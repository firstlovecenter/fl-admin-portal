// OPTIONAL one-shot migration. ADR-014 made this unnecessary: the FE @cypher
// resolvers in `aggregates.graphql` now dedup by (week, year) using
// `recomputedAt DESC NULLS LAST`, so old-keyed aggregate nodes that lack a
// `recomputedAt` timestamp lose to the freshly written ones. The duplicate
// graph bug is fixed without touching legacy data. Run this script ONLY if
// you also want to:
//
//   - reclaim the disk space taken by the orphaned old-format nodes, OR
//   - apply the strict uniqueness constraints in
//     `constraints.cypher` / `bacenta-aggregation-constraints.js` (the
//     constraint creation will fail until duplicate ids are gone).
//
// If you skip this migration, the new uniqueness constraints must also be
// skipped — they are NOT load-bearing for correctness, only a defence-in-
// depth signal.
//
// Run order if you DO run it (matters — constraints fail on a database with
// duplicates):
//   1. Deploy the new code.
//   2. Run this migration on dev, then prod.
//   3. (Optional) apply the new uniqueness constraints.
//   4. Trigger both aggregator lambdas (or run the CLI scripts) to regenerate
//      the current-week aggregates with the new keys.
//
// Run via Neo4j Browser, cypher-shell, or the neo4j MCP server.
//
// Notes:
//   - DETACH DELETE removes all incoming/outgoing relationships
//     (HAS_SERVICE_AGGREGATE, HAS_BUSSING_AGGREGATE) before deleting the node.
//   - apoc.periodic.iterate keeps transaction sizes bounded on the prod
//     dataset.

CALL apoc.periodic.iterate(
  'MATCH (a:AggregateServiceRecord) RETURN a',
  'DETACH DELETE a',
  {batchSize: 1000, parallel: false}
);

CALL apoc.periodic.iterate(
  'MATCH (a:AggregateBussingRecord) RETURN a',
  'DETACH DELETE a',
  {batchSize: 1000, parallel: false}
);

CALL apoc.periodic.iterate(
  'MATCH (a:AggregateRehearsalRecord) RETURN a',
  'DETACH DELETE a',
  {batchSize: 1000, parallel: false}
);

CALL apoc.periodic.iterate(
  'MATCH (a:AggregateMinistryMeetingRecord) RETURN a',
  'DETACH DELETE a',
  {batchSize: 1000, parallel: false}
);

CALL apoc.periodic.iterate(
  'MATCH (a:AggregateStageAttendanceRecord) RETURN a',
  'DETACH DELETE a',
  {batchSize: 1000, parallel: false}
);
