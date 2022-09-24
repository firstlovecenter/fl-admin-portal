export const setVehicleRecordTransactionId = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)
MATCH (bussing)-[:BUSSED_ON]->(date:TimeGraph)
MATCH (transaction: LastPaySwitchTransactionId)
SET record.transactionId = transaction.id + 1,
transaction.id = record.transactionId,
record.transactionTime = datetime(),
record.transactionStatus = 'pending'

RETURN record, bacenta.name AS bacentaName, date.date AS date
`

export const setVehicleRecordTransactionSuccessful = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})
SET record.transactionStatus = "success"

RETURN record
`

export const removeVehicleRecordTransactionId = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)
MATCH (bussing)-[:BUSSED_ON]->(date:TimeGraph)
REMOVE record.transactionId, record.transactionTime, record.transactionStatus

RETURN record, bacenta.name AS bacentaName, date.date AS date
`

export const getVehicleRecordWithDate = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)<-[:LEADS]-(leader:Member)
MATCH (bacenta)
MATCH (bussing)-[:BUSSED_ON]->(date:TimeGraph)
SET record.target = bacenta.target,
record.momoNumber = bacenta.momoNumber, 
record.mobileNetwork = bacenta.mobileNetwork,
record.momoName = bacenta.momoName

RETURN record.id AS vehicleRecordId,
record.target AS target,
record.attendance AS attendance, 
record.vehicle AS vehicle,
record.vehicleCost AS vehicleCost,
record.outbound AS outbound,
record.arrivalTime  AS arrivalTime,
record.personalContribution AS personalContribution,
leader.phoneNumber AS leaderPhoneNumber,
leader.firstName AS leaderFirstName,

bacenta.sprinterCost AS bacentaSprinterCost,
bacenta.urvanCost AS bacentaUrvanCost,

labels(date) AS dateLabels
`

export const checkTransactionId = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)
MATCH (bacenta)<-[:HAS]-(:Constituency)<-[:HAS]-(:Council)<-[:HAS]-(stream:Stream)
MATCH (bacenta)<-[:LEADS]-(leader:Member)
WITH record, bacenta, leader, stream

RETURN record, stream, bacenta, leader.firstName AS firstName, leader.phoneNumber AS phoneNumber
`

export const checkArrivalTimes = `
MATCH (bacenta {id: $bacentaId})<-[:HAS]-(:Constituency)<-[:HAS]-(:Council)<-[:HAS]-(stream:Stream)
RETURN stream
`

export const setSwellDate = `
MERGE (date:TimeGraph {date: date($date)})
    SET date:SwellDate
RETURN toString(date.date) AS id, date.date AS date, true AS swell
`

export const noVehicleTopUp = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)
SET record.vehicleTopUp = 0

RETURN record AS record
`

export const setVehicleTopUp = `
MATCH (record:VehicleRecord {id: $vehicleRecordId})
SET record.vehicleTopUp = $vehicleTopUp

RETURN record
`

export const RemoveAllStreamArrivalsHelpers = `
MATCH (church {id: $streamId})
WHERE church:Stream
OPTIONAL MATCH (church)<-[oldHelpers:COUNTS_ARRIVALS_FOR|CONFIRMS_ARRIVALS_FOR]-(admin:Member)
DELETE oldHelpers

WITH church, admin

MATCH (church)-[oldHistory:CURRENT_HISTORY]->(:ServiceLog)<-[oldAdminHistory:CURRENT_HISTORY]-(admin)
DELETE oldHistory, oldAdminHistory


RETURN church
`

export const checkBacentaMomoDetails = `
MATCH (bacenta:Bacenta {id: $bacentaId})
RETURN bacenta.sprinterCost AS sprinterCost, bacenta.urvanCost AS uvanCost, bacenta.momoNumber AS momoNumber
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
    MATCH (leader:Member {auth_id: $auth.jwt.sub})
    MATCH (bacenta)<-[:HAS]-(:Constituency)<-[:HAS]-(:Council)<-[:HAS]-(stream:Stream)
    MERGE (bussingRecord)-[:LOGGED_BY]->(leader)

    RETURN bussingRecord AS bussingRecord, 
    bacenta AS bacenta, 
    serviceDate AS date, 
    week AS week,
    stream.name AS stream_name
`

// Record Time And Aggregate Records for Bussing Record
export const recordArrivalTime = `
MATCH (vehicle:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(bussing:BussingRecord)
 SET vehicle.arrivalTime = datetime()
MATCH (bussing)-[:INCLUDES_RECORD]->(allVehicles:VehicleRecord)
WITH bussing, SUM(allVehicles.attendance) AS attendance, SUM(allVehicles.leaderDeclaration) AS leaderDeclaration, SUM(allVehicles.personalContribution) AS personalContribution, SUM(allVehicles.vehicleCost) AS vehicleCost, SUM(allVehicles.vehicleTopUp) AS vehicleTopUp
SET bussing.attendance = attendance,
bussing.leaderDeclaration = leaderDeclaration,
bussing.personalContribution = personalContribution,
bussing.bussingCost = vehicleCost,
bussing.bussingTopUp = vehicleTopUp

WITH bussing
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(cars:VehicleRecord {vehicle: 'Car'})
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(sprinters:VehicleRecord {vehicle: 'Sprinter'})
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(urvan:VehicleRecord {vehicle: 'Urvan'})
WITH bussing, COUNT(DISTINCT cars) AS cars, COUNT(DISTINCT sprinters) AS sprinters, COUNT(DISTINCT urvan) AS urvan

MATCH (vehicleRecord:VehicleRecord {id: $vehicleRecordId})
SET bussing.numberOfSprinters = sprinters,
 bussing.numberOfCars = cars,
 bussing.numberOfUrvan = urvan

RETURN vehicleRecord {
    .id,
    .vehicleTopUp,
    .arrivalTime
   }
`

export const recordVehicleFromBacenta = `
CREATE (vehicleRecord:VehicleRecord  {id: apoc.create.uuid()})
WITH vehicleRecord
MATCH (bussingRecord:BussingRecord {id: $bussingRecordId})
MERGE (bussingRecord)-[:INCLUDES_RECORD]->(vehicleRecord)

SET vehicleRecord.leaderDeclaration = $leaderDeclaration,
vehicleRecord.createdAt = datetime(),
vehicleRecord.vehicleCost = $vehicleCost,
vehicleRecord.personalContribution = $personalContribution,
vehicleRecord.vehicle = $vehicle,
vehicleRecord.picture =  $picture,
vehicleRecord.outbound = $outbound

WITH vehicleRecord, bussingRecord
MATCH (leader:Member {auth_id: $auth.jwt.sub})
MERGE (vehicleRecord)-[:LOGGED_BY]->(leader)

WITH vehicleRecord, bussingRecord
MATCH (bussingRecord)-[:INCLUDES_RECORD]->(vehicleRecords)
WITH vehicleRecord, bussingRecord, sum(vehicleRecords.leaderDeclaration) as summedLeaderDeclaration, toFloat(SUM(vehicleRecords.personalContribution)) as summedPersonalContribution, toFloat(SUM(vehicleRecords.vehicleCost)) as summedVehicleCost
SET bussingRecord.leaderDeclaration = summedLeaderDeclaration,
bussingRecord.personalContribution = summedPersonalContribution,
bussingRecord.bussingCost = summedVehicleCost

RETURN vehicleRecord, bussingRecord, date().week AS week
`

export const aggregateLeaderBussingDataOnHigherChurches = `
   MATCH (bacenta:Bacenta {id: $bacentaId}) 
   MATCH (bacenta)<-[:HAS]-(constituency)
   MATCH (constituency)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH constituency, aggregate

   MATCH (constituency)-[:HAS]->(bacentas)
   MATCH (date:TimeGraph {date: date()})
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(date)
   WITH constituency, aggregate, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.bussingCost) AS bussingCost, SUM(record.personalContribution) AS personalContribution

   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.bussingCost = bussingCost,
    aggregate.personalContribution = personalContribution

   WITH constituency AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(council)
   MATCH (council)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH council, aggregate
   MATCH (council)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {week: date().week, year: date().year})
   WITH council, aggregate, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.bussingCost) AS bussingCost, SUM(record.personalContribution) AS personalContribution

   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.bussingCost = bussingCost,
    aggregate.personalContribution = personalContribution

WITH council AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(stream)
   MATCH (stream)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH stream, aggregate
   MATCH (stream)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    WITH stream, aggregate, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.bussingCost) AS bussingCost, SUM(record.personalContribution) AS personalContribution

   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.bussingCost = bussingCost,
    aggregate.personalContribution = personalContribution

   WITH stream AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(gathering)
   MATCH (gathering)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH gathering, aggregate
   MATCH (gathering)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    WITH gathering, aggregate, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.bussingCost) AS bussingCost, SUM(record.personalContribution) AS personalContribution

   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.bussingCost = bussingCost,
    aggregate.personalContribution = personalContribution

   WITH gathering AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(oversight)
   MATCH (oversight)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH oversight, aggregate
   MATCH (oversight)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    WITH oversight, aggregate, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.bussingCost) AS bussingCost, SUM(record.personalContribution) AS personalContribution

   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.bussingCost = bussingCost,
    aggregate.personalContribution = personalContribution

   WITH oversight AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(denomination)
   MATCH (denomination)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH denomination, aggregate
   MATCH (denomination)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year}) 
   WITH denomination, aggregate, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.bussingCost) AS bussingCost, SUM(record.personalContribution) AS personalContribution

   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.bussingCost = bussingCost,
    aggregate.personalContribution = personalContribution

      
   RETURN denomination,aggregate
`

export const aggregateConfirmedBussingDataOnHigherChurches = `
   MATCH (bacenta:Bacenta {id: $bacentaId}) 
   MATCH (bacenta)<-[:HAS]-(constituency)
   MATCH (constituency)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH constituency, aggregate

   MATCH (constituency)-[:HAS]->(bacentas)
   MATCH (date:TimeGraph {date: date()})
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(date)
   WITH constituency, aggregate, SUM(record.attendance) AS lowerAttendance

   SET aggregate.attendance = lowerAttendance

   WITH constituency AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(council)
   MATCH (council)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH council, aggregate
   MATCH (council)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   WITH council, aggregate, SUM(record.attendance) AS lowerAttendance

   SET aggregate.attendance = lowerAttendance

WITH council AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(stream)
   MATCH (stream)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH stream, aggregate
   MATCH (stream)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   WITH stream, aggregate, SUM(record.attendance) AS lowerAttendance

   SET aggregate.attendance = lowerAttendance

   WITH stream AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(gathering)
   MATCH (gathering)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH gathering, aggregate
   MATCH (gathering)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   WITH gathering, aggregate, SUM(record.attendance) AS lowerAttendance

   SET aggregate.attendance = lowerAttendance

   WITH gathering AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(oversight)
   MATCH (oversight)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH oversight, aggregate
   MATCH (oversight)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   WITH oversight, aggregate, SUM(record.attendance) AS lowerAttendance

   SET aggregate.attendance = lowerAttendance

   WITH oversight AS lowerChurch
   MATCH (lowerChurch)<-[:HAS]-(denomination)
   MATCH (denomination)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH denomination, aggregate
   MATCH (denomination)-[:HAS]->(lowerChurch)
   MATCH (lowerChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(record:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year}) 
   WITH denomination, aggregate, SUM(record.attendance) AS lowerAttendance

   SET aggregate.attendance = lowerAttendance

   RETURN denomination,aggregate
`
