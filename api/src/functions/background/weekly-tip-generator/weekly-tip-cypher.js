/* eslint-disable no-multi-str */

/**
 * Cypher for the weekly-tip-generator Lambda.
 *
 * All parameters are passed via `$param` bindings — never string-interpolated
 * (ADR-012).
 */

// All churches that have at least one leader. Each church appears AT MOST
// ONCE — a church with two co-leaders produces one tip read by both. A leader
// of multiple churches sees a distinct tip per church via the FE scope picker.
// `$onlyChurchId` is optional — pass `null` to process every church with a
// leader, or a specific church id to limit to one for testing.
const LIST_CHURCHES_CYPHER = `
MATCH (church)
WHERE any(l IN labels(church) WHERE l IN [
  'Bacenta','Governorship','Council','Stream','Campus','Oversight','Denomination'
])
  AND ($onlyChurchId IS NULL OR church.id = $onlyChurchId)
  AND EXISTS { MATCH (:Member)-[:LEADS]->(church) }
RETURN
  church.id AS churchId,
  church.name AS churchName,
  [l IN labels(church) WHERE l IN [
    'Bacenta','Governorship','Council','Stream','Campus','Oversight','Denomination'
  ]][0] AS churchLevel
ORDER BY churchId
`

// Last 12 weeks of service data for a Bacenta. Mirrors the @cypher block
// in api/src/schema/aggregates.graphql so the trend brief matches what
// leaders see in their dashboard.
const BACENTA_SERVICE_TREND_CYPHER = `
MATCH (b:Bacenta {id: $churchId})-[:HAS_HISTORY]->(:ServiceLog)
  -[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(t:TimeGraph)
WHERE NOT record:NoService
  AND t.date >= date() - duration({weeks: 12})
WITH t.date.year AS year, t.date.week AS week, record
WITH year, week,
     toInteger(sum(coalesce(record.attendance, 0))) AS attendance,
     round(toFloat(sum(coalesce(record.income, 0))), 2) AS income,
     count(DISTINCT record) AS numberOfServices
RETURN collect({
  year: year, week: week, attendance: attendance, income: income, numberOfServices: numberOfServices
}) AS trend
`

const BACENTA_BUSSING_TREND_CYPHER = `
MATCH (b:Bacenta {id: $churchId})-[:HAS_HISTORY]->(:ServiceLog)
  -[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(t:TimeGraph)
WHERE t.date >= date() - duration({weeks: 12})
WITH t.date.year AS year, t.date.week AS week, record
WITH year, week,
     toInteger(sum(coalesce(record.attendance, 0))) AS attendance,
     toInteger(sum(coalesce(record.leaderDeclaration, 0))) AS leaderDeclaration,
     toInteger(sum(coalesce(record.numberOfSprinters, 0))) AS sprinters,
     toInteger(sum(coalesce(record.numberOfUrvans, 0))) AS urvans,
     toInteger(sum(coalesce(record.numberOfCars, 0))) AS cars
RETURN collect({
  year: year, week: week, attendance: attendance, leaderDeclaration: leaderDeclaration,
  sprinters: sprinters, urvans: urvans, cars: cars
}) AS trend
`

// Higher-level (Governorship+) trend uses stored aggregates per ADR-014.
// The (year, week) predicate is split into two index-friendly comparisons so
// the planner can use the composite (week, year) range index — the previous
// `year * 100 + week >= $startKey` form had to filter post-scan because the
// arithmetic predicate cannot push into an index seek.
const HIGHER_LEVEL_SERVICE_TREND_CYPHER = `
MATCH (church {id: $churchId})-[:HAS_SERVICE_AGGREGATE]->(agg:AggregateServiceRecord)
WHERE agg.year > $startYear OR (agg.year = $startYear AND agg.week >= $startWeek)
RETURN collect(agg {.year, .week, .attendance, .income, .numberOfServices}) AS trend
`

const HIGHER_LEVEL_BUSSING_TREND_CYPHER = `
MATCH (church {id: $churchId})-[:HAS_BUSSING_AGGREGATE]->(agg:AggregateBussingRecord)
WHERE agg.year > $startYear OR (agg.year = $startYear AND agg.week >= $startWeek)
RETURN collect(agg {
  .year, .week, .attendance, .leaderDeclaration,
  numberOfSprinters: agg.numberOfSprinters,
  numberOfUrvans: agg.numberOfUrvans,
  numberOfCars: agg.numberOfCars
}) AS trend
`

// Vector retrieval — the cosine similarity score is returned so we can drop
// low-confidence neighbours before passing them to Claude.
const RETRIEVE_PASSAGES_CYPHER = `
CALL db.index.vector.queryNodes('bookPassageEmbedding', $k, $vec)
YIELD node, score
WHERE score > 0.30
MATCH (book:Book)-[:HAS_CHAPTER]->(:BookChapter)-[:HAS_PASSAGE]->(node)
RETURN
  node.id AS id,
  node.text AS text,
  node.citationLabel AS citationLabel,
  book.id AS bookId,
  book.title AS bookTitle,
  book.author AS bookAuthor,
  score
ORDER BY score DESC
`

const RETRIEVE_VERSES_CYPHER = `
CALL db.index.vector.queryNodes('verseEmbedding', $k, $vec)
YIELD node, score
WHERE score > 0.30
RETURN
  node.id AS id,
  node.book AS book,
  node.chapter AS chapter,
  node.verse AS verse,
  node.translation AS translation,
  node.text AS text,
  score
ORDER BY score DESC
`

// Idempotent write — MERGE on the deterministic tip id (`<churchId>-<year>-<week>`)
// and overwrite content + edges via SET / MERGE. Re-running the Lambda for
// the same week is safe. Inbound HAS_WEEKLY_TIP from the Church node is the
// resolver's primary lookup edge.
//
// IMPORTANT: the edge MERGEs use MATCH (not MERGE) on the target Verse /
// BookPassage / Book — they MUST already exist from ingest. A stale id from
// the Lambda would otherwise create a stub node missing every required SDL
// field, which crashes future reads via @neo4j/graphql. The FOREACH guard
// drops the edge if the lookup misses.
const UPSERT_WEEKLY_TIP_CYPHER = `
MATCH (church {id: $churchId})
WHERE any(l IN labels(church) WHERE l IN [
  'Bacenta','Governorship','Council','Stream','Campus','Oversight','Denomination'
])
MERGE (tip:WeeklyTip {id: $tipId})
SET tip.week = $week,
    tip.year = $year,
    tip.body = $body,
    tip.generatedAt = datetime(),
    tip.model = $model,
    tip.inputHash = $inputHash
MERGE (church)-[:HAS_WEEKLY_TIP]->(tip)

WITH tip
OPTIONAL MATCH (tip)-[oldS:CITES_SCRIPTURE]->()
DELETE oldS
WITH tip
OPTIONAL MATCH (tip)-[oldQ:QUOTES_PASSAGE]->()
DELETE oldQ
WITH tip
OPTIONAL MATCH (tip)-[oldR:RECOMMENDS_BOOK]->()
DELETE oldR

WITH tip
OPTIONAL MATCH (v:Verse {id: $verseId})
FOREACH (_ IN CASE WHEN v IS NULL THEN [] ELSE [1] END |
  MERGE (tip)-[:CITES_SCRIPTURE]->(v)
)
WITH tip
OPTIONAL MATCH (p:BookPassage {id: $passageId})
FOREACH (_ IN CASE WHEN p IS NULL THEN [] ELSE [1] END |
  MERGE (tip)-[:QUOTES_PASSAGE]->(p)
)
WITH tip
OPTIONAL MATCH (b:Book {id: $bookId})
FOREACH (_ IN CASE WHEN b IS NULL THEN [] ELSE [1] END |
  MERGE (tip)-[:RECOMMENDS_BOOK]->(b)
)
RETURN tip.id AS tipId
`

module.exports = {
  LIST_CHURCHES_CYPHER,
  BACENTA_SERVICE_TREND_CYPHER,
  BACENTA_BUSSING_TREND_CYPHER,
  HIGHER_LEVEL_SERVICE_TREND_CYPHER,
  HIGHER_LEVEL_BUSSING_TREND_CYPHER,
  RETRIEVE_PASSAGES_CYPHER,
  RETRIEVE_VERSES_CYPHER,
  UPSERT_WEEKLY_TIP_CYPHER,
}
