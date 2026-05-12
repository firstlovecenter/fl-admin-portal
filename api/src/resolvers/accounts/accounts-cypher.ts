export const getCouncilBalancesWithTransaction = `
MATCH (transaction:AccountTransaction {id: $transactionId})<-[:HAS_TRANSACTION]-(council:Council)
MATCH (council)<-[:LEADS]-(leader:Member)
RETURN council, transaction, leader
`

export const getCouncilBalances = `
MATCH (council:Council {id: $councilId})
MATCH (council)<-[:LEADS]-(leader:Member)
RETURN council, leader
`

export const approveBussingExpense = `
MATCH (transaction:AccountTransaction {id: $transactionId})<-[:HAS_TRANSACTION]-(council:Council)
MATCH (transaction)-[:LOGGED_BY]->(depositor:Member)
  SET transaction.bussingSocietyBalance = council.bussingSocietyBalance
  SET council.bussingSocietyBalance = council.bussingSocietyBalance + (-1 * transaction.amount)
  SET council.weekdayBalance = council.weekdayBalance - (-1 * transaction.amount) - toFloat($charge)
  SET transaction.status = 'success'
  SET transaction.charge = toFloat($charge) * -1
  SET transaction.weekdayBalance = council.weekdayBalance

RETURN council, transaction, depositor
`

// Server-derived clientTransactionId — the credit leg has no client
// caller, so the key is deterministic on the parent weekday transaction
// id. An Apollo retry of ApproveExpense re-runs both legs; this MERGE
// matches the existing credit row and skips the body. Prefixed
// `internal:credit-leg:` to keep server-derived keys disjoint from
// FE-supplied UUIDs.
export const creditBussingSocietyFromWeekday = `
MATCH (weekdayTrans:AccountTransaction {id: $transactionId})<-[:HAS_TRANSACTION]-(council:Council)
MATCH (requester:Member {id: $jwt.userId})

WITH council, requester, weekdayTrans,
     'internal:credit-leg:' + $transactionId AS creditLegKey

MERGE (transaction:AccountTransaction {clientTransactionId: creditLegKey})
ON CREATE SET
  transaction.id = randomUUID(),
  transaction.amount = weekdayTrans.amount * -1,
  transaction.account = 'Bussing Society',
  transaction.category = 'Deposit',
  transaction.status = 'success',
  transaction.createdAt = datetime(),
  transaction.lastModified = datetime(),
  transaction.bussingSocietyBalance = council.bussingSocietyBalance,
  transaction.weekdayBalance = council.weekdayBalance,
  transaction.description = weekdayTrans.description

MERGE (council)-[:HAS_TRANSACTION]->(transaction)
MERGE (requester)<-[:LOGGED_BY]-(transaction)

RETURN transaction
`

export const approveExpense = `
MATCH (transaction:AccountTransaction {id: $transactionId})<-[:HAS_TRANSACTION]-(council:Council)
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
  transaction.createdAt = datetime(),
  transaction.lastModified = datetime(),
  transaction._isNewWrite = true
ON MATCH SET
  transaction._isNewWrite = false

WITH transaction, council, requester,
     coalesce(transaction._isNewWrite, false) AS isNew,
     council.bussingSocietyBalance - $expenseAmount AS newBussingBalance,
     council.weekdayBalance AS weekdaySnapshot
REMOVE transaction._isNewWrite

FOREACH (_ IN CASE WHEN isNew THEN [1] ELSE [] END |
  SET council.bussingSocietyBalance = newBussingBalance,
      council.bussingAmount = $expenseAmount,
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
        ' deposited ' + $weekdayBalanceDepositAmount +
        ' into the weekday account'
)

MERGE (council)-[:HAS_TRANSACTION]->(transaction)
MERGE (depositor)<-[:LOGGED_BY]-(transaction)

RETURN council, transaction, depositor, isNew
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
