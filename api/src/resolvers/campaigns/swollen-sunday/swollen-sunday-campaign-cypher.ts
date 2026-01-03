export const uploadBacentaTargetsCypher = `
UNWIND $data as details
MERGE (target:Target {code: toInteger(details.code) + '-' + toString(date($swellDate))})
ON CREATE
SET target.target = details.target,
target.id = apoc.create.uuid(),
target.code = details.code + '-' + date($swellDate),
target.date = date($swellDate)
ON MATCH
SET target.date = date($swellDate),
target.target = details.target

WITH target, details
MATCH (bacenta:Bacenta {code: toInteger(details.code)})
MATCH (bacenta)-[:CURRENT_HISTORY]->(log:ServiceLog)
MERGE (swellDate:TimeGraph {date:date($swellDate)})
SET swellDate:SwellDate

WITH log, target, swellDate
MERGE (target)<-[:HAS_TARGET]-(log)

WITH log
MATCH (log)<-[:HAS_HISTORY]-(bacenta:Bacenta)

WITH DISTINCT bacenta
CREATE (log:HistoryLog)
SET
log.id =  apoc.create.uuid(),
log.timeStamp = datetime(),
log.historyRecord = bacenta.name + ' bacenta target has been updated'

MERGE (date:TimeGraph {date: date()})
WITH bacenta, log, date
MERGE (bacenta)-[:HAS_HISTORY]->(log)
MERGE (log)-[:RECORDED_ON]->(date)

RETURN true as result
`

export const getCouncilAverage = `
MATCH (this:Council {id:$councilId})
MATCH (this)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)

CALL apoc.cypher.run('
 WITH $bacenta AS bacenta
 MATCH (bacenta:Bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(bussing:AggregateBussingRecord) 
 WITH bussing ORDER BY bussing.year, bussing.week DESC
 RETURN DISTINCT bussing  LIMIT 4',
 {bacenta:bacenta}) YIELD value

WITH avg(value.bussing.attendance) as averageBacentaAttendance, bacenta
WITH sum(averageBacentaAttendance) as averageCouncilBussing
RETURN toFloat(averageCouncilBussing) as averageCouncilBussing
`

export const shareBacentaTargetsCypher = `
MATCH (this:Council {id:$councilId})
MATCH (this)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
OPTIONAL MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_TARGET]->(oldTarget:Target {date:date($swellDate)})
DETACH DELETE oldTarget

WITH bacenta, this

CALL apoc.cypher.run('
 WITH $bacenta AS bacenta
 MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(bussing:AggregateBussingRecord) 
 WITH bussing ORDER BY bussing.year, bussing.week DESC
 RETURN DISTINCT bussing  LIMIT 4',
 {bacenta:bacenta}) YIELD value

WITH avg(value.bussing.attendance) as averageBacentaAttendance, bacenta
WITH ((averageBacentaAttendance/$averageCouncilBussing) * $target) as bacentaTarget, bacenta

WITH bacenta, ROUND(bacentaTarget) as target
WITH collect(bacenta.id) as ids, collect(target) as targets
WITH apoc.coll.zip(ids, targets) as output

UNWIND output as one
MATCH (bacenta:Bacenta {id:one[0]})
MATCH (bacenta)-[:CURRENT_HISTORY]->(log:ServiceLog)

WITH log, one, bacenta
MERGE (target:Target {code: bacenta.code + '-' + toString(date($swellDate))})
ON CREATE
SET target.target = one[1],
target.id = apoc.create.uuid(),
target.code = bacenta.code + '-' + date($swellDate),
target.date = date($swellDate)
ON MATCH
SET target.date = date($swellDate),
target.target = one[1]

WITH target, log
MERGE (swellDate:TimeGraph {date:date($swellDate)})
SET swellDate:SwellDate

WITH swellDate, log, target
MERGE (target)<-[:HAS_TARGET]-(log)

WITH log
MATCH (log)<-[:HAS_HISTORY|:CURRENT_HISTORY]-(bacenta:Bacenta)

WITH DISTINCT bacenta
CREATE (log:HistoryLog)
SET
log.id =  apoc.create.uuid(),
log.timeStamp = datetime(),
log.historyRecord = bacenta.name + ' bacenta target has been updated'

MERGE (date:TimeGraph {date: date()})
WITH bacenta, log, date
MERGE (bacenta)-[:HAS_HISTORY]->(log)
MERGE (log)-[:RECORDED_ON]->(date)


RETURN "success" as result
`
export const aggregateTargetsCypher = `
MATCH (bacenta:Bacenta)

WITH bacenta as lowerChurch
MATCH (lowerChurch)<-[:HAS]-(higherChurch:Governorship)
MATCH (lowerChurch)-[:CURRENT_HISTORY]->(lowerLog:ServiceLog)-[:HAS_TARGET]->(target:Target)
WHERE target.date = date($swellDate)

WITH DISTINCT target as lowerTarget, higherChurch
WITH sum(lowerTarget.target) as aggregate, higherChurch, collect(lowerTarget.id) as componentTargetIds
MERGE (target:Target {code: higherChurch.id + '-' + toString(date($swellDate))})
ON CREATE
SET target.target = aggregate,
target.id = apoc.create.uuid(),
target.date = date($swellDate),
target.componentTargetIds = componentTargetIds
ON MATCH 
SET target.target = aggregate,
target.componentTargetIds = componentTargetIds

WITH DISTINCT target, higherChurch
MATCH (higherChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)
MERGE (log)-[:HAS_TARGET]->(target)

WITH higherChurch as lowerChurch
MATCH (lowerChurch)<-[:HAS]-(higherChurch:Council)
MATCH (lowerChurch)-[:CURRENT_HISTORY]->(lowerLog:ServiceLog)-[:HAS_TARGET]->(target:Target)
WHERE target.date = date($swellDate)

WITH DISTINCT target as lowerTarget, higherChurch
WITH sum(lowerTarget.target) as aggregate, higherChurch, collect(lowerTarget.id) as componentTargetIds
MERGE (target:Target {code: higherChurch.id + '-' + toString(date($swellDate))})
ON CREATE
SET target.target = aggregate,
target.id = apoc.create.uuid(),
target.date = date($swellDate),
target.componentTargetIds = componentTargetIds
ON MATCH 
SET target.target = aggregate,
target.componentTargetIds = componentTargetIds

WITH DISTINCT target, higherChurch
MATCH (higherChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)
MERGE (log)-[:HAS_TARGET]->(target)

WITH higherChurch as lowerChurch
MATCH (lowerChurch)<-[:HAS]-(higherChurch:Stream)
MATCH (lowerChurch)-[:CURRENT_HISTORY]->(lowerLog:ServiceLog)-[:HAS_TARGET]->(target:Target)
WHERE target.date = date($swellDate)

WITH DISTINCT target as lowerTarget, higherChurch
WITH sum(lowerTarget.target) as aggregate, higherChurch, collect(lowerTarget.id) as componentTargetIds
MERGE (target:Target {code: higherChurch.id + '-' + toString(date($swellDate))})
ON CREATE
SET target.target = aggregate,
target.id = apoc.create.uuid(),
target.date = date($swellDate),
target.componentTargetIds = componentTargetIds
ON MATCH 
SET target.target = aggregate,
target.componentTargetIds = componentTargetIds

WITH DISTINCT target, higherChurch
MATCH (higherChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)
MERGE (log)-[:HAS_TARGET]->(target)

WITH higherChurch as lowerChurch
MATCH (lowerChurch)<-[:HAS]-(higherChurch:Campus)
MATCH (lowerChurch)-[:CURRENT_HISTORY]->(lowerLog:ServiceLog)-[:HAS_TARGET]->(target:Target)
WHERE target.date = date($swellDate)

WITH DISTINCT target as lowerTarget, higherChurch
WITH sum(lowerTarget.target) as aggregate, higherChurch, collect(lowerTarget.id) as componentTargetIds
MERGE (target:Target {code: higherChurch.id + '-' + toString(date($swellDate))})
ON CREATE
SET target.target = aggregate,
target.id = apoc.create.uuid(),
target.date = date($swellDate),
target.componentTargetIds = componentTargetIds
ON MATCH 
SET target.target = aggregate,
target.componentTargetIds = componentTargetIds

WITH DISTINCT target, higherChurch
MATCH (higherChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)
MERGE (log)-[:HAS_TARGET]->(target)

WITH higherChurch as lowerChurch
MATCH (lowerChurch)<-[:HAS]-(higherChurch:Oversight)
MATCH (lowerChurch)-[:CURRENT_HISTORY]->(lowerLog:ServiceLog)-[:HAS_TARGET]->(target:Target)
WHERE target.date = date($swellDate)

WITH DISTINCT target as lowerTarget, higherChurch
WITH sum(lowerTarget.target) as aggregate, higherChurch, collect(lowerTarget.id) as componentTargetIds
MERGE (target:Target {code: higherChurch.id + '-' + toString(date($swellDate))})
ON CREATE
SET target.target = aggregate,
target.id = apoc.create.uuid(),
target.date = date($swellDate),
target.componentTargetIds = componentTargetIds
ON MATCH 
SET target.target = aggregate,
target.componentTargetIds = componentTargetIds

WITH DISTINCT target, higherChurch
MATCH (higherChurch)-[:CURRENT_HISTORY]->(log:ServiceLog)
MERGE (log)-[:HAS_TARGET]->(target)

RETURN target
`
