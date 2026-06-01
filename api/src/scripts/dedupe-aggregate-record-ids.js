#!/usr/bin/env node
/**
 * SYN-149 — Dedupe duplicate AggregateServiceRecord / AggregateBussingRecord ids
 *
 * Collapses every duplicate `id` group down to a single row so the
 * `uniqueAggregateServiceRecord` / `uniqueAggregateBussingRecord` constraints
 * (already live in dev as constraint_3b9ae1fb / constraint_8a9bc714) can be
 * applied to prod.
 *
 * Why this exists alongside migrate-aggregate-*-record-ids.js:
 *   Those scripts REKEY legacy `<week>-<year>-<logId>` ids to the ADR-014
 *   canonical `<church.id>-<week>-<year>` shape and dedup collisions by
 *   `recomputedAt DESC`. Every legacy duplicate row has `recomputedAt = null`,
 *   so that tiebreak is a no-op and the wrong (stale) row can win. They also
 *   only reach rows joined through a recognised church level, leaving a
 *   coverage gap. This script is narrower and complete: it resolves the
 *   duplicates that block the constraint, using a rule correct for every
 *   group, and it does NOT rekey (all ~91k connected aggregate nodes are
 *   legacy-keyed today; rekeying is a separate, larger concern and the FE
 *   @cypher resolvers already dedup by (week, year)).
 *
 * Winner rule (verified against prod 2026-06-01):
 *   Keep the row with the largest component set; break ties deterministically
 *   by elementId (a LEXICAL string compare, not numeric — it only fires when
 *   component sizes are equal, where any deterministic pick is correct).
 *   Empirically on prod:
 *     - AggregateServiceRecord: 185 groups (370 rows). 16 are value-identical;
 *       169 are divergent and in every one the larger row's componentServiceIds
 *       is a strict superset of the smaller (the loser is a stale partial run).
 *     - AggregateBussingRecord: 202 groups (404 rows). ALL 202 have every value
 *       field identical across rows; they differ only in componentBussingIds
 *       membership (provenance), which affects no aggregated/displayed number.
 *   Every row in a group hangs off the single ServiceLog whose id is embedded
 *   in the shared aggregate id (verified 370/370 service, 404/404 bussing), so
 *   deleting the loser can never strand a different log's aggregate.
 *
 * SAFETY GUARD: a loser is deleted only when it carries no information the
 * winner lacks — i.e. its value fields equal the winner's OR its component set
 * is a subset of the winner's. (Subset is tested with a list comprehension, not
 * apoc.coll.containsAll, which returns FALSE for two empty lists.) A loser that
 * has BOTH different values AND a non-subset component set is a genuine
 * conflict: it is left intact, the post-run probe reports a remaining duplicate
 * group, and the run aborts BEFORE any constraint is applied. On the prod data
 * above there are zero such conflicts (185/185 and 202/202 are safe).
 *
 * Idempotent: after a successful run no id group has > 1 row, so a re-run is a
 * no-op. `--dry-run` prints the planned deletions and writes nothing.
 *
 * Usage:
 *   node dedupe-aggregate-record-ids.js [--dry-run]
 *
 * Connects to whichever Neo4j the loaded secrets point at — confirm you are
 * targeting the intended database before running live.
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')
const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const DRY_RUN = process.argv.includes('--dry-run')

const TARGETS = [
  {
    label: 'AggregateServiceRecord',
    componentField: 'componentServiceIds',
    valueFields: ['attendance', 'income', 'dollarIncome'],
  },
  {
    label: 'AggregateBussingRecord',
    componentField: 'componentBussingIds',
    valueFields: [
      'attendance',
      'income',
      'numberOfUrvans',
      'numberOfCars',
      'numberOfSprinters',
      'personalContribution',
      'bussingCost',
      'bussingTopUp',
      'leaderDeclaration',
    ],
  },
]

/*
 * ADR-012 exception: the only values interpolated into the Cypher below are
 * label names and property keys from the hardcoded TARGETS constant — never
 * external/user/DB input. Neo4j cannot bind labels or property keys as $params,
 * so $param binding is not an option here. No injection surface exists.
 */
/* eslint-disable fl-cypher/no-interpolated-cypher */

// `winner` = largest component set per id group, tiebreak max(elementId).
const winnerSelection = (label, componentField) => `
MATCH (a:\`${label}\`)
WITH a.id AS id, collect(a) AS nodes, count(*) AS c
WHERE c > 1
WITH id, nodes,
  reduce(best = head(nodes), n IN tail(nodes) |
    CASE
      WHEN size(coalesce(n.\`${componentField}\`, [])) > size(coalesce(best.\`${componentField}\`, [])) THEN n
      WHEN size(coalesce(n.\`${componentField}\`, [])) = size(coalesce(best.\`${componentField}\`, []))
           AND elementId(n) > elementId(best) THEN n
      ELSE best
    END
  ) AS winner
`

// `true` when loser `n` carries no info the `winner` lacks (value-equal OR
// component-subset). Same expression in planQuery and deleteQuery.
const safeToDelete = (componentField, valueFields) => {
  const valueEqual = valueFields
    .map((f) => `coalesce(n.\`${f}\`, -1) = coalesce(winner.\`${f}\`, -1)`)
    .join(' AND ')
  const subset = `size([x IN coalesce(n.\`${componentField}\`, []) WHERE NOT x IN coalesce(winner.\`${componentField}\`, [])]) = 0`
  return `((${valueEqual}) OR (${subset}))`
}

const planQuery = (label, componentField, valueFields) => `
${winnerSelection(label, componentField)}
UNWIND nodes AS n
WITH id, winner, n
WHERE elementId(n) <> elementId(winner)
RETURN id AS groupId,
       n.attendance AS loserAttendance, n.income AS loserIncome,
       size(coalesce(n.\`${componentField}\`, [])) AS loserComponents,
       winner.attendance AS winnerAttendance, winner.income AS winnerIncome,
       size(coalesce(winner.\`${componentField}\`, [])) AS winnerComponents,
       ${safeToDelete(componentField, valueFields)} AS safe
ORDER BY id
`

const deleteQuery = (label, componentField, valueFields) => `
${winnerSelection(label, componentField)}
UNWIND nodes AS n
WITH winner, n
WHERE elementId(n) <> elementId(winner)
  AND ${safeToDelete(componentField, valueFields)}
DETACH DELETE n
RETURN count(*) AS deleted
`

const probeQuery = (label) => `
MATCH (a:\`${label}\`)
WITH a.id AS id, count(*) AS c
WHERE c > 1
RETURN count(*) AS remainingDuplicateGroups
`

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
/* eslint-enable fl-cypher/no-interpolated-cypher */

const toNum = (v) => (typeof v?.toNumber === 'function' ? v.toNumber() : v)

async function main() {
  console.log('\nSYN-149 Aggregate id dedupe')
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
  let totalDeleted = 0

  try {
    session = driver.session()
    console.log(`Connected to Neo4j at ${uri}\n`)

    // eslint-disable-next-line no-restricted-syntax
    for (const { label, componentField, valueFields } of TARGETS) {
      console.log(`=== ${label} ===`)
      // eslint-disable-next-line no-await-in-loop
      const plan = await session.executeRead((tx) =>
        tx.run(planQuery(label, componentField, valueFields))
      )

      if (plan.records.length === 0) {
        console.log('  No duplicate id groups. Nothing to do.\n')
        // eslint-disable-next-line no-continue
        continue
      }

      const conflicts = plan.records.filter((r) => r.get('safe') === false)
      console.log(`  ${plan.records.length} loser row(s) to remove:`)
      plan.records.slice(0, 10).forEach((r) => {
        console.log(
          `    ${r.get('groupId')} | drop att=${r.get('loserAttendance')} ` +
            `income=${r.get('loserIncome')} comps=${r.get(
              'loserComponents'
            )} ` +
            `→ keep att=${r.get('winnerAttendance')} ` +
            `income=${r.get('winnerIncome')} comps=${r.get(
              'winnerComponents'
            )}${r.get('safe') === false ? '  ⚠️ CONFLICT — will be kept' : ''}`
        )
      })
      if (plan.records.length > 10) {
        console.log(`    ... and ${plan.records.length - 10} more`)
      }
      if (conflicts.length > 0) {
        console.log(
          `  ⚠️  ${conflicts.length} group(s) have a loser with different ` +
            'values AND a non-subset component set. These will be LEFT INTACT ' +
            'and the run will abort before constraints. Investigate manually.'
        )
      }

      if (DRY_RUN) {
        console.log('')
        // eslint-disable-next-line no-continue
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      const del = await session.executeWrite((tx) =>
        tx.run(deleteQuery(label, componentField, valueFields))
      )
      const deletedNum = toNum(del.records[0]?.get('deleted')) ?? 0
      totalDeleted += deletedNum

      // Audit each destructive write per label, so a mid-run abort still
      // leaves a trail of exactly what was removed.
      // eslint-disable-next-line no-await-in-loop
      const hist = await session.executeWrite((tx) =>
        tx.run(writeHistoryLogQuery, {
          historyRecord:
            `SYN-149 dedupe: removed ${deletedNum} stale duplicate ${label} ` +
            `row(s), keeping the largest component set per id group, to enable ` +
            `the uniqueness constraint per ADR-014. Run at ${new Date().toISOString()}.`,
        })
      )
      console.log(
        `  Deleted ${deletedNum} loser row(s). HistoryLog: ${hist.records[0]?.get(
          'historyLogId'
        )}`
      )

      // eslint-disable-next-line no-await-in-loop
      const probe = await session.executeRead((tx) => tx.run(probeQuery(label)))
      const remainingNum = toNum(
        probe.records[0]?.get('remainingDuplicateGroups')
      )
      console.log(`  Remaining duplicate groups: ${remainingNum}\n`)
      if (remainingNum !== 0) {
        throw new Error(
          `${label} still has ${remainingNum} duplicate group(s) after dedupe ` +
            '(a conflict loser was kept — see ⚠️ above). Aborting before ' +
            'constraints are applied.'
        )
      }
    }

    if (DRY_RUN) {
      console.log('Dry run complete. Re-run without --dry-run to apply.')
      return
    }

    console.log(`Dedupe complete. Total rows deleted: ${totalDeleted}`)
    console.log(
      'Next: apply uniqueAggregateServiceRecord + uniqueAggregateBussingRecord ' +
        'constraints (api/cypher/constraints.cypher).'
    )
  } catch (error) {
    console.error('\nFatal error:', error)
    process.exit(1)
  } finally {
    if (session) await session.close()
    await driver.close()
  }
}

main()
