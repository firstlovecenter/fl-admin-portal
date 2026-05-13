import { Context } from '../utils/neo4j-types'
import { sendBulkSMS } from '../utils/notify'
import { Member, Role } from '../utils/types'
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
  MAX_ACCOUNTS_CHARGE,
  MAX_ACCOUNTS_DEPOSIT,
  MAX_ACCOUNTS_EXPENSE,
  assertPositiveFiniteAmount,
} from '../utils/financial-utils'
import {
  approveBussingExpense,
  approveExpense,
  createExpenseRequest,
  debitBussingSociety,
  declineExpense,
  depositIntoCoucilBussingSociety,
  depositIntoCouncilCurrentAccount,
  getCouncilBalances,
  getCouncilBalancesWithTransaction,
  getTransactionForUndo,
  setCouncilHRAmount,
  undoBussingTransactionCypher,
  undoWeekdayTransactionCypher,
} from './accounts-cypher'
import { AccountTransaction, CouncilForAccounts } from './accounts-types'

// SYN-98 — accounts is a need-to-know surface. Per the user's policy
// clarification, ONLY these three church-scoped roles can access any
// accounts mutation, AND the caller must additionally hold the
// `fishers` role. We deliberately do NOT use the permitX helpers
// because they expand to denomination/oversight admins (and other
// downstream roles) by inheritance — which would silently re-widen
// the gate the next time the helpers grow.
//
// Any addition to this list is a deliberate policy change that must
// be made by a human, never by Claude.
const ACCOUNTS_CHURCH_ROLES: Role[] = [
  'leaderCouncil',
  'leaderCampus',
  'adminCampus',
]

const assertAccountsAccess = (jwtRoles: Role[] | undefined) => {
  isAuth(ACCOUNTS_CHURCH_ROLES, jwtRoles)
  if (!jwtRoles?.includes('fishers')) {
    throw badRequest(
      'Accounts access requires the fishers role. Contact an admin if you need this access.'
    )
  }
}

// SYN-92 — surfaced to the user when the read- or write-side status guard
// trips. Same wording in all sites so a future copy-edit can't drift
// a partial set of error messages.
//
// SYN-96 — also reused by the lifted DeclineExpense resolver, which
// shares the same status precondition.
const TRANSACTION_NOT_PENDING_MESSAGE =
  'This transaction is no longer pending approval. Refresh to see the current status.'

// SYN-96 — preserved narrow gates from the lifted SDL @authentication
// directives. SetCouncilHRAmount was adminCampus only; DeclineExpense
// was adminCampus + leaderCampus. Refactor-only PR — no role widening.
// Intentionally NOT using assertAccountsAccess (which would expand the
// allowed set to leaderCouncil too) and NOT using permitAdmin (which
// expands by inheritance).
const SET_COUNCIL_HR_ROLES: Role[] = ['adminCampus']
const DECLINE_EXPENSE_ROLES: Role[] = ['adminCampus', 'leaderCampus']

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

// SYN-111 — accounts office hours, mirrored from
// web-react-ts/src/pages/accounts/accounts-utils.ts:isAccountOpen.
// Ghana runs UTC+0 year-round (no DST), and Lambda always runs in UTC,
// so getUTCHours is the right comparison surface in both environments.
const ACCOUNTS_OPEN_HOUR_UTC = 6
const ACCOUNTS_CLOSE_HOUR_UTC = 15

const isAccountsWindowOpen = (now: Date = new Date()): boolean => {
  const hour = now.getUTCHours()
  return hour >= ACCOUNTS_OPEN_HOUR_UTC && hour < ACCOUNTS_CLOSE_HOUR_UTC
}

// SYN-111 — server-side enforcement of the office-hours gate. The FE
// already blocks ExpenseRequest submission outside this window, but a
// direct API call (curl, replay, custom client) could bypass that.
// `fishers` is the ops-override role and skips the check, mirroring
// the same exemption in the FE's ExpenseForm.
const assertAccountsWindowOpen = (jwtRoles: Role[] | undefined) => {
  if (jwtRoles?.includes('fishers')) return
  if (!isAccountsWindowOpen()) {
    throw badRequest(
      'Accounts are closed. Expense requests can only be submitted between 6:00 and 15:00 UTC.'
    )
  }
}

export const accountsMutations = {
  // SYN-96 — lifted from SDL @cypher. The previous declarative form
  // gated only on role membership, so an adminCampus from one campus
  // could overwrite the HR amount on a Council in another campus and
  // prime an oversize HR ExpenseRequest. The resolver now runs the
  // narrow role gate, validates the amount via SYN-93, and asserts
  // church scope before the write.
  SetCouncilHRAmount: async (
    object: unknown,
    args: { councilId: string; amount: number },
    context: Context
  ) => {
    isAuth(SET_COUNCIL_HR_ROLES, context.jwt.roles)
    assertPositiveFiniteAmount(args.amount, 'amount', {
      max: MAX_ACCOUNTS_EXPENSE,
      allowZero: true,
    })
    await assertChurchScope(context, args.councilId)
    const session = context.executionContext.session()

    try {
      const result = await session.run(setCouncilHRAmount, args)
      if (result.records.length === 0) {
        throw badRequest('Council not found.')
      }
      return result.records[0].get('council').properties
    } catch (err) {
      if (isClassifiedError(err)) throw err
      throwToSentry('Error setting council HR amount', err)
    } finally {
      await session.close()
    }

    return null
  },

  // SYN-96 — lifted from SDL @cypher. Adds the SYN-92 status
  // precondition so an already-approved transaction cannot be
  // silently re-flipped to 'declined' (which would leave the council
  // balance moved while the row reads 'declined'). Roles preserved at
  // adminCampus + leaderCampus per the lifted SDL gate.
  DeclineExpense: async (
    object: unknown,
    args: { transactionId: string },
    context: Context
  ) => {
    isAuth(DECLINE_EXPENSE_ROLES, context.jwt.roles)
    await assertScopeViaTransaction(context, args.transactionId)
    const session = context.executionContext.session()

    try {
      const result = await session.run(declineExpense, args)
      if (result.records.length === 0) {
        throw badRequest(TRANSACTION_NOT_PENDING_MESSAGE)
      }
      return result.records[0].get('transaction').properties
    } catch (err) {
      if (isClassifiedError(err)) throw err
      throwToSentry('Error declining expense', err)
    } finally {
      await session.close()
    }

    return null
  },

  DepositIntoCouncilCurrentAccount: async (
    object: unknown,
    args: {
      councilId: string
      weekdayBalanceDepositAmount: number
      clientTransactionId: string
    },
    context: Context
  ) => {
    assertAccountsAccess(context.jwt.roles)
    assertPositiveFiniteAmount(
      args.weekdayBalanceDepositAmount,
      'weekdayBalanceDepositAmount',
      { max: MAX_ACCOUNTS_DEPOSIT }
    )
    const session = context.executionContext.session()
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

      // SYN-112: format the description JS-side and pass as
      // $transactionDescription so the ledger doesn't store "20000.0"
      // via Cypher's float-to-string concatenation.
      const transactionDescription = ` deposited ${args.weekdayBalanceDepositAmount.toLocaleString(
        'en-GB'
      )} into the weekday account`

      const debitRes = await session.run(depositIntoCouncilCurrentAccount, {
        jwt: context.jwt,
        ...args,
        transactionDescription,
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
    assertAccountsAccess(context.jwt.roles)
    // SYN-93 — bussingSocietyBalance is the NEW account total, not a
    // delta, so zero is legitimate (zeroing the account). The downstream
    // Debit branch (depositAmount < 0) is itself a valid path.
    assertPositiveFiniteAmount(
      args.bussingSocietyBalance,
      'bussingSocietyBalance',
      { max: MAX_ACCOUNTS_DEPOSIT, allowZero: true }
    )
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
    assertAccountsAccess(context.jwt.roles)
    // SYN-93 — closes the negative-charge self-credit primitive.
    // approveExpense's cypher computes
    //   weekdayBalance - (-1 * transaction.amount) - toFloat($charge)
    // A negative $charge value would credit (instead of debit) the
    // council balance. allowZero: true because a no-fee approval is
    // legitimate.
    assertPositiveFiniteAmount(args.charge, 'charge', {
      max: MAX_ACCOUNTS_CHARGE,
      allowZero: true,
    })
    await assertScopeViaTransaction(context, args.transactionId)
    // SYN-94 — single session. The bussing branch used to allocate a
    // sessionTwo for the credit-leg insert running in parallel with
    // the parent debit; that's now collapsed into one Cypher statement
    // (see approveBussingExpense in accounts-cypher.ts).
    const session = context.executionContext.session()

    try {
      const councilBalancesResult = await session.run(
        getCouncilBalancesWithTransaction,
        args
      )

      // SYN-92 — read is now status-gated. Zero rows means the
      // transaction is not (or no longer) pending approval, so we
      // bail before constructing the SMS body or running the write.
      if (councilBalancesResult.records.length === 0) {
        throw badRequest(TRANSACTION_NOT_PENDING_MESSAGE)
      }

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

        // SYN-94 — single Cypher statement covers both the parent
        // debit and the Bussing Society credit-leg MERGE atomically.
        // The credit-leg's clientTransactionId is server-derived from
        // the parent id so the MERGE is idempotent across retries.
        // SYN-102 — SMS dispatch detached from Promise.all and gated
        // on a successful write. An mNotify outage no longer poisons
        // the mutation response, and a TOCTOU race loser does not get
        // a duplicate "approved" SMS because the gated write returns
        // zero rows on the loser side.
        const debitRes = await session.run(approveBussingExpense, {
          ...args,
          jwt: context.jwt,
        })

        // SYN-92 — TOCTOU defense for the narrow race between the read
        // returning and the write firing. The read-side guard catches
        // almost all cases; this exists so a future reader does not
        // delete it as redundant.
        if (debitRes.records.length === 0) {
          throw badRequest(TRANSACTION_NOT_PENDING_MESSAGE)
        }

        // Fire-and-forget — leader notification must not block or fail
        // the mutation response.
        sendBulkSMS([leader.phoneNumber], message).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('ApproveExpense (bussing) SMS send failed', err)
        })

        const trans = debitRes.records[0].get('transaction').properties
        const depositor = debitRes.records[0].get('depositor').properties

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

      // SYN-102 — see bussing branch above for rationale.
      const debitRes = await session.run(approveExpense, args)

      // SYN-92 — TOCTOU defense.
      if (debitRes.records.length === 0) {
        throw badRequest(TRANSACTION_NOT_PENDING_MESSAGE)
      }

      // Fire-and-forget — see bussing branch.
      sendBulkSMS([leader.phoneNumber], message).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('ApproveExpense SMS send failed', err)
      })

      const trans = debitRes.records[0].get('transaction').properties
      const depositor = debitRes.records[0].get('depositor').properties

      return {
        ...trans,
        loggedBy: { ...depositor },
      }
    } catch (error: any) {
      if (isClassifiedError(error)) throw error
      throwToSentry('', error.message)
    } finally {
      await session.close()
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
    assertAccountsAccess(context.jwt.roles)
    // SYN-111 — server-side enforcement of the office-hours window.
    // FE blocks submission, but a direct API call would otherwise
    // bypass the gate. fishers role exempt (matches FE behaviour).
    // Hoisted above assertChurchScope so a closed-window call never
    // reaches the scope DB read; an attacker probing councilIds out
    // of hours sees the hours error, not "Council not found".
    assertAccountsWindowOpen(context.jwt.roles)
    // SYN-93 — replaces the inline finite/positive check that lived
    // here. Adds a paranoia ceiling.
    assertPositiveFiniteAmount(args.expenseAmount, 'expenseAmount', {
      max: MAX_ACCOUNTS_EXPENSE,
    })
    await assertChurchScope(context, args.councilId)

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
    assertAccountsAccess(context.jwt.roles)
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
    assertAccountsAccess(context.jwt.roles)
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
    assertAccountsAccess(context.jwt.roles)
    // SYN-93 — closes the negative-expenseAmount audit-trail laundering
    // primitive. debitBussingSociety's cypher computes
    //   transaction.amount = -1 * $expenseAmount
    // A negative $expenseAmount would write a positive transaction
    // amount and silently shift balance the wrong direction.
    assertPositiveFiniteAmount(args.expenseAmount, 'expenseAmount', {
      max: MAX_ACCOUNTS_EXPENSE,
    })
    const session = context.executionContext.session()
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
