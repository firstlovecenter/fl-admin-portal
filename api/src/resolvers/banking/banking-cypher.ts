export const initiateServiceRecordTransaction = `
MATCH (record {id: $serviceRecordId}) WHERE record:ServiceRecord OR record:RehearsalRecord

MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus
OR church:Hub OR church:HubCouncil OR church:Ministry OR church:CreativeArts


UNWIND labels(church) AS churchLevel 
WITH record, church, churchLevel
WHERE churchLevel IN ['Bacenta','Governorship','Council', 'Stream', 'Campus', 'Hub', 'HubCouncil', 'Ministry', 'CreativeArts'] 

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

export const setRecordTransactionReferenceWithOTP = `
    MATCH (record {id: $id}) WHERE record:ServiceRecord OR record:RehearsalRecord
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

export const checkRehearsalTransactionReference = `
MATCH (record:RehearsalRecord {id: $rehearsalRecordId})<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)<-[:HAS*0..3]-(ministry:Ministry)
WHERE church:Hub OR church:HubCouncil OR church:Ministry
MATCH (ministry)<-[:HAS_MINISTRY]-(stream:Stream)
OPTIONAL MATCH (record)-[:OFFERING_BANKED_BY]->(banker)

RETURN record {
    .id,
    .transactionReference,
    .transactionStatus,
    .transactionTime,
    .income
}, banker {
    .id,
    .firstName, 
    .lastName
}, ministry {
    .id,
    .bankAccount,
    .name
}, stream {
    .id,
    .bankAccount,
    .name
}
`

export const setTransactionStatusFailed = `
MATCH (record {id: $serviceRecordId}) WHERE record:ServiceRecord OR record:RehearsalRecord
SET record.transactionStatus = $status,
record.transactionError = $error

RETURN record
`

export const setTransactionStatusSuccess = `
   MATCH (record {id: $serviceRecordId}) WHERE record:ServiceRecord OR record:RehearsalRecord
   SET record.transactionStatus = 'success'
   
   RETURN record
`

export const getLastServiceRecord = `
MATCH (record:ServiceRecord {id: $serviceRecordId})-[:SERVICE_HELD_ON]->(date:TimeGraph)
MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church) 
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus
OR church:Hub OR church:HubCouncil OR church:Ministry OR church:CreativeArts
MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(otherRecords:ServiceRecord)-[:SERVICE_HELD_ON]->(otherDate:TimeGraph)
WHERE NOT (otherRecords:NoService) AND duration.between(otherDate.date, date.date).weeks < 52 AND otherDate.date < date.date

WITH DISTINCT record,otherRecords ORDER BY otherRecords.createdAt DESC LIMIT 2
WITH collect(otherRecords.id) AS recordIds, record.id AS currentServiceId

WITH apoc.coll.indexOf(recordIds,currentServiceId) + 1 AS lastServiceIndex, recordIds WHERE lastServiceIndex >= 0
MATCH (lastService:ServiceRecord {id: recordIds[lastServiceIndex]})-[:SERVICE_HELD_ON]->(lastDate:TimeGraph)
MATCH (record:ServiceRecord {id: $serviceRecordId})<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus OR church:Oversight OR church:Denomination
OR church:Hub OR church:HubCouncil OR church:Ministry OR church:CreativeArts

RETURN lastService, lastDate, record, church
`

export const checkIfIMCLNotFilled = `
    MATCH (record:ServiceRecord {id: $serviceRecordId})
    OPTIONAL MATCH (record)<-[:ABSENT_FROM_SERVICE]-(absent:Active:IMCL) WHERE NOT absent:Lost
    AND absent.imclChecked = false

    RETURN COUNT(absent) > 0 AS imclNotFilled
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
