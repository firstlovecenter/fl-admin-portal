const aggregateBacentaOnGovernorshipQuery = `
   MATCH (governorship:Governorship)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..3]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
   WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

   WITH DISTINCT governorship, record
   WITH governorship, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices,
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance,
        round(toFloat(SUM(record.income)), 2) AS totalIncome,
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome

   MATCH (governorship)-[:CURRENT_HISTORY]->(log:ServiceLog)

   MERGE (aggregate:AggregateServiceRecord {id: governorship.id + '-' + toString(date().week) + '-' + toString(date().year)})
    ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
    SET aggregate.month = date().month

   MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
       SET aggregate.attendance = totalAttendance,
       aggregate.income = totalIncome,
       aggregate.dollarIncome = totalDollarIncome,
       aggregate.componentServiceIds = componentServiceIds,
       aggregate.numberOfServices = numberOfServices,
       aggregate.recomputedAt = datetime()

    RETURN COUNT(governorship) as governorshipCount
`

const aggregateGovernorshipOnCouncilQuery = `
    MATCH (council:Council)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..4]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT council, record
    WITH council, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices,
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance,
        round(toFloat(SUM(record.income)), 2) AS totalIncome,
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome

    MATCH (council)-[:CURRENT_HISTORY]->(log:ServiceLog)

    MERGE (aggregate:AggregateServiceRecord {id: council.id + '-' + toString(date().week) + '-' + toString(date().year)})
     ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
     SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices,
        aggregate.recomputedAt = datetime()

    RETURN COUNT(council) as councilCount
`

const aggregateCouncilOnStreamQuery = `
    MATCH (stream:Stream)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..5]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT stream, record
    WITH stream, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices,
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance,
        round(toFloat(SUM(record.income)), 2) AS totalIncome,
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome

    MATCH (stream)-[:CURRENT_HISTORY]->(log:ServiceLog)

    MERGE (aggregate:AggregateServiceRecord {id: stream.id + '-' + toString(date().week) + '-' + toString(date().year)})
     ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
     SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices,
        aggregate.recomputedAt = datetime()

    RETURN COUNT(stream) as streamCount
`

const aggregateStreamOnCampusQuery = `
    MATCH (campus:Campus)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..6]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT campus, record
    WITH campus, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices,
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance,
        round(toFloat(SUM(record.income)), 2) AS totalIncome,
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome

    MATCH (campus)-[:CURRENT_HISTORY]->(log:ServiceLog)

    MERGE (aggregate:AggregateServiceRecord {id: campus.id + '-' + toString(date().week) + '-' + toString(date().year)})
     ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
     SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = totalIncome,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices,
        aggregate.recomputedAt = datetime()

    RETURN COUNT(campus) as campusCount
`

const aggregateCampusOnOversightQuery = `
    MATCH (oversight:Oversight)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..7]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT oversight, record
    WITH oversight, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices,
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance,
        round(toFloat(SUM(record.income)), 2) AS totalIncome,
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome

    // Resolve the income currency from the oversight's campuses. A single-currency
    // oversight (e.g. all-GHS Outside Accra) reports income in that native currency
    // so the graph matches the campus figures and the weekly report; only a
    // genuinely multi-currency oversight consolidates unlike currencies to USD.
    WITH oversight, componentServiceIds, numberOfServices, totalAttendance, totalIncome, totalDollarIncome,
         [(oversight)-[:HAS]->(cx:Campus) WHERE cx.currency IS NOT NULL | cx.currency] AS campusCurrencies
    WITH oversight, componentServiceIds, numberOfServices, totalAttendance, totalIncome, totalDollarIncome,
         CASE
           WHEN size(campusCurrencies) > 0
             AND size([c IN campusCurrencies WHERE c <> campusCurrencies[0]]) = 0
           THEN campusCurrencies[0]
           ELSE 'USD'
         END AS resolvedCurrency

    MATCH (oversight)-[:CURRENT_HISTORY]->(log:ServiceLog)

    MERGE (aggregate:AggregateServiceRecord {id: oversight.id + '-' + toString(date().week) + '-' + toString(date().year)})
     ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
     SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = CASE WHEN resolvedCurrency = 'USD' THEN totalDollarIncome ELSE totalIncome END,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.currency = resolvedCurrency,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices,
        aggregate.recomputedAt = datetime()

    RETURN COUNT(oversight) as oversightCount
`

const aggregateOversightOnDenominationQuery = `
    MATCH (denomination:Denomination)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..8]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week AND date.date.year = date().year AND NOT record:NoService

    WITH DISTINCT denomination, record
    WITH denomination, collect(record.id) AS componentServiceIds,COUNT(DISTINCT record) AS numberOfServices,
        round(toFloat(SUM(record.attendance)), 2) AS totalAttendance,
        round(toFloat(SUM(record.income)), 2) AS totalIncome,
        round(toFloat(SUM(record.dollarIncome)), 2) AS totalDollarIncome

    // Resolve the income currency from the denomination's campuses (reached via
    // its oversights). In practice the network spans multiple currencies, so this
    // consolidates to USD; the single-currency branch is kept for symmetry with
    // the Oversight query so a future single-currency network stays native.
    WITH denomination, componentServiceIds, numberOfServices, totalAttendance, totalIncome, totalDollarIncome,
         [(denomination)-[:HAS*2]->(cx:Campus) WHERE cx.currency IS NOT NULL | cx.currency] AS campusCurrencies
    WITH denomination, componentServiceIds, numberOfServices, totalAttendance, totalIncome, totalDollarIncome,
         CASE
           WHEN size(campusCurrencies) > 0
             AND size([c IN campusCurrencies WHERE c <> campusCurrencies[0]]) = 0
           THEN campusCurrencies[0]
           ELSE 'USD'
         END AS resolvedCurrency

    MATCH (denomination)-[:CURRENT_HISTORY]->(log:ServiceLog)

    MERGE (aggregate:AggregateServiceRecord {id: denomination.id + '-' + toString(date().week) + '-' + toString(date().year)})
     ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
     SET aggregate.month = date().month

    MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
        SET aggregate.attendance = totalAttendance,
        aggregate.income = CASE WHEN resolvedCurrency = 'USD' THEN totalDollarIncome ELSE totalIncome END,
        aggregate.dollarIncome = totalDollarIncome,
        aggregate.currency = resolvedCurrency,
        aggregate.componentServiceIds = componentServiceIds,
        aggregate.numberOfServices = numberOfServices,
        aggregate.recomputedAt = datetime()

    RETURN COUNT(denomination) as denominationCount
`

module.exports = {
  aggregateBacentaOnGovernorshipQuery,
  aggregateGovernorshipOnCouncilQuery,
  aggregateCouncilOnStreamQuery,
  aggregateStreamOnCampusQuery,
  aggregateCampusOnOversightQuery,
  aggregateOversightOnDenominationQuery,
}
