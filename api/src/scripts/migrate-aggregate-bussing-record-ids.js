#!/usr/bin/env node
/**
 * SYN-149 Migration Script — Rekey legacy AggregateBussingRecord nodes
 *
 * Mirror of migrate-aggregate-service-record-ids.js but for the bussing
 * aggregate tree. Finds AggregateBussingRecord nodes whose id does not match
 * the ADR-014 canonical format <church.id>-<week>-<year>, rewrites them to
 * the canonical key, deduplicates any (church, week, year) collisions by
 * keeping the most recently recomputed snapshot (Model-A semantics), and
 * appends a HistoryLog entry summarising the migration run.
 *
 * Prod state captured on 2026-05-18 against neo4j.firstlovecenter.com:
 *   - 202 duplicate id groups (404 rows) on AggregateBussingRecord
 *   - 195 groups have identical numbers, 7 groups have divergent numbers
 *   - 274 of the 404 rows are reachable via
 *     (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(agg)
 *     where church is one of the recognised hierarchy levels
 *   - The remaining 130 rows attach via Member/User/Sheep or via
 *     Constituency / Closed* labels; they need separate handling.
 *
 * Usage:
 *   node migrate-aggregate-bussing-record-ids.js [--dry-run]
 *
 * Options:
 *   --dry-run   Print planned changes without writing anything
 *
 * Per ADR-014 §9 this migration is OPTIONAL for live read paths (the FE
 * @cypher resolvers already dedup by recomputedAt DESC NULLS LAST). Run it
 * for data hygiene or to enable the strict uniqueness constraint
 * `uniqueAggregateBussingRecord` in api/cypher/constraints.cypher.
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')
const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const DRY_RUN = process.argv.includes('--dry-run')

// Legacy ids look like "<week>-<year>-<uuid>". Canonical is
// "<church.id>-<week>-<year>". The live aggregator (bacenta-cypher.js) links
// bussing aggregates from a :ServiceLog via :HAS_BUSSING_AGGREGATE, so the
// traversal mirrors the live write path.
const auditQuery = `
MATCH (log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(agg:AggregateBussingRecord)
MATCH (church)-[:HAS_HISTORY]->(log)
WHERE (church:Bacenta OR church:Governorship OR church:Council OR church:Stream
       OR church:Campus OR church:Oversight OR church:Denomination
       OR church:Hub OR church:HubCouncil OR church:Ministry OR church:CreativeArts)
  AND agg.id <> church.id + '-' + toString(agg.week) + '-' + toString(agg.year)
UNWIND labels(church) AS lbl
WITH agg, church, lbl
WHERE lbl IN ['Bacenta','Governorship','Council','Stream','Campus',
              'Oversight','Denomination','Hub','HubCouncil','Ministry','CreativeArts']
RETURN agg.id AS legacyId,
       church.id + '-' + toString(agg.week) + '-' + toString(agg.year) AS canonicalId,
       church.id AS churchId,
       church.name AS churchName,
       lbl AS churchLevel,
       agg.week AS week,
       agg.year AS year,
       agg.attendance AS attendance,
       agg.leaderDeclaration AS leaderDeclaration,
       agg.bussingTopUp AS bussingTopUp,
       coalesce(agg.recomputedAt, null) AS recomputedAt
ORDER BY agg.year DESC, agg.week DESC, church.id
`

// For a given canonical id, merge (or create) the canonical node with the
// best-available values (highest recomputedAt wins, with null treated as
// epoch zero), then detach-delete the legacy node. Idempotent — if the
// canonical node already exists with a newer recomputedAt it is not
// downgraded.
const migrateOneQuery = `
MATCH (legacyAgg:AggregateBussingRecord {id: $legacyId})
MATCH (log:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(legacyAgg)
MATCH (church {id: $churchId})-[:HAS_HISTORY]->(log)

MERGE (canonical:AggregateBussingRecord {id: $canonicalId})
ON CREATE SET
  canonical.week = $week,
  canonical.year = $year,
  canonical.month = legacyAgg.month

WITH legacyAgg, canonical, log
CALL {
  WITH legacyAgg, canonical
  WITH legacyAgg, canonical
  WHERE coalesce(canonical.recomputedAt, datetime({epochSeconds: 0}))
      <= coalesce(legacyAgg.recomputedAt, datetime({epochSeconds: 0}))
  SET canonical.attendance          = legacyAgg.attendance,
      canonical.leaderDeclaration   = legacyAgg.leaderDeclaration,
      canonical.bussingTopUp        = legacyAgg.bussingTopUp,
      canonical.componentBussingIds = legacyAgg.componentBussingIds,
      canonical.numberOfSprinters   = legacyAgg.numberOfSprinters,
      canonical.numberOfUrvans      = legacyAgg.numberOfUrvans,
      canonical.numberOfCars        = legacyAgg.numberOfCars,
      canonical.bussingCost         = legacyAgg.bussingCost,
      canonical.personalContribution = legacyAgg.personalContribution,
      canonical.recomputedAt        = legacyAgg.recomputedAt,
      canonical.month               = legacyAgg.month
  RETURN count(*) AS updated
}

MERGE (log)-[:HAS_BUSSING_AGGREGATE]->(canonical)
DETACH DELETE legacyAgg

RETURN canonical.id AS canonicalId
`

// Append a single summary HistoryLog linked to the Denomination root so it
// is discoverable via any (denomination)-[:HAS_HISTORY] traversal.
const writeHistoryLogQuery = `
MATCH (denomination:Denomination)
CREATE (h:HistoryLog)
SET h.id = apoc.create.uuid(),
    h.timeStamp = datetime(),
    h.historyRecord = $historyRecord
MERGE (date:TimeGraph {date: date()})
MERGE (denomination)-[:HAS_HISTORY]->(h)
MERGE (h)-[:RECORDED_ON]->(date)
RETURN h.id AS historyLogId
`

async function main() {
  console.log(`\nSYN-149 AggregateBussingRecord Key Migration`)
  console.log(DRY_RUN ? '[DRY RUN — no writes will occur]\n' : '[LIVE RUN]\n')

  const SECRETS = await loadSecrets()
  const uri =
    SECRETS.NEO4J_ENCRYPTED === 'true'
      ? SECRETS.NEO4J_URI?.replace('bolt://', 'neo4j+s://')
      : SECRETS.NEO4J_URI || 'bolt://localhost:7687'

  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    )
  )

  let session
  let migratedCount = 0
  let errorCount = 0

  try {
    session = driver.session()
    console.log(`Connected to Neo4j at ${uri}\n`)

    console.log('=== Audit: Legacy-keyed AggregateBussingRecord nodes ===')
    const auditResult = await session.executeRead((tx) => tx.run(auditQuery))

    if (auditResult.records.length === 0) {
      console.log(
        '✅ No legacy-keyed AggregateBussingRecord nodes found. Nothing to migrate.\n'
      )
      return
    }

    console.log(`Found ${auditResult.records.length} legacy node(s):\n`)
    const grouped = {}
    auditResult.records.forEach((r) => {
      const level = r.get('churchLevel')
      grouped[level] = (grouped[level] || 0) + 1
    })
    Object.entries(grouped).forEach(([level, count]) => {
      console.log(`  ${level}: ${count}`)
    })
    console.log()

    if (DRY_RUN) {
      console.log('=== Planned changes (dry run) ===')
      auditResult.records.slice(0, 20).forEach((r) => {
        console.log(
          `  [${r.get('churchLevel')}] "${r.get('churchName')}" ` +
            `week ${r.get('week')} ${r.get('year')}`
        )
        console.log(`    Legacy id:    ${r.get('legacyId')}`)
        console.log(`    Canonical id: ${r.get('canonicalId')}`)
        console.log(
          `    attendance=${r.get('attendance')} ` +
            `leaderDeclaration=${r.get('leaderDeclaration')} ` +
            `bussingTopUp=${r.get('bussingTopUp')}`
        )
      })
      if (auditResult.records.length > 20) {
        console.log(`  ... and ${auditResult.records.length - 20} more`)
      }
      console.log(
        '\nDry run complete. Re-run without --dry-run to apply changes.'
      )
      return
    }

    console.log('=== Migrating legacy nodes ===')
    // Dedupe by legacyId — a single legacy node may be reachable through
    // multiple (church, ServiceLog) paths after a leadership change, so the
    // audit can emit the same legacyId more than once. The first MATCH in
    // migrateOneQuery picks up every node with that id atomically, so we
    // only need to fire the query once per distinct legacy id.
    const seen = new Set()
    const migrations = []
    auditResult.records.forEach((record) => {
      const legacyId = record.get('legacyId')
      if (seen.has(legacyId)) return
      seen.add(legacyId)
      migrations.push({
        legacyId,
        canonicalId: record.get('canonicalId'),
        churchId: record.get('churchId'),
        week: record.get('week'),
        year: record.get('year'),
      })
    })
    console.log(
      `Deduplicated ${auditResult.records.length} audit emissions to ` +
        `${migrations.length} distinct legacy ids.\n`
    )

    // eslint-disable-next-line no-restricted-syntax
    for (const { legacyId, canonicalId, churchId, week, year } of migrations) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await session.executeWrite((tx) =>
          tx.run(migrateOneQuery, {
            legacyId,
            canonicalId,
            churchId,
            week: neo4j.int(
              typeof week.toNumber === 'function' ? week.toNumber() : week
            ),
            year: neo4j.int(
              typeof year.toNumber === 'function' ? year.toNumber() : year
            ),
          })
        )
        console.log(`  ✓ ${legacyId} → ${canonicalId}`)
        migratedCount += 1
      } catch (err) {
        console.error(`  ✗ Failed to migrate ${legacyId}: ${err.message}`)
        errorCount += 1
      }
    }

    const historyRecord =
      `SYN-149 migration: rekeyed ${migratedCount} AggregateBussingRecord node(s) ` +
      `to canonical <church.id>-<week>-<year> format per ADR-014. ` +
      `Errors: ${errorCount}. Run at ${new Date().toISOString()}.`

    const histResult = await session.executeWrite((tx) =>
      tx.run(writeHistoryLogQuery, { historyRecord })
    )
    const histLogId = histResult.records[0]?.get('historyLogId')
    console.log(`\nHistoryLog written: ${histLogId}`)

    console.log(
      `\nMigration complete. Migrated: ${migratedCount}, Errors: ${errorCount}`
    )
    if (errorCount > 0) {
      console.error('\n⚠️  Some nodes failed. Check the log above and re-run.')
      process.exit(1)
    }
  } catch (error) {
    console.error('\nFatal error:', error)
    process.exit(1)
  } finally {
    if (session) await session.close()
    await driver.close()
  }
}

main()
