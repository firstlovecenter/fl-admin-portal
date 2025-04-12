const aggregateBussingOnGovernorshipQuery = `
   MATCH (governorship:Governorship)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH governorship, aggregate

   MATCH (governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (date:TimeGraph {date: date()})
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph) WHERE date.date.week = date().week AND date.date.year = date().year
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
    aggregate.numberOfCars = numberOfCars

    RETURN COUNT(governorship) as governorshipCount
`

const aggregateBussingOnCouncilQuery = `
   MATCH (council:Council)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH council, aggregate
   MATCH (council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph) WHERE date.date.week = date().week AND date.date.year = date().year
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
    aggregate.numberOfCars = numberOfCars

    RETURN COUNT(council) as councilCount
`

const aggregateBussingOnStreamQuery = `
   MATCH (stream:Stream)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH stream, aggregate
   MATCH (stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph) WHERE date.date.week = date().week AND date.date.year = date().year
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
    aggregate.numberOfCars = numberOfCars

    RETURN COUNT(stream) as streamCount
`

const aggregateBussingOnCampusQuery = `
   MATCH (campus:Campus)-[:CURRENT_HISTORY]->(log:ServiceLog)
   MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
    SET aggregate.month = date().month
   MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

   WITH campus, aggregate
   MATCH (campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
   MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph) WHERE date.date.week = date().week AND date.date.year = date().year
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
    aggregate.numberOfCars = numberOfCars

    RETURN COUNT(campus) as campusCount
`

const aggregateBussingOnOversightQuery = `
    MATCH (oversight:Oversight)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
        SET aggregate.month = date().month
    MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)
    
    WITH oversight, aggregate
    MATCH (oversight)-[:HAS]->(:Campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
    MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph) WHERE date.date.week = date().week AND date.date.year = date().year
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
     aggregate.numberOfCars = numberOfCars
    
     RETURN COUNT(oversight) as oversightCount
    `

const aggregateBussingOnDenominationQuery = `
    MATCH (denomination:Denomination)-[:CURRENT_HISTORY]->(log:ServiceLog)
    MERGE (aggregate:AggregateBussingRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
        SET aggregate.month = date().month
    MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(aggregate)

    WITH denomination, aggregate
    MATCH (denomination)-[:HAS]->(:Oversight)-[:HAS]->(:Campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacentas:Bacenta)
    MATCH (bacentas)-[:CURRENT_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph) WHERE date.date.week = date().week AND date.date.year = date().year
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
        aggregate.numberOfCars = numberOfCars
    
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
