// Reads the current week's WeeklyTip for the requested church. The resolver
// verifies the caller has $churchId in their allowedChurchIds before this
// query runs, so the Cypher only checks (year, week).
//
// Keying convention mirrors ADR-014 aggregate nodes: `<churchId>-<year>-<week>`.
// We filter on (year, week) rather than reconstructing the id so the resolver
// stays robust if the id format ever changes.
//
// The optional matches on scripture / quotedPassage / recommendedBook return
// `null` when the Lambda chose not to attach that edge — the SDL declares each
// of these as nullable singletons so the FE renders the available sections.
const READ_WEEKLY_TIP_FOR_CHURCH_CYPHER = `
MATCH (church {id: $churchId})-[:HAS_WEEKLY_TIP]->(tip:WeeklyTip)
WHERE tip.year = $year AND tip.week = $week
WITH tip
OPTIONAL MATCH (tip)-[:CITES_SCRIPTURE]->(scripture:Verse)
OPTIONAL MATCH (tip)-[:QUOTES_PASSAGE]->(quotedPassage:BookPassage)
OPTIONAL MATCH (tip)-[:RECOMMENDS_BOOK]->(recommendedBook:Book)
RETURN tip {
  .id,
  .week,
  .year,
  .body,
  generatedAt: tip.generatedAt,
  scripture: scripture { .id, .book, .chapter, .verse, .translation, .text },
  quotedPassage: quotedPassage { .id, .text, .citationLabel, .order },
  recommendedBook: recommendedBook { .id, .title, .author, .subtitle, .publishedYear }
} AS tip
LIMIT 1
`

export default READ_WEEKLY_TIP_FOR_CHURCH_CYPHER
