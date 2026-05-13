import { permitAdmin, permitArrivals, permitLeader } from '../permissions'
import { Context } from '../utils/neo4j-types'
import { sendBulkSMS } from '../utils/notify'
import { Member } from '../utils/types'
import {
  badRequest,
  isAuth,
  isClassifiedError,
  throwToSentry,
} from '../utils/utils'
import {
  assertChurchScope,
  assertScopeViaTransaction,
} from '../utils/scope-utils'
import {
  approveBussingExpense,
  approveExpense,
  createExpenseRequest,
  creditBussingSocietyFromWeekday,
  debitBussingSociety,
  depositIntoCoucilBussingSociety,
  depositIntoCouncilCurrentAccount,
  getCouncilBalances,
  getCouncilBalancesWithTransaction,
  getTransactionForUndo,
  undoBussingTransactionCypher,
  undoWeekdayTransactionCypher,
} from './accounts-cypher'
import { AccountTransaction, CouncilForAccounts } from './accounts-types'

const ALLOWED_ACCOUNT_TYPES = new Set(['Weekday Account', 'Bussing Society'])
const ALLOWED_EXPENSE_CATEGORIES = new Set([
  'Bussing',
  'HR',
  'Construction',
  'Ministry Expense',
])
const DESCRIPTION_MAX_LENGTH = 500
// Half-pesewa tolerance — HR amounts are whole-cedi but a client-side
// re-parse can introduce float noise. ADR-005.
const HR_AMOUNT_TOLERANCE = 0.005

export const accountsMutations = {
  DepositIntoCouncilCurrentAccount: async (
    object: unknown,
    args: {
      councilId: string
      weekdayBalanceDepositAmount: number
      clientTransactionId: string
    },
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(['adminCampus'], context.jwt.roles)
    await assertChurchScope(context, args.councilId)

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

      const debitRes = await session.run(depositIntoCouncilCurrentAccount, {
        jwt: context.jwt,
        ...args,
      })

      const isNew = debitRes.records[0].get('isNew')
      // Only fire the SMS when the cypher actually inserted the row.
      // Apollo retries hit the MERGE-MATCH path (isNew=false) and would
      // otherwise spam the leader with a stale "balance remaining" line.
      // Fire-and-forget so an mNotify failure cannot poison the commit.
      if (isNew) {
        sendBulkSMS([leader.phoneNumber], message).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('Deposit SMS send failed', err)
        })
      }

      const trans = debitRes.records[0].get('transaction').properties
      const depositor = debitRes.records[0].get('depositor').properties

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
      clientTransactionId: string
    },
    context: Context
  ) => {
    isAuth(['arrivalsAdminCampus', 'adminCampus'], context.jwt.roles)
    await assertChurchScope(context, args.councilId)
    const session = context.executionContext.session()

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

      const debitRes = await session.run(depositIntoCoucilBussingSociety, {
        jwt: context.jwt,
        ...args,
        transactionDescription,
        transactionType,
        bussingSocietyDepositAmount: depositAmount,
      })

      const isNew = debitRes.records[0].get('isNew')
      if (isNew) {
        sendBulkSMS([leader.phoneNumber], message).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('Bussing deposit SMS send failed', err)
        })
      }

      const trans = debitRes.records[0].get('transaction').properties
      const depositor = debitRes.records[0].get('depositor').properties

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
    isAuth(permitAdmin('Campus'), context.jwt.roles)
    await assertScopeViaTransaction(context, args.transactionId)
    const session = context.executionContext.session()
    const sessionTwo = context.executionContext.session()

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
          throw badRequest('Insufficient bussing funds')
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
        throw badRequest('Insufficient Funds')
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
      if (isClassifiedError(error)) throw error
      throwToSentry('', error.message)
    } finally {
      await Promise.all([session.close(), sessionTwo.close()])
    }

    return null
  },
  ExpenseRequest: async (
    object: unknown,
    args: {
      councilId: string
      expenseAmount: number
      expenseCategory: string
      accountType: string
      description: string
      clientTransactionId: string
    },
    context: Context
  ) => {
    // Mirror the route gate at web-react-ts/src/pages/accounts/accountsRoutes.ts.
    isAuth(
      [
        ...permitLeader('Council'),
        ...permitAdmin('Campus'),
        ...permitArrivals('Campus'),
      ],
      context.jwt.roles
    )
    await assertChurchScope(context, args.councilId)

    if (!Number.isFinite(args.expenseAmount) || args.expenseAmount <= 0) {
      throw badRequest('Expense amount must be a positive, finite number.')
    }
    if (!ALLOWED_ACCOUNT_TYPES.has(args.accountType)) {
      throw badRequest(
        `Invalid accountType '${args.accountType}'. Allowed: ${[
          ...ALLOWED_ACCOUNT_TYPES,
        ].join(', ')}.`
      )
    }
    if (!ALLOWED_EXPENSE_CATEGORIES.has(args.expenseCategory)) {
      throw badRequest(
        `Invalid expenseCategory '${args.expenseCategory}'. Allowed: ${[
          ...ALLOWED_EXPENSE_CATEGORIES,
        ].join(', ')}.`
      )
    }
    if (
      typeof args.description !== 'string' ||
      args.description.trim().length === 0
    ) {
      throw badRequest('Description is required.')
    }
    if (args.description.length > DESCRIPTION_MAX_LENGTH) {
      throw badRequest(
        `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`
      )
    }

    const session = context.executionContext.session()

    try {
      const councilBalancesResult = await session.executeRead((tx) =>
        tx.run(getCouncilBalances, { councilId: args.councilId })
      )

      if (councilBalancesResult.records.length === 0) {
        throw badRequest('Council not found.')
      }

      const council: CouncilForAccounts =
        councilBalancesResult.records[0].get('council').properties

      if (args.expenseCategory === 'HR') {
        if (
          typeof council.hrAmount !== 'number' ||
          !Number.isFinite(council.hrAmount) ||
          council.hrAmount <= 0
        ) {
          throw badRequest(
            'This council has no HR amount on file. Set it before requesting an HR expense.'
          )
        }
        if (
          Math.abs(args.expenseAmount - council.hrAmount) > HR_AMOUNT_TOLERANCE
        ) {
          throw badRequest(
            `HR expense amount must equal the council HR amount (${council.hrAmount}).`
          )
        }
      }

      const writeResult = await session.executeWrite((tx) =>
        tx.run(createExpenseRequest, {
          jwt: context.jwt,
          ...args,
        })
      )

      if (writeResult.records.length === 0) {
        throw badRequest(
          'Could not create the expense request — council may have been removed.'
        )
      }

      const trans = writeResult.records[0].get('transaction').properties
      const requester = writeResult.records[0].get('requester').properties

      return {
        ...trans,
        loggedBy: { ...requester },
      }
    } catch (err) {
      if (isClassifiedError(err)) throw err
      throwToSentry('Error creating expense request', err)
    } finally {
      await session.close()
    }

    return null
  },
  UndoBussingTransaction: async (
    object: unknown,
    args: { transactionId: string },
    context: Context
  ) => {
    isAuth(permitAdmin('Campus'), context.jwt.roles)
    await assertScopeViaTransaction(context, args.transactionId)

    const session = context.executionContext.session()

    try {
      const contextResult = await session.executeRead((tx) =>
        tx.run(getTransactionForUndo, { transactionId: args.transactionId })
      )

      if (contextResult.records.length === 0) {
        throw badRequest('Transaction not found or already undone.')
      }

      const transaction: AccountTransaction =
        contextResult.records[0].get('transaction').properties

      if (transaction.category !== 'Bussing') {
        throw badRequest(
          `Use UndoWeekdayTransaction for non-Bussing transactions. This transaction is '${transaction.category}'.`
        )
      }
      if (transaction.status !== 'success') {
        throw badRequest(
          `Only successful transactions can be undone. This transaction is '${transaction.status}'.`
        )
      }

      // The write Cypher re-checks status + category, so a concurrent
      // undo that wins the race leaves us with zero rows here — surface
      // a clean "already undone" instead of a crash.
      const writeResult = await session.executeWrite((tx) =>
        tx.run(undoBussingTransactionCypher, {
          jwt: context.jwt,
          transactionId: args.transactionId,
        })
      )

      if (writeResult.records.length === 0) {
        throw badRequest('Transaction was already undone by another request.')
      }

      return writeResult.records[0].get('council').properties
    } catch (err) {
      if (isClassifiedError(err)) throw err
      throwToSentry('Error undoing bussing transaction', err)
    } finally {
      await session.close()
    }

    return null
  },
  UndoWeekdayTransaction: async (
    object: unknown,
    args: { transactionId: string },
    context: Context
  ) => {
    isAuth(permitAdmin('Campus'), context.jwt.roles)
    await assertScopeViaTransaction(context, args.transactionId)

    const session = context.executionContext.session()

    try {
      const contextResult = await session.executeRead((tx) =>
        tx.run(getTransactionForUndo, { transactionId: args.transactionId })
      )

      if (contextResult.records.length === 0) {
        throw badRequest('Transaction not found or already undone.')
      }

      const transaction: AccountTransaction =
        contextResult.records[0].get('transaction').properties

      if (transaction.category === 'Bussing') {
        throw badRequest('Use UndoBussingTransaction for Bussing transactions.')
      }
      if (transaction.status !== 'success') {
        throw badRequest(
          `Only successful transactions can be undone. This transaction is '${transaction.status}'.`
        )
      }

      const writeResult = await session.executeWrite((tx) =>
        tx.run(undoWeekdayTransactionCypher, {
          jwt: context.jwt,
          transactionId: args.transactionId,
        })
      )

      if (writeResult.records.length === 0) {
        throw badRequest('Transaction was already undone by another request.')
      }

      return writeResult.records[0].get('council').properties
    } catch (err) {
      if (isClassifiedError(err)) throw err
      throwToSentry('Error undoing weekday transaction', err)
    } finally {
      await session.close()
    }

    return null
  },
  DebitBussingSociety: async (
    object: unknown,
    args: {
      councilId: string
      expenseAmount: number
      expenseCategory: string
      clientTransactionId: string
    },
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(['arrivalsAdminCampus', 'adminCampus'], context.jwt.roles)
    await assertChurchScope(context, args.councilId)

    try {
      const councilBalancesResult = await session.run(getCouncilBalances, args)
      const council: CouncilForAccounts =
        councilBalancesResult.records[0].get('council').properties
      const leader: Member =
        councilBalancesResult.records[0].get('leader').properties

      const amountRemaining = council.bussingSocietyBalance - args.expenseAmount
      const message = `Dear ${leader.firstName}, ${council.name} Council spent ${args.expenseAmount} GHS on bussing. Bussing Society Balance remaining is ${amountRemaining} GHS`

      const debitRes = await session.run(debitBussingSociety, {
        ...args,
        jwt: context.jwt,
      })

      const isNew = debitRes.records[0].get('isNew')
      if (isNew) {
        sendBulkSMS([leader.phoneNumber], message).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('Bussing debit SMS send failed', err)
        })
      }

      const trans = debitRes.records[0].get('transaction').properties
      const depositor = debitRes.records[0].get('requester').properties

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
