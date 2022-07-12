export const setServiceRecordTransactionId = `
MATCH (record:ServiceRecord {id: $serviceRecordId})<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
WHERE church:Fellowship OR church:Constituency OR church:Council OR church:Stream OR church:GatheringService


UNWIND labels(church) AS churchLevel 
WITH record, church, churchLevel
WHERE churchLevel = 'Fellowship' OR churchLevel = 'Bacenta' OR churchLevel = 'Constituency' 
OR churchLevel = 'Council' OR churchLevel = 'Stream' OR churchLevel = 'GatheringService'

MATCH (author:Member {auth_id: $auth.jwt.sub})
MATCH (record)-[:SERVICE_HELD_ON]->(date:TimeGraph)
MATCH (transaction: LastPaySwitchTransactionId)
    SET record.transactionId = transaction.id + 1,  
    transaction.id = record.transactionId,
    record.sourceNumber = $mobileNumber,
    record.sourceNetwork = $mobileNetwork,
    record.desc = church.name + ' ' + churchLevel + ' '  + date.date,
    record.transactionTime = datetime(),
    record.transactionStatus = "pending"

MERGE (author)<-[:OFFERING_BANKED_BY]-(record)

RETURN record, church.name AS churchName, date.date AS date, churchLevel AS churchLevel
`

export const checkTransactionId = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
OPTIONAL MATCH (record)-[:OFFERING_BANKED_BY]->(banker)
RETURN record, banker 
`

export const setTransactionStatusFailed = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
SET record.transactionStatus = "failed"

RETURN record
`

export const setTransactionStatusSuccess = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
SET record.transactionStatus = "success"

RETURN record
`
export const removeBankingRecordTransactionId = `
MATCH (record:ServiceRecord {id: $serviceRecordId})<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
WHERE church:Fellowship OR church:Constituency OR church:Council OR church:Stream

MATCH (record)-[r:OFFERING_BANKED_BY]->(banker)
MATCH (record)-[:SERVICE_HELD_ON]->(date:TimeGraph)
SET record.transactionStatus = "failed"
DELETE r

RETURN record, church.name AS churchName, date.date AS date
`
export const lastButOneServiceRecord = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(fellowship:Fellowship) 
WITH fellowship
MATCH (record:ServiceRecord)<-[:HAS_SERVICE]-(:HistoryLog)<-[:HAS_HISTORY]-(fellowship) 
WHERE NOT (record:NoService)
WITH fellowship, record ORDER BY record.created_at DESC LIMIT 2
WITH min(record.created_at) as lowDate, fellowship
MATCH (record:ServiceRecord {created_at: lowDate})<-[:HAS_SERVICE]-(:HistoryLog)<-[:HAS_HISTORY]-(fellowship) 
RETURN record
`
export const submitBankingSlip = `
MATCH (record:ServiceRecord {id: $serviceRecordId})
WHERE record.transactionStatus IS NULL
OR record.transactionStatus = 'failed'

SET record.bankingSlip = $bankingSlip
WITH record
MATCH (banker:Member {auth_id: $auth.jwt.sub})
MERGE (banker)-[:UPLOADED_SLIP_FOR]->(record)
RETURN record
`
