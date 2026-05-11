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


UNWIND labels(church) AS churchLevel
WITH record, church, churchLevel
WHERE churchLevel IN ['Bacenta','Governorship','Council', 'Stream', 'Campus']

MATCH (author:Member {id: $jwt.userId})
MATCH (record)-[:SERVICE_HELD_ON]->(date:TimeGraph)
SET record.sourceNumber = $mobileNumber,
    record.sourceNetwork = $mobileNetwork,
    record.desc = church.name + ' ' + churchLevel + ' '  + date.date,
    record.transactionStatus = 'pending',
    record.transactionTime = datetime()
REMOVE record.transactionError

MERGE (author)<-[:OFFERING_BANKED_BY]-(record)

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
export const setTransactionStatusFailed = `
MATCH (record {id: $serviceRecordId})
WHERE (record:ServiceRecord OR record:RehearsalRecord)
  AND (
    record.transactionStatus IS NULL
    OR record.transactionStatus IN ['pending', 'send OTP', 'failed']
  )
SET record.transactionStatus = $status,
    record.transactionError = $error

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
SET record.bankingSlip = $bankingSlip
WITH record
MATCH (banker:Member {id: $jwt.userId})
MERGE (banker)-[:UPLOADED_SLIP_FOR]->(record)
RETURN record
`

export const checkIfServicePending = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
WHERE record.transactionStatus = 'pending' OR record.transactionStatus = 'send OTP'
RETURN record
`

export const manuallyConfirmOfferingPayment = `
MATCH (service:ServiceRecord {id: $serviceRecordId})
    SET service.tellerConfirmationTime = datetime()

WITH service
MATCH (author:Member {id: $jwt.userId})
MERGE (service)<-[:CONFIRMED_BANKING_FOR]-(author)
RETURN service
`
