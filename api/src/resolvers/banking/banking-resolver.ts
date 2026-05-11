import axios from 'axios'
import { getHumanReadableDate } from 'jd-date-utils'
import { Context } from '../utils/neo4j-types'
import {
  permitAdmin,
  permitLeaderAdmin,
  permitMe,
  permitTellerStream,
} from '../permissions'
import {
  getMobileCode,
  getStreamFinancials,
  isValidNetwork,
  MOMO_NUM_REGEX,
  Network,
} from '../utils/financial-utils'
import { isAuth, rearrangeCypherObject, throwToSentry } from '../utils/utils'
import { assertScopeViaServiceRecord } from '../utils/scope-utils'

import {
  checkTransactionReference,
  getLastServiceRecord,
  initiateServiceRecordTransaction,
  setTransactionStatusFailed,
  setTransactionStatusSuccess,
  setRecordTransactionReference,
  setRecordTransactionReferenceWithOTP,
  submitBankingSlip,
  manuallyConfirmOfferingPayment,
} from './banking-cypher'
import {
  DebitDataBody,
  PayStackRequestBody,
  SendPaymentOTP,
} from './banking-types'
import { loadSecrets } from '../secrets'

export const checkIfLastServiceBanked = async (
  serviceRecordId: string,
  context: Context
) => {
  const session = context.executionContext.session()

  // this checks if the person has banked their last offering
  const lastServiceResponse = await session
    .run(getLastServiceRecord, {
      serviceRecordId,
      jwt: context.jwt,
    })
    .catch((error: any) =>
      throwToSentry('There was a problem checking the lastService', error)
    )
  const lastServiceRecord: any = rearrangeCypherObject(lastServiceResponse)

  if (!('lastService' in lastServiceRecord)) return true

  const lastService = lastServiceRecord.lastService.properties
  // const currentService = lastServiceRecord.record.properties
  const date = lastServiceRecord.lastDate.properties
  // const { church } = lastServiceRecord

  if (
    !(
      'bankingSlip' in lastService ||
      lastService.transactionStatus === 'success' ||
      'tellerConfirmationTime' in lastService
    )
  ) {
    throw new Error(
      `Please bank outstanding offering for your service filled on ${getHumanReadableDate(
        date.date
      )} before attempting to bank this week's offering`
    )
  }

  // if (!currentService.markedAttendance && church.labels.includes('Bacenta')) {
  //   throw new Error(
  //     'Please tick the present members on the Poimen App before you will be allowed to bank your offering'
  //   )
  // }

  return true
}

const bankingMutation = {
  BankServiceOffering: async (
    object: any,
    args: {
      // eslint-disable-next-line camelcase
      serviceRecordId: string
      mobileNetwork: Network
      mobileNumber: string
      momoName: string
    },
    context: Context
  ) => {
    const SECRETS = await loadSecrets()
    isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)
    await assertScopeViaServiceRecord(context, args.serviceRecordId)

    if (!isValidNetwork(args.mobileNetwork)) {
      throw new Error(
        'Invalid mobile network. Choose MTN, Vodafone, AirtelTigo, Airtel, or Tigo.'
      )
    }
    if (!MOMO_NUM_REGEX.test(args.mobileNumber)) {
      throw new Error(
        'Enter a valid mobile money number (10 digits, e.g. 02XXXXXXXX).'
      )
    }

    const session = context.executionContext.session()
    try {
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

      if (!transactionResponse?.stream) {
        throw new Error(
          'This service record is not linked to a Stream and cannot be banked via self-banking. Contact your admin.'
        )
      }

      const { auth, subaccount } = await getStreamFinancials(
        transactionResponse.stream
      )

      // In development the merchant uses Paystack test keys with no
      // subaccount split — the charge goes to the main merchant account so
      // local payments can complete end-to-end. In production a missing
      // subaccount is a configuration error and must fail loudly.
      const environment = SECRETS.ENVIRONMENT || 'production'
      if (!subaccount && environment !== 'development') {
        throw new Error(
          'There was an error with the payment. Please email admin@firstlovecenter.com.'
        )
      }

      await checkIfLastServiceBanked(args.serviceRecordId, context)

      const transactionStatus = transactionResponse.record?.transactionStatus
      if (transactionStatus === 'success') {
        throw new Error('Banking has already been done for this service')
      }
      if (transactionStatus === 'pending') {
        throw new Error(
          'Please confirm your previous payment attempt before starting a new one.'
        )
      }
      if (transactionStatus === 'send OTP') {
        throw new Error(
          'Please submit the OTP for your previous payment attempt before starting a new one.'
        )
      }

      // Validate cash up-front so a zero/invalid record never trips the
      // atomic Cypher guard and strands itself in 'pending'.
      const cash = Number(transactionResponse.record?.cash)
      if (!Number.isFinite(cash) || cash <= 0) {
        throw new Error(
          'Cannot bank a zero offering. Please record the cash amount on the service before banking.'
        )
      }

      const cypherResponse = rearrangeCypherObject(
        await session
          .executeWrite((tx) =>
            tx.run(initiateServiceRecordTransaction, {
              jwt: context.jwt,
              ...args,
            })
          )
          .catch((error: any) =>
            throwToSentry(
              'There was an error setting serviceRecordTransactionReference',
              error
            )
          )
      )

      // SM1 atomic guard in initiateServiceRecordTransaction returned no
      // rows — another concurrent attempt has already moved the record out
      // of {null, failed}.
      if (!cypherResponse?.record) {
        throw new Error(
          'Another payment attempt is in progress for this service. Please refresh and try again.'
        )
      }

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
          amount: Math.round((cash / (1 - 0.0195) + 0.01) * 100),
          email: cypherResponse.author.email,
          currency: 'GHS',
          subaccount,
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

      const paymentResponse = await axios(payOffering)

      axios(updatePaystackCustomer).catch((err: any) => {
        // Don't log err.response.data — Paystack echoes the request body
        // (member email, phone) on validation errors.
        console.error(
          'Paystack customer update failed (non-fatal):',
          err?.response?.status,
          err?.response?.data?.message || err?.message
        )
      })

      const paymentCypherRes = rearrangeCypherObject(
        await session.executeWrite((tx) =>
          tx.run(setRecordTransactionReference, {
            id: serviceRecord.id,
            reference: paymentResponse.data.data.reference,
          })
        )
      )

      if (paymentResponse.data.data.status === 'send_otp') {
        const otpCypherRes = rearrangeCypherObject(
          await session.run(setRecordTransactionReferenceWithOTP, {
            id: serviceRecord.id,
          })
        )

        if (otpCypherRes?.record) {
          return otpCypherRes.record
        }
        // SM1 guard refused — webhook beat us to a terminal state. Return the
        // post-charge reference write; the FE will navigate to confirm-payment.
        console.warn(
          `setRecordTransactionReferenceWithOTP no-op for ${serviceRecord.id}; status precluded the OTP transition`
        )
      }

      return paymentCypherRes.record
    } catch (error: any) {
      // Surface user-facing messages from validation/state guards directly;
      // wrap unexpected errors (Paystack 5xx, Neo4j) in a generic message
      // and log the original to console for forensics.
      const friendly = error?.response?.data?.message || error?.message
      console.error('BankServiceOffering failed:', error)
      throw new Error(friendly || 'There was an error processing your payment.')
    } finally {
      await session.close()
    }
  },

  SendPaymentOTP: async (
    object: any,
    args: {
      serviceRecordId: string
      reference: string
      otp: string
    },
    context: Context
  ) => {
    isAuth(permitMe('Bacenta'), context.jwt.roles)
    await assertScopeViaServiceRecord(context, args.serviceRecordId)

    // Paystack mobile-money OTPs are always 4 or 6 digits.
    if (!/^(\d{4}|\d{6})$/.test(args.otp)) {
      throw new Error('Enter a valid OTP (4 or 6 digits).')
    }

    const session = context.executionContext.session()
    try {
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

      if (!transactionResponse?.record) {
        throw new Error('Service record not found.')
      }
      if (!transactionResponse.stream) {
        throw new Error(
          'This service record is not linked to a Stream and cannot accept OTP submission.'
        )
      }
      if (transactionResponse.record.transactionStatus !== 'send OTP') {
        throw new Error(
          'No OTP is pending for this payment. Refresh and try again.'
        )
      }

      // Trust the reference stored on the record, not the one the client
      // sent — defence in depth on top of assertScopeViaServiceRecord.
      const reference = transactionResponse.record.transactionReference
      if (!reference) {
        throw new Error(
          'No transaction reference on this record. Restart the payment.'
        )
      }

      const { auth } = await getStreamFinancials(transactionResponse.stream)

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
          reference,
        },
      }

      const otpResponse = await axios(sendOtp).catch(async (error) => {
        if (error?.response?.data?.message === 'Charge attempted') {
          console.log('OTP was already sent and charge attempted')

          return {
            data: { data: { status: 'pay_offline' } },
          }
        }

        return throwToSentry('There was an error sending OTP', error)
      })

      if (otpResponse.data.data.status === 'pay_offline') {
        const paymentCypherRes = rearrangeCypherObject(
          await session
            .run(setRecordTransactionReference, {
              id: args.serviceRecordId,
              reference,
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
        // setTransactionStatusFailed's MATCH is on $serviceRecordId, not $id —
        // pre-existing param-name mismatch that silently failed every call.
        const paymentCypherRes = rearrangeCypherObject(
          await session
            .run(setTransactionStatusFailed, {
              serviceRecordId: args.serviceRecordId,
              reference,
              status: otpResponse.data.data.status,
              error: otpResponse.data.data.gateway_response,
            })
            .catch((error: any) =>
              throwToSentry(
                'There was an error setting transaction reference',
                error
              )
            )
        )
        if (paymentCypherRes?.record) {
          return paymentCypherRes.record
        }
        // SM1 guard refused — the webhook already marked the record as
        // success between OTP submission and now. Don't clobber it.
        console.warn(
          `setTransactionStatusFailed no-op for ${args.serviceRecordId}; webhook likely settled to success`
        )
        return {
          id: args.serviceRecordId,
          transactionStatus: 'success',
        }
      }

      return {
        id: args.serviceRecordId,
        transactionStatus: 'send OTP',
      }
    } finally {
      await session.close()
    }
  },

  ConfirmOfferingPayment: async (
    object: any,
    // eslint-disable-next-line camelcase
    args: { serviceRecordId: string },
    context: Context
  ) => {
    isAuth(permitMe('Bacenta'), context.jwt.roles)
    await assertScopeViaServiceRecord(context, args.serviceRecordId)
    const session = context.executionContext.session()

    try {
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
      const stream = transactionResponse?.stream

      if (!record) {
        throw new Error('Service record not found.')
      }
      if (!stream) {
        throw new Error(
          'This service record is not linked to a Stream and cannot be confirmed via self-banking.'
        )
      }

      const buildBankerShape = () =>
        banker
          ? {
              id: banker.id,
              firstName: banker.firstName,
              lastName: banker.lastName,
              fullName: `${banker.firstName} ${banker.lastName}`,
            }
          : null

      // Throttle: within 3 minutes of the last attempt return the cached
      // state instead of re-hitting Paystack's verify endpoint.
      if (
        record.transactionTime &&
        new Date().getTime() - new Date(record.transactionTime).getTime() <
          180000
      ) {
        console.log('transactionTime is within the last 3 minutes')
        return {
          id: record.id,
          cash: record.cash,
          transactionReference: record.transactionReference,
          transactionStatus: record.transactionStatus,
          offeringBankedBy: buildBankerShape(),
        }
      }

      if (!record.transactionReference) {
        const failedRes = rearrangeCypherObject(
          await session
            .run(setTransactionStatusFailed, {
              ...args,
              status: 'failed',
              error: 'No Transaction Reference',
            })
            .catch((error: any) =>
              throwToSentry('There was an error setting the transaction', error)
            )
        )
        if (failedRes?.record) {
          return failedRes.record.properties
        }
        // SM1 guard refused — record is already in 'success'. Return the
        // current state instead of crashing on a missing failedRes.
        console.warn(
          `setTransactionStatusFailed no-op for ${args.serviceRecordId} (no-reference branch); already terminal`
        )
        return { ...record, offeringBankedBy: buildBankerShape() }
      }

      const { auth } = await getStreamFinancials(stream)

      const confirmPaymentBody: PayStackRequestBody = {
        method: 'get',
        baseURL: 'https://api.paystack.co/',
        url: `/transaction/verify/${record.transactionReference}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
      }

      try {
        const confirmationResponse = await axios(confirmPaymentBody)

        if (confirmationResponse.data.data.status === 'success') {
          const successRes = rearrangeCypherObject(
            await session
              .run(setTransactionStatusSuccess, {
                ...args,
                status: confirmationResponse.data.data.status,
              })
              .catch((error: any) =>
                throwToSentry(
                  'There was an error setting the successful transaction',
                  error
                )
              )
          )
          if (successRes?.record) {
            record = successRes.record.properties
          } else {
            // SM1 guard refused — current state is not in {pending, send OTP}.
            // Webhook already settled this record; reflect that on the local
            // copy so the response carries the truth.
            console.warn(
              `setTransactionStatusSuccess no-op for ${args.serviceRecordId}; webhook already settled`
            )
            record = { ...record, transactionStatus: 'success' }
          }
        }

        if (
          confirmationResponse.data.data.status === 'failed' ||
          confirmationResponse.data.data.status === 'abandoned'
        ) {
          const failedRes = rearrangeCypherObject(
            await session
              .run(setTransactionStatusFailed, {
                ...args,
                status: confirmationResponse.data.data.status,
                error: confirmationResponse.data.data.gateway_response,
              })
              .catch((error: any) =>
                throwToSentry(
                  'There was an error setting the transaction',
                  error
                )
              )
          )
          if (failedRes?.record) {
            record = failedRes.record.properties
          } else {
            // SM1 guard refused — record is already 'success'. Paystack verify
            // disagrees with the webhook (rare) — webhook event wins per SM1.
            console.warn(
              `setTransactionStatusFailed no-op for ${args.serviceRecordId}; record already success, verify said ${confirmationResponse.data.data.status}`
            )
            record = { ...record, transactionStatus: 'success' }
          }
        }
      } catch (error: any) {
        // Paystack reports 'transaction_not_found' when the reference never
        // succeeded — write failed and return the updated record. For any
        // other error (network, 5xx) surface to Sentry without overwriting
        // local state.
        if (error.response?.data?.code === 'transaction_not_found') {
          const failedRes = rearrangeCypherObject(
            await session.executeWrite((tx) =>
              tx.run(setTransactionStatusFailed, {
                ...args,
                status: error.response.data.status,
                error: error.response.data.message,
              })
            )
          )
          if (failedRes?.record) {
            return {
              ...failedRes.record.properties,
              offeringBankedBy: buildBankerShape(),
            }
          }
          // SM1 guard refused — already success. Don't clobber.
          console.warn(
            `setTransactionStatusFailed no-op for ${args.serviceRecordId} (transaction_not_found branch); already terminal`
          )
          return { ...record, offeringBankedBy: buildBankerShape() }
        }

        throwToSentry(
          'There was an error confirming transaction - ',
          JSON.stringify(error.response?.data || error.message)
        )
      }

      return {
        ...record,
        offeringBankedBy: buildBankerShape(),
      }
    } finally {
      await session.close()
    }
  },
  SubmitBankingSlip: async (
    object: any,
    args: { serviceRecordId: string; bankingSlip: string },
    context: Context
  ) => {
    isAuth(permitAdmin('Campus'), context.jwt.roles)
    await assertScopeViaServiceRecord(context, args.serviceRecordId)
    const session = context.executionContext.session()

    await checkIfLastServiceBanked(args.serviceRecordId, context).catch(
      (error: any) => {
        throwToSentry(
          'There was an error checking if last service banked',
          error
        )
      }
    )

    const submissionResponse = rearrangeCypherObject(
      await session
        .run(submitBankingSlip, { ...args, jwt: context.jwt })
        .catch((error: any) =>
          throwToSentry('There was an error submitting banking slip', error)
        )
    )

    return submissionResponse.record.properties
  },

  ManuallyConfirmOfferingPayment: async (
    object: any,
    args: { serviceRecordId: string; bankingSlip: string },
    context: Context
  ) => {
    isAuth(['fishers', ...permitTellerStream()], context.jwt.roles)
    await assertScopeViaServiceRecord(context, args.serviceRecordId)
    const session = context.executionContext.session()

    const churchRes = await session.executeRead((tx) =>
      tx.run(
        `MATCH (record:ServiceRecord {id: $serviceRecordId})
        MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
        RETURN labels(church) AS churchLabels`,
        args
      )
    )
    const churchLabels: string[] = churchRes.records[0].get('churchLabels')

    if (
      context.jwt.roles.includes('tellerStream') &&
      !['Stream', 'Campus', 'Oversight', 'Denomination'].some((churchLevel) =>
        churchLabels.includes(churchLevel)
      )
    ) {
      throw new Error(
        'You are not allowed to manually confirm offering payment for this church'
      )
    }

    await checkIfLastServiceBanked(args.serviceRecordId, context).catch(
      (error: any) => {
        throwToSentry(
          'There was an error checking if last service banked',
          error
        )
      }
    )

    const submissionResponse = rearrangeCypherObject(
      await session
        .run(manuallyConfirmOfferingPayment, { ...args, jwt: context.jwt })
        .catch((error: any) =>
          throwToSentry('There was an error confirming offering payment', error)
        )
    )

    return submissionResponse.service.properties
  },
}

export default bankingMutation
