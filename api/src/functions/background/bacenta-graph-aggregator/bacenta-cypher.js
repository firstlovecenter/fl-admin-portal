// SYN-215 — these queries now mirror sevice-cypher.js on two points (ADR-014):
//   1. The record MATCH precedes the MERGE. With the MERGE first, a run on a
//      day with no bussing records still created the current-week aggregate
//      before the MATCH eliminated the row, leaving an empty node that the
//      zero-out pass below filled with zeros — a phantom current-week row in
//      graphs, reports and downloads.
//   2. Records are filtered by the current ISO *week*, not by `date()`. The
//      node is week-keyed, so a day filter meant a week with bussing on two
//      days had the earlier day silently overwritten by the later one.
const aggregateBussingOnGovernorshipQuery = `
   MATCH (governorship:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate:TimeGraph)
   WHERE serviceDate.date.week = date().week AND serviceDate.date.year = date().year

   WITH DISTINCT governorship, record
   WITH governorship, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
   SUM(record.numberOfSprinters) AS numberOfSprinters,
   SUM(record.numberOfUrvans) AS numberOfUrvans,
   SUM(record.numberOfCars) AS numberOfCars

   MATCH (governorship)-[:CURRENT_HISTORY]->(log:ServiceLog)

   MERGE (aggregate:AggregateBussingRecord {id: governorship.id + '-' + toString(date().week) + '-' + toString(date().year)})
    ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
    SET aggregate.month = date().month

   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)
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
   MATCH (council:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate:TimeGraph)
   WHERE serviceDate.date.week = date().week AND serviceDate.date.year = date().year

   WITH DISTINCT council, record
   WITH council, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
   SUM(record.numberOfSprinters) AS numberOfSprinters,
   SUM(record.numberOfUrvans) AS numberOfUrvans,
   SUM(record.numberOfCars) AS numberOfCars

   MATCH (council)-[:CURRENT_HISTORY]->(log:ServiceLog)

   MERGE (aggregate:AggregateBussingRecord {id: council.id + '-' + toString(date().week) + '-' + toString(date().year)})
    ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
    SET aggregate.month = date().month

   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)
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
   MATCH (stream:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate:TimeGraph)
   WHERE serviceDate.date.week = date().week AND serviceDate.date.year = date().year

   WITH DISTINCT stream, record
   WITH stream, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
   SUM(record.numberOfSprinters) AS numberOfSprinters,
   SUM(record.numberOfUrvans) AS numberOfUrvans,
   SUM(record.numberOfCars) AS numberOfCars

   MATCH (stream)-[:CURRENT_HISTORY]->(log:ServiceLog)

   MERGE (aggregate:AggregateBussingRecord {id: stream.id + '-' + toString(date().week) + '-' + toString(date().year)})
    ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
    SET aggregate.month = date().month

   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)
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
   MATCH (campus:Campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate:TimeGraph)
   WHERE serviceDate.date.week = date().week AND serviceDate.date.year = date().year

   WITH DISTINCT campus, record
   WITH campus, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
   SUM(record.numberOfSprinters) AS numberOfSprinters,
   SUM(record.numberOfUrvans) AS numberOfUrvans,
   SUM(record.numberOfCars) AS numberOfCars

   MATCH (campus)-[:CURRENT_HISTORY]->(log:ServiceLog)

   MERGE (aggregate:AggregateBussingRecord {id: campus.id + '-' + toString(date().week) + '-' + toString(date().year)})
    ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
    SET aggregate.month = date().month

   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)
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
    MATCH (oversight:Oversight)-[:HAS]->(:Campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
    MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate:TimeGraph)
    WHERE serviceDate.date.week = date().week AND serviceDate.date.year = date().year

    WITH DISTINCT oversight, record
    WITH oversight, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
    SUM(record.numberOfSprinters) AS numberOfSprinters,
    SUM(record.numberOfUrvans) AS numberOfUrvans,
    SUM(record.numberOfCars) AS numberOfCars

    MATCH (oversight)-[:CURRENT_HISTORY]->(log:ServiceLog)

    MERGE (aggregate:AggregateBussingRecord {id: oversight.id + '-' + toString(date().week) + '-' + toString(date().year)})
     ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
     SET aggregate.month = date().month

    MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)
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
    MATCH (denomination:Denomination)-[:HAS]->(:Oversight)-[:HAS]->(:Campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
    MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(serviceDate:TimeGraph)
    WHERE serviceDate.date.week = date().week AND serviceDate.date.year = date().year

    WITH DISTINCT denomination, record
    WITH denomination, collect(record.id) AS componentBussingIds, SUM(record.leaderDeclaration) AS leaderDeclaration, SUM(record.attendance) AS attendance, SUM(record.bussingTopUp) AS bussingTopUp,
    SUM(record.numberOfSprinters) AS numberOfSprinters,
    SUM(record.numberOfUrvans) AS numberOfUrvans,
    SUM(record.numberOfCars) AS numberOfCars

    MATCH (denomination)-[:CURRENT_HISTORY]->(log:ServiceLog)

    MERGE (aggregate:AggregateBussingRecord {id: denomination.id + '-' + toString(date().week) + '-' + toString(date().year)})
     ON CREATE SET aggregate.week = date().week, aggregate.year = date().year
     SET aggregate.month = date().month

    MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)
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
