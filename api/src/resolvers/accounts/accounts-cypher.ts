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

// HAS_MIRROR_DEPOSIT lets UndoBussingTransaction reach the sibling Deposit
// created here and DETACH DELETE it alongside the original. Without the tag,
// the mirror would survive the undo and appear in transaction history as a
// phantom Bussing Society deposit with no source expense.
export const creditBussingSocietyFromWeekday = `
 MATCH (weekdayTrans:AccountTransaction {id: $transactionId})<-[:HAS_TRANSACTION]-(council:Council)
 MATCH (requester:Member {id: $jwt.userId})

 WITH council, requester, weekdayTrans

 CREATE (transaction:AccountTransaction {id: randomUUID()})
   SET transaction.description = weekdayTrans.description,
   transaction.amount = weekdayTrans.amount * -1,
   transaction.account = 'Bussing Society',
   transaction.category = 'Deposit',
   transaction.status = 'success',
   transaction.createdAt = datetime(),
   transaction.lastModified = datetime(),
   transaction.bussingSocietyBalance = council.bussingSocietyBalance,
   transaction.weekdayBalance = council.weekdayBalance

 MERGE (council)-[:HAS_TRANSACTION]->(transaction)
 MERGE (requester)<-[:LOGGED_BY]-(transaction)
 MERGE (weekdayTrans)-[:HAS_MIRROR_DEPOSIT]->(transaction)

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

export const debitBussingSociety = `
MATCH  (council:Council {id: $councilId})
MATCH (requester:Member {id: $jwt.userId})

WITH council, requester

CREATE (transaction:AccountTransaction {id: randomUUID()})
  SET transaction.amount = -1 * $expenseAmount,
  transaction.description = 'Bussing Expense',
  transaction.category = $expenseCategory,
  transaction.account = 'Bussing Society',
  transaction.status = 'success',
  transaction.createdAt = datetime(),
  transaction.lastModified = datetime(),
  council.bussingAmount = $expenseAmount
  

SET council.bussingSocietyBalance = council.bussingSocietyBalance - $expenseAmount,
  transaction.bussingSocietyBalance = council.bussingSocietyBalance,
  transaction.weekdayBalance = council.weekdayBalance

MERGE (council)-[:HAS_TRANSACTION]->(transaction)
MERGE (requester)<-[:LOGGED_BY]-(transaction)

RETURN transaction, requester`

export const depositIntoCouncilCurrentAccount = `
MATCH (council:Council {id: $councilId})
MATCH (depositor:Member {id: $jwt.userId})
  SET council.weekdayBalance = council.weekdayBalance + $weekdayBalanceDepositAmount

WITH council, depositor

CREATE (transaction:AccountTransaction {id: randomUUID()})
  SET transaction.description = depositor.firstName +  ' ' + depositor.lastName +  ' deposited ' + $weekdayBalanceDepositAmount + ' into the weekday account',
  transaction.amount = $weekdayBalanceDepositAmount,
  transaction.account = 'Weekday Account',
  transaction.category = 'Deposit',
  transaction.createdAt = datetime(),
  transaction.lastModified = datetime(),
  transaction.status = 'success',
  transaction.bussingSocietyBalance = council.bussingSocietyBalance,
  transaction.weekdayBalance = council.weekdayBalance

MERGE (council)-[:HAS_TRANSACTION]->(transaction)
MERGE (depositor)<-[:LOGGED_BY]-(transaction)

RETURN council, transaction, depositor
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

export const createExpenseRequest = `
MATCH (council:Council {id: $councilId})
MATCH (requester:Member {id: $jwt.userId})

WITH council, requester

CREATE (transaction:AccountTransaction {id: randomUUID()})
  SET transaction.description = $description,
  transaction.amount = $expenseAmount * -1,
  transaction.account = $accountType,
  transaction.category = $expenseCategory,
  transaction.status = 'pending approval',
  transaction.createdAt = datetime(),
  transaction.lastModified = datetime(),
  transaction.bussingSocietyBalance = council.bussingSocietyBalance,
  transaction.weekdayBalance = council.weekdayBalance

MERGE (council)-[:HAS_TRANSACTION]->(transaction)
MERGE (requester)<-[:LOGGED_BY]-(transaction)

WITH council, requester, transaction
CREATE (log:HistoryLog {id: randomUUID()})
  SET log.timeStamp = datetime(),
  log.historyRecord = requester.firstName + ' ' + requester.lastName +
    ' requested ' + toString($expenseAmount) + ' GHS from the ' +
    $accountType + ' for ' + $expenseCategory
MERGE (date:TimeGraph {date: date()})
MERGE (log)-[:LOGGED_BY]->(requester)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (council)-[:HAS_HISTORY]->(log)

RETURN transaction, requester
`

export const depositIntoCoucilBussingSociety = `
   MATCH (council:Council {id: $councilId})
   MATCH (depositor:Member {id: $jwt.userId})
     SET council.bussingSocietyBalance = council.bussingSocietyBalance + $bussingSocietyDepositAmount

   WITH council, depositor

   CREATE (transaction:AccountTransaction {id: randomUUID()})
     SET transaction.description = depositor.firstName +  ' ' + depositor.lastName + $transactionDescription ,
     transaction.amount = $bussingSocietyDepositAmount,
     transaction.category = $transactionType,
     transaction.account = 'Bussing Society',
     transaction.createdAt = datetime(),
     transaction.lastModified = datetime(),
     transaction.status = 'success',
     transaction.bussingSocietyBalance = council.bussingSocietyBalance,
     transaction.weekdayBalance = council.weekdayBalance

   MERGE (council)-[:HAS_TRANSACTION]->(transaction)
   MERGE (depositor)<-[:LOGGED_BY]-(transaction)

   RETURN council, transaction, depositor
      `
