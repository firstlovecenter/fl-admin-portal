import { Context } from '../utils/neo4j-types'
import { sendBulkSMS } from '../utils/notify'
import { Member } from '../utils/types'
import { isAuth, throwToSentry } from '../utils/utils'
import {
  approveBussingExpense,
  approveExpense,
  creditBussingSocietyFromWeekday,
  debitBussingSociety,
  depositIntoCoucilBussingSociety,
  depositIntoCouncilCurrentAccount,
  getCouncilBalances,
  getCouncilBalancesWithTransaction,
} from './accounts-cypher'
import { AccountTransaction, CouncilForAccounts } from './accounts-types'

export const accountsMutations = {
  DepositIntoCouncilCurrentAccount: async (
    object: unknown,
    args: {
      councilId: string
      weekdayBalanceDepositAmount: number
    },
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(['adminCampus'], context.jwt['https://flcadmin.netlify.app/roles'])

    try {
      const councilBalancesResult = await session.run(getCouncilBalances, args)

      const council: CouncilForAccounts =
        councilBalancesResult.records[0].get('council').properties

      const leader: Member =
        councilBalancesResult.records[0].get('leader').properties

      const message = `Dear ${leader.firstName}, an amount of ${
        args.weekdayBalanceDepositAmount
      } GHS has been deposited into your weekday account for ${
        council.name
      }. Your weekday account balance is ${
        council.weekdayBalance + args.weekdayBalanceDepositAmount
      } GHS and bussing society is ${council.bussingSocietyBalance} GHS`

      const debitRes = await Promise.all([
        session.run(depositIntoCouncilCurrentAccount, {
          jwt: context.jwt,
          ...args,
        }),
        sendBulkSMS([leader.phoneNumber], message),
      ])

      const trans = debitRes[0].records[0].get('transaction').properties
      const depositor = debitRes[0].records[0].get('depositor').properties

      return {
        ...trans,
        loggedBy: { ...depositor },
      }
    } catch (error) {
      throwToSentry('', error)
    } finally {
      await session.close()
    }

    return null
  },
  DepositIntoCouncilBussingSociety: async (
    object: unknown,
    args: {
      councilId: string
      bussingSocietyBalance: number
    },
    context: Context
  ) => {
    const session = context.executionContext.session()
    // isAuth(['arrivalsAdminCampus'], context.jwt['https://flcadmin.netlify.app/roles'])

    try {
      const councilBalancesResult = await session.run(getCouncilBalances, args)

      const council: CouncilForAccounts =
        councilBalancesResult.records[0].get('council').properties

      const leader: Member =
        councilBalancesResult.records[0].get('leader').properties

      const depositAmount =
        args.bussingSocietyBalance - council.bussingSocietyBalance

      let transactionDescription = ` made a deposit of ${depositAmount} into the bussing society`
      let transactionType = 'Deposit'
      let transactionSMS = `an amount of ${depositAmount} GHS has been deposited into your bussing society`

      if (depositAmount < 0) {
        transactionDescription = ` marked a deduction of ${depositAmount} on your bussing society`
        transactionType = 'Debit'
        transactionSMS = `a debit of ${depositAmount} GHS has been marked on your bussing society`
      }

      const message = `Dear ${leader.firstName}, ${transactionSMS} for ${council.name}. Your current bussing society balance is ${args.bussingSocietyBalance} GHS`

      const debitRes = await Promise.all([
        session.run(depositIntoCoucilBussingSociety, {
          jwt: context.jwt,
          ...args,
          transactionDescription,
          transactionType,
          bussingSocietyDepositAmount: depositAmount,
        }),
        sendBulkSMS([leader.phoneNumber], message),
      ])

      const trans = debitRes[0].records[0].get('transaction').properties
      const depositor = debitRes[0].records[0].get('depositor').properties

      return {
        ...trans,
        loggedBy: { ...depositor },
      }
    } catch (error) {
      throwToSentry('', error)
    } finally {
      await session.close()
    }

    return null
  },
  ApproveExpense: async (
    object: unknown,
    args: {
      transactionId: string
      charge: number
    },
    context: Context
  ) => {
    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()
    isAuth(['adminCampus'], context.jwt['https://flcadmin.netlify.app/roles'])

    try {
      const councilBalancesResult = await session.run(
        getCouncilBalancesWithTransaction,
        args
      )

      const council: CouncilForAccounts =
        councilBalancesResult.records[0].get('council').properties
      const leader: Member =
        councilBalancesResult.records[0].get('leader').properties
      const transaction: AccountTransaction =
        councilBalancesResult.records[0].get('transaction').properties

      const transactionAmount = transaction.amount * -1

      if (transaction.category === 'Bussing') {
        if (council.weekdayBalance < transactionAmount) {
          throw new Error('Insufficient bussing funds')
        }

        const currentAmountRemaining =
          council.weekdayBalance - transactionAmount - args.charge

        const amountRemaining =
          council.bussingSocietyBalance + transactionAmount
        const message = `Dear ${leader.firstName}, your expense request of ${transactionAmount} GHS from ${council.name} weekday account for ${transaction.category} has been approved. Balance remaining is ${currentAmountRemaining} GHS. Bussing Society Balance is ${amountRemaining} GHS`

        const debitRes = await Promise.all([
          session.run(approveBussingExpense, args),
          sessionTwo.run(creditBussingSocietyFromWeekday, {
            ...args,
            jwt: context.jwt,
          }),
          sendBulkSMS([leader.phoneNumber], message),
        ])

        const trans = debitRes[0].records[0].get('transaction').properties
        const depositor = debitRes[0].records[0].get('depositor').properties

        return {
          ...trans,
          loggedBy: { ...depositor },
        }
      }

      if (council.weekdayBalance < transactionAmount) {
        throw new Error('Insufficient Funds')
      }

      const amountRemaining =
        council.weekdayBalance - transactionAmount - args.charge
      const message = `Dear ${leader.firstName}, your expense request of ${transactionAmount} GHS (Charges: ${args.charge} GHS) from ${council.name} weekday account for ${transaction.category} has been approved. Balance remaining is ${amountRemaining} GHS`

      const debitRes = await Promise.all([
        session.run(approveExpense, args),
        sendBulkSMS([leader.phoneNumber], message),
      ])

      const trans = debitRes[0].records[0].get('transaction').properties
      const depositor = debitRes[0].records[0].get('depositor').properties

      return {
        ...trans,
        loggedBy: { ...depositor },
      }
    } catch (error: any) {
      throwToSentry('', error.message)
    } finally {
      await Promise.all([session.close(), sessionTwo.close()])
    }

    return null
  },
  DebitBussingSociety: async (
    object: unknown,
    args: {
      councilId: string
      expenseAmount: number
      expenseCategory: string
    },
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(
      ['arrivalsAdminCampus', 'adminCampus'],
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    try {
      const councilBalancesResult = await session.run(getCouncilBalances, args)
      const council: CouncilForAccounts =
        councilBalancesResult.records[0].get('council').properties
      const leader: Member =
        councilBalancesResult.records[0].get('leader').properties

      const amountRemaining = council.bussingSocietyBalance - args.expenseAmount
      const message = `Dear ${leader.firstName}, ${council.name} Council spent ${args.expenseAmount} GHS on bussing. Bussing Society Balance remaining is ${amountRemaining} GHS`

      const debitRes = await Promise.all([
        session.run(debitBussingSociety, { ...args, jwt: context.jwt }),
        sendBulkSMS([leader.phoneNumber], message),
      ])

      const trans = debitRes[0].records[0].get('transaction').properties
      const depositor = debitRes[0].records[0].get('requester').properties

      return {
        ...trans,
        loggedBy: { ...depositor },
      }
    } catch (err) {
      throwToSentry('There was an error debiting bussing society', err)
    } finally {
      await session.close()
    }

    return null
  },
}

export default accountsMutations
