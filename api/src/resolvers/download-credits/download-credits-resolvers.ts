import axios from 'axios'
import {
  updatePaystackCustomerBody,
  initiatePaystackCharge,
  confirmTransactionStatus,
} from '@jaedag/admin-portal-api-core'
import { Council, Member, Network } from '@jaedag/admin-portal-types'
import { permitMe } from '../permissions'
import { getCreditsFinancials } from '../utils/financial-utils'
import { Context } from '../utils/neo4j-types'
import { isAuth, throwToSentry } from '../utils/utils'
import {
  creditSuccessfulTransaction,
  getMember,
  initiateDownloadCreditsTransaction,
  updateTransactionStatus,
} from './download-credits-cypher'
import { councilDownloadMembers } from './download-credits-member-cypher'

export const downloadCreditsMutations = {
  PurchaseDownloadCredits: async (
    object: unknown,
    args: {
      churchId: string
      amount: number
      mobileNetwork: Network
      mobileNumber: string
    },
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(
      permitMe('Bacenta'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    try {
      const { auth, subaccount } = await getCreditsFinancials()

      const memberResponse = await session.executeRead((tx) =>
        tx.run(getMember, {
          jwt: context.jwt,
        })
      )
      const member: Member =
        memberResponse.records[0]?.get('member')?.properties

      const response = await Promise.all([
        axios(
          initiatePaystackCharge({
            amount: args.amount * 20,
            mobile_money: {
              phone: args.mobileNumber,
              provider: args.mobileNetwork,
            },
            bearCharges: true,
            customer: member,
            subaccount,
            auth,
          })
        ),
        member && axios(updatePaystackCustomerBody({ auth, customer: member })),
      ])

      const paymentRes = response[0].data.data

      const cypherRes = await session.executeWrite((tx) =>
        tx.run(initiateDownloadCreditsTransaction, {
          ...args,
          jwt: context.jwt,
          transactionStatus: paymentRes.status,
          transactionReference: paymentRes.reference,
        })
      )

      return cypherRes.records[0].get('transaction').properties
    } catch (error) {
      throwToSentry('Error purchasing credits', error)
    } finally {
      await session.close()
    }

    return {}
  },

  ConfirmCreditTransaction: async (
    object: unknown,
    args: { transactionReference: string },
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(
      permitMe('Bacenta'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    try {
      const { auth } = await getCreditsFinancials()

      const confirmRes = await axios(
        confirmTransactionStatus({
          reference: args.transactionReference,
          auth,
        })
      )

      const cypherRes = await session.executeWrite((tx) =>
        tx.run(updateTransactionStatus, {
          transactionReference: args.transactionReference,
          status: confirmRes.data.data.status,
        })
      )

      const transaction = cypherRes.records[0].get('transaction').properties

      if (
        transaction.transactionStatus === 'success' &&
        !transaction.credited
      ) {
        const response = await session.executeWrite((tx) =>
          tx.run(creditSuccessfulTransaction, {
            transactionReference: args.transactionReference,
          })
        )

        return response.records[0].get('record').properties
      }

      return cypherRes.records[0].get('transaction').properties
    } catch (error) {
      throwToSentry('Error confirming transaction', error)
    } finally {
      await session.close()
    }

    return {}
  },
}

export const downloadCreditsQueries = {
  Council: {
    downloadMembership: async (
      object: Council,
      args: unknown,
      context: Context
    ) => {
      const session = context.executionContext.session()
      isAuth(
        permitMe('Council'),
        context.jwt['https://flcadmin.netlify.app/roles']
      )

      try {
        const councilRes = await session.executeRead((tx) => {
          return tx.run(councilDownloadMembers, {
            id: object.id,
          })
        })

        const council = councilRes.records[0].get('council')

        if (council.downloadCredits < 1) {
          throw new Error(
            'You do not have enough credits to download this report'
          )
        }

        return councilRes.records[0].get('members')
      } catch (error) {
        throwToSentry('Error getting council membership', error)
      } finally {
        await session.close()
      }

      return {}
    },
  },
}
