export const setVehicleRecordTransactionSuccessful = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)
SET record.transactionStatus = $responseStatus,
record.transactionReference = $transactionReference,
record.paystackTransferCode = $transferCode

RETURN record
`

export const setBacentaRecipientCode = `
MATCH (bacenta:Bacenta {id: $bacentaId})
MATCH (record:VehicleRecord {id: $vehicleRecordId})
    SET bacenta.recipientCode = $recipientCode,
    record.recipientCode = $recipientCode
RETURN bacenta
`

export const removeVehicleRecordTransactionId = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)
MATCH (bussing)-[:BUSSED_ON]->(date:TimeGraph)
REMOVE record.transactionId, record.transactionTime, record.transactionStatus

RETURN record, bacenta.name AS bacentaName, date.date AS date
`

export const getVehicleRecordWithDate = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)<-[:LEADS]-(leader:Active:Member)
MATCH (bussing)-[:BUSSED_ON]->(date:TimeGraph)
SET record.momoNumber = bacenta.momoNumber, 
record.mobileNetwork = bacenta.mobileNetwork,
record.momoName = bacenta.momoName,
record.outbound = bacenta.outbound,
record.recipientCode = bacenta.recipientCode

RETURN record.id AS vehicleRecordId,
record.attendance AS attendance, 
record.vehicle AS vehicle,
record.outbound AS outbound,
record.arrivalTime  AS arrivalTime,
leader.phoneNumber AS leaderPhoneNumber,
leader.firstName AS leaderFirstName,

bacenta.sprinterTopUp AS bacentaSprinterTopUp,
bacenta.urvanTopUp AS bacentaUrvanTopUp,

labels(date) AS dateLabels
`

export const checkTransactionReference = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)
MATCH (bacenta)<-[:HAS]-(:Governorship)<-[:HAS]-(:Council)<-[:HAS]-(stream:Stream)
MATCH (bacenta)<-[:LEADS]-(leader:Active:Member)
MATCH (bussing)-[:BUSSED_ON]->(bussingDate:TimeGraph)
WITH DISTINCT record, bacenta, leader, stream, bussingDate


RETURN record, stream, bacenta, leader, bussingDate.date AS bussedOnDate, date() = date(bussingDate.date) AS isToday
`

export const checkArrivalTimes = `
MATCH (bacenta {id: $bacentaId})<-[:HAS]-(:Governorship)<-[:HAS]-(:Council)<-[:HAS]-(stream:Stream)
RETURN stream, bacenta
`

export const checkIfPreMobilisationFilled = `
OPTIONAL MATCH (bacenta {id: $bacentaId})-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph)
WHERE date(date.date)=date()
RETURN bussing.mobilisationPicture IS NOT NULL AS status
`

export const checkArrivalTimeFromVehicle = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)<-[:HAS]-(:Governorship)<-[:HAS]-(:Council)<-[:HAS]-(stream:Stream)
MATCH (bacenta)<-[:LEADS]-(leader:Active:Member)
MATCH (bussing)-[:BUSSED_ON]->(bussingDate:TimeGraph)
WITH DISTINCT record, bussing, bacenta, leader, stream, bussingDate
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(records:VehicleRecord) WHERE records.arrivalTime IS NOT NULL
RETURN stream.arrivalEndTime AS arrivalEndTime,
COUNT(DISTINCT records) AS numberOfVehicles,
SUM(records.attendance) AS totalAttendance,
record.arrivalTime IS NOT NULL AS alreadyCounted,
date() = date(bussingDate.date) AS isToday
`

export const setSwellDate = `
MERGE (date:TimeGraph {date: date($date)})
    SET date:SwellDate
RETURN toString(date.date) AS id, date.date AS date, true AS swell
`

export const noVehicleTopUp = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)
SET record.vehicleTopUp = 0

WITH bussing, record
MATCH (bussing)-[:INCLUDES_RECORD]->(records:VehicleRecord)

WITH bussing, record, SUM(records.vehicleTopUp) AS summedVehicleTopUp
SET bussing.bussingTopUp = summedVehicleTopUp

RETURN record AS record
`

export const setVehicleTopUp = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)
SET record.vehicleTopUp = $vehicleTopUp

WITH bussing, record
MATCH (bussing)-[:INCLUDES_RECORD]->(records:VehicleRecord)

WITH bussing, record, SUM(records.vehicleTopUp) AS summedVehicleTopUp
SET bussing.bussingTopUp = summedVehicleTopUp

RETURN record
`

export const RemoveAllStreamArrivalsHelpers = `
MATCH (church {id: $streamId})
WHERE church:Stream
OPTIONAL MATCH (church)<-[oldHelpers:COUNTS_ARRIVALS_FOR|CONFIRMS_ARRIVALS_FOR]-(admin:Member)
DELETE oldHelpers

WITH DISTINCT church

OPTIONAL MATCH (church)-[oldHistory:CURRENT_HISTORY]->(:ServiceLog)
DELETE oldHistory

WITH church
OPTIONAL MATCH (church)<-[:COUNTS_ARRIVALS_FOR|CONFIRMS_ARRIVALS_FOR]-(admin:Member)
WITH DISTINCT admin
OPTIONAL MATCH (admin)-[oldAdminHistory:CURRENT_HISTORY]->(:ServiceLog)
DELETE oldAdminHistory


RETURN church
`

export const checkBacentaMomoDetails = `
MATCH (bacenta:Bacenta {id: $bacentaId})
RETURN bacenta.sprinterTopUp AS sprinterTopUp, bacenta.urvanTopUp AS uvanTopUp, bacenta.momoNumber AS momoNumber
`

export const uploadMobilisationPicture = `
CREATE (bussingRecord:BussingRecord {createdAt:datetime()})
    SET bussingRecord.id = apoc.create.uuid(),
    bussingRecord.mobilisationPicture = $mobilisationPicture

    WITH bussingRecord
    MERGE (serviceDate:TimeGraph {date: date($serviceDate)})

    WITH bussingRecord, serviceDate
    MATCH (bacenta:Bacenta {id:$bacentaId})
    MATCH (bacenta)-[:CURRENT_HISTORY]->(log:ServiceLog)

    MERGE (log)-[:HAS_BUSSING]->(bussingRecord)
    MERGE (bussingRecord)-[:BUSSED_ON]->(serviceDate)

WITH bussingRecord, bacenta, serviceDate,  date($serviceDate).week AS week
    MATCH (leader:Member {id: $jwt.userId})
    MATCH (bacenta)<-[:HAS]-(:Governorship)<-[:HAS]-(:Council)<-[:HAS]-(stream:Stream)
    MERGE (bussingRecord)-[:LOGGED_BY]->(leader)

    RETURN bussingRecord AS bussingRecord, 
    bacenta AS bacenta, 
    serviceDate AS date, 
    week AS week,
    stream.name AS stream_name
`

export const confirmVehicleByAdmin = `
MATCH (vehicleRecord:VehicleRecord {id: $vehicleRecordId})
  WHERE vehicleRecord.arrivalTime IS NULL
    SET vehicleRecord.attendance = $attendance,
      vehicleRecord.vehicle = $vehicle,
      vehicleRecord.comments = $comments,
      vehicleRecord.arrivalTime = datetime()

    WITH vehicleRecord
          MATCH (admin:Member {id: $jwt.userId})
          MERGE (vehicleRecord)-[:COUNTED_BY]->(admin)

      RETURN vehicleRecord
      `

// Record Time And Aggregate Records for Bussing Record
export const aggregateVehicleBussingRecordData = `
MATCH (vehicle:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)
MATCH (bussing)-[:INCLUDES_RECORD]->(allVehicles:VehicleRecord)
WITH bussing, SUM(allVehicles.attendance) AS attendance, SUM(allVehicles.leaderDeclaration) AS leaderDeclaration, SUM(allVehicles.vehicleTopUp) AS vehicleTopUp
SET bussing.attendance = attendance,
bussing.leaderDeclaration = leaderDeclaration,
bussing.bussingTopUp = vehicleTopUp

WITH bussing
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(cars:VehicleRecord {vehicle: 'Car'})
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(sprinters:VehicleRecord {vehicle: 'Sprinter'})
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(urvan:VehicleRecord {vehicle: 'Urvan'})
WITH bussing, COUNT(DISTINCT cars) AS cars, COUNT(DISTINCT sprinters) AS sprinters, COUNT(DISTINCT urvan) AS urvan

MATCH (vehicleRecord:VehicleRecord {id: $vehicleRecordId})
SET bussing.numberOfSprinters = sprinters,
 bussing.numberOfCars = cars,
 bussing.numberOfUrvans = urvan

RETURN vehicleRecord {
    .id,
    .vehicleTopUp,
    .arrivalTime
   }
`

export const recordVehicleFromBacenta = `
MATCH (bussingRecord:BussingRecord {id: $bussingRecordId})
MATCH (leader:Member {id: $jwt.userId})
// Always CREATE under this BussingRecord. A MERGE on {picture} can match an
// existing VehicleRecord node elsewhere in the graph and re-link it here,
// which swaps pictures between records in the UI.
CREATE (vehicleRecord:VehicleRecord {
  id: apoc.create.uuid(),
  createdAt: datetime(),
  picture: $picture,
  vehicle: $vehicle,
  outbound: $outbound,
  leaderDeclaration: $leaderDeclaration,
  momoNumber: $momoNumber,
  mobileNetwork: $mobileNetwork
})
CREATE (bussingRecord)-[:INCLUDES_RECORD]->(vehicleRecord)
MERGE (vehicleRecord)-[:LOGGED_BY]->(leader)

WITH vehicleRecord, bussingRecord
MATCH (bussingRecord)-[:INCLUDES_RECORD]->(vehicleRecords:VehicleRecord)
WITH vehicleRecord, bussingRecord, sum(vehicleRecords.leaderDeclaration) as summedLeaderDeclaration
SET bussingRecord.leaderDeclaration = summedLeaderDeclaration

RETURN vehicleRecord, bussingRecord, date().week AS week
`

export const getArrivalsPaymentDataCypher = `
MATCH (stream:Stream {id:$streamId})-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph {date:date($date)})
MATCH (leader:Member)-[:LEADS]->(bacenta)
MATCH (councilHead:Member)-[:LEADS]->(council)
MATCH (bussing)-[:INCLUDES_RECORD]->(record:VehicleRecord) WHERE record.arrivalTime IS NOT NULL AND record.attendance > 7
OPTIONAL MATCH (governorship)-[:IS_SUPPORTED_BY]->(society:BussingSociety)
RETURN DISTINCT date.date as date, stream.name as stream, (councilHead.firstName+ " "+ councilHead.lastName) as councilHead, bacenta.name as bacenta, (stream.arrivalsPrefix+toString(bacenta.code)) as bacentaCode, record.leaderDeclaration as attendance, record.attendance as confirmedAttendance, record.vehicle as vehicle,
(CASE
    WHEN record.outbound = true THEN 'In and Out'
    WHEN record.outbound = false THEN 'In Only'
    END) as outbound,
round(toFloat(record.vehicleTopUp), 2) as topUp, record.vehicleCost as vehicleCost, record.momoNumber as momoNumber, record.comments as comments, record.arrivalTime as arrivalTime, (leader.firstName+ " "+ leader.lastName) as leader, council.name as council, governorship.name as governorship, record.momoName as momoName, society.society as society, record.id as recordId ORDER BY toInteger(society) ASC, recordId ASC SKIP $offset LIMIT $limit
`

export const getArrivalsPaymentCountCypher = `
MATCH (stream:Stream {id:$streamId})-[:HAS*3]->(:Bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(:TimeGraph {date:date($date)})
MATCH (bussing)-[:INCLUDES_RECORD]->(record:VehicleRecord) WHERE record.arrivalTime IS NOT NULL AND record.attendance > 7
RETURN count(DISTINCT record) AS total
`

// SYN-185 — formerly an SDL @cypher mutation. Moved here so the resolver can run
// an actor-scope check (assertChurchScope) BEFORE the write, closing the IDOR
// where any arrivals admin could edit any bacenta's top-ups org-wide. The scope
// gate lives in the resolver; this statement does the write + audit log + node
// re-projection. $userId replaces the old $jwt.userId (custom resolvers pass
// explicit params).
//
// The history sub-projection is LOAD-BEARING: in @neo4j/graphql v7 object-type
// @cypher fields (Bacenta.history) are NOT re-resolved off a custom resolver's
// plain-map return — defaultFieldResolver just reads `source.history` — so any
// field the mutation's selection set asks for MUST be projected here. It mirrors
// the Bacenta.history SDL field (DISTINCT, HAS_HISTORY|OLD_HISTORY, ORDER BY
// timeStamp DESC then id). LIMIT is fixed at 5 to match the sole caller
// (UpdateBacentaArrivals.ts `history(limit: 5)`); change both together.
// currentUser is matched up front so a bad/absent $userId yields zero rows and
// writes nothing (no orphan HistoryLog), rather than after the CREATE.
export const updateBacentaBussingDetails = `
MATCH (bacenta:Bacenta {id: $bacentaId})
MATCH (currentUser:Member {id: $userId})
SET bacenta.sprinterTopUp = $sprinterTopUp,
    bacenta.urvanTopUp = $urvanTopUp,
    bacenta.outbound = $outbound

WITH bacenta, currentUser
CREATE (log:HistoryLog {id: apoc.create.uuid()})
  SET log.timeStamp = datetime(),
      log.historyRecord = bacenta.name + ' Bussing Details were updated'

WITH bacenta, log, currentUser
MERGE (date:TimeGraph {date: date()})
MERGE (log)-[:LOGGED_BY]->(currentUser)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (bacenta)-[:HAS_HISTORY]->(log)

WITH bacenta
CALL {
  WITH bacenta
  MATCH (bacenta)-[:HAS_HISTORY|OLD_HISTORY]->(h:HistoryLog)
  WITH DISTINCT h ORDER BY h.timeStamp DESC, h.id LIMIT 5
  RETURN collect(h {
    .id,
    .timeStamp,
    .historyRecord,
    createdAt: head([(h)-[:RECORDED_ON]->(t:TimeGraph) | t { .date }]),
    loggedBy: head([(h)-[:LOGGED_BY]->(m:Member) | m { .id, .firstName, .lastName }])
  }) AS history
}

RETURN bacenta {
  .id,
  .name,
  .outbound,
  .sprinterTopUp,
  .urvanTopUp,
  history
} AS bacenta
`

// SYN-185 — see updateBacentaBussingDetails above. Same scope-before-write
// rationale, same load-bearing history projection (fixed LIMIT 5); gated to the
// bacenta's own leader in the resolver.
export const updateBusPaymentDetails = `
MATCH (bacenta:Bacenta {id: $bacentaId})
MATCH (currentUser:Member {id: $userId})
SET bacenta.mobileNetwork = $mobileNetwork,
    bacenta.momoName = $momoName,
    bacenta.momoNumber = $momoNumber
REMOVE bacenta.recipientCode

WITH bacenta, currentUser
CREATE (log:HistoryLog {id: apoc.create.uuid()})
  SET log.timeStamp = datetime(),
      log.historyRecord = bacenta.name + ' Bus Payment Details were updated'

WITH bacenta, log, currentUser
MERGE (date:TimeGraph {date: date()})
MERGE (log)-[:LOGGED_BY]->(currentUser)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (bacenta)-[:HAS_HISTORY]->(log)

WITH bacenta
CALL {
  WITH bacenta
  MATCH (bacenta)-[:HAS_HISTORY|OLD_HISTORY]->(h:HistoryLog)
  WITH DISTINCT h ORDER BY h.timeStamp DESC, h.id LIMIT 5
  RETURN collect(h {
    .id,
    .timeStamp,
    .historyRecord,
    createdAt: head([(h)-[:RECORDED_ON]->(t:TimeGraph) | t { .date }]),
    loggedBy: head([(h)-[:LOGGED_BY]->(m:Member) | m { .id, .firstName, .lastName }])
  }) AS history
}

RETURN bacenta {
  .id,
  .name,
  .momoName,
  .momoNumber,
  .mobileNetwork,
  history
} AS bacenta
`
