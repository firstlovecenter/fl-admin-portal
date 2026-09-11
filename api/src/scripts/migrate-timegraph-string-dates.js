#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * SYN-219 Ops cleanup — normalise `:TimeGraph.date` values that are not native
 * Neo4j DATEs (in practice, STRINGs such as "2023-03-07").
 *
 * Background. Every write path in this repo creates TimeGraph nodes with
 * `MERGE (d:TimeGraph {date: date(...)})`, so `d.date` is a native DATE and
 * `d.date.week` / `d.date.year` work. A handful of legacy / imported nodes on
 * dev instead carried a STRING. Any query that reads the temporal accessors
 * off one of those nodes aborts the whole statement with
 *
 *     Neo.ClientError.Statement.TypeError:
 *     Type mismatch: expected a map but was String("2023-03-07")
 *
 * i.e. one bad node takes down an entire aggregation pass (the broad
 * `MATCH (d:TimeGraph) ... d.date.week` scans in aggregate-dev-history.js and
 * the weekly aggregators), not just the row it belongs to. This pass removes
 * the hazard at the source.
 *
 * Audit vs remediation. The audit deliberately reports EVERY node whose `date`
 * is not `DATE NOT NULL` — a LIST or an INTEGER epoch aborts `d.date.week`
 * exactly like a STRING does, so narrowing the audit to STRINGs would let the
 * script print a false all-clear. Remediation is narrower: only a STRING that
 * is a strict YYYY-MM-DD calendar day is repaired. Anything else is reported
 * as UNRESOLVED and the process exits non-zero, because the TypeError hazard
 * is still live and needs a human.
 *
 * What it does, per repairable node:
 *   - If a canonical DATE-typed TimeGraph already exists for the same calendar
 *     day, the legacy node is merged into it (apoc.refactor.mergeNodes with
 *     `properties: 'discard'`) — the canonical DATE value is kept, the legacy
 *     node's extra labels (e.g. :SwellDate) and ALL of its relationships,
 *     direction preserved, move onto the canonical node, and the duplicate is
 *     removed. This is the case the TimeGraph.date uniqueness constraint
 *     cannot prevent, because Neo4j treats STRING "2023-03-07" and
 *     DATE 2023-03-07 as different values.
 *   - If no canonical node exists, the property is cast in place
 *     (`SET t.date = date($isoDate)`), which preserves elementId and every
 *     relationship untouched.
 *
 * Safety:
 *   - Idempotent, and a failed run is safe to re-run: each row is its own
 *     auto-commit transaction, and a re-run re-derives its work list from the
 *     audit, so already-migrated nodes simply drop out.
 *   - Never invents a date. A string that is not a strict YYYY-MM-DD calendar
 *     day is REPORTED and SKIPPED — it is never passed to `date()` (which
 *     would abort the statement) and never guessed at.
 *   - Never deletes a node without first moving its relationships, and the
 *     merge asserts the post-merge degree against the two pre-merge degrees so
 *     a relationship collapsed by `mergeRels` is surfaced, not silent.
 *   - Counts only writes that actually matched. A write whose re-asserted type
 *     guard fires is reported as SKIPPED, never as migrated.
 *   - `--dry-run` performs no writes at all.
 *   - Refuses a production-looking NEO4J_URI unless `--allow-prod` is passed.
 *
 * Requires APOC (`apoc.refactor.mergeNodes`), as do the sibling scripts here.
 *
 * Usage (dev):
 *   NEO4J_URI=bolt+ssc://dev-neo4j.firstlovecenter.com:7687 \
 *   NEO4J_USER=neo4j NEO4J_PASSWORD=*** \
 *   node api/src/scripts/migrate-timegraph-string-dates.js --dry-run
 *
 * Options:
 *   --dry-run          Report the plan and exit without writing.
 *   --allow-prod       Permit a production-looking NEO4J_URI.
 *   --print-limit N    Cap the rows PRINTED in the report (default 100). This
 *                      does not batch the migration — a live run always
 *                      processes every audited node.
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

// Every TimeGraph node whose `date` is anything other than a native DATE.
// `valueType()` returns e.g. "STRING NOT NULL" / "DATE NOT NULL", so the exact
// comparison is the only safe inverse — `STARTS WITH 'DATE'` would wrongly
// swallow "DATETIME NOT NULL". A missing `date` is caught by the IS NULL arm:
// `null.week` is null rather than a TypeError, so it is harmless, but a
// TimeGraph without a date is still worth reporting.
// `extraProps` shows what a merge would carry across onto the canonical node.
const AUDIT_NON_DATE = `
MATCH (legacy:TimeGraph)
WHERE legacy.date IS NULL OR valueType(legacy.date) <> 'DATE NOT NULL'
RETURN elementId(legacy) AS elementId,
       legacy.date AS rawDate,
       valueType(legacy.date) AS dateType,
       labels(legacy) AS labels,
       [k IN keys(legacy) WHERE k <> 'date'] AS extraProps,
       COUNT { (legacy)--() } AS degree
ORDER BY dateType, elementId
`

// Is there already a properly typed TimeGraph for this calendar day?
// USING INDEX pins the seek on the TimeGraph.date uniqueness index and doubles
// as a canary: if the planner cannot use it the query fails loudly instead of
// silently full-scanning once per audited row.
// Note `canonical.date = date($isoDate)` compares DATE to DATE, so a *string*-
// dated node can never be selected as a merge target (STRING = DATE is null).
const FIND_CANONICAL = `
MATCH (canonical:TimeGraph)
USING INDEX canonical:TimeGraph(date)
WHERE canonical.date = date($isoDate)
  AND elementId(canonical) <> $elementId
RETURN elementId(canonical) AS elementId
LIMIT 1
`

// Fold the string-dated duplicate into the canonical DATE node.
// `properties: 'discard'` keeps the canonical node's DATE value; mergeRels
// moves every relationship (both directions). The re-assert of valueType keeps
// the write honest if the audit is stale, and returning zero rows is how the
// caller learns the write did not happen.
// expectedDegree vs actualDegree: mergeRels de-duplicates parallel edges of
// the same type between the same pair, so a shortfall is not necessarily loss
// — but it is never silent.
const MERGE_INTO_CANONICAL = `
MATCH (legacy:TimeGraph)
WHERE elementId(legacy) = $elementId
  AND valueType(legacy.date) <> 'DATE NOT NULL'
MATCH (canonical:TimeGraph)
WHERE elementId(canonical) = $canonicalElementId
WITH canonical, legacy,
     COUNT { (canonical)--() } + COUNT { (legacy)--() } AS expectedDegree
CALL apoc.refactor.mergeNodes([canonical, legacy], {
  properties: 'discard',
  mergeRels: true,
  produceSelfRel: false
}) YIELD node
RETURN elementId(node) AS elementId,
       labels(node) AS labels,
       expectedDegree,
       COUNT { (node)--() } AS actualDegree
`

// No canonical twin — cast the property in place. elementId and every
// relationship survive untouched.
const CAST_IN_PLACE = `
MATCH (legacy:TimeGraph)
WHERE elementId(legacy) = $elementId
  AND valueType(legacy.date) <> 'DATE NOT NULL'
SET legacy.date = date($isoDate)
RETURN elementId(legacy) AS elementId
`

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * True only for a strict YYYY-MM-DD string that is also a real calendar day.
 * Guards `date($isoDate)`: an unparseable string would abort the statement,
 * and a rolled-over one ("2023-02-30") would silently become another day.
 */
function isIsoCalendarDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.toISOString().slice(0, 10) === value
}

/**
 * Mirrors the guard in the sibling repair-* scripts: the prod host is
 * neo4j.firstlovecenter.com, dev is dev-neo4j.firstlovecenter.com.
 * Deliberately conservative rather than clever — it cannot recognise a prod
 * database reached through an IP or an SSH tunnel, so `--allow-prod` is still
 * the operator's responsibility.
 */
function looksLikeProd(uri) {
  if (!uri) return false
  return uri.includes('neo4j.firstlovecenter.com') && !uri.includes('dev-')
}

function num(v) {
  if (v === null || v === undefined) return 0
  return v.toNumber ? v.toNumber() : Number(v)
}

/**
 * Audit, plan and (unless dryRun) apply the normalisation.
 *
 * Rows are processed one at a time on purpose: two string nodes can share a
 * calendar day, in which case the first is cast in place and the second then
 * finds it as its canonical twin and merges into it.
 *
 * Returns { rows, unresolved, skipped, failed, merged, cast, degreeWarnings }.
 */
async function migrate(session, { dryRun = true } = {}) {
  const auditRes = await session.run(AUDIT_NON_DATE)

  const rows = []
  // Not repairable by this script: a non-STRING type, or a string that is not
  // a real calendar day. Reported, never guessed at.
  const unresolved = []
  // The write ran but matched nothing (stale audit / concurrent run).
  const skipped = []
  const failed = []
  const degreeWarnings = []
  // Dates already cast in this pass. Only used to keep the DRY-RUN plan
  // faithful: in a live run the cast is committed, so FIND_CANONICAL sees it.
  const castThisPass = new Set()

  let merged = 0
  let cast = 0

  for (const record of auditRes.records) {
    const elementId = record.get('elementId')
    const rawDate = record.get('rawDate')
    const row = {
      elementId,
      rawDate,
      dateType: record.get('dateType'),
      labels: record.get('labels'),
      extraProps: record.get('extraProps'),
      degree: num(record.get('degree')),
    }

    if (!isIsoCalendarDate(rawDate)) {
      unresolved.push(row)
      continue
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const canonicalRes = await session.run(FIND_CANONICAL, {
        isoDate: rawDate,
        elementId,
      })
      const canonicalElementId = canonicalRes.records.length
        ? canonicalRes.records[0].get('elementId')
        : null

      const plannedMerge =
        Boolean(canonicalElementId) || (dryRun && castThisPass.has(rawDate))
      rows.push({
        ...row,
        action: plannedMerge ? 'merge' : 'cast',
        canonicalElementId,
      })

      if (dryRun) {
        if (!plannedMerge) castThisPass.add(rawDate)
        continue
      }

      if (canonicalElementId) {
        // eslint-disable-next-line no-await-in-loop
        const res = await session.run(MERGE_INTO_CANONICAL, {
          elementId,
          canonicalElementId,
        })
        if (!res.records.length) {
          skipped.push(row)
          continue
        }
        merged += 1
        const expected = num(res.records[0].get('expectedDegree'))
        const actual = num(res.records[0].get('actualDegree'))
        if (expected !== actual) {
          degreeWarnings.push({ ...row, expected, actual })
        }
      } else {
        // eslint-disable-next-line no-await-in-loop
        const res = await session.run(CAST_IN_PLACE, {
          elementId,
          isoDate: rawDate,
        })
        if (!res.records.length) {
          skipped.push(row)
          continue
        }
        cast += 1
      }
    } catch (err) {
      // Keep going: the remaining nodes are independent, and losing the whole
      // report to one bad row is the failure mode this script exists to avoid.
      failed.push({ ...row, error: err.message })
    }
  }

  return { rows, unresolved, skipped, failed, merged, cast, degreeWarnings }
}

function readNum(argv, flag, fallback) {
  const i = argv.indexOf(flag)
  if (i === -1) return fallback
  const v = Number(argv[i + 1])
  return Number.isFinite(v) && v >= 0 ? v : fallback
}

async function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const allowProd = argv.includes('--allow-prod')
  const printLimit = readNum(argv, '--print-limit', 100)

  const uri = process.env.NEO4J_URI
  const user = process.env.NEO4J_USER || 'neo4j'
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !password) {
    console.error('Refusing to run: NEO4J_URI and NEO4J_PASSWORD must be set.')
    process.exit(1)
  }

  if (looksLikeProd(uri) && !allowProd) {
    console.error(
      'Refusing to run: NEO4J_URI looks like production. Pass --allow-prod to override.'
    )
    process.exit(1)
  }

  if (looksLikeProd(uri)) {
    console.warn('⚠️  Targeting a PRODUCTION-looking database.')
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  const session = driver.session()

  try {
    console.log(`\nSYN-219 TimeGraph date-type normalisation`)
    console.log(`Connected to ${uri}`)
    console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}\n`)

    const { rows, unresolved, skipped, failed, merged, cast, degreeWarnings } =
      await migrate(session, { dryRun })

    if (!rows.length && !unresolved.length) {
      console.log('✅ Every :TimeGraph.date is a native DATE. Nothing to do.\n')
      return
    }

    console.log(`Repairable TimeGraph nodes: ${rows.length}`)
    if (rows.length) {
      console.table(
        rows.slice(0, printLimit).map((r) => ({
          elementId: r.elementId,
          date: r.rawDate,
          type: r.dateType,
          labels: r.labels.join(':'),
          extraProps: r.extraProps.join(',') || '—',
          relationships: r.degree,
          action: r.action,
        }))
      )
    }

    if (degreeWarnings.length) {
      console.warn(
        `\n⚠️  ${degreeWarnings.length} merge(s) ended with a different relationship count than the two nodes had between them. mergeRels collapses parallel edges of the same type, so this may be legitimate de-duplication — verify before moving on:`
      )
      console.table(
        degreeWarnings.slice(0, printLimit).map((r) => ({
          date: r.rawDate,
          expected: r.expected,
          actual: r.actual,
        }))
      )
    }

    if (skipped.length) {
      console.warn(
        `\n⚠️  ${skipped.length} node(s) no longer matched at write time (stale audit or a concurrent run) — NOT counted as migrated:`
      )
      console.table(
        skipped
          .slice(0, printLimit)
          .map((r) => ({ elementId: r.elementId, date: r.rawDate }))
      )
    }

    if (failed.length) {
      console.error(`\n❌ ${failed.length} node(s) errored mid-run:`)
      console.table(
        failed
          .slice(0, printLimit)
          .map((r) => ({ elementId: r.elementId, error: r.error }))
      )
    }

    if (unresolved.length) {
      console.warn(
        `\n⚠️  ${unresolved.length} node(s) hold a date this script will not repair (wrong type, or a string that is not a valid YYYY-MM-DD calendar day). The date.week TypeError hazard REMAINS for these — resolve them by hand:`
      )
      console.table(
        unresolved.slice(0, printLimit).map((r) => ({
          elementId: r.elementId,
          raw: JSON.stringify(r.rawDate),
          type: r.dateType,
          relationships: r.degree,
        }))
      )
    }

    if (dryRun) {
      console.log('\nDry run — no writes performed.')
    } else {
      console.log(
        `\nDone. ${merged} node(s) merged into an existing date, ${cast} cast in place.`
      )
    }

    // Non-zero whenever the hazard this script exists to remove is still live,
    // so an operator or CI job cannot read success from the exit code alone.
    if (unresolved.length || failed.length) process.exitCode = 1
  } catch (err) {
    console.error('Migration failed:', err)
    process.exitCode = 1
  } finally {
    await session.close()
    await driver.close()
  }
}

module.exports = {
  migrate,
  isIsoCalendarDate,
  looksLikeProd,
  AUDIT_NON_DATE,
  FIND_CANONICAL,
  MERGE_INTO_CANONICAL,
  CAST_IN_PLACE,
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Migration failed:', err)
    process.exitCode = 1
  })
}
