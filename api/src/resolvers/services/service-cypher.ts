export const checkFormFilledThisWeek = `
MATCH (church {id: $churchId})
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream 
OR church:Hub OR church:HubCouncil  OR church:Ministry

OPTIONAL MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
WHERE (record:ServiceRecord  OR record:RehearsalRecord)
AND date(date.date).week = date().week AND date(date.date).year = date().year // AND record.description IS NULL

RETURN church.id AS id, church.name AS name, labels(church) AS labels, record IS NOT NULL AS alreadyFilled
`

export const getHigherChurches = `
MATCH (church {id: $churchId})
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream
OR church:Hub OR church:HubCouncil OR church:Ministry OR church:CreativeArts
MATCH (church)<-[:HAS*1..7]-(higherChurch)
WHERE higherChurch:Bacenta OR higherChurch:Governorship OR higherChurch:Council OR higherChurch:Stream OR higherChurch:Campus OR higherChurch:Oversight OR higherChurch:Denomination
OR higherChurch:Hub OR higherChurch:HubCouncil OR higherChurch:Ministry OR higherChurch:CreativeArts

RETURN DISTINCT higherChurch
`

export const getCurrency = `
MATCH (church {id: $churchId})<-[:HAS|HAS_MINISTRY*0..5]-(campus:Campus)
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus
OR church:Hub OR church:HubCouncil OR church:Ministry OR church:CreativeArts

RETURN DISTINCT labels(church) AS labels, campus.name, campus.currency AS currency, campus.conversionRateToDollar AS conversionRateToDollar
`

export const absorbAllTransactions = `
MATCH (serviceRecord:ServiceRecord {id: $serviceRecordId})<-[:HAS_SERVICE]-(log:ServiceLog)<-[:CURRENT_HISTORY]-(church)
WHERE church:Bacenta OR church:Governorship OR church:Council // OR church:Stream OR church:Campus
MATCH (church)-[:HAS*0..3]->(bacentas:Bacenta)<-[r:GIVEN_AT]-(transaction:Transaction)
DELETE r

WITH DISTINCT serviceRecord, transaction, log
MERGE (transaction)-[:GIVEN_AT]->(serviceRecord)

WITH DISTINCT log, serviceRecord, transaction WHERE transaction.transactionStatus = 'success'

WITH serviceRecord, log, SUM(transaction.amount) AS amount
     SET serviceRecord.onlineGiving = amount,
     serviceRecord.cash = round(toFloat(serviceRecord.income), 2),
     serviceRecord.income = round(toFloat(amount + serviceRecord.income), 2),
     serviceRecord.dollarIncome = round(toFloat(serviceRecord.income / $conversionRateToDollar), 2)

WITH serviceRecord, log
MATCH (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id})
SET aggregate.onlineGiving = aggregate.onlineGiving + serviceRecord.onlineGiving,
    aggregate.income = round(toFloat(aggregate.income + serviceRecord.income), 2),
    aggregate.dollarIncome = round(toFloat(aggregate.dollarIncome + serviceRecord.dollarIncome), 2)

RETURN serviceRecord
`

export const recordService = `
      CREATE (serviceRecord:ServiceRecord {id: apoc.create.uuid()})
        SET serviceRecord.createdAt = datetime(),
        serviceRecord.attendance = $attendance,
        serviceRecord.income = round(toFloat($income), 2),
        serviceRecord.cash = round(toFloat($income), 2),
        serviceRecord.dollarIncome = round(toFloat($income / $conversionRateToDollar), 2),
        serviceRecord.foreignCurrency = $foreignCurrency,
        serviceRecord.numberOfTithers = $numberOfTithers,
        serviceRecord.treasurerSelfie = $treasurerSelfie,
        serviceRecord.familyPicture = $familyPicture
      WITH serviceRecord

      MATCH (church {id: $churchId}) WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream
      MATCH (church)-[current:CURRENT_HISTORY]->(log:ServiceLog)
      MATCH (leader:Member {id: $jwt.userId})
      
      MERGE (serviceDate:TimeGraph {date:date($serviceDate)})

      WITH DISTINCT serviceRecord, leader, serviceDate, log
      MERGE (serviceRecord)-[:LOGGED_BY]->(leader)
      MERGE (serviceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
      MERGE (log)-[:HAS_SERVICE]->(serviceRecord)

      WITH log, serviceRecord
      MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
        SET aggregate.month = date().month
      MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)

      WITH serviceRecord, aggregate, SUM(serviceRecord.attendance) AS attendance, SUM(serviceRecord.income) AS income, SUM(serviceRecord.dollarIncome) AS dollarIncome, SUM(aggregate.attendance) AS aggregateAttendance, SUM(aggregate.income) AS aggregateIncome, SUM(aggregate.dollarIncome) AS aggregateDollarIncome
      MATCH (aggregate)
      SET aggregate.attendance = aggregateAttendance + attendance,
      aggregate.income = round(toFloat(aggregateIncome + income), 2),
      aggregate.dollarIncome = round(toFloat(aggregateDollarIncome + dollarIncome), 2)

      WITH serviceRecord
      UNWIND $treasurers AS treasurerId WITH treasurerId, serviceRecord
      MATCH (treasurer:Active:Member {id: treasurerId})
      MERGE (treasurer)-[:WAS_TREASURER_FOR]->(serviceRecord)

      RETURN serviceRecord
`
export const recordSpecialService = `
      CREATE (serviceRecord:ServiceRecord {id: apoc.create.uuid()})
        SET serviceRecord.createdAt = datetime(),
        serviceRecord.attendance = $attendance,
        serviceRecord.income = round(toFloat($income), 2),
        serviceRecord.cash = round(toFloat($income), 2),
        serviceRecord.dollarIncome = round(toFloat($income / $conversionRateToDollar), 2),
        serviceRecord.foreignCurrency = $foreignCurrency,
        serviceRecord.numberOfTithers = $numberOfTithers,
        serviceRecord.treasurerSelfie = $treasurerSelfie,
        serviceRecord.familyPicture = $familyPicture,
        serviceRecord.name = $serviceName,
        serviceRecord.description = $serviceDescription
      WITH serviceRecord

      MATCH (church {id: $churchId}) WHERE church:Fellowship OR church:Bacenta OR church:Governorship OR church:Council OR church:Stream
      MATCH (church)-[current:CURRENT_HISTORY]->(log:ServiceLog)
      MATCH (leader:Member {id: $jwt.userId})
      
      MERGE (serviceDate:TimeGraph {date:date($serviceDate)})

      WITH DISTINCT serviceRecord, leader, serviceDate, log
      MERGE (serviceRecord)-[:LOGGED_BY]->(leader)
      MERGE (serviceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
      MERGE (log)-[:HAS_SERVICE]->(serviceRecord)

      WITH log, serviceRecord, serviceDate
      MERGE (aggregate:AggregateServiceRecord {id: serviceDate.date.week + '-' + serviceDate.date.year + '-' + log.id, week: serviceDate.date.week, year: serviceDate.date.year, month: date().month})
      MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)

      WITH serviceRecord, aggregate, SUM(serviceRecord.attendance) AS attendance, SUM(serviceRecord.income) AS income, SUM(serviceRecord.dollarIncome) AS dollarIncome, SUM(aggregate.attendance) AS aggregateAttendance, SUM(aggregate.income) AS aggregateIncome, SUM(aggregate.dollarIncome) AS aggregateDollarIncome
      MATCH (aggregate)
      SET aggregate.attendance = aggregateAttendance + attendance,
      aggregate.income = round(toFloat(aggregateIncome + income), 2),
      aggregate.dollarIncome = round(toFloat(aggregateDollarIncome + dollarIncome), 2)

      WITH serviceRecord
      UNWIND $treasurers AS treasurerId WITH treasurerId, serviceRecord
      MATCH (treasurer:Active:Member {id: treasurerId})
      MERGE (treasurer)-[:WAS_TREASURER_FOR]->(serviceRecord)

      RETURN serviceRecord
`
export const recordCancelledService = `
CREATE (serviceRecord:ServiceRecord:NoService {createdAt:datetime()})
SET serviceRecord.id = apoc.create.uuid(),
serviceRecord.noServiceReason = $noServiceReason

WITH serviceRecord
MATCH (church {id: $churchId}) WHERE church:Bacenta OR church:Stream
MATCH (church)-[:CURRENT_HISTORY]->(log:ServiceLog)
MATCH (leader:Active:Member {id: $jwt.userId})

MERGE (serviceDate:TimeGraph {date: date($serviceDate)})
MERGE (serviceRecord)-[:LOGGED_BY]->(leader)
MERGE (serviceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
MERGE (log)-[:HAS_SERVICE]->(serviceRecord)

RETURN serviceRecord
`

export const checkCurrentServiceLog = `
MATCH (church {id:$churchId}) 
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream
OR church:Hub OR church:HubCouncil OR church:Ministry OR church:CreativeArts
MATCH (church)-[:CURRENT_HISTORY]->(log:ServiceLog)
RETURN true AS exists
`
export const getServantAndChurch = `
MATCH (church {id: $churchId}) 
WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Hub OR church:HubCounci
OR church:Ministry OR church:CreativeArts
MATCH (church)<-[:LEADS]-(servant:Active:Member)
UNWIND labels(church) AS churchType 
WITH churchType, church, servant WHERE churchType IN ['Fellowship', 'Bacenta', 'Governorship', 'Council', 'Stream','Hub', 'HubCouncil', 'Ministry']

RETURN church.id AS churchId, church.name AS churchName, servant.id AS servantId, servant.firstName AS firstName, servant.lastName AS lastName, churchType AS churchType
`
export const aggregateServiceDataForHub = `
   MATCH (hubfellowship:HubFellowship {id: $churchId}) 
   WITH hubfellowship AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(hub:Hub)
   MATCH (hub)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..3]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
   WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
   WITH DISTINCT hub, record
   WITH hub, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, 
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance, 
        round(toFloat(SUM(record.income)), 2) AS totalIncome, 
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome
   MATCH (hub)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
       SET aggregate.attendance = totalAttendance,
       aggregate.income = totalIncome,
         aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices
   WITH hub AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(hubCouncil:HubCouncil)
   MATCH (hubCouncil)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..4]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
   WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
   WITH DISTINCT hubCouncil, record
   WITH hubCouncil, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, 
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance, 
        round(toFloat(SUM(record.income)), 2) AS totalIncome, 
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome
   MATCH (hubCouncil)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
       SET aggregate.attendance = totalAttendance,
       aggregate.income = totalIncome,
         aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices
   WITH hubCouncil AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(ministry:Ministry)
   MATCH (ministry)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..5]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
   WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
   WITH DISTINCT ministry, record
   WITH ministry, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, 
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance, 
        round(toFloat(SUM(record.income)), 2) AS totalIncome, 
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome
   MATCH (ministry)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
       SET aggregate.attendance = totalAttendance,
       aggregate.income = totalIncome,
       aggregate.dollarIncome = totalDollarIncome,
       aggregate.componentServiceIds = componentServiceIds,
         aggregate.numberOfServices = numberOfServices
   WITH ministry AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(creativearts:CreativeArts)
   MATCH (creativearts)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..6]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
   WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
   WITH DISTINCT creativearts, record
   WITH creativearts, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, 
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance, 
        round(toFloat(SUM(record.income)), 2) AS totalIncome, 
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome
   MATCH (creativearts)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
       SET aggregate.attendance = totalAttendance,
       aggregate.income = totalIncome,
       aggregate.dollarIncome = totalDollarIncome,
       aggregate.componentServiceIds = componentServiceIds,
       aggregate.numberOfServices = numberOfServices
   
   RETURN creativearts,aggregate
`
