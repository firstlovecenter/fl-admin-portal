#!/usr/bin/env node
/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax */

/**
 * SYN-222 Ops correction: move a church's weekly ServiceRecord from one
 * service date to a date in another week (e.g. a week-39 service that was
 * filled in on Thu 1 Oct 2026 — ISO week 40 — moved back to Sun 27 Sep 2026,
 * ISO week 39).
 *
 * Why a script and not a portal edit. Service forms only accept a date in the
 * current week (`assertServiceDateInCurrentWeek`), and the regular service
 * record is keyed `<church.id>-<week>-<year>` (`recordService` MERGE). A record
 * filed on the wrong day therefore sits in the wrong week, holds that week's
 * key, and the form for that week reports "already filled". There is no
 * edit-date mutation, and adding one would reopen the out-of-week write the
 * week guard exists to block — so this is a one-off, operator-run fix.
 *
 * What it does, per church:
 *   1. Resolves the church by name (Bacenta / Governorship / Council / Stream —
 *      the levels `recordService` writes for), optionally narrowed by campus.
 *      Zero or several matches → UNRESOLVED, nothing written.
 *   2. Finds the ServiceRecord held on --from. Anything other than exactly one
 *      → UNRESOLVED. So is a record whose banking is still in flight
 *      ('pending' / 'send OTP'): the leader's open session holds the old id and
 *      the banking mutations match on it, so re-keying would strand them.
 *   3. Clash check: refuses if the church already has a service record in
 *      --to's week, or the --to week key is held by another node (that would
 *      also break the ServiceRecord.id uniqueness constraint).
 *   4. Re-points SERVICE_HELD_ON to the --to TimeGraph and, when the record
 *      carries the --from weekly key, re-keys it to the --to week so the --from
 *      week is free again. Stamps `serviceDateCorrectedFrom`,
 *      `serviceDateCorrectedFromId`, `serviceDateCorrectedAt` and
 *      `serviceDateCorrectionRef` on the record — ServiceRecords carry no
 *      HistoryLog by design (W1), so the audit trail lives on the record.
 *   5. Moves the record between the weekly AggregateServiceRecord snapshots
 *      (ADR-014). Rejected alternative: re-running the Lambda roll-ups for both
 *      weeks. Those walk TODAY's hierarchy and CURRENT_HISTORY edges, so for a
 *      past week they silently drop records on rotated-away logs and re-attribute
 *      restructured churches — rewriting campus / oversight / denomination
 *      income with other churches' changes. Instead this follows each
 *      snapshot's own membership (the faithful path, as in
 *      repair-oversight-native-income.js). For every --from-week snapshot whose
 *      stored `componentServiceIds` lists the record, ONE statement:
 *        · drops the record from it and re-sums the remaining components, and
 *        · adds the record to the same owner's --to-week snapshot (created on
 *          the owner's current ServiceLog if missing) and re-sums that,
 *      both or neither. A `blocked` reason is computed first and nothing is
 *      written when any of these hold: the owner cannot be resolved, a
 *      component on either side no longer resolves (re-summing would drop its
 *      money), the --to snapshot exists without a component list (its contents
 *      are unknown, so it cannot be re-summed), or an Oversight / Denomination
 *      snapshot has no currency (the native-vs-USD income rule would guess).
 *      Re-summing keeps the currency rule (`income = dollarIncome` when the
 *      snapshot is USD) and reads the components' current figures. Both sides
 *      are stamped with a correction marker in `serviceDateCorrections`, so a
 *      re-run never applies it twice.
 *
 * Safety:
 *   - `--dry-run` performs no writes. It runs the same aggregate statement
 *     with `$apply = false`, so the preview shows exactly which snapshots would
 *     be adjusted or blocked, with their current and projected totals.
 *   - Refuses a production-looking NEO4J_URI unless `--allow-prod` is passed.
 *     The check is hostname-based, so it cannot recognise prod reached through
 *     an IP or an SSH tunnel — `--allow-prod` is still the operator's call.
 *   - Rejects any argument it does not recognise (typo'd flags, stray words
 *     from an unquoted church name) and any flag missing its value, so a
 *     mistyped `--dry-run` or a half-read name cannot become a live run.
 *   - Refuses a --from date in the current week: the Lambda rewrites
 *     current-week snapshots from live data every 30 minutes, so the snapshot
 *     membership this script relies on is not stable there.
 *   - The move re-asserts every guard inside its own write, so a stale plan or
 *     a concurrent submission makes it a SKIP, never a clobber.
 *   - Re-runnable: a record already moved by this script (nothing left on
 *     --from, a stamped record on --to) is reported as ALREADY MOVED and its
 *     aggregate adjustment is retried under the ref stored on the record;
 *     markers make that a no-op when it already completed.
 *   - Prints only the scheme and host of NEO4J_URI, never credentials in it.
 *
 * Usage (SYN-222, dry-run first):
 *   NEO4J_URI=... NEO4J_USER=neo4j NEO4J_PASSWORD=*** \
 *   node api/src/scripts/move-service-record-date.js --allow-prod --dry-run \
 *     --ref SYN-222 --from 2026-10-01 --to 2026-09-27 --campus "Energy" \
 *     --church "Jesus Encounter" --church "Blessed Encounter" \
 *     --church "Energy Lovelets"
 *
 * Options:
 *   --from YYYY-MM-DD   Date the record is currently held on; not in the
 *                       current week (required).
 *   --to YYYY-MM-DD     Date it should be held on; must be in another week
 *                       (required).
 *   --church NAME       Church name, case-insensitive. Repeatable (required).
 *   --campus NAME       Only match churches under this campus (case-insensitive).
 *   --ref TEXT          Audit reference stamped on the record, e.g. a ticket key
 *                       (required).
 *   --dry-run           Report the plan and exit without writing.
 *   --allow-prod        Permit a production-looking NEO4J_URI.
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

// Every later query anchors on `elementId(church)` from here: a label-less
// `{id: $churchId}` match would be an AllNodesScan on prod. The campus walk
// mirrors `getCurrency`.
const FIND_CHURCHES = `
MATCH (church)
WHERE (church:Bacenta OR church:Governorship OR church:Council OR church:Stream)
  AND toLower(trim(church.name)) = toLower(trim($churchName))
OPTIONAL MATCH (church)<-[:HAS|HAS_MINISTRY*1..5]-(campus:Campus)
WITH church, collect(DISTINCT campus.name) AS campuses
WHERE $campusName IS NULL
   OR any(c IN campuses WHERE toLower(trim(c)) = toLower(trim($campusName)))
RETURN elementId(church) AS eid, church.id AS id, church.name AS name,
       [l IN labels(church) WHERE l IN ['Bacenta', 'Governorship', 'Council', 'Stream']] AS levels,
       campuses
ORDER BY id
`

const FIND_RECORDS_ON_DATE = `
MATCH (church) WHERE elementId(church) = $churchEid
MATCH (church)-[:HAS_HISTORY|CURRENT_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(day:TimeGraph)
WHERE day.date = date($fromDate)
RETURN DISTINCT record.id AS id, labels(record) AS labels,
       record.attendance AS attendance, record.income AS income,
       record.transactionStatus AS transactionStatus
ORDER BY id
`

// A record this script already moved from --from to --to. Lets a re-run
// finish the aggregate adjustment if a previous live run moved the record but
// died before (or during) it: --from is empty, but the stamped record is found
// here and fed back into the adjustment. Its stored ref is returned so the
// retry uses the same marker even if the operator types --ref differently.
const FIND_ALREADY_MOVED = `
MATCH (church) WHERE elementId(church) = $churchEid
MATCH (church)-[:HAS_HISTORY|CURRENT_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(day:TimeGraph)
WHERE day.date = date($toDate)
  AND record.serviceDateCorrectedFrom = date($fromDate)
RETURN DISTINCT record.id AS id,
       coalesce(record.serviceDateCorrectedFromId, record.id) AS previousId,
       record.serviceDateCorrectionRef AS ref
ORDER BY id
`

// Anything that would make the moved record a second service in the --to
// week: another record of this church held that week, or any node already
// holding the --to weekly key. Collapsed per id so one record held both ways
// is listed once.
const FIND_CLASHES = `
MATCH (church) WHERE elementId(church) = $churchEid
CALL {
  WITH church
  MATCH (church)-[:HAS_HISTORY|CURRENT_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(other:ServiceRecord)-[:SERVICE_HELD_ON]->(day:TimeGraph)
  WHERE day.date.week = date($toDate).week AND day.date.year = date($toDate).year
    AND other.id <> $recordId
  RETURN other, toString(day.date) AS heldOn
  UNION
  WITH church
  MATCH (other:ServiceRecord {id: church.id + '-' + toString(date($toDate).week) + '-' + toString(date($toDate).year)})
  WHERE other.id <> $recordId
  RETURN other, null AS heldOn
}
RETURN other.id AS id, labels(other) AS labels, max(heldOn) AS heldOn
ORDER BY id
`

// The move. Every guard from the plan is re-asserted here so a stale dry-run
// or a concurrent submission yields zero rows (a SKIP) instead of a clobber.
// `rekey` is fixed before any SET, and the from-id is stamped in an earlier
// SET clause than the id change, so it always captures the pre-move id.
const MOVE_RECORD = `
MATCH (church) WHERE elementId(church) = $churchEid
MATCH (church)-[:HAS_HISTORY|CURRENT_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord {id: $recordId})-[old:SERVICE_HELD_ON]->(fromDay:TimeGraph)
WHERE fromDay.date = date($fromDate)
  AND NOT coalesce(record.transactionStatus, '') IN ['pending', 'send OTP']
WITH DISTINCT church, record, old,
     church.id + '-' + toString(date($fromDate).week) + '-' + toString(date($fromDate).year) AS fromKey,
     church.id + '-' + toString(date($toDate).week) + '-' + toString(date($toDate).year) AS toKey
WHERE NOT EXISTS {
        MATCH (other:ServiceRecord {id: toKey}) WHERE other <> record
      }
  AND NOT EXISTS {
        MATCH (church)-[:HAS_HISTORY|CURRENT_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(other:ServiceRecord)-[:SERVICE_HELD_ON]->(day:TimeGraph)
        WHERE other <> record
          AND day.date.week = date($toDate).week AND day.date.year = date($toDate).year
      }
WITH record, old, toKey, record.id = fromKey AS rekey
DELETE old
MERGE (toDay:TimeGraph {date: date($toDate)})
MERGE (record)-[:SERVICE_HELD_ON]->(toDay)
SET record.serviceDateCorrectedFromId = record.id,
    record.serviceDateCorrectedFrom = date($fromDate),
    record.serviceDateCorrectedAt = datetime(),
    record.serviceDateCorrectionRef = $ref
SET record.id = CASE WHEN rekey THEN toKey ELSE record.id END
RETURN record.id AS newId, rekey
`

// Week parts come from the database clock, the same one the Lambda and
// `recordService` key on.
const DATE_PARTS = `
RETURN date($date).week AS week, date($date).year AS year,
       date($date).month AS month,
       date().week AS nowWeek, date().year AS nowYear,
       date($date) > date() AS isFuture
`

// Move ONE record between the --from-week and --to-week snapshots, for every
// owner whose --from snapshot lists it — both sides in one statement, so they
// commit together or not at all (MERGE…SET overwrite, never +=, ADR-014).
//
// `$renames` maps "id as listed in a snapshot" → "id to look the record up
// by". Live: every pre-move id in the run → its new id, because snapshots
// above the church (campus, oversight, denomination) are shared by all the
// moved churches and still list the OTHER moved records under their old ids
// until their own adjustment runs. Dry run: the record has not moved yet, so
// it maps the predicted new id back to the current id.
//
// `$apply = false` evaluates everything (including `blocked`) and writes
// nothing — that is the dry-run preview. The owner is resolved through the
// ServiceLog holding the --from snapshot; the id check excludes the leader
// Member, who also has HAS_HISTORY to that log.
const ADJUST_SNAPSHOTS = `
MATCH (a:AggregateServiceRecord)
WHERE a.week = $fromWeek AND a.year = $fromYear
  AND $oldId IN coalesce(a.componentServiceIds, [])
  AND NOT $marker IN coalesce(a.serviceDateCorrections, [])
OPTIONAL MATCH (owner)-[:HAS_HISTORY|CURRENT_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(a)
WHERE a.id = owner.id + '-' + toString($fromWeek) + '-' + toString($fromYear)
WITH a, head(collect(DISTINCT owner)) AS owner
WITH a, owner,
     CASE WHEN owner IS NULL THEN null
          ELSE owner.id + '-' + toString($toWeek) + '-' + toString($toYear) END AS toId
OPTIONAL MATCH (dst:AggregateServiceRecord) WHERE dst.id = toId
OPTIONAL MATCH (owner)-[:CURRENT_HISTORY]->(log:ServiceLog)
WITH a, owner, toId, dst, head(collect(log)) AS log
WITH a, owner, toId, dst, log,
     [x IN a.componentServiceIds WHERE x <> $oldId] AS keep,
     [x IN coalesce(dst.componentServiceIds, []) WHERE x <> $newId] + [$newId] AS ids
CALL {
  WITH keep
  OPTIONAL MATCH (r:ServiceRecord)
  WHERE r.id IN [x IN keep | coalesce($renames[x], x)] AND NOT r:NoService
  RETURN collect(DISTINCT r) AS fromRs
}
CALL {
  WITH ids
  OPTIONAL MATCH (r:ServiceRecord)
  WHERE r.id IN [x IN ids | coalesce($renames[x], x)] AND NOT r:NoService
  RETURN collect(DISTINCT r) AS toRs
}
WITH a, owner, toId, dst, log, keep, ids, fromRs, toRs,
     CASE
       WHEN owner IS NULL THEN 'owner of the --from snapshot not found'
       WHEN size(fromRs) <> size(keep) THEN 'a --from component no longer resolves'
       WHEN dst IS NULL AND log IS NULL THEN 'owner has no current ServiceLog to hold a new --to snapshot'
       WHEN dst IS NOT NULL AND dst.componentServiceIds IS NULL THEN 'the --to snapshot has no component list'
       WHEN size(toRs) <> size(ids) THEN 'a --to component no longer resolves'
       WHEN $marker IN coalesce(dst.serviceDateCorrections, []) THEN 'the --to snapshot already carries this correction'
       WHEN (owner:Oversight OR owner:Denomination)
            AND (a.currency IS NULL OR (dst IS NOT NULL AND dst.currency IS NULL))
         THEN 'oversight/denomination snapshot has no currency'
       ELSE null
     END AS blocked
WITH a, owner, toId, dst, log, keep, ids, fromRs, toRs, blocked,
     a.attendance AS fromAttendanceBefore, a.income AS fromIncomeBefore,
     dst.attendance AS toAttendanceBefore, dst.income AS toIncomeBefore,
     round(toFloat(reduce(s = 0.0, x IN fromRs | s + coalesce(x.attendance, 0))), 2) AS fromAttendance,
     round(toFloat(reduce(s = 0.0, x IN fromRs | s + coalesce(x.income, 0))), 2) AS fromNative,
     round(toFloat(reduce(s = 0.0, x IN fromRs | s + coalesce(x.dollarIncome, 0))), 2) AS fromDollar,
     round(toFloat(reduce(s = 0.0, x IN toRs | s + coalesce(x.attendance, 0))), 2) AS toAttendance,
     round(toFloat(reduce(s = 0.0, x IN toRs | s + coalesce(x.income, 0))), 2) AS toNative,
     round(toFloat(reduce(s = 0.0, x IN toRs | s + coalesce(x.dollarIncome, 0))), 2) AS toDollar,
     // The currency the --to write actually uses: an existing snapshot keeps
     // its own (even null); a new one is created with the --from currency.
     CASE WHEN dst IS NULL THEN a.currency ELSE dst.currency END AS toCurrency
FOREACH (_ IN CASE WHEN $apply AND blocked IS NULL THEN [1] ELSE [] END |
  SET a.componentServiceIds = keep,
      a.numberOfServices = size(fromRs),
      a.attendance = fromAttendance,
      a.income = CASE WHEN a.currency = 'USD' THEN fromDollar ELSE fromNative END,
      a.dollarIncome = fromDollar,
      a.recomputedAt = datetime(),
      a.serviceDateCorrections = coalesce(a.serviceDateCorrections, []) + $marker
  MERGE (d:AggregateServiceRecord {id: toId})
    ON CREATE SET d.week = $toWeek, d.year = $toYear, d.month = $toMonth,
                  d.currency = a.currency, d._isNew = true
  FOREACH (l IN CASE WHEN d._isNew THEN [log] ELSE [] END |
    MERGE (l)-[:HAS_SERVICE_AGGREGATE]->(d)
  )
  REMOVE d._isNew
  SET d.componentServiceIds = ids,
      d.numberOfServices = size(toRs),
      d.attendance = toAttendance,
      d.income = CASE WHEN d.currency = 'USD' THEN toDollar ELSE toNative END,
      d.dollarIncome = toDollar,
      d.recomputedAt = datetime(),
      d.serviceDateCorrections = coalesce(d.serviceDateCorrections, []) + $marker
)
RETURN a.id AS fromId, toId, blocked,
       $apply AND blocked IS NULL AS applied,
       fromAttendanceBefore, fromIncomeBefore,
       fromAttendance AS fromAttendanceAfter,
       CASE WHEN a.currency = 'USD' THEN fromDollar ELSE fromNative END AS fromIncomeAfter,
       toAttendanceBefore, toIncomeBefore,
       toAttendance AS toAttendanceAfter,
       CASE WHEN toCurrency = 'USD' THEN toDollar ELSE toNative END AS toIncomeAfter
ORDER BY fromId
`

const VALUE_FLAGS = {
  '--from': 'fromDate',
  '--to': 'toDate',
  '--church': 'churchNames',
  '--campus': 'campusName',
  '--ref': 'ref',
}
const BOOLEAN_FLAGS = { '--dry-run': 'dryRun', '--allow-prod': 'allowProd' }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Strict YYYY-MM-DD that is a real calendar day (no 2026-02-30 rollover). */
function isIsoCalendarDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.toISOString().slice(0, 10) === value
}

/** Mirrors the guard in the sibling repair-* / migrate-* scripts. */
function looksLikeProd(uri) {
  if (!uri) return false
  return uri.includes('neo4j.firstlovecenter.com') && !uri.includes('dev-')
}

/** Scheme and host only — a URI can carry `user:password@`. */
function describeUri(uri) {
  try {
    const url = new URL(uri)
    return `${url.protocol}//${url.host}`
  } catch (err) {
    return '(unparseable NEO4J_URI)'
  }
}

function num(v) {
  if (v === null || v === undefined) return 0
  return v.toNumber ? v.toNumber() : Number(v)
}

/**
 * The idempotency marker stamped on every adjusted aggregate. Built in JS and
 * bound as `$marker` — never spliced into Cypher.
 */
function correctionMarker(ref, oldId, newId) {
  return `${ref}:${oldId}->${newId}`
}

/**
 * Strict parser: every token must be a known flag or the value of the flag
 * before it. A value-taking flag followed by nothing or by another flag is
 * reported as missing its value. Single-valued flags: last one wins.
 */
function parseArgs(argv) {
  const out = {
    fromDate: null,
    toDate: null,
    churchNames: [],
    campusName: null,
    ref: null,
    dryRun: false,
    allowProd: false,
    unknownArgs: [],
    missingValues: [],
  }
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (VALUE_FLAGS[arg]) {
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) {
        out.missingValues.push(arg)
        i += 1
      } else {
        if (arg === '--church') out.churchNames.push(next)
        else out[VALUE_FLAGS[arg]] = next
        i += 2
      }
    } else if (BOOLEAN_FLAGS[arg]) {
      out[BOOLEAN_FLAGS[arg]] = true
      i += 1
    } else {
      out.unknownArgs.push(arg)
      i += 1
    }
  }
  return out
}

/** Returns a list of human-readable problems; empty means the args are usable. */
function validateArgs({
  fromDate,
  toDate,
  churchNames,
  ref,
  unknownArgs = [],
  missingValues = [],
}) {
  const problems = []
  unknownArgs.forEach((a) =>
    problems.push(
      `Unrecognised argument "${a}" (quote multi-word names: --church "Jesus Encounter").`
    )
  )
  missingValues.forEach((f) => problems.push(`${f} needs a value.`))
  if (!isIsoCalendarDate(fromDate)) {
    problems.push('--from must be a real YYYY-MM-DD date.')
  }
  if (!isIsoCalendarDate(toDate)) {
    problems.push('--to must be a real YYYY-MM-DD date.')
  }
  if (fromDate && fromDate === toDate) {
    problems.push('--from and --to are the same date; nothing to move.')
  }
  if (!churchNames.length) {
    problems.push('Pass at least one --church NAME.')
  }
  if (!ref) {
    problems.push('Pass --ref (e.g. the ticket key) for the audit stamp.')
  }
  return problems
}

async function datePartsOf(session, date) {
  const res = await session.run(DATE_PARTS, { date })
  const r = res.records[0]
  return {
    week: num(r.get('week')),
    year: num(r.get('year')),
    month: num(r.get('month')),
    nowWeek: num(r.get('nowWeek')),
    nowYear: num(r.get('nowYear')),
    isFuture: Boolean(r.get('isFuture')),
  }
}

/**
 * Plan and (unless dryRun) apply the move.
 *
 * Returns { planned, moved, alreadyMoved, unresolved, skipped, failed,
 *           aggregates, aggregateError }. `aggregates` is the per-snapshot
 * result of ADJUST_SNAPSHOTS — applied in a live run, a preview in a dry run.
 */
async function moveServiceRecords(
  session,
  { fromDate, toDate, churchNames, campusName = null, ref, dryRun = true }
) {
  const from = await datePartsOf(session, fromDate)
  const to = await datePartsOf(session, toDate)
  if (from.week === to.week && from.year === to.year) {
    // Same week: the key and the snapshots do not change, and the marker
    // logic assumes two distinct weeks. Not what this script is for.
    throw new Error(
      `${fromDate} and ${toDate} are in the same week (${from.week}/${from.year}); nothing to re-key.`
    )
  }
  if (from.week === from.nowWeek && from.year === from.nowYear) {
    throw new Error(
      `${fromDate} is in the current week; the Lambda rewrites this week's snapshots from live data, so move it after the week closes.`
    )
  }

  if (to.isFuture) {
    // A typo'd --to (wrong month or year) would re-key the record into a week
    // that has not happened, blocking that week's form when it arrives.
    throw new Error(
      `${toDate} is in the future; a service cannot be moved there.`
    )
  }

  const planned = []
  const moved = []
  const alreadyMoved = []
  const unresolved = []
  const skipped = []
  const failed = []

  for (const churchName of churchNames) {
    try {
      const churchRes = await session.run(FIND_CHURCHES, {
        churchName,
        campusName,
      })
      const churches = churchRes.records.map((r) => ({
        eid: r.get('eid'),
        id: r.get('id'),
        name: r.get('name'),
        levels: r.get('levels'),
        campuses: r.get('campuses'),
      }))
      if (churches.length !== 1) {
        unresolved.push({
          churchName,
          reason: churches.length
            ? `${churches.length} churches match — narrow with --campus`
            : 'no Bacenta/Governorship/Council/Stream with this name (and campus)',
          candidates: churches,
        })
        continue
      }
      const [church] = churches

      const recordRes = await session.run(FIND_RECORDS_ON_DATE, {
        churchEid: church.eid,
        fromDate,
      })
      const records = recordRes.records.map((r) => ({
        id: r.get('id'),
        labels: r.get('labels'),
        attendance: r.get('attendance'),
        income: r.get('income'),
        transactionStatus: r.get('transactionStatus'),
      }))
      if (!records.length) {
        const doneRes = await session.run(FIND_ALREADY_MOVED, {
          churchEid: church.eid,
          fromDate,
          toDate,
        })
        if (doneRes.records.length === 1) {
          const done = doneRes.records[0]
          alreadyMoved.push({
            churchName,
            church,
            record: { id: done.get('previousId') },
            newId: done.get('id'),
            ref: done.get('ref') || ref,
            alreadyMoved: true,
          })
          continue
        }
      }
      if (records.length !== 1) {
        unresolved.push({
          churchName,
          church,
          reason: records.length
            ? `${records.length} service records on ${fromDate} — move by hand`
            : `no service record on ${fromDate}`,
          candidates: records,
        })
        continue
      }
      const [record] = records

      if (['pending', 'send OTP'].includes(record.transactionStatus)) {
        unresolved.push({
          churchName,
          church,
          record,
          reason: `banking is in progress (${record.transactionStatus}) — retry once it settles`,
          candidates: [],
        })
        continue
      }

      const clashRes = await session.run(FIND_CLASHES, {
        churchEid: church.eid,
        recordId: record.id,
        toDate,
      })
      const clashes = clashRes.records.map((r) => ({
        id: r.get('id'),
        labels: r.get('labels'),
        heldOn: r.get('heldOn'),
      }))
      if (clashes.length) {
        unresolved.push({
          churchName,
          church,
          record,
          reason: `already has a service in the ${toDate} week`,
          candidates: clashes,
        })
        continue
      }

      if (dryRun) {
        // Mirrors MOVE_RECORD's rekey rule, for the preview only.
        const fromKey = `${church.id}-${from.week}-${from.year}`
        planned.push({
          churchName,
          church,
          record,
          ref,
          pending: true,
          newId:
            record.id === fromKey
              ? `${church.id}-${to.week}-${to.year}`
              : record.id,
        })
        continue
      }
      planned.push({ churchName, church, record })

      const moveRes = await session.run(MOVE_RECORD, {
        churchEid: church.eid,
        recordId: record.id,
        fromDate,
        toDate,
        ref,
      })
      if (!moveRes.records.length) {
        skipped.push({ churchName, church, record })
        continue
      }
      moved.push({
        churchName,
        church,
        record,
        ref,
        newId: moveRes.records[0].get('newId'),
        rekeyed: Boolean(moveRes.records[0].get('rekey')),
      })
    } catch (err) {
      failed.push({ churchName, error: err.message })
    }
  }

  // Covers records moved this run AND records a previous run moved, so an
  // adjustment that failed last time is finished by simply re-running. In a
  // dry run the same statement runs with apply = false as the preview. A
  // failure here is reported, not thrown: any moves above are committed and
  // the caller still needs the `moved` list.
  let aggregates = null
  let aggregateError = null
  try {
    aggregates = await adjustAggregates(session, {
      moves: dryRun
        ? [...planned, ...alreadyMoved]
        : [...moved, ...alreadyMoved],
      from,
      to,
      apply: !dryRun,
    })
  } catch (err) {
    aggregateError = err.message
  }

  return {
    planned,
    moved,
    alreadyMoved,
    unresolved,
    skipped,
    failed,
    aggregates,
    aggregateError,
  }
}

/**
 * Run ADJUST_SNAPSHOTS once per move. A move flagged `pending` (dry-run plan)
 * has not been re-keyed yet, so its rename points from the predicted new id
 * back to the current one; every other move points old → new.
 *
 * Returns [{ churchName, recordId, newId, snapshots: [...] }].
 */
async function adjustAggregates(session, { moves, from, to, apply }) {
  const renames = {}
  moves.forEach((m) => {
    if (m.pending) renames[m.newId] = m.record.id
    else renames[m.record.id] = m.newId
  })

  const results = []
  for (const m of moves) {
    const res = await session.run(ADJUST_SNAPSHOTS, {
      renames,
      apply,
      oldId: m.record.id,
      newId: m.newId,
      marker: correctionMarker(m.ref, m.record.id, m.newId),
      fromWeek: neo4j.int(from.week),
      fromYear: neo4j.int(from.year),
      toWeek: neo4j.int(to.week),
      toYear: neo4j.int(to.year),
      toMonth: neo4j.int(to.month),
    })
    results.push({
      churchName: m.church.name,
      recordId: m.record.id,
      newId: m.newId,
      alreadyMoved: Boolean(m.alreadyMoved),
      snapshots: res.records.map((r) => ({
        fromId: r.get('fromId'),
        toId: r.get('toId'),
        blocked: r.get('blocked'),
        applied: Boolean(r.get('applied')),
        fromAttendance: [
          num(r.get('fromAttendanceBefore')),
          num(r.get('fromAttendanceAfter')),
        ],
        fromIncome: [
          num(r.get('fromIncomeBefore')),
          num(r.get('fromIncomeAfter')),
        ],
        toAttendance: [
          num(r.get('toAttendanceBefore')),
          num(r.get('toAttendanceAfter')),
        ],
        toIncome: [num(r.get('toIncomeBefore')), num(r.get('toIncomeAfter'))],
      })),
    })
  }
  return results
}

/** Snapshots that were (or in a dry run would be) left untouched, and why. */
function blockedSnapshots(aggregates) {
  if (!aggregates) return []
  return aggregates.flatMap((a) =>
    a.snapshots
      .filter((s) => s.blocked)
      .map((s) => ({
        church: a.churchName,
        snapshot: s.fromId,
        reason: s.blocked,
      }))
  )
}

/**
 * Records moved (or planned) in this run that no --from-week snapshot lists.
 * Expected for nothing: the record was in that week's roll-ups. A healed
 * record with no snapshots left is fine — its adjustment already finished.
 */
function unadjustedMoves(aggregates) {
  if (!aggregates) return []
  return aggregates.filter((a) => !a.alreadyMoved && !a.snapshots.length)
}

/** Non-zero whenever anything was not done, so the exit code cannot lie. */
function exitCodeFor(result) {
  return result.unresolved.length ||
    result.skipped.length ||
    result.failed.length ||
    result.aggregateError ||
    blockedSnapshots(result.aggregates).length ||
    unadjustedMoves(result.aggregates).length
    ? 1
    : 0
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const problems = validateArgs(opts)
  if (problems.length) {
    problems.forEach((p) => console.error(`✖ ${p}`))
    process.exitCode = 1
    return
  }

  const uri = process.env.NEO4J_URI
  const user = process.env.NEO4J_USER || 'neo4j'
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !password) {
    console.error('Refusing to run: NEO4J_URI and NEO4J_PASSWORD must be set.')
    process.exitCode = 1
    return
  }
  if (looksLikeProd(uri) && !opts.allowProd) {
    console.error(
      'Refusing to run: NEO4J_URI looks like production. Pass --allow-prod to override.'
    )
    process.exitCode = 1
    return
  }
  if (looksLikeProd(uri)) {
    console.warn('⚠️  Targeting a PRODUCTION-looking database.')
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  const session = driver.session()

  try {
    console.log(`\n${opts.ref} service-date correction`)
    console.log(`Connected to ${describeUri(uri)}`)
    console.log(`Mode: ${opts.dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`)
    console.log(`Move: ${opts.fromDate} → ${opts.toDate}\n`)

    const result = await moveServiceRecords(session, opts)

    if (result.planned.length) {
      console.log(`Planned moves: ${result.planned.length}`)
      console.table(
        result.planned.map((p) => ({
          church: p.church.name,
          level: p.church.levels.join(':'),
          campus: p.church.campuses.join(', '),
          record: p.record.id,
          attendance: num(p.record.attendance),
          income: num(p.record.income),
          banking: p.record.transactionStatus || '—',
        }))
      )
    }

    if (result.alreadyMoved.length) {
      console.log(
        `\nAlready moved by an earlier run (the aggregate adjustment is retried): ${result.alreadyMoved
          .map((m) => `${m.church.name} (${m.newId})`)
          .join(', ')}`
      )
    }

    if (result.unresolved.length) {
      console.warn(
        `\n⚠️  ${result.unresolved.length} church(es) NOT moved — resolve by hand:`
      )
      for (const u of result.unresolved) {
        console.warn(`  • ${u.churchName}: ${u.reason}`)
        if (u.candidates && u.candidates.length) {
          console.table(
            u.candidates.map(({ eid, ...rest }) => ({
              ...rest,
              ...(rest.labels ? { labels: rest.labels.join(':') } : {}),
              ...(rest.levels ? { levels: rest.levels.join(':') } : {}),
              ...(rest.campuses ? { campuses: rest.campuses.join(', ') } : {}),
            }))
          )
        }
      }
    }

    if (result.skipped.length) {
      console.warn(
        `\n⚠️  ${result.skipped.length} move(s) no longer matched at write time (stale plan or a concurrent submission) — NOT moved:`
      )
      console.table(
        result.skipped.map((s) => ({
          church: s.church.name,
          record: s.record.id,
        }))
      )
    }

    if (result.failed.length) {
      console.error(`\n❌ ${result.failed.length} church(es) errored:`)
      console.table(result.failed)
    }

    if (!opts.dryRun) {
      console.log(`\nMoved ${result.moved.length} record(s):`)
      console.table(
        result.moved.map((m) => ({
          church: m.church.name,
          from: m.record.id,
          to: m.newId,
          rekeyed: m.rekeyed,
        }))
      )
    }

    if (result.aggregates && result.aggregates.length) {
      console.log(
        opts.dryRun
          ? "\nAggregate snapshots (preview — attendance / income, before → after; each row shows that church's move alone, so a snapshot shared by several moved churches ends at the combined result):"
          : '\nAggregate snapshots (attendance / income, before → after):'
      )
      console.table(
        result.aggregates.flatMap((a) =>
          a.snapshots.map((s) => ({
            church: a.churchName,
            from: s.fromId,
            to: s.toId || '—',
            status:
              s.blocked || (s.applied ? 'adjusted' : 'would adjust (dry run)'),
            fromAtt: `${s.fromAttendance[0]} → ${s.fromAttendance[1]}`,
            fromInc: `${s.fromIncome[0]} → ${s.fromIncome[1]}`,
            toAtt: `${s.toAttendance[0]} → ${s.toAttendance[1]}`,
            toInc: `${s.toIncome[0]} → ${s.toIncome[1]}`,
          }))
        )
      )
      result.aggregates
        .filter((a) => !a.snapshots.length)
        .forEach((a) =>
          console.warn(
            a.alreadyMoved
              ? `  ${a.churchName}: no outstanding --from-week snapshot adjustment (finished by an earlier run, or never listed — see that run's output).`
              : `⚠️  ${a.churchName}: no --from-week snapshot lists ${a.recordId} — check the week totals by hand.`
          )
        )
    }

    const blocked = blockedSnapshots(result.aggregates)
    if (blocked.length) {
      console.warn(
        `\n⚠️  ${blocked.length} snapshot(s) ${
          opts.dryRun ? 'would be' : 'were'
        } left untouched on BOTH weeks — fix by hand, then re-run:`
      )
      console.table(blocked)
    }
    if (result.aggregateError) {
      console.error(
        `\n❌ Aggregate adjustment failed: ${result.aggregateError}${
          opts.dryRun
            ? ''
            : '\nThe moves above ARE committed. Re-run the same command to finish.'
        }`
      )
    }

    if (opts.dryRun) console.log('\nDry run — no writes performed.')

    process.exitCode = exitCodeFor(result)
  } catch (err) {
    console.error('Correction failed:', err.message)
    process.exitCode = 1
  } finally {
    await session.close()
    await driver.close()
  }
}

module.exports = {
  moveServiceRecords,
  adjustAggregates,
  blockedSnapshots,
  unadjustedMoves,
  exitCodeFor,
  correctionMarker,
  describeUri,
  parseArgs,
  validateArgs,
  isIsoCalendarDate,
  looksLikeProd,
  FIND_CHURCHES,
  FIND_RECORDS_ON_DATE,
  FIND_ALREADY_MOVED,
  FIND_CLASHES,
  MOVE_RECORD,
  DATE_PARTS,
  ADJUST_SNAPSHOTS,
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Correction failed:', err.message)
    process.exitCode = 1
  })
}
