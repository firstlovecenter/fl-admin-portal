// Optimized version of the governorship service aggregation query

// First gather current week and year once to avoid repeated calculations
WITH date() AS today,
     date().week AS currentWeek,
     date().year AS currentYear
     
// Match TimeGraph nodes with indexed properties first to reduce initial dataset
MATCH (date:TimeGraph)
WHERE date.date.week = currentWeek AND date.date.year = currentYear

// Match service records connected to these dates
MATCH (record:ServiceRecord)-[:SERVICE_HELD_ON]->(date)
WHERE NOT record:NoService

// Now match governorships with a direct path to records
MATCH (governorship:Governorship)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..3]->(record)

// Group by governorship to calculate aggregates
WITH DISTINCT governorship, 
      collect(record.id) AS componentServiceIds,
      COUNT(DISTINCT record) AS numberOfServices, 
      SUM(record.attendance) AS totalAttendance, 
      SUM(record.income) AS totalIncome, 
      SUM(record.dollarIncome) AS totalDollarIncome,
      currentWeek AS week,
      currentYear AS year

// Match logs for each governorship
MATCH (governorship)-[:CURRENT_HISTORY]->(log:ServiceLog)

// Create unique identifier for aggregate
WITH log, governorship, componentServiceIds, numberOfServices, totalAttendance, totalIncome, totalDollarIncome, week, year,
     (week + '-' + year + '-' + log.id) AS aggregateId

// Create or update aggregate record
MERGE (aggregate:AggregateServiceRecord {id: aggregateId})
ON CREATE SET 
    aggregate.week = week,
    aggregate.year = year,
    aggregate.month = date().month,
    aggregate.logId = log.id
ON MATCH SET
    aggregate.month = date().month

MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(aggregate)
SET aggregate.attendance = totalAttendance,
    aggregate.income = totalIncome,
    aggregate.dollarIncome = totalDollarIncome,
    aggregate.componentServiceIds = componentServiceIds,
    aggregate.numberOfServices = numberOfServices

RETURN COUNT(DISTINCT governorship) as governorshipCount
