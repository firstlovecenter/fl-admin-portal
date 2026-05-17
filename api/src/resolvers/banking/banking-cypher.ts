/* eslint-disable fl-cypher/no-interpolated-cypher --
   This file composes Cypher from STATIC helper fragments
   (appendBankingHistoryLog, markRecordTellerConfirmed). Every interpolated
   expression in this file is a function call that takes hardcoded literal
   variable names ('record' | 'service', 'author' | 'banker' | 'teller')
   and returns a static Cypher string — no user input, no JWT value, no
   resolver argument is ever interpolated. All runtime values flow through
   $param bindings inside those fragments (e.g. $bh_method, $bh_toStatus).
   ADR-012's intent (no injection vectors via user input) is preserved.
   Reviewers: confirm every interpolated expression in this file is a
   helper-function call returning a const-string Cypher fragment before
   approving changes to this disable. */
// Cypher fragment: append a BankingHistoryLog node to a ServiceRecord and
// (optionally) attach the actor that performed the transition. The fragment
// expects the named record/actor variables to be in scope from the calling
// query — pass actorVar=null for the Paystack webhook which has no JWT.
// Parameters consumed: $bh_method, $bh_fromStatus (nullable), $bh_toStatus,
// $bh_message. Callers must supply all four on the session.run call.
export const appendBankingHistoryLog = (
  recordVar: string,
  actorVar: string | null
): string => {
  // bhlog is freshly CREATEd one line above, so the actor edge can never
  // match an existing pattern — use CREATE not MERGE for clarity.
  const actorLine = actorVar
    ? `CREATE (${actorVar})-[:LOGGED_BANKING]->(bhlog)`
    : ''
  return `
CREATE (${recordVar})-[:HAS_BANKING_HISTORY]->(bhlog:BankingHistoryLog {
  id: randomUUID(),
  method: $bh_method,
  fromStatus: $bh_fromStatus,
  toStatus: $bh_toStatus,
  message: $bh_message,
  ts: datetime()
})
${actorLine}
`
}

// SM1 atomic transition: a fresh banking attempt is only allowed from
// null (never banked) or 'failed' (previous attempt exploded). Concurrent
// requests both passing the read-side check race here — by filtering at
// MATCH the SET only fires for the first one, and the second sees zero
// rows returned.
export const initiateServiceRecordTransaction = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
WHERE record.transactionStatus IS NULL OR record.transactionStatus = 'failed'

MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus

// Hierarchy labels are mutually exclusive per kb/05-data-entities.md, so the
// head() always resolves to exactly one value. The allowlist is duplicated
// here intentionally to keep the projection explicit at the point of use.
WITH record, church,
     head([l IN labels(church) WHERE l IN ['Bacenta','Governorship','Council','Stream','Campus']]) AS churchLevel

MATCH (author:Member {id: $jwt.userId})
MATCH (record)-[:SERVICE_HELD_ON]->(date:TimeGraph)

// A ServiceRecord can hang off multiple :ServiceLog history nodes for the
// same church (one per leadership tenure). Without DISTINCT here the
// church/churchLevel join above fans the row stream out N times, and the
// downstream CREATE for the BankingHistoryLog audit row fires N times —
// producing duplicate audit entries for a single banking action. The SET
// writes are idempotent on value but the CREATE is not. Verified against
// dev: ~3% of ServiceRecord ids resolve to 2-3 :ServiceLog ancestors.
WITH DISTINCT record, church, churchLevel, author, date

SET record.sourceNumber = $mobileNumber,
    record.sourceNetwork = $mobileNetwork,
    record.desc = church.name + ' ' + churchLevel + ' '  + date.date,
    record.transactionStatus = 'pending',
    record.transactionTime = datetime()
REMOVE record.transactionError

MERGE (author)<-[:OFFERING_BANKED_BY]-(record)
${appendBankingHistoryLog('record', 'author')}
RETURN record, church.name AS churchName, date.date AS date, churchLevel AS churchLevel,
    author {
        .firstName,
        .lastName,
        .email,
        .phoneNumber
    }
`

export const setRecordTransactionReference = `
    MATCH (record:ServiceRecord {id: $id})
    SET record.transactionReference = $reference,
    record.transactionStatus = 'pending'

    RETURN record {
        .id,
        .transactionReference,
        .transactionStatus
    }
`

// SM1 atomic transition for the admin-driven "paste a Paystack reference
// the system lost track of" recovery path. Only legal source states are
// {null, 'failed'} — never overwrite 'pending', 'success', 'reversed',
// or 'send OTP' (overwriting a 'send OTP' record desyncs the Paystack
// reference still bound to the in-flight OTP and orphans the charge).
//
// OFFERING_BANKED_BY stays pointed at whoever actually attempted the
// banking — usually the leader/treasurer whose momo number is on the
// record. The recovering admin's attribution is captured separately via
// RECOVERY_REFERENCE_SET_BY so the receipt continues to show "Banked by
// <original banker>" while the audit trail still names who pasted the
// reference. Both MATCH clauses run BEFORE any SET — if the JWT's userId
// fails to resolve to a Member, the entire write is suppressed (zero
// rows) instead of leaving the record half-mutated.
export const setRecordTransactionReferenceManually = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
WHERE record.transactionStatus IS NULL
   OR record.transactionStatus = 'failed'
MATCH (author:Member {id: $jwt.userId})

SET record.transactionReference = $transactionReference,
    record.transactionStatus = 'pending',
    record.transactionTime = datetime()
REMOVE record.transactionError

MERGE (record)-[:RECOVERY_REFERENCE_SET_BY]->(author)
${appendBankingHistoryLog('record', 'author')}
RETURN record {
    .id,
    .transactionReference,
    .transactionStatus,
    .transactionError,
    .transactionTime
}
`

// SM1 guard: only legal transition is 'pending' -> 'send OTP'. Blocks the
// race where the Paystack webhook flips to 'success' between the resolver's
// initiate-write and Paystack's send_otp response.
export const setRecordTransactionReferenceWithOTP = `
    MATCH (record {id: $id})
    WHERE (record:ServiceRecord OR record:RehearsalRecord)
      AND record.transactionStatus = 'pending'
    SET record.transactionStatus = 'send OTP'

    RETURN record {
        .id,
        .transactionReference,
        .transactionStatus,
        .cash,
        .desc,
        .sourceNetwork,
        .sourceNumber,
        .transactionTime
        }
    `

export const checkTransactionReference = `
MATCH (record {id: $serviceRecordId}) WHERE record:ServiceRecord OR record:RehearsalRecord
MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)<-[:HAS*0..5]-(stream:Stream)
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream
OPTIONAL MATCH (record)-[:OFFERING_BANKED_BY]->(banker)
RETURN record {
    .id,
    .cash,
    .transactionReference,
    .transactionStatus,
    .transactionTime,
    .income
}, banker {
    .id,
    .firstName,
    .lastName
}, stream {
    .id,
    .bankAccount,
    .name
}
`

// SM1 guard: 'success' is terminal — never overwrite. Allow null so the
// defensive ConfirmOfferingPayment "no transactionReference" branch can
// still mark a never-banked record as failed.
//
// Only applies to ServiceRecord; for the RehearsalRecord branch the
// BankingHistoryLog tail would be misplaced (no banking semantics on
// rehearsals), so the log fragment is conditionally appended via the
// FOREACH-on-label trick: only ServiceRecord nodes get the audit row.
export const setTransactionStatusFailed = `
MATCH (record {id: $serviceRecordId})
WHERE (record:ServiceRecord OR record:RehearsalRecord)
  AND (
    record.transactionStatus IS NULL
    OR record.transactionStatus IN ['pending', 'send OTP', 'failed']
  )
SET record.transactionStatus = $status,
    record.transactionError = $error

WITH record
FOREACH (_ IN CASE WHEN record:ServiceRecord THEN [1] ELSE [] END |
${appendBankingHistoryLog('record', null)}
)
RETURN record
`

// SM1 guard: only legal transitions into 'success' are from 'pending' or
// 'send OTP'. Prevents a stale ConfirmOfferingPayment from reviving a
// failed/abandoned record after the user's mobile money declined.
export const setTransactionStatusSuccess = `
MATCH (record {id: $serviceRecordId})
WHERE (record:ServiceRecord OR record:RehearsalRecord)
  AND record.transactionStatus IN ['pending', 'send OTP']
SET record.transactionStatus = 'success'

WITH record
FOREACH (_ IN CASE WHEN record:ServiceRecord THEN [1] ELSE [] END |
${appendBankingHistoryLog('record', null)}
)
RETURN record
`

// SM1 special transition: Paystack reversed a previously-settled charge
// (refund to customer). 'reversed' is the only path that legally overwrites
// 'success' — the money was settled, then returned. Distinct from 'failed'
// so accounting can tell a never-settled charge apart from a refund.
export const setTransactionStatusReversed = `
MATCH (record {id: $serviceRecordId})
WHERE (record:ServiceRecord OR record:RehearsalRecord)
  AND record.transactionStatus IN ['pending', 'send OTP', 'failed', 'success']
SET record.transactionStatus = 'reversed',
    record.transactionError = $error

WITH record
FOREACH (_ IN CASE WHEN record:ServiceRecord THEN [1] ELSE [] END |
${appendBankingHistoryLog('record', null)}
)
RETURN record
`

export const getLastServiceRecord = `
MATCH (record:ServiceRecord {id: $serviceRecordId})-[:SERVICE_HELD_ON]->(date:TimeGraph)
MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus
MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(otherRecords:ServiceRecord)-[:SERVICE_HELD_ON]->(otherDate:TimeGraph)
WHERE NOT (otherRecords:NoService) AND duration.between(otherDate.date, date.date).weeks < 52 AND otherDate.date < date.date

WITH DISTINCT record,otherRecords ORDER BY otherRecords.createdAt DESC LIMIT 2
WITH collect(otherRecords.id) AS recordIds, record.id AS currentServiceId

WITH apoc.coll.indexOf(recordIds,currentServiceId) + 1 AS lastServiceIndex, recordIds WHERE lastServiceIndex >= 0
MATCH (lastService:ServiceRecord {id: recordIds[lastServiceIndex]})-[:SERVICE_HELD_ON]->(lastDate:TimeGraph)
MATCH (record:ServiceRecord {id: $serviceRecordId})<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus OR church:Oversight OR church:Denomination

RETURN lastService, lastDate, record, church
`

export const submitBankingSlip = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
WHERE record.transactionStatus IS NULL
OR NOT record.transactionStatus IN ['pending', 'success']
SET record.bankingSlip = $bankingSlip,
    record.bankingSlipUploadedAt = datetime()
WITH record
MATCH (banker:Member {id: $jwt.userId})
MERGE (banker)-[:UPLOADED_SLIP_FOR]->(record)
${appendBankingHistoryLog('record', 'banker')}
RETURN record
`

export const checkIfServicePending = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
WHERE record.transactionStatus = 'pending' OR record.transactionStatus = 'send OTP'
RETURN record
`

// SM2 atomic guard: only the first concurrent teller wins.
// Without the WHERE clause two tellers clicking "Confirm Offering" at
// nearly the same time both overwrite tellerConfirmationTime and both
// MERGE a CONFIRMED_BANKING_FOR edge, silently losing the first teller's
// attribution. The MATCH-clause guard returns zero rows on conflict and
// the resolver translates that into a user-facing "already confirmed"
// error so the second teller knows their click was a no-op.
// Cypher fragment: stamp the teller-confirmation marker and the actor edge.
// Shared between the single-record path (manuallyConfirmOfferingPayment)
// and the Anagkazo batch path (anagkazo.confirmBanking) so a future change
// to teller-flow semantics (new fields, edge labels) lands in one place.
// The appendBankingHistoryLog fragment is included so callers get the audit
// row for free.
export const markRecordTellerConfirmed = (
  recordVar: string,
  actorVar: string
): string => `
SET ${recordVar}.tellerConfirmationTime = datetime()
MERGE (${recordVar})<-[:CONFIRMED_BANKING_FOR]-(${actorVar})
${appendBankingHistoryLog(recordVar, actorVar)}
`

export const manuallyConfirmOfferingPayment = `
MATCH (service:ServiceRecord {id: $serviceRecordId})
WHERE service.tellerConfirmationTime IS NULL
MATCH (author:Member {id: $jwt.userId})

${markRecordTellerConfirmed('service', 'author')}
RETURN service
`
