// SYN-92 — read-time fail-fast. ApproveExpense uses this read to build
// the SMS body and balance preview BEFORE the write fires. Without the
// status guard, an already-approved row would still return a record,
// the SMS would dispatch in the same Promise.all as the write, and the
// leader would receive a second "approved" SMS for a duplicate request.
// Filtering pending-only at read time prevents that side effect; the
// writes below carry the same guard for the narrow race between the
// read returning and the write firing.
export const getCouncilBalancesWithTransaction = `
MATCH (transaction:AccountTransaction {id: $transactionId})<-[:HAS_TRANSACTION]-(council:Council)
WHERE transaction.status = 'pending approval'
MATCH (council)<-[:LEADS]-(leader:Member)
RETURN council, transaction, leader
`

export const getCouncilBalances = `
MATCH (council:Council {id: $councilId})
MATCH (council)<-[:LEADS]-(leader:Member)
RETURN council, leader
`

// SYN-96 — lifted from inline @cypher in accounts.graphql so the
// resolver can run a real church-scope check (assertChurchScope) and
// validate the amount with the SYN-93 helper before any write. The
// SDL @authentication only verified role membership; nothing stopped
// an adminCampus from Campus A from overwriting the HR amount on a
// Council in Campus B and priming an oversize ExpenseRequest.
//
// Adds hrAmountLastModified so future audits can spot HR-knob drift.
export const setCouncilHRAmount = `
MATCH (council:Council {id: $councilId})
  SET council.hrAmount = $amount,
      council.hrAmountLastModified = datetime()
RETURN council
`

// SYN-96 — lifted from inline @cypher. Adds the same SYN-92 status
// precondition the approve mutations use so an already-approved or
// already-declined transaction cannot be silently re-flipped to
// 'declined' (which would leave the council balance moved while the
// row reads 'declined').
export const declineExpense = `
MATCH (transaction:AccountTransaction {id: $transactionId})
WHERE transaction.status = 'pending approval'
  SET transaction.status = 'declined',
      transaction.lastModified = datetime()
RETURN transaction
`

// SYN-92 — `WHERE transaction.status = 'pending approval'` makes
// double-approval impossible at the DB layer. If two admins race or
// Apollo retries the mutation, only the first write matches; the
// second filters to zero rows and the resolver surfaces a friendly
// error instead of double-debiting the council balance.
//
// SYN-94 — atomic. The parent debit and the Bussing Society credit-leg
// MERGE now run as a single Cypher statement so they commit together.
// Previously these were two `session.run` calls across two sessions;
// a failure or partial commit between them could leave the parent
// flipped to 'success' with no mirror credit (orphaned debit) or vice
// versa, and the credit-leg's pre-update balance snapshots were stale
// because they read the council's PRE-debit balances.
//
// Credit-leg keying: `'internal:credit-leg:' + $transactionId`. The
// MERGE makes a retry on the same parent a no-op for the credit row.
// Prefixed `internal:credit-leg:` to stay disjoint from FE UUIDs.
//
// HAS_MIRROR_DEPOSIT links the credit leg back to the parent so
// UndoBussingTransaction can DETACH DELETE both together.
export const approveBussingExpense = `
MATCH (transaction:AccountTransaction {id: $transactionId})<-[:HAS_TRANSACTION]-(council:Council)
WHERE transaction.status = 'pending approval'
MATCH (transaction)-[:LOGGED_BY]->(depositor:Member)
MATCH (requester:Member {id: $jwt.userId})

  SET transaction.bussingSocietyBalance = council.bussingSocietyBalance
  SET council.bussingSocietyBalance = council.bussingSocietyBalance + (-1 * transaction.amount)
  SET council.weekdayBalance = council.weekdayBalance - (-1 * transaction.amount) - toFloat($charge)
  SET transaction.status = 'success'
  SET transaction.charge = toFloat($charge) * -1
  SET transaction.weekdayBalance = council.weekdayBalance

WITH council, transaction, depositor, requester,
     'internal:credit-leg:' + $transactionId AS creditLegKey

MERGE (creditLeg:AccountTransaction {clientTransactionId: creditLegKey})
ON CREATE SET
  creditLeg.id = randomUUID(),
  creditLeg.amount = transaction.amount * -1,
  creditLeg.account = 'Bussing Society',
  creditLeg.category = 'Deposit',
  creditLeg.status = 'success',
  creditLeg.createdAt = datetime(),
  creditLeg.lastModified = datetime(),
  creditLeg.bussingSocietyBalance = council.bussingSocietyBalance,
  creditLeg.weekdayBalance = council.weekdayBalance,
  creditLeg.description = transaction.description

MERGE (council)-[:HAS_TRANSACTION]->(creditLeg)
MERGE (requester)<-[:LOGGED_BY]-(creditLeg)
MERGE (transaction)-[:HAS_MIRROR_DEPOSIT]->(creditLeg)

RETURN council, transaction, depositor
`

// SYN-92 — same precondition as approveBussingExpense above. Without
// this guard a second ApproveExpense call (race or Apollo retry) would
// re-debit the council weekdayBalance and re-apply the charge.
export const approveExpense = `
MATCH (transaction:AccountTransaction {id: $transactionId})<-[:HAS_TRANSACTION]-(council:Council)
WHERE transaction.status = 'pending approval'
MATCH (transaction)-[:LOGGED_BY]->(depositor:Member)
  SET council.weekdayBalance = council.weekdayBalance - (-1 * transaction.amount) - toFloat($charge)
  SET transaction.charge = $charge * -1
  SET transaction.status = 'success'
  SET transaction.lastModified = datetime(),
  transaction.bussingSocietyBalance = council.bussingSocietyBalance,
  transaction.weekdayBalance = council.weekdayBalance

RETURN transaction, depositor
`

// ADR-005 idempotency — see depositIntoCouncilCurrentAccount above.
// Note: `council.bussingAmount = $expenseAmount` (overwrite, not
// accumulate) is preserved for parity with the original behaviour. The
// overwrite-vs-accumulate bug is tracked in SYN-99 and is now gated to
// first-write only by the FOREACH, so retries no longer re-overwrite.
export const debitBussingSociety = `
MATCH (council:Council {id: $councilId})
MATCH (requester:Member {id: $jwt.userId})

MERGE (transaction:AccountTransaction {clientTransactionId: $clientTransactionId})
ON CREATE SET
  transaction.id = randomUUID(),
  transaction.amount = -1 * $expenseAmount,
  transaction.description = 'Bussing Expense',
  transaction.category = $expenseCategory,
  transaction.account = 'Bussing Society',
  transaction.status = 'success',
  transaction.lastModified = datetime(),
  transaction._isNewWrite = true
ON MATCH SET
  transaction._isNewWrite = false

WITH transaction, council, requester,
     coalesce(transaction._isNewWrite, false) AS isNew,
     council.bussingSocietyBalance - $expenseAmount AS newBussingBalance,
     council.weekdayBalance AS weekdaySnapshot
REMOVE transaction._isNewWrite

// SYN-99 — council.bussingAmount cached scalar removed. The four spine
// bussingAmount aggregates now compute from the AccountTransaction
// ledger directly, so the snapshot field would be stale and unused.
FOREACH (_ IN CASE WHEN isNew THEN [1] ELSE [] END |
  SET council.bussingSocietyBalance = newBussingBalance,
      transaction.bussingSocietyBalance = newBussingBalance,
      transaction.weekdayBalance = weekdaySnapshot
)

MERGE (council)-[:HAS_TRANSACTION]->(transaction)
MERGE (requester)<-[:LOGGED_BY]-(transaction)

RETURN transaction, requester, isNew`

// ADR-005 idempotency. MERGE keyed on a client-supplied
// `clientTransactionId` (UNIQUE-constrained — see migration script) so an
// Apollo retry returns the original transaction without firing a second
// balance increment, and concurrent retries cannot both pass through the
// CREATE branch.
//
// The `_isNewWrite` sentinel + FOREACH/CASE pattern gates the council-
// balance mutation and the snapshot fields to the FIRST insertion only —
// on a MATCH (replay), the FOREACH body does not execute. The sentinel
// is removed before RETURN so it never persists.
//
// IMPORTANT: the post-update balance is pre-computed into `newWB` BEFORE
// the FOREACH. Inside one SET clause, comma-chained assignments execute
// sequentially and later items read post-update property values — so
// reading `council.weekdayBalance + $X` AFTER the council mutation would
// give `old + 2X`, double-counting the snapshot.
export const depositIntoCouncilCurrentAccount = `
MATCH (council:Council {id: $councilId})
MATCH (depositor:Member {id: $jwt.userId})

MERGE (transaction:AccountTransaction {clientTransactionId: $clientTransactionId})
ON CREATE SET
  transaction.id = randomUUID(),
  transaction.amount = $weekdayBalanceDepositAmount,
  transaction.account = 'Weekday Account',
  transaction.category = 'Deposit',
  transaction.status = 'success',
  transaction.createdAt = datetime(),
  transaction.lastModified = datetime(),
  transaction._isNewWrite = true
ON MATCH SET
  transaction._isNewWrite = false

WITH transaction, council, depositor,
     coalesce(transaction._isNewWrite, false) AS isNew,
     council.weekdayBalance + $weekdayBalanceDepositAmount AS newWeekdayBalance,
     council.bussingSocietyBalance AS bussingSnapshot
REMOVE transaction._isNewWrite

FOREACH (_ IN CASE WHEN isNew THEN [1] ELSE [] END |
  SET council.weekdayBalance = newWeekdayBalance,
      transaction.weekdayBalance = newWeekdayBalance,
      transaction.bussingSocietyBalance = bussingSnapshot,
      transaction.description = depositor.firstName + ' ' + depositor.lastName +
        $transactionDescription
)

MERGE (council)-[:HAS_TRANSACTION]->(transaction)
MERGE (depositor)<-[:LOGGED_BY]-(transaction)

RETURN council, transaction, depositor, isNew
`

export const getTransactionForUndo = `
MATCH (transaction:AccountTransaction {id: $transactionId})
      <-[:HAS_TRANSACTION]-(council:Council)
RETURN transaction, council
`

// Status + category guards are folded into the MATCH so concurrent undo
// calls race on the planner, not on the resolver. The loser matches zero
// rows, SET / DETACH DELETE no-op, RETURN is empty, and the resolver
// reports "already undone".
//
// Sign math: ApproveExpense for a Bussing-category transaction
//   bussingSocietyBalance += -1 * transaction.amount     (credit bussing)
//   weekdayBalance        -= -1 * transaction.amount + charge   (debit weekday)
// where transaction.amount is stored negative. The undo reverses both
// sides and restores the charge.
export const undoBussingTransactionCypher = `
MATCH (transaction:AccountTransaction {id: $transactionId})
      <-[:HAS_TRANSACTION]-(council:Council)
WHERE transaction.status = 'success'
  AND transaction.category = 'Bussing'
MATCH (actor:Member {id: $jwt.userId})

WITH transaction, council, actor,
     transaction.amount AS originalAmount,
     COALESCE(transaction.charge, 0.0) AS originalCharge

SET council.bussingSocietyBalance = council.bussingSocietyBalance + originalAmount
SET council.weekdayBalance = council.weekdayBalance - originalAmount - originalCharge

WITH council, actor, originalAmount, transaction
CREATE (log:HistoryLog {id: randomUUID()})
  SET log.timeStamp = datetime(),
  log.historyRecord = actor.firstName + ' ' + actor.lastName +
    ' undid a Bussing Society transaction of ' +
    toString(-1 * originalAmount) + ' GHS'
MERGE (date:TimeGraph {date: date()})
MERGE (log)-[:LOGGED_BY]->(actor)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (council)-[:HAS_HISTORY]->(log)

WITH council, transaction
OPTIONAL MATCH (transaction)-[:HAS_MIRROR_DEPOSIT]->(mirror:AccountTransaction)
DETACH DELETE mirror, transaction

RETURN council
`

// ApproveExpense for a non-Bussing transaction
//   weekdayBalance -= -1 * transaction.amount + charge
// Undo reverses that single-sided debit and the charge.
export const undoWeekdayTransactionCypher = `
MATCH (transaction:AccountTransaction {id: $transactionId})
      <-[:HAS_TRANSACTION]-(council:Council)
WHERE transaction.status = 'success'
  AND transaction.category <> 'Bussing'
MATCH (actor:Member {id: $jwt.userId})

WITH transaction, council, actor,
     transaction.amount AS originalAmount,
     COALESCE(transaction.charge, 0.0) AS originalCharge

SET council.weekdayBalance = council.weekdayBalance - originalAmount - originalCharge

WITH council, actor, originalAmount, transaction
CREATE (log:HistoryLog {id: randomUUID()})
  SET log.timeStamp = datetime(),
  log.historyRecord = actor.firstName + ' ' + actor.lastName +
    ' undid a Weekday Account transaction of ' +
    toString(-1 * originalAmount) + ' GHS'
MERGE (date:TimeGraph {date: date()})
MERGE (log)-[:LOGGED_BY]->(actor)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (council)-[:HAS_HISTORY]->(log)

DETACH DELETE transaction

RETURN council
`

// createExpenseRequest now MERGE-keyed on $clientTransactionId per
// SYN-97 so an Apollo retry returns the original pending-approval row
// instead of creating a duplicate. ON CREATE SET handles the identity +
// snapshot fields; on MATCH the body is a no-op. HistoryLog still
// appended on first write only — gated by the same isNew sentinel
// pattern used in the deposit / debit cyphers below.
export const createExpenseRequest = `
MATCH (council:Council {id: $councilId})
MATCH (requester:Member {id: $jwt.userId})

MERGE (transaction:AccountTransaction {clientTransactionId: $clientTransactionId})
ON CREATE SET
  transaction.id = randomUUID(),
  transaction.description = $description,
  transaction.amount = $expenseAmount * -1,
  transaction.account = $accountType,
  transaction.category = $expenseCategory,
  transaction.status = 'pending approval',
  transaction.createdAt = datetime(),
  transaction.lastModified = datetime(),
  transaction.bussingSocietyBalance = council.bussingSocietyBalance,
  transaction.weekdayBalance = council.weekdayBalance,
  transaction._isNewWrite = true
ON MATCH SET
  transaction._isNewWrite = false

WITH transaction, council, requester,
     coalesce(transaction._isNewWrite, false) AS isNew
REMOVE transaction._isNewWrite

MERGE (council)-[:HAS_TRANSACTION]->(transaction)
MERGE (requester)<-[:LOGGED_BY]-(transaction)

FOREACH (_ IN CASE WHEN isNew THEN [1] ELSE [] END |
  CREATE (log:HistoryLog {id: randomUUID()})
    SET log.timeStamp = datetime(),
    log.historyRecord = requester.firstName + ' ' + requester.lastName +
      ' requested ' + toString($expenseAmount) + ' GHS from the ' +
      $accountType + ' for ' + $expenseCategory
  MERGE (date:TimeGraph {date: date()})
  MERGE (log)-[:LOGGED_BY]->(requester)
  MERGE (log)-[:RECORDED_ON]->(date)
  MERGE (council)-[:HAS_HISTORY]->(log)
)

RETURN transaction, requester
`

// ADR-005 idempotency — see depositIntoCouncilCurrentAccount above for
// the sentinel + pre-computed-balance pattern.
export const depositIntoCoucilBussingSociety = `
MATCH (council:Council {id: $councilId})
MATCH (depositor:Member {id: $jwt.userId})

MERGE (transaction:AccountTransaction {clientTransactionId: $clientTransactionId})
ON CREATE SET
  transaction.id = randomUUID(),
  transaction.amount = $bussingSocietyDepositAmount,
  transaction.account = 'Bussing Society',
  transaction.category = $transactionType,
  transaction.status = 'success',
  transaction.createdAt = datetime(),
  transaction.lastModified = datetime(),
  transaction._isNewWrite = true
ON MATCH SET
  transaction._isNewWrite = false

WITH transaction, council, depositor,
     coalesce(transaction._isNewWrite, false) AS isNew,
     council.bussingSocietyBalance + $bussingSocietyDepositAmount AS newBussingBalance,
     council.weekdayBalance AS weekdaySnapshot
REMOVE transaction._isNewWrite

FOREACH (_ IN CASE WHEN isNew THEN [1] ELSE [] END |
  SET council.bussingSocietyBalance = newBussingBalance,
      transaction.bussingSocietyBalance = newBussingBalance,
      transaction.weekdayBalance = weekdaySnapshot,
      transaction.description = depositor.firstName + ' ' + depositor.lastName +
        $transactionDescription
)

MERGE (council)-[:HAS_TRANSACTION]->(transaction)
MERGE (depositor)<-[:LOGGED_BY]-(transaction)

RETURN council, transaction, depositor, isNew
`
