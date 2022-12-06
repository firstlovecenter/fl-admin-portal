import axios from 'axios'
import { getHumanReadableDate } from 'jd-date-utils'
import { Context } from '../utils/neo4j-types'
import { permitLeader, permitLeaderAdmin } from '../permissions'
import {
  getMobileCode,
  getStreamFinancials,
  Network,
} from '../utils/financial-utils'
import { isAuth, rearrangeCypherObject, throwToSentry } from '../utils/utils'

import {
  checkIfServicePending,
  checkTransactionReference,
  getLastServiceRecord,
  initiateServiceRecordTransaction,
  setTransactionStatusFailed,
  setTransactionStatusSuccess,
  submitBankingSlip,
  setRecordTransactionReference,
  setRecordTransactionReferenceWithOTP,
} from './banking-cypher'
import {
  DebitDataBody,
  PayStackRequestBody,
  SendPaymentOTP,
} from './banking-types'
import { StreamOptions } from '../utils/types'

const checkIfLastServiceBanked = async (
  serviceRecordId: string,
  context: Context
) => {
  const session = context.executionContext.session()

  // this checks if the person has banked their last offering
  const lastServiceResponse = await session
    .run(getLastServiceRecord, {
      serviceRecordId,
      auth: context.auth,
    })
    .catch((error: any) =>
      throwToSentry('There was a problem checking the lastService', error)
    )
  const lastServiceRecord: any = rearrangeCypherObject(lastServiceResponse)

  if (!('lastService' in lastServiceRecord)) return true

  const record = lastServiceRecord.lastService.properties

  if (!('bankingSlip' in record || record.transactionStatus === 'success')) {
    throw new Error(
      `Please bank outstanding offering for your service filled on ${getHumanReadableDate(
        record.createdAt
      )} before attempting to bank this week's offering`
    )
  }

  return true
}

const bankingMutation = {
  BankServiceOffering: async (
    object: any,
    args: {
      // eslint-disable-next-line camelcase
      stream_name: StreamOptions
      serviceRecordId: string
      mobileNetwork: Network
      mobileNumber: string
      momoName: string
    },
    context: Context
  ) => {
    isAuth(permitLeader('Fellowship'), context.auth.roles)

    const session = context.executionContext.session()

    const { auth } = getStreamFinancials(args.stream_name)

    // This code checks if there has already been a successful transaction
    const transactionResponse = rearrangeCypherObject(
      await session
        .run(checkTransactionReference, args)
        .catch((error: any) =>
          throwToSentry(
            'There was a problem checking the transactionReference',
            error
          )
        )
    )

    await checkIfLastServiceBanked(args.serviceRecordId, context)

    const transactionStatus = transactionResponse?.record.transactionStatus
    if (transactionStatus === 'success') {
      throw new Error('Banking has already been done for this service')
    }

    if (transactionStatus === 'pending') {
      throw new Error(
        'Please confirm your initial payment before attempting another one'
      )
    }

    const cypherResponse = rearrangeCypherObject(
      await session
        .run(initiateServiceRecordTransaction, {
          auth: context.auth,
          ...args,
        })
        .catch((error: any) =>
          throwToSentry(
            'There was an error setting serviceRecordTransactionReference',
            error
          )
        )
    )

    const serviceRecord = cypherResponse.record.properties

    const payOffering: DebitDataBody = {
      method: 'post',
      baseURL: 'https://api.paystack.co/',
      url: `/charge`,
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      data: {
        amount: Math.round((serviceRecord.income / (1 - 0.0195) + 0.01) * 100),
        email: cypherResponse.author.email,
        currency: 'GHS',
        mobile_money: {
          phone: args.mobileNumber,
          provider: getMobileCode(args.mobileNetwork),
        },
        metadata: {
          custom_fields: [
            {
              church_name: cypherResponse.churchName,
              church_level: cypherResponse.churchLevel,
              depositor_firstname: cypherResponse.author.firstName,
              depositor_lastname: cypherResponse.author.lastName,
            },
          ],
        },
      },
    }

    const updatePaystackCustomer = {
      method: 'put',
      baseURL: 'https://api.paystack.co/',
      url: `/customer/${cypherResponse.author.email}`,
      headers: {
        'content-type': 'application/json',
        Authorization: auth ?? '',
      },
      data: {
        first_name: cypherResponse.author.firstName,
        last_name: cypherResponse.author.lastName,
        phone: cypherResponse.author.phoneNumber,
      },
    }

    try {
      const paymentResponse = await axios(payOffering).catch((error: any) =>
        throwToSentry('There was an error with the payment', error)
      )

      axios(updatePaystackCustomer)

      if (paymentResponse.data.data.status === 'send_otp') {
        const paymentCypherRes = rearrangeCypherObject(
          await session
            .run(setRecordTransactionReferenceWithOTP, {
              id: serviceRecord.id,
              reference: paymentResponse.data.data.reference,
            })
            .catch((error: any) =>
              throwToSentry(
                'There was an error setting serviceRecordTransactionReference',
                error
              )
            )
        )

        return paymentCypherRes.record
      }

      const paymentCypherRes = rearrangeCypherObject(
        await session.run(setRecordTransactionReference, {
          id: serviceRecord.id,
          reference: paymentResponse.data.data.reference,
        })
      )

      return paymentCypherRes.record
    } catch (error: any) {
      throwToSentry('There was an error processing your payment', error)
    }
    return transactionResponse.record
  },

  SendPaymentOTP: async (
    object: any,
    args: {
      serviceRecordId: string
      streamName: StreamOptions
      reference: string
      otp: string
    },
    context: Context
  ) => {
    isAuth(permitLeader('Fellowship'), context.auth.roles)

    const { auth } = getStreamFinancials(args.streamName)

    const session = context.executionContext.session()

    const sendOtp: SendPaymentOTP = {
      method: 'post',
      baseURL: 'https://api.paystack.co/',
      url: `/charge/submit_otp`,
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      data: {
        otp: args.otp,
        reference: args.reference,
      },
    }

    const otpResponse = await axios(sendOtp).catch(async (error) => {
      if (error.response.data.message === 'Charge attempted') {
        console.log('OTP was already sent and charge attempted')

        return {
          data: {
            data: {
              status: 'pay_offline',
            },
          },
        }
      }

      return throwToSentry('There was an error sending OTP', error)
    })

    if (otpResponse.data.data.status === 'pay_offline') {
      const paymentCypherRes = rearrangeCypherObject(
        await session
          .run(setRecordTransactionReference, {
            id: args.serviceRecordId,
            reference: args.reference,
          })
          .catch((error: any) =>
            throwToSentry(
              'There was an error setting transaction reference',
              error
            )
          )
      )
      return paymentCypherRes.record
    }
    if (otpResponse.data.data.status === 'failed') {
      const paymentCypherRes = rearrangeCypherObject(
        await session
          .run(setTransactionStatusFailed, {
            id: args.serviceRecordId,
            reference: args.reference,
          })
          .catch((error: any) =>
            throwToSentry(
              'There was an error setting transaction reference',
              error
            )
          )
      )
      return paymentCypherRes.record
    }

    return {
      id: args.serviceRecordId,
      transactionStatus: 'send OTP',
    }
  },

  ConfirmOfferingPayment: async (
    object: any,
    // eslint-disable-next-line camelcase
    args: { stream_name: StreamOptions; serviceRecordId: string },
    context: Context
  ) => {
    isAuth(permitLeader('Fellowship'), context.auth.roles)
    const session = context.executionContext.session()

    const { auth } = getStreamFinancials(args.stream_name)

    const transactionResponse = rearrangeCypherObject(
      await session
        .run(checkTransactionReference, args)
        .catch((error: any) =>
          throwToSentry(
            'There was an error checking transaction reference',
            error
          )
        )
    )

    let record = transactionResponse?.record
    const banker = transactionResponse?.banker

    if (!record?.transactionReference) {
      record = rearrangeCypherObject(
        await session
          .run(setTransactionStatusFailed, args)
          .catch((error: any) =>
            throwToSentry('There was an error setting the transaction', error)
          )
      )

      record = record.record.properties
      return {
        id: record.id,
        income: record.income,
        transactionReference: record.transactionReference,
        transactionStatus: record.transactionStatus,
      }
    }

    const confirmPaymentBody: PayStackRequestBody = {
      method: 'get',
      baseURL: 'https://api.paystack.co/',
      url: `/transaction/verify/${record.transactionReference}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
    }

    const confirmationResponse = await axios(confirmPaymentBody).catch(
      async (error) => {
        if (error.response.data.status === false) {
          record = rearrangeCypherObject(
            await session.run(setTransactionStatusFailed, args)
          )
        }
        throwToSentry(
          'There was an error confirming transaction - ',
          error.response.data.message
        )
      }
    )

    if (
      confirmationResponse?.data.data.status === 'failed' ||
      confirmationResponse?.data.data.status === 'abandoned'
    ) {
      record = rearrangeCypherObject(
        await session
          .run(setTransactionStatusFailed, args)
          .catch((error: any) =>
            throwToSentry('There was an error setting the transaction', error)
          )
      )
      record = record.record.properties
    }

    if (confirmationResponse?.data.data.status === 'success') {
      record = rearrangeCypherObject(
        await session
          .run(setTransactionStatusSuccess, args)
          .catch((error: any) =>
            throwToSentry(
              'There was an error setting the successful transaction',
              error
            )
          )
      )
      record = record.record.properties
    }

    return {
      id: record.id,
      income: record.income,
      transactionReference: record.transactionReference,
      transactionStatus: record.transactionStatus,
      offeringBankedBy: {
        id: banker.id,
        firstName: banker.firstName,
        lastName: banker.lastName,
        fullName: `${banker.firstName} ${banker.fullName}`,
      },
    }
  },
  SubmitBankingSlip: async (
    object: any,
    args: { serviceRecordId: string; bankingSlip: string },
    context: Context
  ) => {
    isAuth(permitLeaderAdmin('Fellowship'), context.auth.roles)
    const session = context.executionContext.session()

    await checkIfLastServiceBanked(args.serviceRecordId, context).catch(
      (error: any) => {
        throwToSentry(
          'There was an error checking if last service banked',
          error
        )
      }
    )

    const checkIfAnyServicePending = rearrangeCypherObject(
      await session.run(checkIfServicePending, args).catch((error: any) => {
        throwToSentry(
          'There was an error checking if any service pending',
          error
        )
      })
    )

    if (checkIfAnyServicePending?.record?.properties?.transactionStatus) {
      throw new Error(
        'You will have to confirm your initial self banking before uploading your banking slip'
      )
    }

    const submissionResponse = rearrangeCypherObject(
      await session
        .run(submitBankingSlip, { ...args, auth: context.auth })
        .catch((error: any) =>
          throwToSentry('There was an error submitting banking slip', error)
        )
    )

    return submissionResponse.record.properties
  },
}

export default bankingMutation
