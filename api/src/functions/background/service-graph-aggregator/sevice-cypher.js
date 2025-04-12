export const aggregateBacentaOnGovernorshipQuery = `
   MATCH (governorship:Governorship)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..3]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
   WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

   WITH DISTINCT governorship, record
   WITH governorship, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, SUM(record.attendance) AS totalAttendance, SUM(record.income) AS totalIncome, SUM(record.dollarIncome) AS totalDollarIncome
   
   MATCH (governorship)-[:CURRENT_HISTORY]->(log:ServiceLog)
   
   MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month

   MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
       SET aggregate.attendance = totalAttendance,
       aggregate.income = totalIncome,
       aggregate.dollarIncome = totalDollarIncome,
       aggregate.componentServiceIds = componentServiceIds,
       aggregate.numberOfServices = numberOfServices

    RETURN COUNT(governorship) as governorshipCount
`

export const aggregateGovernorshipOnCouncilQuery = `
    MATCH (council:Council)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..4]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT council, record
    WITH council, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, SUM(record.attendance) AS totalAttendance, SUM(record.income) AS totalIncome, SUM(record.dollarIncome) AS totalDollarIncome

    MATCH (council)-[:CURRENT_HISTORY]->(log:ServiceLog)
    
    MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices

    RETURN COUNT(council) as councilCount
`

export const aggregateCouncilOnStreamQuery = `
    MATCH (stream:Stream)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..5]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT stream, record
    WITH stream, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, SUM(record.attendance) AS totalAttendance, SUM(record.income) AS totalIncome, SUM(record.dollarIncome) AS totalDollarIncome

    MATCH (stream)-[:CURRENT_HISTORY]->(log:ServiceLog)
    
    MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices

    RETURN COUNT(stream) as streamCount
`

export const aggregateStreamOnCampusQuery = `
    MATCH (campus:Campus)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..6]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT campus, record
    WITH campus, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, SUM(record.attendance) AS totalAttendance, SUM(record.income) AS totalIncome, SUM(record.dollarIncome) AS totalDollarIncome

    MATCH (campus)-[:CURRENT_HISTORY]->(log:ServiceLog)
    
    MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices

    RETURN COUNT(campus) as campusCount
`

export const aggregateCampusOnOversightQuery = `
    MATCH (oversight:Oversight)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..7]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT oversight, record
    WITH oversight, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, SUM(record.attendance) AS totalAttendance, SUM(record.income) AS totalIncome, SUM(record.dollarIncome) AS totalDollarIncome

    MATCH (oversight)-[:CURRENT_HISTORY]->(log:ServiceLog)
    
    MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalDollarIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices

    RETURN COUNT(oversight) as oversightCount
`

export const aggregateOversightOnDenominationQuery = `
    MATCH (denomination:Denomination)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..8]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph) 
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT denomination, record
    WITH denomination, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices, SUM(record.attendance) AS totalAttendance, SUM(record.income) AS totalIncome, SUM(record.dollarIncome) AS totalDollarIncome

    MATCH (denomination)-[:CURRENT_HISTORY]->(log:ServiceLog)
    
    MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalDollarIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices

    RETURN COUNT(denomination) as denominationCount
`
