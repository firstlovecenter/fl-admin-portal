#!/usr/bin/env node
/**
 * SYN-60 Migration Script — Rekey legacy AggregateServiceRecord nodes
 *
 * Finds AggregateServiceRecord nodes whose id does not match the ADR-014
 * canonical format <church.id>-<week>-<year>, rewrites them to the canonical
 * key, deduplicates any (church, week, year) collisions by keeping the most
 * recently recomputed snapshot (Model-A semantics), and appends a HistoryLog
 * entry summarising the migration run.
 *
 * IMPORTANT: Run diagnose-service-log-duplication.js and fix SYN-59 first so
 * that this migration does not lock in inflated values for the current week.
 *
 * Usage:
 *   node migrate-aggregate-service-record-ids.js [--dry-run]
 *
 * Options:
 *   --dry-run   Print planned changes without writing anything (safe to run anytime)
 *
 * Per ADR-014 §9 this migration is OPTIONAL — the FE @cypher resolvers already
 * dedup by recomputedAt DESC NULLS LAST.  Run it for data hygiene or to enable
 * the strict uniqueness constraints in api/cypher/constraints.cypher.
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')
const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const DRY_RUN = process.argv.includes('--dry-run')

// Finds legacy-keyed AggregateServiceRecord nodes.
// A canonical id looks like "<uuid>-<week>-<year>" where uuid is a standard v4
// UUID (8-4-4-4-12 hex). Legacy ids look like "<week>-<year>-<uuid>" or just
// the log id directly.
const auditQuery = `
MATCH (log:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(agg:AggregateServiceRecord)
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
       agg.income AS income,
       agg.attendance AS attendance,
       coalesce(agg.recomputedAt, null) AS recomputedAt
ORDER BY agg.year DESC, agg.week DESC, church.id
`

// For a given canonical id, merge (or create) the canonical node with the
// best-available values (highest recomputedAt wins), then detach-delete the
// legacy node.  Idempotent: if the canonical node already exists with a newer
// recomputedAt it is not downgraded.
const migrateOneQuery = `
MATCH (legacyAgg:AggregateServiceRecord {id: $legacyId})
MATCH (log:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(legacyAgg)
MATCH (church {id: $churchId})-[:HAS_HISTORY]->(log)

MERGE (canonical:AggregateServiceRecord {id: $canonicalId})
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
      canonical.income              = legacyAgg.income,
      canonical.dollarIncome        = legacyAgg.dollarIncome,
      canonical.componentServiceIds = legacyAgg.componentServiceIds,
      canonical.numberOfServices    = legacyAgg.numberOfServices,
      canonical.recomputedAt        = legacyAgg.recomputedAt,
      canonical.month               = legacyAgg.month
  RETURN count(*) AS updated
}

MERGE (log)-[:HAS_SERVICE_AGGREGATE]->(canonical)
DETACH DELETE legacyAgg

RETURN canonical.id AS canonicalId
`

// Append a single summary HistoryLog linked to the Denomination root so it is
// discoverable via any (denomination)-[:HAS_HISTORY] traversal.
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
  console.log(`\nSYN-60 AggregateServiceRecord Key Migration`)
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

    // Step 1: Audit
    console.log('=== Audit: Legacy-keyed AggregateServiceRecord nodes ===')
    const auditResult = await session.executeRead((tx) => tx.run(auditQuery))

    if (auditResult.records.length === 0) {
      console.log(
        '✅ No legacy-keyed AggregateServiceRecord nodes found. Nothing to migrate.\n'
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
          `    income=${r.get('income')} attendance=${r.get('attendance')}`
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

    // Step 2: Migrate each node sequentially (writes are order-dependent — one
    // legacy node may be a duplicate of another's canonical target)
    console.log('=== Migrating legacy nodes ===')
    const migrations = auditResult.records.map((record) => ({
      legacyId: record.get('legacyId'),
      canonicalId: record.get('canonicalId'),
      churchId: record.get('churchId'),
      week: record.get('week'),
      year: record.get('year'),
    }))

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

    // Step 3: Append HistoryLog
    const historyRecord =
      `SYN-60 migration: rekeyed ${migratedCount} AggregateServiceRecord node(s) ` +
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
