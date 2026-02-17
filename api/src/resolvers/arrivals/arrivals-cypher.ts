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
MATCH (record:VehicleRecord {id: $vehicleRecordId})<-[:INCLUDES_RECORD]-(:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Bacenta)
MATCH (bacenta)<-[:HAS]-(:Governorship)<-[:HAS]-(:Council)<-[:HAS]-(stream:Stream)
MATCH (bacenta)<-[:LEADS]-(leader:Active:Member)
WITH record, bacenta, leader, stream


RETURN record, stream, bacenta, leader
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
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(records:VehicleRecord) WHERE records.arrivalTime IS NOT NULL
RETURN stream.arrivalEndTime AS arrivalEndTime, 
bacenta.id AS bacentaId, 
COUNT(DISTINCT records) AS numberOfVehicles, 
SUM(records.attendance) AS totalAttendance, 
leader.phoneNumber AS leaderPhoneNumber,
leader.firstName AS leaderFirstName, 
bacenta.name AS bacentaName
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

WITH church, admin

MATCH (church)-[oldHistory:CURRENT_HISTORY]->(:ServiceLog)<-[oldAdminHistory:CURRENT_HISTORY]-(admin)
DELETE oldHistory, oldAdminHistory


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
    MATCH (leader:Member {auth_id: $jwt.sub})
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
    SET vehicleRecord.attendance = $attendance,
      vehicleRecord.vehicle = $vehicle,
      vehicleRecord.comments = $comments,
      vehicleRecord.arrivalTime = datetime()

    WITH vehicleRecord
          MATCH (admin:Member {auth_id: $jwt.sub})
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
CREATE (vehicleRecord:VehicleRecord  {id: apoc.create.uuid()})

WITH vehicleRecord
MATCH (bussingRecord:BussingRecord {id: $bussingRecordId})
MERGE (bussingRecord)-[:INCLUDES_RECORD]->(vehicleRecord)

SET vehicleRecord.leaderDeclaration = $leaderDeclaration,
vehicleRecord.createdAt = datetime(),
vehicleRecord.vehicle = $vehicle,
vehicleRecord.picture =  $picture,
vehicleRecord.outbound = $outbound,
vehicleRecord.momoNumber = $momoNumber,
vehicleRecord.mobileNetwork = $mobileNetwork

WITH vehicleRecord, bussingRecord
MATCH (leader:Member {auth_id: $jwt.sub})
MERGE (vehicleRecord)-[:LOGGED_BY]->(leader)

WITH vehicleRecord, bussingRecord
MATCH (bussingRecord)-[:INCLUDES_RECORD]->(vehicleRecords)
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
round(toFloat(record.vehicleTopUp), 2) as topUp, record.vehicleCost as vehicleCost, record.momoNumber as momoNumber, record.comments as comments, record.arrivalTime as arrivalTime, (leader.firstName+ " "+ leader.lastName) as leader, council.name as council, governorship.name as governorship, record.momoName as momoName, society.society as society ORDER BY toInteger(society) ASC
`
