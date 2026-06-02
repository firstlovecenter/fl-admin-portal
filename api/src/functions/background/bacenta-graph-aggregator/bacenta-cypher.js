const aggregateBussingOnGovernorshipQuery = `
   MATCH (governorship:Governorship)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: governorship.id + '-' + toString(date().week) + '-' + toString(date().year)})
    ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH governorship, aggregate

   MATCH (governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (serviceDate:TimeGraph {date: date()})
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate)
   WITH DISTINCT governorship, aggregate, record
   WITH governorship, aggregate, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
   SUM(record.numberOfSprinters) AS numberOfSprinters,
   SUM(record.numberOfUrvans) AS numberOfUrvans,
   SUM(record.numberOfCars) AS numberOfCars

   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.attendance = attendance,
    aggregate.bussingTopUp = bussingTopUp,
    aggregate.componentBussingIds = componentBussingIds,
    aggregate.numberOfSprinters = numberOfSprinters,
    aggregate.numberOfUrvans = numberOfUrvans,
    aggregate.numberOfCars = numberOfCars,
    aggregate.recomputedAt = datetime()

    RETURN COUNT(governorship) as governorshipCount
`

const aggregateBussingOnCouncilQuery = `
   MATCH (council:Council)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: council.id + '-' + toString(date().week) + '-' + toString(date().year)})
    ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH council, aggregate
   MATCH (council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (serviceDate:TimeGraph {date: date()})
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate)
   WITH DISTINCT council, aggregate, record
   WITH council, aggregate, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
   SUM(record.numberOfSprinters) AS numberOfSprinters,
   SUM(record.numberOfUrvans) AS numberOfUrvans,
   SUM(record.numberOfCars) AS numberOfCars


   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.attendance = attendance,
    aggregate.bussingTopUp = bussingTopUp,
    aggregate.componentBussingIds = componentBussingIds,
    aggregate.numberOfSprinters = numberOfSprinters,
    aggregate.numberOfUrvans = numberOfUrvans,
    aggregate.numberOfCars = numberOfCars,
    aggregate.recomputedAt = datetime()

    RETURN COUNT(council) as councilCount
`

const aggregateBussingOnStreamQuery = `
   MATCH (stream:Stream)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: stream.id + '-' + toString(date().week) + '-' + toString(date().year)})
    ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH stream, aggregate
   MATCH (stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (serviceDate:TimeGraph {date: date()})
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate)
   WITH DISTINCT stream, aggregate, record
   WITH stream, aggregate, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
   SUM(record.numberOfSprinters) AS numberOfSprinters,
   SUM(record.numberOfUrvans) AS numberOfUrvans,
   SUM(record.numberOfCars) AS numberOfCars


   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.attendance = attendance,
    aggregate.bussingTopUp = bussingTopUp,
    aggregate.componentBussingIds = componentBussingIds,
    aggregate.numberOfSprinters = numberOfSprinters,
    aggregate.numberOfUrvans = numberOfUrvans,
    aggregate.numberOfCars = numberOfCars,
    aggregate.recomputedAt = datetime()

    RETURN COUNT(stream) as streamCount
`

const aggregateBussingOnCampusQuery = `
   MATCH (campus:Campus)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: campus.id + '-' + toString(date().week) + '-' + toString(date().year)})
    ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH campus, aggregate
   MATCH (campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (serviceDate:TimeGraph {date: date()})
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate)
   WITH DISTINCT campus, aggregate, record
   WITH campus, aggregate, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
   SUM(record.numberOfSprinters) AS numberOfSprinters,
   SUM(record.numberOfUrvans) AS numberOfUrvans,
   SUM(record.numberOfCars) AS numberOfCars


   SET aggregate.leaderDeclaration = leaderDeclaration,
    aggregate.attendance = attendance,
    aggregate.bussingTopUp = bussingTopUp,
    aggregate.componentBussingIds = componentBussingIds,
    aggregate.numberOfSprinters = numberOfSprinters,
    aggregate.numberOfUrvans = numberOfUrvans,
    aggregate.numberOfCars = numberOfCars,
    aggregate.recomputedAt = datetime()

    RETURN COUNT(campus) as campusCount
`

const aggregateBussingOnOversightQuery = `
    MATCH (oversight:Oversight)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateBussingRecord {id: oversight.id + '-' + toString(date().week) + '-' + toString(date().year)})
     ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
     SET aggregate.month = date().month
    MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

    WITH oversight, aggregate
    MATCH (oversight)-[:HAS]->(:Campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
    MATCH (serviceDate:TimeGraph {date: date()})
    MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate)
    WITH DISTINCT oversight, aggregate, record
    WITH oversight, aggregate, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
    SUM(record.numberOfSprinters) AS numberOfSprinters,
    SUM(record.numberOfUrvans) AS numberOfUrvans,
    SUM(record.numberOfCars) AS numberOfCars


    SET aggregate.leaderDeclaration = leaderDeclaration,
     aggregate.attendance = attendance,
     aggregate.bussingTopUp = bussingTopUp,
     aggregate.componentBussingIds = componentBussingIds,
     aggregate.numberOfSprinters = numberOfSprinters,
     aggregate.numberOfUrvans = numberOfUrvans,
     aggregate.numberOfCars = numberOfCars,
     aggregate.recomputedAt = datetime()

     RETURN COUNT(oversight) as oversightCount
    `

const aggregateBussingOnDenominationQuery = `
    MATCH (denomination:Denomination)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateBussingRecord {id: denomination.id + '-' + toString(date().week) + '-' + toString(date().year)})
     ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
     SET aggregate.month = date().month
    MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

    WITH denomination, aggregate
    MATCH (denomination)-[:HAS]->(:Oversight)-[:HAS]->(:Campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
    MATCH (serviceDate:TimeGraph {date: date()})
    MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate)
    WITH DISTINCT denomination, aggregate, record
    WITH denomination, aggregate, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
    SUM(record.numberOfSprinters) AS numberOfSprinters,
    SUM(record.numberOfUrvans) AS numberOfUrvans,
    SUM(record.numberOfCars) AS numberOfCars

    SET aggregate.leaderDeclaration = leaderDeclaration,
        aggregate.attendance = attendance,
        aggregate.bussingTopUp = bussingTopUp,
        aggregate.componentBussingIds = componentBussingIds,
        aggregate.numberOfSprinters = numberOfSprinters,
        aggregate.numberOfUrvans = numberOfUrvans,
        aggregate.numberOfCars = numberOfCars,
        aggregate.recomputedAt = datetime()

        RETURN COUNT(denomination) as denominationCount
        `

const zeroAllNullBussingRecordsCypher = `
    MATCH (aggregate:AggregateBussingRecord)
   WHERE aggregate.numberOfSprinters IS NULL AND aggregate.numberOfUrvans IS NULL AND aggregate.numberOfCars IS NULL

   SET aggregate.leaderDeclaration = 0,
    aggregate.attendance = 0,
    aggregate.bussingTopUp = 0,
    aggregate.componentBussingIds = [],
    aggregate.numberOfSprinters = 0,
    aggregate.numberOfUrvans = 0,
    aggregate.numberOfCars = 0
   RETURN COUNT(aggregate) as aggregateCount
   `

module.exports = {
  aggregateBussingOnCampusQuery,
  aggregateBussingOnCouncilQuery,
  aggregateBussingOnDenominationQuery,
  aggregateBussingOnGovernorshipQuery,
  aggregateBussingOnOversightQuery,
  aggregateBussingOnStreamQuery,
  zeroAllNullBussingRecordsCypher,
}
