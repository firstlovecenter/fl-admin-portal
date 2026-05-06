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

      WITH DISTINCT serviceRecord, leader, serviceDate, log, church
      MERGE (serviceRecord)-[:LOGGED_BY]->(leader)
      MERGE (serviceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
      MERGE (log)-[:HAS_SERVICE]->(serviceRecord)

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

      MATCH (church {id: $churchId}) WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream
      MATCH (church)-[current:CURRENT_HISTORY]->(log:ServiceLog)
      MATCH (leader:Member {id: $jwt.userId})

      MERGE (serviceDate:TimeGraph {date:date($serviceDate)})

      WITH DISTINCT serviceRecord, leader, serviceDate, log, church
      MERGE (serviceRecord)-[:LOGGED_BY]->(leader)
      MERGE (serviceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
      MERGE (log)-[:HAS_SERVICE]->(serviceRecord)

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

// Synchronously recomputes ONE aggregate per submission: the immediate
// parent of the submitting church. Mapping:
//   Bacenta      → Governorship
//   Governorship → Council
//   Council      → Stream
//   Stream       → Campus
//
// This is purely a UX optimisation — the leader sees the parent dashboard
// reflect their submission immediately rather than waiting up to 30 minutes
// for the lambda. The lambda remains the primary writer for general
// aggregation: it recomputes every level (Bacenta, Governorship, Council,
// Stream, Campus, Oversight, Denomination) every 30 minutes from live
// ServiceRecords. The submitter's own level and every level above the
// immediate parent rely on the lambda.
//
// Each subquery is gated by an OPTIONAL MATCH on the EXACT submitting label.
// If the submitter is not at the gated level, the subquery is a no-op, so at
// most one parent rollup runs per submission.
//
// The week/year come from the just-created ServiceRecord's serviceDate so
// back-dated and special services land in the correct weekly bucket.
export const recomputeAggregateChainAfterServiceRecord = `
MATCH (seed:ServiceRecord {id: $serviceRecordId})-[:SERVICE_HELD_ON]->(sd:TimeGraph)
WITH sd.date.week AS w, sd.date.year AS y, sd.date.month AS m

// --- Bacenta → Governorship ---
CALL {
  WITH w, y, m
  OPTIONAL MATCH (:Bacenta {id: $churchId})<-[:HAS]-(target:Governorship)
  WITH target, w, y, m WHERE target IS NOT NULL
  OPTIONAL MATCH (target)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..3]->(r:ServiceRecord)-[:SERVICE_HELD_ON]->(d:TimeGraph)
  WHERE d.date.week = w AND d.date.year = y AND NOT r:NoService
  WITH target, w, y, m, collect(DISTINCT r) AS records
  WITH target, w, y, m,
       [x IN records | x.id] AS componentServiceIds,
       size(records) AS numberOfServices,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.attendance, 0))), 2) AS totalAttendance,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.income, 0))), 2) AS totalIncome,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.dollarIncome, 0))), 2) AS totalDollarIncome
  OPTIONAL MATCH (target)-[:CURRENT_HISTORY]->(log:ServiceLog)
  WITH target, log, w, y, m, componentServiceIds, numberOfServices, totalAttendance, totalIncome, totalDollarIncome
  WHERE log IS NOT NULL
  MERGE (a:AggregateServiceRecord {id: target.id + '-' + toString(w) + '-' + toString(y)})
    ON CREATE SET a.week = w, a.year = y
    SET a.month = m
  MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(a)
  SET a.attendance = totalAttendance,
      a.income = totalIncome,
      a.dollarIncome = totalDollarIncome,
      a.componentServiceIds = componentServiceIds,
      a.numberOfServices = numberOfServices,
      a.recomputedAt = datetime()
}

// --- Governorship → Council ---
CALL {
  WITH w, y, m
  OPTIONAL MATCH (:Governorship {id: $churchId})<-[:HAS]-(target:Council)
  WITH target, w, y, m WHERE target IS NOT NULL
  OPTIONAL MATCH (target)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..4]->(r:ServiceRecord)-[:SERVICE_HELD_ON]->(d:TimeGraph)
  WHERE d.date.week = w AND d.date.year = y AND NOT r:NoService
  WITH target, w, y, m, collect(DISTINCT r) AS records
  WITH target, w, y, m,
       [x IN records | x.id] AS componentServiceIds,
       size(records) AS numberOfServices,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.attendance, 0))), 2) AS totalAttendance,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.income, 0))), 2) AS totalIncome,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.dollarIncome, 0))), 2) AS totalDollarIncome
  OPTIONAL MATCH (target)-[:CURRENT_HISTORY]->(log:ServiceLog)
  WITH target, log, w, y, m, componentServiceIds, numberOfServices, totalAttendance, totalIncome, totalDollarIncome
  WHERE log IS NOT NULL
  MERGE (a:AggregateServiceRecord {id: target.id + '-' + toString(w) + '-' + toString(y)})
    ON CREATE SET a.week = w, a.year = y
    SET a.month = m
  MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(a)
  SET a.attendance = totalAttendance,
      a.income = totalIncome,
      a.dollarIncome = totalDollarIncome,
      a.componentServiceIds = componentServiceIds,
      a.numberOfServices = numberOfServices,
      a.recomputedAt = datetime()
}

// --- Council → Stream ---
CALL {
  WITH w, y, m
  OPTIONAL MATCH (:Council {id: $churchId})<-[:HAS]-(target:Stream)
  WITH target, w, y, m WHERE target IS NOT NULL
  OPTIONAL MATCH (target)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..5]->(r:ServiceRecord)-[:SERVICE_HELD_ON]->(d:TimeGraph)
  WHERE d.date.week = w AND d.date.year = y AND NOT r:NoService
  WITH target, w, y, m, collect(DISTINCT r) AS records
  WITH target, w, y, m,
       [x IN records | x.id] AS componentServiceIds,
       size(records) AS numberOfServices,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.attendance, 0))), 2) AS totalAttendance,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.income, 0))), 2) AS totalIncome,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.dollarIncome, 0))), 2) AS totalDollarIncome
  OPTIONAL MATCH (target)-[:CURRENT_HISTORY]->(log:ServiceLog)
  WITH target, log, w, y, m, componentServiceIds, numberOfServices, totalAttendance, totalIncome, totalDollarIncome
  WHERE log IS NOT NULL
  MERGE (a:AggregateServiceRecord {id: target.id + '-' + toString(w) + '-' + toString(y)})
    ON CREATE SET a.week = w, a.year = y
    SET a.month = m
  MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(a)
  SET a.attendance = totalAttendance,
      a.income = totalIncome,
      a.dollarIncome = totalDollarIncome,
      a.componentServiceIds = componentServiceIds,
      a.numberOfServices = numberOfServices,
      a.recomputedAt = datetime()
}

// --- Stream → Campus ---
CALL {
  WITH w, y, m
  OPTIONAL MATCH (:Stream {id: $churchId})<-[:HAS]-(target:Campus)
  WITH target, w, y, m WHERE target IS NOT NULL
  OPTIONAL MATCH (target)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..6]->(r:ServiceRecord)-[:SERVICE_HELD_ON]->(d:TimeGraph)
  WHERE d.date.week = w AND d.date.year = y AND NOT r:NoService
  WITH target, w, y, m, collect(DISTINCT r) AS records
  WITH target, w, y, m,
       [x IN records | x.id] AS componentServiceIds,
       size(records) AS numberOfServices,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.attendance, 0))), 2) AS totalAttendance,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.income, 0))), 2) AS totalIncome,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.dollarIncome, 0))), 2) AS totalDollarIncome
  OPTIONAL MATCH (target)-[:CURRENT_HISTORY]->(log:ServiceLog)
  WITH target, log, w, y, m, componentServiceIds, numberOfServices, totalAttendance, totalIncome, totalDollarIncome
  WHERE log IS NOT NULL
  MERGE (a:AggregateServiceRecord {id: target.id + '-' + toString(w) + '-' + toString(y)})
    ON CREATE SET a.week = w, a.year = y
    SET a.month = m
  MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(a)
  SET a.attendance = totalAttendance,
      a.income = totalIncome,
      a.dollarIncome = totalDollarIncome,
      a.componentServiceIds = componentServiceIds,
      a.numberOfServices = numberOfServices,
      a.recomputedAt = datetime()
}

RETURN $churchId AS churchId
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
WITH churchType, church, servant WHERE churchType IN ['Bacenta', 'Governorship', 'Council', 'Stream','Hub', 'HubCouncil', 'Ministry']

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
