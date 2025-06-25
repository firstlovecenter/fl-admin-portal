export const checkRehearsalFormFilledThisWeek = `
MATCH (church {id: $churchId})
WHERE church:Hub OR church:HubCouncil OR church:Ministry
MATCH (church)<-[:HAS]-(higherChurch)

OPTIONAL MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record)-[:SERVICE_HELD_ON]->(date)
WHERE date(date.date).week = date().week AND date(date.date).year = date().year AND (record:RehearsalRecord)
RETURN church.id AS id, church.name AS name, labels(church) AS labels, labels(higherChurch) AS higherChurchLabels, higherChurch.id AS higherChurchId, record IS NOT NULL AS alreadyFilled
`

export const checkStreamServiceDay = `
WITH datetime($serviceDate) as dt
MATCH (church {id: $churchId}) WHERE church:Ministry
OPTIONAL MATCH (church)<-[:HAS_MINISTRY]-(stream:Stream)-[:MEETS_ON]->(serviceDay:ServiceDay {dayNumber: dt.dayOfWeek})
RETURN serviceDay.day IS NOT NULL AS serviceDay
`
export const checkCurrentServiceLog = `
MATCH (church {id:$churchId}) 
WHERE church:Hub OR church:HubCouncil OR church:Ministry
MATCH (church)-[:CURRENT_HISTORY]->(log:ServiceLog)
RETURN true AS exists
`
export const getServantAndChurch = `
MATCH (church {id: $churchId}) 
WHERE church:Hub OR church:HubCouncil OR church:Ministry
MATCH (church)<-[:LEADS]-(servant:Active:Member)
UNWIND labels(church) AS churchType 
WITH churchType, church, servant WHERE churchType IN ['Hub', 'HubCouncil','Ministry']
RETURN church.id AS churchId, church.name AS churchName, servant.id AS servantId, servant.auth_id AS auth_id, servant.firstName AS firstName, servant.lastName AS lastName, churchType AS churchType
`

export const checkMinistryAttendanceFormFilledThisWeek = `
    MATCH (church {id: $churchId})
    WHERE church:HubCouncil OR church:Ministry 
    MATCH (church)<-[:HAS]-(higherChurch) WHERE higherChurch:Ministry OR higherChurch:CreativeArts
    
    OPTIONAL MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record)-[:SERVICE_HELD_ON]->(date)    
    WHERE date(date.date).week = date().week AND date(date.date).year = date().year AND (record:MinistryAttendanceRecord)
    RETURN church.id AS id, church.name AS name, labels(church) AS labels, labels(higherChurch) AS higherChurchLabels, higherChurch.id AS higherChurchId, record IS NOT NULL AS alreadyFilled
    `

export const checkMinistryStageAttendanceFormFilledThisWeek = `
MATCH (church {id: $churchId})
WHERE church:Ministry 
MATCH (church)<-[:HAS]-(higherChurch) WHERE higherChurch:CreativeArts

OPTIONAL MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record)-[:SERVICE_HELD_ON]->(date)    
WHERE date(date.date).week = date().week AND date(date.date).year = date().year AND (record:StageAttendanceRecord)
RETURN church.id AS id, church.name AS name, labels(church) AS labels, labels(higherChurch) AS higherChurchLabels, higherChurch.id AS higherChurchId, record IS NOT NULL AS alreadyFilled
`

export const recordSundayMinistryAttendance = `
    CREATE (ministryAttendanceRecord:MinistryAttendanceRecord {id: apoc.create.uuid()})
        SET ministryAttendanceRecord.createdAt = datetime(), 
        ministryAttendanceRecord.attendance = $attendance, 
        ministryAttendanceRecord.familyPicture = $familyPicture
    
    WITH ministryAttendanceRecord
    MATCH (church {id: $churchId}) WHERE church:HubCouncil
    MATCH (church)-[current:CURRENT_HISTORY]->(log:ServiceLog)
    MATCH (leader:Member {auth_id: $jwt.sub})

    MERGE (serviceDate:TimeGraph {date: date($serviceDate)})

    WITH DISTINCT ministryAttendanceRecord, leader, serviceDate, log 
    MERGE (ministryAttendanceRecord)-[:LOGGED_BY]->(leader)
    MERGE (ministryAttendanceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
    MERGE (log)-[:HAS_SERVICE]->(ministryAttendanceRecord)

    WITH log, ministryAttendanceRecord
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)

    WITH ministryAttendanceRecord, aggregate, SUM(ministryAttendanceRecord.attendance) AS attendance, SUM(aggregate.attendance) AS aggregateAttendance
    MATCH (aggregate)
    SET aggregate.attendance = aggregateAttendance + attendance
    
    RETURN ministryAttendanceRecord
`

export const recordHubRehearsalService = `
CREATE (rehearsalRecord:RehearsalRecord {id: apoc.create.uuid()})
SET rehearsalRecord.createdAt = datetime(),
rehearsalRecord.attendance = $attendance,
rehearsalRecord.income = toFloat(round(100 * $income/10) / 100.0),
rehearsalRecord.cash = toFloat(round(100 * $income/10) / 100.0),
rehearsalRecord.dollarIncome = toFloat(round(100 * ($income / $conversionRateToDollar)/10) / 100.0),
rehearsalRecord.foreignCurrency = $foreignCurrency,
rehearsalRecord.numberOfTithers = $numberOfTithers,
rehearsalRecord.treasurerSelfie = $treasurerSelfie,
rehearsalRecord.familyPicture = $familyPicture
WITH rehearsalRecord

MATCH (church {id: $churchId}) WHERE church:Hub OR church:HubCouncil OR church:Ministry
MATCH (church)-[current:CURRENT_HISTORY]->(log:ServiceLog)
MATCH (leader:Member {auth_id: $jwt.sub})

MERGE (serviceDate:TimeGraph {date:date($serviceDate)})

WITH DISTINCT rehearsalRecord, leader, serviceDate, log
MERGE (rehearsalRecord)-[:LOGGED_BY]->(leader)
MERGE (rehearsalRecord)-[:SERVICE_HELD_ON]->(serviceDate)
MERGE (log)-[:HAS_SERVICE]->(rehearsalRecord)

WITH log, rehearsalRecord
MERGE (aggregate:AggregateRehearsalRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)

WITH rehearsalRecord, aggregate, SUM(rehearsalRecord.attendance) AS attendance, SUM(rehearsalRecord.income) AS income, SUM(rehearsalRecord.dollarIncome) AS dollarIncome, SUM(aggregate.attendance) AS aggregateAttendance, SUM(aggregate.income) AS aggregateIncome, SUM(aggregate.dollarIncome) AS aggregateDollarIncome
MATCH (aggregate)
SET aggregate.attendance = aggregateAttendance + attendance,
aggregate.income = toFloat(round(100 * (aggregateIncome + income)/10) / 100.0),
aggregate.dollarIncome = toFloat(round(100 * (aggregateDollarIncome + dollarIncome)/10) / 100.0),
aggregate.numberOfServices = 1


WITH rehearsalRecord
UNWIND $treasurers AS treasurerId WITH treasurerId, rehearsalRecord
MATCH (treasurer:Active:Member {id: treasurerId})
MERGE (treasurer)-[:WAS_TREASURER_FOR]->(rehearsalRecord)

RETURN rehearsalRecord
`

export const recordOnStageAttendance = `
    CREATE (stageAttendanceRecord:StageAttendanceRecord {id: apoc.create.uuid()})
        SET stageAttendanceRecord.createdAt = datetime(), 
        stageAttendanceRecord.attendance = $attendance, 
        stageAttendanceRecord.onStagePictures = $onStagePictures
    
    WITH stageAttendanceRecord
    MATCH (church {id: $churchId}) WHERE church:Ministry
    MATCH (church)-[current:CURRENT_HISTORY]->(log:ServiceLog)
    MATCH (leader:Member {auth_id: $jwt.sub})

    MERGE (serviceDate:TimeGraph {date: date($serviceDate)})

    WITH DISTINCT stageAttendanceRecord, leader, serviceDate, log 
    MERGE (stageAttendanceRecord)-[:LOGGED_BY]->(leader)
    MERGE (stageAttendanceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
    MERGE (log)-[:HAS_SERVICE]->(stageAttendanceRecord)

    WITH log, stageAttendanceRecord
    MERGE (aggregate:AggregateStageAttendanceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)

    WITH stageAttendanceRecord, aggregate, COUNT(DISTINCT stageAttendanceRecord) AS recordCount, SUM(stageAttendanceRecord.attendance) AS attendance, SUM(aggregate.attendance) AS aggregateAttendance
    
    MATCH (aggregate)
    SET aggregate.attendance = aggregateAttendance + attendance,
    aggregate.numberOfServices = recordCount
    
    RETURN stageAttendanceRecord
`

export const recordCancelledService = `
CREATE (serviceRecord:RehearsalRecord:NoService {createdAt:datetime()})
SET serviceRecord.id = apoc.create.uuid(),
serviceRecord.noServiceReason = $noServiceReason

WITH serviceRecord
MATCH (church {id: $churchId}) WHERE church:Hub
MATCH (church)-[:CURRENT_HISTORY]->(log:ServiceLog)
MATCH (leader:Active:Member {auth_id: $jwt.sub})

MERGE (serviceDate:TimeGraph {date: date($serviceDate)})
MERGE (serviceRecord)-[:LOGGED_BY]->(leader)
MERGE (serviceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
MERGE (log)-[:HAS_SERVICE]->(serviceRecord)

RETURN serviceRecord
`
export const recordCancelledOnStagePerformance = `
CREATE (stagePerformanceRecord:StageAttendanceRecord:NoService {createdAt:datetime()})
SET stagePerformanceRecord.id = apoc.create.uuid(),
stagePerformanceRecord.noStagePerformanceReason = $noStagePerformanceReason

WITH stagePerformanceRecord
MATCH (church {id: $churchId}) WHERE church:Ministry
MATCH (church)-[:CURRENT_HISTORY]->(log:ServiceLog)
MATCH (leader:Active:Member {auth_id: $jwt.sub})

MERGE (serviceDate:TimeGraph {date: date($serviceDate)})
MERGE (stagePerformanceRecord)-[:LOGGED_BY]->(leader)
MERGE (stagePerformanceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
MERGE (log)-[:HAS_SERVICE]->(stagePerformanceRecord)

RETURN stagePerformanceRecord
`

export const aggregateMinistryMeetingDataForHub = `
    MATCH (fellowship:HubFellowship {id: $churchId})
    WITH fellowship as lowerChurch
    MATCH (lowerChurch)<-[:HAS]-(hub:Hub)
    MATCH (hub)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..3]->(record:MinistryAttendanceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT hub, record
    MATCH (hub)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH hub, aggregate, collect(record.id) AS componentServiceIds, SUM(record.attendance) as totalAttendance
        SET aggregate.attendance = totalAttendance,
        aggregate.componentServiceIds = componentServiceIds
    WITH hub as lowerChurch 
    MATCH (lowerChurch)<-[:HAS]-(hubCouncil:HubCouncil)
    MATCH (hubCouncil)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..4]->(record:MinistryAttendanceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date().year = date().year AND NOT record:NoService
    WITH DISTINCT hubCouncil, record
    MATCH (hubCouncil)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  hubCouncil, aggregate, collect(record.id) AS componentServiceIds, SUM(record.attendance) AS totalAttendance
        SET aggregate.attendance = totalAttendance,
        aggregate.componentServiceIds = componentServiceIds
    
        WITH hubCouncil AS lowerChurch
    MATCH (lowerChurch)<-[:HAS]-(ministry:Ministry)
    MATCH (ministry)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..5]->(record:MinistryAttendanceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT ministry, record
    MATCH (ministry)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  ministry, aggregate, collect(record.id) AS componentServiceIds, SUM(record.attendance) AS totalAttendance
        SET aggregate.attendance = totalAttendance,
        aggregate.componentServiceIds = componentServiceIds
    
    WITH ministry as lowerChurch

    MATCH (lowerChurch)<-[:HAS]-(creativeArt:CreativeArts)
    MATCH (creativeArt)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..6]->(record:RehearsalRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT creativeArt, record
    MATCH (creativeArt)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  creativeArt, aggregate, collect(record.id) AS componentServiceIds, SUM(record.attendance) AS totalAttendance
        SET aggregate.attendance = totalAttendance,
        aggregate.componentServiceIds = componentServiceIds

    RETURN creativeArt, aggregate
`
export const aggregateMinistryMeetingDataForHubCouncil = `
    MATCH (hub:Hub {id: $churchId})
    WITH hub as lowerChurch
    MATCH (lowerChurch)<-[:HAS]-(hubCouncil:HubCouncil)
    MATCH (hubCouncil)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..4]->(record:MinistryAttendanceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT hubCouncil, record
    MATCH (hubCouncil)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH hubCouncil, aggregate, collect(record.id) AS componentServiceIds, SUM(record.attendance) as totalAttendance
        SET aggregate.attendance = totalAttendance,
        aggregate.componentServiceIds = componentServiceIds
    
    WITH hubCouncil AS lowerChurch
    MATCH (lowerChurch)<-[:HAS]-(ministry:Ministry)
    MATCH (ministry)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..5]->(record:MinistryAttendanceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT ministry, record
    MATCH (ministry)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  ministry, aggregate, collect(record.id) AS componentServiceIds, SUM(record.attendance) AS totalAttendance
        SET aggregate.attendance = totalAttendance,
        aggregate.componentServiceIds = componentServiceIds
    
    WITH ministry as lowerChurch

    MATCH (lowerChurch)<-[:HAS]-(creativeArt:CreativeArts)
    MATCH (creativeArt)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..6]->(record:RehearsalRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT creativeArt, record
    MATCH (creativeArt)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  creativeArt, aggregate, collect(record.id) AS componentServiceIds, SUM(record.attendance) AS totalAttendance
        SET aggregate.attendance = totalAttendance,
        aggregate.componentServiceIds = componentServiceIds

    RETURN creativeArt, aggregate
`

export const aggregateMinistryMeetingDataForMinistry = `
    MATCH (hub:HubCouncil {id: $churchId})
    WITH hub as lowerChurch
    MATCH (lowerChurch)<-[:HAS]-(ministry:Ministry)
    MATCH (ministry)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..5]->(record:MinistryAttendanceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT ministry, record
    MATCH (ministry)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  ministry, aggregate, collect(record.id) AS componentServiceIds, SUM(record.attendance) AS totalAttendance
        SET aggregate.attendance = totalAttendance,
        aggregate.componentServiceIds = componentServiceIds

    WITH ministry as lowerChurch

    MATCH (lowerChurch)<-[:HAS]-(creativeArt:CreativeArts)
    MATCH (creativeArt)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..6]->(record:MinistryAttendanceRecord>)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT creativeArt, record
    MATCH (creativeArt)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  creativeArt, aggregate, collect(record.id) AS componentServiceIds, SUM(record.attendance) AS totalAttendance
        SET aggregate.attendance = totalAttendance,
        aggregate.componentServiceIds = componentServiceIds

    RETURN creativeArt, aggregate
`

export const aggregateMinistryMeetingDataForCreativeArts = `
    MATCH (ministry:Ministry {id: $churchId})
    WITH ministry as lowerChurch

    MATCH (lowerChurch)<-[:HAS]-(creativeArt:CreativeArts)
    MATCH (creativeArt)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..6]->(record:MinistryAttendanceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT creativeArt, record
    MATCH (creativeArt)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateMinistryMeetingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  creativeArt, aggregate, collect(record.id) AS componentServiceIds, COUNT(DISTINCT record) AS numberOfServices, 
        toFloat(round(100 * SUM(record.attendance)/10) / 100.0) AS totalAttendance, 
        toFloat(round(100 * SUM(record.income)/10) / 100.0) AS totalIncome, 
        toFloat(round(100 * SUM(record.dollarIncome)/10) / 100.0) AS totalDollarIncome
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices

    RETURN creativeArt, aggregate
`

export const aggregateHubRehearsalDataForHubCouncil = `
    MATCH (hub:Hub {id: $churchId})
    WITH hub as lowerChurch
    MATCH (lowerChurch)<-[:HAS]-(hubcouncil:HubCouncil)
    MATCH (hubcouncil)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..4]->(record:RehearsalRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT hubcouncil, record
    MATCH (hubcouncil)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateRehearsalRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  hubcouncil, aggregate, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, 
        toFloat(round(100 * SUM(record.attendance)/10) / 100.0) AS totalAttendance, 
        toFloat(round(100 * SUM(record.income)/10) / 100.0) AS totalIncome, 
        toFloat(round(100 * SUM(record.dollarIncome)/10) / 100.0) AS totalDollarIncome
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices 

    WITH hubcouncil as lowerChurch

    MATCH (lowerChurch)<-[:HAS]-(ministry:Ministry)
    MATCH (ministry)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..5]->(record:RehearsalRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT ministry, record
    MATCH (ministry)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateRehearsalRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  ministry, aggregate, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, 
        toFloat(round(100 * SUM(record.attendance)/10) / 100.0) AS totalAttendance, 
        toFloat(round(100 * SUM(record.income)/10) / 100.0) AS totalIncome, 
        toFloat(round(100 * SUM(record.dollarIncome)/10) / 100.0) AS totalDollarIncome
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices 
    
    WITH ministry as lowerChurch

    MATCH (lowerChurch)<-[:HAS]-(creativearts:CreativeArts)
    MATCH (creativearts)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..6]->(record:RehearsalRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT creativearts, record
    MATCH (creativearts)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateRehearsalRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  creativearts, aggregate, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, 
        toFloat(round(100 * SUM(record.attendance)/10) / 100.0) AS totalAttendance, 
        toFloat(round(100 * SUM(record.income)/10) / 100.0) AS totalIncome, 
        toFloat(round(100 * SUM(record.dollarIncome)/10) / 100.0) AS totalDollarIncome
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices 

    RETURN creativearts, aggregate
`

export const aggregateHubRehearsalDataForMinistry = `
    MATCH (hubcouncil:HubCouncil {id: $churchId})
    WITH hubcouncil as lowerChurch

    MATCH (lowerChurch)<-[:HAS]-(ministry:Ministry)
    MATCH (ministry)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..5]->(record:RehearsalRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService
    WITH DISTINCT ministry, record
    MATCH (ministry)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateRehearsalRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
    WITH  ministry, aggregate, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, 
        toFloat(round(100 * SUM(record.attendance)/10) / 100.0) AS totalAttendance, 
        toFloat(round(100 * SUM(record.income)/10) / 100.0) AS totalIncome, 
        toFloat(round(100 * SUM(record.dollarIncome)/10) / 100.0) AS totalDollarIncome
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices 
`
