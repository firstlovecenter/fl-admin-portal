/**
 * Unit tests for the SYN-222 service-date correction script.
 *
 * No Neo4j connection required — the Cypher strings are inspected statically
 * and the session is mocked (same harness as
 * migrate-timegraph-string-dates.test.js). The Cypher semantics themselves
 * were verified end-to-end against dev Neo4j; these tests pin the query shape
 * and the JS orchestration around it.
 */

const fs = require('fs')
const neo4j = require('neo4j-driver')

const {
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
} = require('./move-service-record-date')

// ---------------------------------------------------------------------------
// Fake driver session
// ---------------------------------------------------------------------------

const record = (fields) => ({ get: (key) => fields[key] })

/**
 * `plan` maps a query string to a function of (params) -> array of field maps.
 * Every call is recorded so tests can assert what was (and was not) written.
 */
const makeSession = (plan) => {
  const calls = []
  return {
    calls,
    run: jest.fn(async (query, params = {}) => {
      calls.push({ query, params })
      const rows = plan[query] ? plan[query](params) : []
      return { records: rows.map(record) }
    }),
  }
}

const squash = (s) => s.replace(/\s+/g, ' ').trim()
const paramsOf = (cypher) =>
  [
    ...new Set((cypher.match(/\$[A-Za-z_]\w*/g) || []).map((p) => p.slice(1))),
  ].sort()

const FROM = '2026-10-01'
const TO = '2026-09-27'

// "Now" is week 41 / 2026, so neither date is in the current week.
const DATE_PARTS_BY_DATE = {
  // Mixed plain numbers and neo4j Integers — the script must normalise both.
  [TO]: {
    week: neo4j.int(39),
    year: neo4j.int(2026),
    month: neo4j.int(9),
    nowWeek: neo4j.int(41),
    nowYear: neo4j.int(2026),
  },
  [FROM]: { week: 40, year: 2026, month: 10, nowWeek: 41, nowYear: 2026 },
}

const churchRow = (overrides = {}) => ({
  eid: '4:abc:1',
  id: 'b-1',
  name: 'Jesus Encounter',
  levels: ['Bacenta'],
  campuses: ['Energy'],
  ...overrides,
})

const recordRow = (overrides = {}) => ({
  id: 'b-1-40-2026',
  labels: ['ServiceRecord'],
  attendance: 12,
  income: 100,
  transactionStatus: null,
  ...overrides,
})

/** One ADJUST_SNAPSHOTS row; fields not overridden are an applied adjustment. */
const snapshotRow = (overrides = {}) => ({
  fromId: 'gov-1-40-2026',
  toId: 'gov-1-39-2026',
  blocked: null,
  applied: true,
  fromAttendanceBefore: 40,
  fromIncomeBefore: 350,
  fromAttendanceAfter: 28,
  fromIncomeAfter: 250,
  toAttendanceBefore: 10,
  toIncomeBefore: 50,
  toAttendanceAfter: 22,
  toIncomeAfter: 150,
  ...overrides,
})

/** The normalised shape adjustAggregates returns for `snapshotRow()`. */
const snapshotOut = (overrides = {}) => ({
  fromId: 'gov-1-40-2026',
  toId: 'gov-1-39-2026',
  blocked: null,
  applied: true,
  fromAttendance: [40, 28],
  fromIncome: [350, 250],
  toAttendance: [10, 22],
  toIncome: [50, 150],
  ...overrides,
})

// Church "Jesus Encounter" -> eid "Jesus Encounter-eid", id "Jesus Encounter-id".
const eidToId = (eid) => eid.replace(/-eid$/, '-id')

/** A plan in which every church resolves cleanly and can be moved. */
const happyPlan = (overrides = {}) => ({
  [DATE_PARTS]: ({ date }) => [DATE_PARTS_BY_DATE[date]],
  [FIND_CHURCHES]: ({ churchName }) => [
    churchRow({
      eid: `${churchName}-eid`,
      id: `${churchName}-id`,
      name: churchName,
    }),
  ],
  [FIND_RECORDS_ON_DATE]: ({ churchEid }) => [
    recordRow({ id: `${eidToId(churchEid)}-40-2026` }),
  ],
  [FIND_CLASHES]: () => [],
  [MOVE_RECORD]: ({ churchEid }) => [
    { newId: `${eidToId(churchEid)}-39-2026`, rekey: true },
  ],
  [ADJUST_SNAPSHOTS]: ({ apply }) => [snapshotRow({ applied: apply })],
  ...overrides,
})

const opts = (overrides = {}) => ({
  fromDate: FROM,
  toDate: TO,
  churchNames: ['Jesus Encounter'],
  campusName: 'Energy',
  ref: 'SYN-222',
  dryRun: false,
  ...overrides,
})

const queriesRun = (session) => session.calls.map((c) => c.query)
const adjustCalls = (session) =>
  session.calls.filter((c) => c.query === ADJUST_SNAPSHOTS)
const asNumbers = (params, keys) =>
  Object.fromEntries(
    keys.map((k) => {
      expect(neo4j.isInt(params[k])).toBe(true)
      return [k, params[k].toNumber()]
    })
  )

// ---------------------------------------------------------------------------
// Cypher shape
// ---------------------------------------------------------------------------

describe('SYN-222 Cypher — parameter safety (ADR-012)', () => {
  // Asserting on the SOURCE: by the time the module is imported, template
  // literals have been evaluated, so `${...}` could never show up at runtime.
  const source = fs.readFileSync(
    require.resolve('./move-service-record-date'),
    'utf8'
  )

  it('interpolates nothing into any Cypher template literal', () => {
    // Anchor on `const X = \`<newline>` so backticks inside the header comment
    // cannot be mis-paired with a query.
    const templates = [
      ...source.matchAll(/^const [A-Z_]+ = `\n([\s\S]*?)`$/gm),
    ].map((m) => m[1])
    expect(templates).toHaveLength(7)
    templates.forEach((t) => {
      expect(t).toMatch(/\b(MATCH|RETURN)\b/)
      expect(t).not.toContain('${')
    })
  })

  it.each([
    ['FIND_CHURCHES', FIND_CHURCHES, ['campusName', 'churchName']],
    ['FIND_RECORDS_ON_DATE', FIND_RECORDS_ON_DATE, ['churchEid', 'fromDate']],
    [
      'FIND_ALREADY_MOVED',
      FIND_ALREADY_MOVED,
      ['churchEid', 'fromDate', 'toDate'],
    ],
    ['FIND_CLASHES', FIND_CLASHES, ['churchEid', 'recordId', 'toDate']],
    [
      'MOVE_RECORD',
      MOVE_RECORD,
      ['churchEid', 'fromDate', 'recordId', 'ref', 'toDate'],
    ],
    ['DATE_PARTS', DATE_PARTS, ['date']],
    [
      'ADJUST_SNAPSHOTS',
      ADJUST_SNAPSHOTS,
      [
        'apply',
        'fromWeek',
        'fromYear',
        'marker',
        'newId',
        'oldId',
        'renames',
        'toMonth',
        'toWeek',
        'toYear',
      ],
    ],
  ])('%s binds exactly the expected params', (_n, cypher, expected) => {
    expect(paramsOf(cypher)).toEqual(expected)
  })

  it.each([
    ['FIND_RECORDS_ON_DATE', FIND_RECORDS_ON_DATE],
    ['FIND_ALREADY_MOVED', FIND_ALREADY_MOVED],
    ['FIND_CLASHES', FIND_CLASHES],
    ['MOVE_RECORD', MOVE_RECORD],
  ])('%s anchors the church by elementId, never a label-less id', (_n, c) => {
    const q = squash(c)
    expect(q).toContain('MATCH (church) WHERE elementId(church) = $churchEid')
    expect(q).not.toMatch(/\{id: \$churchId\}/)
    expect(q).not.toContain('$churchId')
  })
})

describe('FIND_CHURCHES', () => {
  const q = squash(FIND_CHURCHES)

  it('accepts only the four levels recordService writes for (no Ministry)', () => {
    expect(q).toContain(
      'WHERE (church:Bacenta OR church:Governorship OR church:Council OR church:Stream)'
    )
    expect(q).not.toMatch(/church:\w*Ministry/)
  })

  it('returns the elementId as eid', () => {
    expect(q).toContain('RETURN elementId(church) AS eid, church.id AS id')
  })

  it('matches names case- and whitespace-insensitively and filters by campus when given', () => {
    expect(q).toContain(
      'toLower(trim(church.name)) = toLower(trim($churchName))'
    )
    expect(q).toContain('WHERE $campusName IS NULL OR any(c IN campuses')
  })
})

describe('DATE_PARTS', () => {
  it('returns the week parts of the date and of the database clock', () => {
    expect(squash(DATE_PARTS)).toBe(
      'RETURN date($date).week AS week, date($date).year AS year, date($date).month AS month, date().week AS nowWeek, date().year AS nowYear, date($date) > date() AS isFuture'
    )
  })
})

describe('MOVE_RECORD', () => {
  const q = squash(MOVE_RECORD)

  it('re-asserts the from-date guard on the record being moved', () => {
    expect(q).toContain(
      '(record:ServiceRecord {id: $recordId})-[old:SERVICE_HELD_ON]->(fromDay:TimeGraph)'
    )
    expect(q).toContain('WHERE fromDay.date = date($fromDate)')
  })

  it('re-asserts the banking-in-flight guard', () => {
    expect(q).toContain(
      "AND NOT coalesce(record.transactionStatus, '') IN ['pending', 'send OTP']"
    )
  })

  it('re-asserts the to-key clash guard', () => {
    expect(q).toContain(
      "church.id + '-' + toString(date($toDate).week) + '-' + toString(date($toDate).year) AS toKey"
    )
    expect(q).toContain(
      'WHERE NOT EXISTS { MATCH (other:ServiceRecord {id: toKey}) WHERE other <> record }'
    )
  })

  it('re-asserts the to-week clash guard', () => {
    expect(q).toMatch(
      /AND NOT EXISTS \{ MATCH \(church\)-\[:HAS_HISTORY\|CURRENT_HISTORY\]->\(:ServiceLog\)-\[:HAS_SERVICE\]->\(other:ServiceRecord\)-\[:SERVICE_HELD_ON\]->\(day:TimeGraph\) WHERE other <> record AND day\.date\.week = date\(\$toDate\)\.week AND day\.date\.year = date\(\$toDate\)\.year \}/
    )
  })

  it('computes rekey from the pre-move id before any SET', () => {
    const rekeyAt = q.indexOf('record.id = fromKey AS rekey')
    expect(rekeyAt).toBeGreaterThan(-1)
    expect(rekeyAt).toBeLessThan(q.indexOf('SET '))
    expect(q).toContain(
      "church.id + '-' + toString(date($fromDate).week) + '-' + toString(date($fromDate).year) AS fromKey"
    )
  })

  it('re-points SERVICE_HELD_ON: deletes the old edge, merges the to-day', () => {
    const del = q.indexOf('DELETE old')
    expect(del).toBeGreaterThan(-1)
    expect(del).toBeLessThan(
      q.indexOf('MERGE (toDay:TimeGraph {date: date($toDate)})')
    )
    expect(q).toContain('MERGE (record)-[:SERVICE_HELD_ON]->(toDay)')
  })

  it('stamps serviceDateCorrectedFromId in one SET and the id in a later, separate SET', () => {
    const sets = q.match(/\bSET\b/g)
    expect(sets).toHaveLength(2)
    const stampAt = q.indexOf(
      'SET record.serviceDateCorrectedFromId = record.id'
    )
    const idAt = q.indexOf(
      'SET record.id = CASE WHEN rekey THEN toKey ELSE record.id END'
    )
    expect(stampAt).toBeGreaterThan(-1)
    expect(idAt).toBeGreaterThan(stampAt)
    // The id is not assigned inside the first SET.
    expect(q.slice(stampAt, idAt)).not.toMatch(/record\.id =/)
    expect(q.indexOf('RETURN record.id AS newId, rekey')).toBeGreaterThan(idAt)
  })

  it('stamps the correction audit fields on the record', () => {
    expect(q).toContain('record.serviceDateCorrectedFrom = date($fromDate)')
    expect(q).toContain('record.serviceDateCorrectedAt = datetime()')
    expect(q).toContain('record.serviceDateCorrectionRef = $ref')
  })
})

describe('FIND_ALREADY_MOVED', () => {
  const q = squash(FIND_ALREADY_MOVED)

  it('only finds records on --to that this script stamped as moved from --from', () => {
    expect(q).toContain('WHERE day.date = date($toDate)')
    expect(q).toContain('record.serviceDateCorrectedFrom = date($fromDate)')
  })

  it('returns the pre-move id, falling back to the id when it was not re-keyed', () => {
    expect(q).toContain(
      'coalesce(record.serviceDateCorrectedFromId, record.id) AS previousId'
    )
  })

  it('returns the ref stored on the record so a retry reuses its marker', () => {
    expect(q).toContain('record.serviceDateCorrectionRef AS ref')
  })
})

describe('FIND_CLASHES', () => {
  const q = squash(FIND_CLASHES)

  it('checks for another record of the church held in the to-week', () => {
    expect(q).toContain(
      'WHERE day.date.week = date($toDate).week AND day.date.year = date($toDate).year AND other.id <> $recordId'
    )
  })

  it('checks for any ServiceRecord already holding the to-week key', () => {
    expect(q).toContain(
      "MATCH (other:ServiceRecord {id: church.id + '-' + toString(date($toDate).week) + '-' + toString(date($toDate).year)}) WHERE other.id <> $recordId"
    )
  })

  it('unions both checks and collapses them per record id', () => {
    expect(q).toContain('UNION')
    expect(q).toContain(
      'RETURN other.id AS id, labels(other) AS labels, max(heldOn) AS heldOn'
    )
  })
})

describe('ADJUST_SNAPSHOTS', () => {
  const q = squash(ADJUST_SNAPSHOTS)
  const gate =
    'FOREACH (_ IN CASE WHEN $apply AND blocked IS NULL THEN [1] ELSE [] END |'
  const returnClause = 'RETURN a.id AS fromId, toId, blocked,'

  it('targets --from-week snapshots that list oldId and lack the marker', () => {
    expect(q).toMatch(
      /^MATCH \(a:AggregateServiceRecord\) WHERE a\.week = \$fromWeek AND a\.year = \$fromYear AND \$oldId IN coalesce\(a\.componentServiceIds, \[\]\) AND NOT \$marker IN coalesce\(a\.serviceDateCorrections, \[\]\) /
    )
  })

  it('resolves the owner through the ServiceLog holding the --from snapshot, excluding the leader', () => {
    expect(q).toContain(
      'OPTIONAL MATCH (owner)-[:HAS_HISTORY|CURRENT_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(a)'
    )
    // The id check rules out the leader Member, who also has HAS_HISTORY.
    expect(q).toContain(
      "WHERE a.id = owner.id + '-' + toString($fromWeek) + '-' + toString($fromYear)"
    )
    expect(q).toContain('WITH a, head(collect(DISTINCT owner)) AS owner')
    expect(q).toContain(
      'OPTIONAL MATCH (owner)-[:CURRENT_HISTORY]->(log:ServiceLog)'
    )
  })

  it('keys the --to snapshot <owner.id>-<toWeek>-<toYear> and MERGEs on that id (ADR-014)', () => {
    expect(q).toContain(
      "CASE WHEN owner IS NULL THEN null ELSE owner.id + '-' + toString($toWeek) + '-' + toString($toYear) END AS toId"
    )
    expect(q).toContain(
      'OPTIONAL MATCH (dst:AggregateServiceRecord) WHERE dst.id = toId'
    )
    expect(q).toContain('MERGE (d:AggregateServiceRecord {id: toId})')
    expect(q).toContain(
      'ON CREATE SET d.week = $toWeek, d.year = $toYear, d.month = $toMonth, d.currency = a.currency, d._isNew = true'
    )
  })

  it('drops oldId from the --from list and adds newId exactly once to the --to list', () => {
    expect(q).toContain(
      '[x IN a.componentServiceIds WHERE x <> $oldId] AS keep'
    )
    expect(q).toContain(
      '[x IN coalesce(dst.componentServiceIds, []) WHERE x <> $newId] + [$newId] AS ids'
    )
  })

  it('resolves both component lists through $renames and skips NoService', () => {
    expect(q).toContain(
      'OPTIONAL MATCH (r:ServiceRecord) WHERE r.id IN [x IN keep | coalesce($renames[x], x)] AND NOT r:NoService RETURN collect(DISTINCT r) AS fromRs'
    )
    expect(q).toContain(
      'OPTIONAL MATCH (r:ServiceRecord) WHERE r.id IN [x IN ids | coalesce($renames[x], x)] AND NOT r:NoService RETURN collect(DISTINCT r) AS toRs'
    )
    expect(q.match(/coalesce\(\$renames\[x\], x\)/g)).toHaveLength(2)
  })

  it('computes blocked from every refusal reason, in order, else null', () => {
    const blocked = q.slice(q.indexOf("CASE WHEN owner IS NULL THEN 'owner"))
    expect(blocked).toMatch(
      new RegExp(
        [
          "WHEN owner IS NULL THEN 'owner of the --from snapshot not found'",
          "WHEN size\\(fromRs\\) <> size\\(keep\\) THEN 'a --from component no longer resolves'",
          "WHEN dst IS NULL AND log IS NULL THEN 'owner has no current ServiceLog to hold a new --to snapshot'",
          "WHEN dst IS NOT NULL AND dst\\.componentServiceIds IS NULL THEN 'the --to snapshot has no component list'",
          "WHEN size\\(toRs\\) <> size\\(ids\\) THEN 'a --to component no longer resolves'",
          "WHEN \\$marker IN coalesce\\(dst\\.serviceDateCorrections, \\[\\]\\) THEN 'the --to snapshot already carries this correction'",
          "WHEN \\(owner:Oversight OR owner:Denomination\\) AND \\(a\\.currency IS NULL OR \\(dst IS NOT NULL AND dst\\.currency IS NULL\\)\\) THEN 'oversight/denomination snapshot has no currency'",
          'ELSE null END AS blocked',
        ].join(' ')
      )
    )
  })

  it('writes nothing outside the single $apply / blocked gate — both sides or neither', () => {
    const gateAt = q.indexOf(gate)
    const returnAt = q.indexOf(returnClause)
    expect(gateAt).toBeGreaterThan(-1)
    expect(returnAt).toBeGreaterThan(gateAt)
    expect(q.split(gate)).toHaveLength(2)

    const writes = [
      ...q.matchAll(/\b(SET|MERGE|CREATE|DELETE|REMOVE|DETACH)\b/g),
    ]
    expect(writes.length).toBeGreaterThan(0)
    writes.forEach((w) => {
      expect(w.index).toBeGreaterThan(gateAt)
      expect(w.index).toBeLessThan(returnAt)
    })
    // The gated FOREACH closes right before RETURN, so the --from SET and the
    // --to MERGE/SET are in the same body.
    expect(q).toContain(
      'd.serviceDateCorrections = coalesce(d.serviceDateCorrections, []) + $marker ) RETURN a.id AS fromId'
    )
    expect(q.indexOf('SET a.componentServiceIds = keep')).toBeLessThan(
      q.indexOf('MERGE (d:AggregateServiceRecord {id: toId})')
    )
  })

  it('overwrites, never increments (ADR-014)', () => {
    expect(q).not.toContain('+=')
  })

  it('re-sums the --from snapshot with the currency rule and appends the marker', () => {
    expect(q).toContain(
      "SET a.componentServiceIds = keep, a.numberOfServices = size(fromRs), a.attendance = fromAttendance, a.income = CASE WHEN a.currency = 'USD' THEN fromDollar ELSE fromNative END, a.dollarIncome = fromDollar, a.recomputedAt = datetime(), a.serviceDateCorrections = coalesce(a.serviceDateCorrections, []) + $marker"
    )
  })

  it('re-sums the --to snapshot with the currency rule and appends the marker', () => {
    expect(q).toContain(
      "SET d.componentServiceIds = ids, d.numberOfServices = size(toRs), d.attendance = toAttendance, d.income = CASE WHEN d.currency = 'USD' THEN toDollar ELSE toNative END, d.dollarIncome = toDollar, d.recomputedAt = datetime(), d.serviceDateCorrections = coalesce(d.serviceDateCorrections, []) + $marker"
    )
  })

  it('sums attendance, native and dollar income from the resolved components', () => {
    const sides = ['from', 'to']
    sides.forEach((side) => {
      expect(q).toContain(
        `round(toFloat(reduce(s = 0.0, x IN ${side}Rs | s + coalesce(x.attendance, 0))), 2) AS ${side}Attendance`
      )
      expect(q).toContain(
        `round(toFloat(reduce(s = 0.0, x IN ${side}Rs | s + coalesce(x.income, 0))), 2) AS ${side}Native`
      )
      expect(q).toContain(
        `round(toFloat(reduce(s = 0.0, x IN ${side}Rs | s + coalesce(x.dollarIncome, 0))), 2) AS ${side}Dollar`
      )
    })
  })

  it('links HAS_SERVICE_AGGREGATE only for a newly created --to snapshot and drops the temp flag', () => {
    const link =
      'FOREACH (l IN CASE WHEN d._isNew THEN [log] ELSE [] END | MERGE (l)-[:HAS_SERVICE_AGGREGATE]->(d) )'
    expect(q).toContain(link)
    expect(q.match(/HAS_SERVICE_AGGREGATE\]->\(d\)/g)).toHaveLength(1)
    const linkAt = q.indexOf(link)
    const removeAt = q.indexOf('REMOVE d._isNew')
    expect(removeAt).toBeGreaterThan(linkAt)
    expect(removeAt).toBeLessThan(q.indexOf('SET d.componentServiceIds = ids'))
  })

  it('returns ids, blocked, applied and before/after figures for both sides', () => {
    expect(q).toContain(
      "RETURN a.id AS fromId, toId, blocked, $apply AND blocked IS NULL AS applied, fromAttendanceBefore, fromIncomeBefore, fromAttendance AS fromAttendanceAfter, CASE WHEN a.currency = 'USD' THEN fromDollar ELSE fromNative END AS fromIncomeAfter, toAttendanceBefore, toIncomeBefore, toAttendance AS toAttendanceAfter, CASE WHEN toCurrency = 'USD' THEN toDollar ELSE toNative END AS toIncomeAfter ORDER BY fromId"
    )
    expect(q).toContain(
      'a.attendance AS fromAttendanceBefore, a.income AS fromIncomeBefore, dst.attendance AS toAttendanceBefore, dst.income AS toIncomeBefore'
    )
  })

  it('reports the --to income under the same currency the write uses', () => {
    // An existing --to snapshot keeps its own currency (even null); only a new
    // one takes the --from currency. Reporting coalesce(dst, a) instead would
    // show dollar income for a null-currency snapshot that is written native.
    expect(q).toContain(
      'CASE WHEN dst IS NULL THEN a.currency ELSE dst.currency END AS toCurrency'
    )
    expect(q).not.toContain('coalesce(dst.currency, a.currency)')
    expect(q).toContain('d.currency = a.currency, d._isNew = true')
    expect(q).toContain(
      "d.income = CASE WHEN d.currency = 'USD' THEN toDollar ELSE toNative END"
    )
    expect(q).toContain(
      "CASE WHEN toCurrency = 'USD' THEN toDollar ELSE toNative END AS toIncomeAfter"
    )
  })
})

// ---------------------------------------------------------------------------
// isIsoCalendarDate / looksLikeProd / correctionMarker
// ---------------------------------------------------------------------------

describe('isIsoCalendarDate', () => {
  it.each(['2026-09-27', '2024-02-29', '1999-12-31'])('accepts %s', (v) => {
    expect(isIsoCalendarDate(v)).toBe(true)
  })

  it.each([
    '2026-02-30',
    '2026-13-01',
    '2026-02-29',
    '27/09/2026',
    '2026-09-27T00:00:00Z',
    '',
    null,
    undefined,
    20260927,
  ])('rejects %p', (v) => {
    expect(isIsoCalendarDate(v)).toBe(false)
  })
})

describe('looksLikeProd', () => {
  it('flags the production host', () => {
    expect(looksLikeProd('neo4j+s://neo4j.firstlovecenter.com:7687')).toBe(true)
  })

  it.each([
    'bolt://dev-neo4j.firstlovecenter.com:7687',
    'bolt://localhost:7687',
    '',
    null,
    undefined,
  ])('does not flag %p', (uri) => {
    expect(looksLikeProd(uri)).toBe(false)
  })
})

describe('correctionMarker', () => {
  it('combines ref, old id and new id', () => {
    expect(correctionMarker('SYN-222', 'b-1-40-2026', 'b-1-39-2026')).toBe(
      'SYN-222:b-1-40-2026->b-1-39-2026'
    )
  })
})

describe('describeUri', () => {
  it('drops credentials, keeping scheme and host', () => {
    expect(
      describeUri('neo4j+s://neo4j:secret@neo4j.firstlovecenter.com:7687')
    ).toBe('neo4j+s://neo4j.firstlovecenter.com:7687')
  })

  it('keeps a credential-free URI as scheme and host', () => {
    expect(describeUri('bolt://dev-neo4j.firstlovecenter.com:7687/db')).toBe(
      'bolt://dev-neo4j.firstlovecenter.com:7687'
    )
  })

  it.each(['not a uri', '', null, undefined])(
    'reports %p as unparseable without echoing it',
    (uri) => {
      expect(describeUri(uri)).toBe('(unparseable NEO4J_URI)')
    }
  )
})

// ---------------------------------------------------------------------------
// parseArgs / validateArgs
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('collects every --church and defaults the rest (no --ref default)', () => {
    expect(
      parseArgs([
        '--from',
        FROM,
        '--to',
        TO,
        '--church',
        'Jesus Encounter',
        '--church',
        'Blessed Encounter',
      ])
    ).toEqual({
      fromDate: FROM,
      toDate: TO,
      churchNames: ['Jesus Encounter', 'Blessed Encounter'],
      campusName: null,
      ref: null,
      dryRun: false,
      allowProd: false,
      unknownArgs: [],
      missingValues: [],
    })
  })

  it('reads --campus, --ref and the boolean flags', () => {
    const args = parseArgs([
      '--allow-prod',
      '--dry-run',
      '--campus',
      'Energy',
      '--ref',
      'OPS-1',
    ])
    expect(args.campusName).toBe('Energy')
    expect(args.ref).toBe('OPS-1')
    expect(args.dryRun).toBe(true)
    expect(args.allowProd).toBe(true)
    expect(args.churchNames).toEqual([])
    expect(args.fromDate).toBeNull()
    expect(args.unknownArgs).toEqual([])
    expect(args.missingValues).toEqual([])
  })

  it('lets the last value win for single-valued flags', () => {
    const args = parseArgs([
      '--from',
      '2026-01-01',
      '--from',
      FROM,
      '--ref',
      'a',
      '--ref',
      'b',
    ])
    expect(args.fromDate).toBe(FROM)
    expect(args.ref).toBe('b')
  })

  it('reports a trailing value flag as missing its value', () => {
    const args = parseArgs(['--to'])
    expect(args.toDate).toBeNull()
    expect(args.missingValues).toEqual(['--to'])
  })

  it('never takes a following flag as a value; reports the value as missing', () => {
    // `--church --dry-run` must not turn "--dry-run" into a church name.
    const args = parseArgs(['--church', '--dry-run', '--to', '--allow-prod'])
    expect(args.churchNames).toEqual([])
    expect(args.toDate).toBeNull()
    expect(args.dryRun).toBe(true)
    expect(args.allowProd).toBe(true)
    expect(args.missingValues).toEqual(['--church', '--to'])
    expect(args.unknownArgs).toEqual([])
  })

  it('lists stray words from an unquoted church name as unknown', () => {
    const args = parseArgs(['--church', 'Jesus', 'Encounter', '--from', FROM])
    expect(args.churchNames).toEqual(['Jesus'])
    expect(args.unknownArgs).toEqual(['Encounter'])
    expect(args.fromDate).toBe(FROM)
  })

  it('lists typo’d flags as unknown, so a typo cannot become a live run', () => {
    const args = parseArgs([
      '--dryrun',
      '-dry-run',
      '--from',
      FROM,
      '--to=2026-09-27',
    ])
    expect(args.unknownArgs).toEqual([
      '--dryrun',
      '-dry-run',
      '--to=2026-09-27',
    ])
    expect(args.dryRun).toBe(false)
    expect(args.toDate).toBeNull()
  })

  it('accepts a single-dash token as a value (only `--` marks a flag)', () => {
    // Documented behaviour: the "missing value" check only looks for `--`.
    const args = parseArgs(['--church', '-x'])
    expect(args.churchNames).toEqual(['-x'])
    expect(args.unknownArgs).toEqual([])
    expect(args.missingValues).toEqual([])
  })
})

describe('validateArgs', () => {
  const ok = { fromDate: FROM, toDate: TO, churchNames: ['A'], ref: 'SYN-222' }

  it('accepts usable args (unknownArgs / missingValues default to empty)', () => {
    expect(validateArgs(ok)).toEqual([])
    expect(validateArgs({ ...ok, unknownArgs: [], missingValues: [] })).toEqual(
      []
    )
  })

  it('rejects bad dates', () => {
    expect(
      validateArgs({ ...ok, fromDate: '2026-02-30', toDate: null })
    ).toEqual([
      '--from must be a real YYYY-MM-DD date.',
      '--to must be a real YYYY-MM-DD date.',
    ])
  })

  it('rejects moving a record onto the same date', () => {
    expect(validateArgs({ ...ok, toDate: FROM })).toEqual([
      '--from and --to are the same date; nothing to move.',
    ])
  })

  it('rejects an empty church list', () => {
    expect(validateArgs({ ...ok, churchNames: [] })).toEqual([
      'Pass at least one --church NAME.',
    ])
  })

  it('requires --ref', () => {
    expect(validateArgs({ ...ok, ref: null })).toEqual([
      'Pass --ref (e.g. the ticket key) for the audit stamp.',
    ])
  })

  it('reports unrecognised args first, then missing values, then the rest', () => {
    expect(
      validateArgs({
        ...ok,
        ref: null,
        unknownArgs: ['Encounter', '--dryrun'],
        missingValues: ['--campus'],
      })
    ).toEqual([
      'Unrecognised argument "Encounter" (quote multi-word names: --church "Jesus Encounter").',
      'Unrecognised argument "--dryrun" (quote multi-word names: --church "Jesus Encounter").',
      '--campus needs a value.',
      'Pass --ref (e.g. the ticket key) for the audit stamp.',
    ])
  })

  it('rejects the output of parseArgs for an unquoted name and a bare flag', () => {
    const problems = validateArgs(
      parseArgs([
        '--from',
        FROM,
        '--to',
        TO,
        '--ref',
        'SYN-222',
        '--church',
        'Jesus',
        'Encounter',
        '--campus',
      ])
    )
    expect(problems).toEqual([
      'Unrecognised argument "Encounter" (quote multi-word names: --church "Jesus Encounter").',
      '--campus needs a value.',
    ])
  })

  it('does not report "same date" when both are missing', () => {
    expect(validateArgs({ ...ok, fromDate: null, toDate: null })).not.toContain(
      '--from and --to are the same date; nothing to move.'
    )
  })
})

// ---------------------------------------------------------------------------
// moveServiceRecords
// ---------------------------------------------------------------------------

describe('moveServiceRecords', () => {
  it('resolves both dates (from, then to) before the church lookup', async () => {
    const session = makeSession(happyPlan())
    await moveServiceRecords(session, opts({ dryRun: true }))
    expect(session.calls.slice(0, 3)).toEqual([
      { query: DATE_PARTS, params: { date: FROM } },
      { query: DATE_PARTS, params: { date: TO } },
      {
        query: FIND_CHURCHES,
        params: { churchName: 'Jesus Encounter', campusName: 'Energy' },
      },
    ])
  })

  it('throws when --from and --to fall in the same ISO week, before any lookup', async () => {
    const session = makeSession(
      happyPlan({
        [DATE_PARTS]: () => [
          { week: 40, year: 2026, month: 10, nowWeek: 41, nowYear: 2026 },
        ],
      })
    )

    await expect(
      moveServiceRecords(session, opts({ toDate: '2026-10-02' }))
    ).rejects.toThrow(
      `${FROM} and 2026-10-02 are in the same week (40/2026); nothing to re-key.`
    )
    expect(queriesRun(session)).toEqual([DATE_PARTS, DATE_PARTS])
  })

  it('throws when --from is in the current week, before any lookup', async () => {
    const session = makeSession(
      happyPlan({
        [DATE_PARTS]: ({ date }) => [
          {
            ...DATE_PARTS_BY_DATE[date],
            nowWeek: neo4j.int(40),
            nowYear: neo4j.int(2026),
          },
        ],
      })
    )

    await expect(moveServiceRecords(session, opts())).rejects.toThrow(
      `${FROM} is in the current week; the Lambda rewrites this week's snapshots from live data, so move it after the week closes.`
    )
    expect(queriesRun(session)).toEqual([DATE_PARTS, DATE_PARTS])
  })

  it('allows --from with the current week number in a different year', async () => {
    const session = makeSession(
      happyPlan({
        [DATE_PARTS]: ({ date }) => [
          { ...DATE_PARTS_BY_DATE[date], nowWeek: 40, nowYear: 2027 },
        ],
      })
    )

    const result = await moveServiceRecords(session, opts())

    expect(result.moved).toHaveLength(1)
  })

  it('refuses a --to date in the future before touching any church', async () => {
    const session = makeSession(
      happyPlan({
        [DATE_PARTS]: ({ date }) => [
          { ...DATE_PARTS_BY_DATE[date], isFuture: date === TO },
        ],
      })
    )

    await expect(moveServiceRecords(session, opts())).rejects.toThrow(
      `${TO} is in the future; a service cannot be moved there.`
    )
    expect(queriesRun(session)).toEqual([DATE_PARTS, DATE_PARTS])
  })

  it('allows --to in the current week (only --from is guarded)', async () => {
    const session = makeSession(
      happyPlan({
        [DATE_PARTS]: ({ date }) => [
          { ...DATE_PARTS_BY_DATE[date], nowWeek: 39, nowYear: 2026 },
        ],
      })
    )

    const result = await moveServiceRecords(session, opts())

    expect(result.moved).toHaveLength(1)
  })

  it('reports a church that cannot be found as unresolved, writing nothing', async () => {
    const session = makeSession(happyPlan({ [FIND_CHURCHES]: () => [] }))

    const result = await moveServiceRecords(session, opts())

    expect(result.unresolved).toEqual([
      {
        churchName: 'Jesus Encounter',
        reason:
          'no Bacenta/Governorship/Council/Stream with this name (and campus)',
        candidates: [],
      },
    ])
    expect(result.moved).toEqual([])
    expect(result.aggregates).toEqual([])
    expect(queriesRun(session)).not.toContain(MOVE_RECORD)
    expect(queriesRun(session)).not.toContain(FIND_RECORDS_ON_DATE)
    expect(queriesRun(session)).not.toContain(ADJUST_SNAPSHOTS)
  })

  it('reports an ambiguous church name as unresolved, writing nothing', async () => {
    const session = makeSession(
      happyPlan({
        [FIND_CHURCHES]: () => [
          churchRow({ id: 'a', eid: 'e-a' }),
          churchRow({ id: 'b', eid: 'e-b' }),
        ],
      })
    )

    const result = await moveServiceRecords(session, opts())

    expect(result.unresolved).toHaveLength(1)
    expect(result.unresolved[0].reason).toBe(
      '2 churches match — narrow with --campus'
    )
    expect(result.unresolved[0].candidates.map((c) => c.id)).toEqual(['a', 'b'])
    expect(queriesRun(session)).not.toContain(MOVE_RECORD)
  })

  it('reports no record on --from as unresolved', async () => {
    const session = makeSession(happyPlan({ [FIND_RECORDS_ON_DATE]: () => [] }))

    const result = await moveServiceRecords(session, opts())

    expect(result.unresolved[0].reason).toBe(`no service record on ${FROM}`)
    expect(result.planned).toEqual([])
    expect(result.alreadyMoved).toEqual([])
    const lookup = session.calls.find((c) => c.query === FIND_ALREADY_MOVED)
    expect(lookup.params).toEqual({
      churchEid: 'Jesus Encounter-eid',
      fromDate: FROM,
      toDate: TO,
    })
    expect(queriesRun(session)).not.toContain(FIND_CLASHES)
    expect(queriesRun(session)).not.toContain(MOVE_RECORD)
  })

  it('reports several records on --from as unresolved', async () => {
    const session = makeSession(
      happyPlan({
        [FIND_RECORDS_ON_DATE]: () => [
          recordRow({ id: 'r1' }),
          recordRow({ id: 'r2' }),
        ],
      })
    )

    const result = await moveServiceRecords(session, opts())

    expect(result.unresolved[0].reason).toBe(
      `2 service records on ${FROM} — move by hand`
    )
    expect(queriesRun(session)).not.toContain(FIND_ALREADY_MOVED)
    expect(queriesRun(session)).not.toContain(MOVE_RECORD)
  })

  it.each(['pending', 'send OTP'])(
    'refuses a record whose banking is in flight (%s)',
    async (status) => {
      const session = makeSession(
        happyPlan({
          [FIND_RECORDS_ON_DATE]: () => [
            recordRow({ id: 'r1', transactionStatus: status }),
          ],
        })
      )

      const result = await moveServiceRecords(session, opts())

      expect(result.unresolved).toHaveLength(1)
      expect(result.unresolved[0]).toMatchObject({
        churchName: 'Jesus Encounter',
        record: { id: 'r1', transactionStatus: status },
        candidates: [],
      })
      expect(result.unresolved[0].reason).toMatch(/banking/)
      expect(result.unresolved[0].reason).toContain(status)
      expect(result.planned).toEqual([])
      expect(queriesRun(session)).not.toContain(FIND_CLASHES)
      expect(queriesRun(session)).not.toContain(MOVE_RECORD)
    }
  )

  it.each(['success', null, undefined])(
    'lets a record with transactionStatus %p proceed',
    async (status) => {
      const session = makeSession(
        happyPlan({
          [FIND_RECORDS_ON_DATE]: () => [
            recordRow({ id: 'r1', transactionStatus: status }),
          ],
        })
      )

      const result = await moveServiceRecords(session, opts())

      expect(result.unresolved).toEqual([])
      expect(result.moved).toHaveLength(1)
    }
  )

  it('refuses a move that would clash in the to-week', async () => {
    const session = makeSession(
      happyPlan({
        [FIND_CLASHES]: () => [
          {
            id: 'Jesus Encounter-id-39-2026',
            labels: ['ServiceRecord'],
            heldOn: null,
          },
        ],
      })
    )

    const result = await moveServiceRecords(session, opts())

    expect(result.unresolved).toHaveLength(1)
    expect(result.unresolved[0]).toMatchObject({
      reason: `already has a service in the ${TO} week`,
      candidates: [
        {
          id: 'Jesus Encounter-id-39-2026',
          labels: ['ServiceRecord'],
          heldOn: null,
        },
      ],
    })
    expect(result.planned).toEqual([])
    expect(queriesRun(session)).not.toContain(MOVE_RECORD)
    const clash = session.calls.find((c) => c.query === FIND_CLASHES)
    expect(clash.params).toEqual({
      churchEid: 'Jesus Encounter-eid',
      recordId: 'Jesus Encounter-id-40-2026',
      toDate: TO,
    })
  })

  it('dry run: plans without moving and previews the adjustment with apply=false', async () => {
    const session = makeSession(happyPlan())

    const result = await moveServiceRecords(session, opts({ dryRun: true }))

    expect(result.planned).toHaveLength(1)
    expect(result.planned[0]).toMatchObject({
      churchName: 'Jesus Encounter',
      record: { id: 'Jesus Encounter-id-40-2026' },
      ref: 'SYN-222',
      pending: true,
      // The record carries the --from weekly key, so it is predicted re-keyed.
      newId: 'Jesus Encounter-id-39-2026',
    })
    expect(result.moved).toEqual([])
    expect(result.aggregateError).toBeNull()
    expect(queriesRun(session)).toEqual([
      DATE_PARTS,
      DATE_PARTS,
      FIND_CHURCHES,
      FIND_RECORDS_ON_DATE,
      FIND_CLASHES,
      ADJUST_SNAPSHOTS,
    ])
    const [adjust] = adjustCalls(session)
    expect(adjust.params.apply).toBe(false)
    expect(adjust.params.oldId).toBe('Jesus Encounter-id-40-2026')
    expect(adjust.params.newId).toBe('Jesus Encounter-id-39-2026')
    // Not moved yet: the predicted new id maps BACK to the current id.
    expect(adjust.params.renames).toEqual({
      'Jesus Encounter-id-39-2026': 'Jesus Encounter-id-40-2026',
    })
    expect(adjust.params.marker).toBe(
      'SYN-222:Jesus Encounter-id-40-2026->Jesus Encounter-id-39-2026'
    )
    expect(result.aggregates).toEqual([
      {
        churchName: 'Jesus Encounter',
        recordId: 'Jesus Encounter-id-40-2026',
        newId: 'Jesus Encounter-id-39-2026',
        alreadyMoved: false,
        snapshots: [snapshotOut({ applied: false })],
      },
    ])
  })

  it('dry run: predicts no re-key for a record that does not carry the --from key', async () => {
    const session = makeSession(
      happyPlan({ [FIND_RECORDS_ON_DATE]: () => [recordRow({ id: 'uuid-1' })] })
    )

    const result = await moveServiceRecords(session, opts({ dryRun: true }))

    expect(result.planned[0]).toMatchObject({ pending: true, newId: 'uuid-1' })
    expect(adjustCalls(session)[0].params.renames).toEqual({
      'uuid-1': 'uuid-1',
    })
  })

  it('dry run: reports an adjustment preview error as aggregateError', async () => {
    const session = makeSession(
      happyPlan({
        [ADJUST_SNAPSHOTS]: () => {
          throw new Error('preview failed')
        },
      })
    )

    const result = await moveServiceRecords(session, opts({ dryRun: true }))

    expect(result.aggregateError).toBe('preview failed')
    expect(result.aggregates).toBeNull()
    expect(result.planned).toHaveLength(1)
  })

  it('defaults to dry-run when dryRun is omitted', async () => {
    const session = makeSession(happyPlan())
    const { dryRun, ...rest } = opts()

    const result = await moveServiceRecords(session, rest)

    expect(queriesRun(session)).not.toContain(MOVE_RECORD)
    expect(adjustCalls(session).map((c) => c.params.apply)).toEqual([false])
    expect(result.planned[0].pending).toBe(true)
  })

  it('moves the record and adjusts aggregates with apply=true in a live run', async () => {
    const session = makeSession(happyPlan())

    const result = await moveServiceRecords(session, opts())

    const write = session.calls.find((c) => c.query === MOVE_RECORD)
    expect(write.params).toEqual({
      churchEid: 'Jesus Encounter-eid',
      recordId: 'Jesus Encounter-id-40-2026',
      fromDate: FROM,
      toDate: TO,
      ref: 'SYN-222',
    })
    expect(result.moved).toHaveLength(1)
    expect(result.moved[0]).toMatchObject({
      newId: 'Jesus Encounter-id-39-2026',
      rekeyed: true,
      ref: 'SYN-222',
      record: { id: 'Jesus Encounter-id-40-2026' },
    })
    // A live plan entry carries no dry-run prediction.
    expect(result.planned).toHaveLength(1)
    expect(Object.keys(result.planned[0]).sort()).toEqual([
      'church',
      'churchName',
      'record',
    ])
    expect(result.skipped).toEqual([])
    expect(result.aggregateError).toBeNull()

    const [adjust] = adjustCalls(session)
    expect(adjust.params.apply).toBe(true)
    expect(adjust.params.renames).toEqual({
      'Jesus Encounter-id-40-2026': 'Jesus Encounter-id-39-2026',
    })
    expect(result.aggregates).toEqual([
      {
        churchName: 'Jesus Encounter',
        recordId: 'Jesus Encounter-id-40-2026',
        newId: 'Jesus Encounter-id-39-2026',
        alreadyMoved: false,
        snapshots: [snapshotOut()],
      },
    ])
  })

  it('reports rekeyed=false when the record did not carry the weekly key', async () => {
    const session = makeSession(
      happyPlan({ [MOVE_RECORD]: () => [{ newId: 'uuid-1', rekey: false }] })
    )

    const result = await moveServiceRecords(session, opts())

    expect(result.moved[0]).toMatchObject({ newId: 'uuid-1', rekeyed: false })
  })

  it('reports a write that matched nothing as skipped, never as moved', async () => {
    const session = makeSession(happyPlan({ [MOVE_RECORD]: () => [] }))

    const result = await moveServiceRecords(session, opts())

    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].record.id).toBe('Jesus Encounter-id-40-2026')
    expect(result.moved).toEqual([])
    // Nothing moved => adjustment runs over an empty list.
    expect(result.aggregates).toEqual([])
    expect(queriesRun(session)).not.toContain(ADJUST_SNAPSHOTS)
  })

  it('records an error and keeps going with the next church', async () => {
    const plan = happyPlan()
    const session = makeSession({
      ...plan,
      [FIND_RECORDS_ON_DATE]: (params) => {
        if (params.churchEid === 'Broken-eid') throw new Error('bolt reset')
        return plan[FIND_RECORDS_ON_DATE](params)
      },
    })

    const result = await moveServiceRecords(
      session,
      opts({ churchNames: ['Broken', 'Jesus Encounter'] })
    )

    expect(result.failed).toEqual([
      { churchName: 'Broken', error: 'bolt reset' },
    ])
    expect(result.moved.map((m) => m.churchName)).toEqual(['Jesus Encounter'])
  })

  it('reports an aggregate-adjustment error without losing the committed moves', async () => {
    const session = makeSession(
      happyPlan({
        [ADJUST_SNAPSHOTS]: () => {
          throw new Error('adjust failed')
        },
      })
    )

    const result = await moveServiceRecords(session, opts())

    expect(result.aggregateError).toBe('adjust failed')
    expect(result.aggregates).toBeNull()
    expect(result.failed).toEqual([])
    expect(result.moved.map((m) => m.newId)).toEqual([
      'Jesus Encounter-id-39-2026',
    ])
  })

  it('applies every move before any aggregate adjustment, with the whole run’s renames', async () => {
    const session = makeSession(happyPlan())

    await moveServiceRecords(
      session,
      opts({ churchNames: ['Jesus Encounter', 'Blessed Encounter'] })
    )

    const q = queriesRun(session)
    expect(q.filter((x) => x === MOVE_RECORD)).toHaveLength(2)
    // All records are re-keyed before any adjustment, so a snapshot shared by
    // several moved churches (campus / oversight / denomination in the SYN-222
    // run) still lists the other moved records under their pre-move ids. Every
    // adjustment is therefore handed the whole run's renames so those ids
    // resolve — the bug a per-move map would reintroduce.
    expect(q.lastIndexOf(MOVE_RECORD)).toBeLessThan(q.indexOf(ADJUST_SNAPSHOTS))
    const adjusts = adjustCalls(session)
    expect(adjusts.map((c) => c.params.oldId)).toEqual([
      'Jesus Encounter-id-40-2026',
      'Blessed Encounter-id-40-2026',
    ])
    adjusts.forEach((c) =>
      expect(c.params.renames).toEqual({
        'Jesus Encounter-id-40-2026': 'Jesus Encounter-id-39-2026',
        'Blessed Encounter-id-40-2026': 'Blessed Encounter-id-39-2026',
      })
    )
  })

  it('includes records healed from an earlier run in the renames', async () => {
    const plan = happyPlan()
    const session = makeSession({
      ...plan,
      [FIND_RECORDS_ON_DATE]: (params) =>
        eidToId(params.churchEid) === 'Blessed Encounter-id'
          ? []
          : plan[FIND_RECORDS_ON_DATE](params),
      [FIND_ALREADY_MOVED]: () => [
        {
          id: 'Blessed Encounter-id-39-2026',
          previousId: 'Blessed Encounter-id-40-2026',
          ref: 'SYN-222',
        },
      ],
    })

    await moveServiceRecords(
      session,
      opts({ churchNames: ['Jesus Encounter', 'Blessed Encounter'] })
    )

    const adjusts = adjustCalls(session)
    expect(adjusts).toHaveLength(2)
    adjusts.forEach((c) =>
      expect(c.params.renames).toEqual({
        'Jesus Encounter-id-40-2026': 'Jesus Encounter-id-39-2026',
        'Blessed Encounter-id-40-2026': 'Blessed Encounter-id-39-2026',
      })
    )
  })

  it('heals a previous run: a record already moved is re-adjusted under its stored ref', async () => {
    const session = makeSession(
      happyPlan({
        [FIND_RECORDS_ON_DATE]: () => [],
        [FIND_ALREADY_MOVED]: ({ churchEid }) => [
          {
            id: `${eidToId(churchEid)}-39-2026`,
            previousId: `${eidToId(churchEid)}-40-2026`,
            ref: 'SYN-222',
          },
        ],
      })
    )

    // The operator typed the ref differently this time; the stored one wins.
    const result = await moveServiceRecords(session, opts({ ref: 'syn-222' }))

    expect(result.unresolved).toEqual([])
    expect(result.moved).toEqual([])
    expect(result.alreadyMoved).toEqual([
      expect.objectContaining({
        newId: 'Jesus Encounter-id-39-2026',
        record: { id: 'Jesus Encounter-id-40-2026' },
        ref: 'SYN-222',
      }),
    ])
    expect(queriesRun(session)).not.toContain(FIND_CLASHES)
    expect(queriesRun(session)).not.toContain(MOVE_RECORD)
    // The from side is fed the PRE-move id — what the stale from-week
    // snapshot still lists — and the same marker the original run used.
    const [adjust] = adjustCalls(session)
    expect(adjust.params.apply).toBe(true)
    // Flagged so an empty snapshot list (already finished) is not an error.
    expect(result.aggregates[0].alreadyMoved).toBe(true)
    expect(adjust.params.oldId).toBe('Jesus Encounter-id-40-2026')
    expect(adjust.params.newId).toBe('Jesus Encounter-id-39-2026')
    expect(adjust.params.marker).toBe(
      'SYN-222:Jesus Encounter-id-40-2026->Jesus Encounter-id-39-2026'
    )
    expect(result.aggregates).toHaveLength(1)
  })

  it.each([null, undefined, ''])(
    'falls back to the run ref when the stored ref is %p',
    async (stored) => {
      const session = makeSession(
        happyPlan({
          [FIND_RECORDS_ON_DATE]: () => [],
          [FIND_ALREADY_MOVED]: () => [
            { id: 'n-39', previousId: 'o-40', ref: stored },
          ],
        })
      )

      const result = await moveServiceRecords(session, opts({ ref: 'OPS-9' }))

      expect(result.alreadyMoved[0].ref).toBe('OPS-9')
      expect(adjustCalls(session)[0].params.marker).toBe('OPS-9:o-40->n-39')
    }
  )

  it('does not treat several already-moved records as a heal; stays unresolved', async () => {
    const session = makeSession(
      happyPlan({
        [FIND_RECORDS_ON_DATE]: () => [],
        [FIND_ALREADY_MOVED]: () => [
          { id: 'x', previousId: 'x', ref: 'SYN-222' },
          { id: 'y', previousId: 'y', ref: 'SYN-222' },
        ],
      })
    )

    const result = await moveServiceRecords(session, opts())

    expect(result.alreadyMoved).toEqual([])
    expect(result.unresolved[0].reason).toBe(`no service record on ${FROM}`)
    expect(queriesRun(session)).not.toContain(ADJUST_SNAPSHOTS)
  })

  it('dry run: previews an already-moved record (old → new) next to planned ones (new → old)', async () => {
    const plan = happyPlan()
    const session = makeSession({
      ...plan,
      [FIND_RECORDS_ON_DATE]: (params) =>
        eidToId(params.churchEid) === 'Blessed Encounter-id'
          ? []
          : plan[FIND_RECORDS_ON_DATE](params),
      [FIND_ALREADY_MOVED]: () => [
        {
          id: 'Blessed Encounter-id-39-2026',
          previousId: 'Blessed Encounter-id-40-2026',
          ref: 'SYN-222',
        },
      ],
    })

    const result = await moveServiceRecords(
      session,
      opts({
        dryRun: true,
        churchNames: ['Blessed Encounter', 'Jesus Encounter'],
      })
    )

    expect(result.alreadyMoved).toHaveLength(1)
    expect(result.planned).toHaveLength(1)
    expect(queriesRun(session)).not.toContain(MOVE_RECORD)
    const adjusts = adjustCalls(session)
    // Planned moves first, then already-moved ones.
    expect(adjusts.map((c) => c.params.oldId)).toEqual([
      'Jesus Encounter-id-40-2026',
      'Blessed Encounter-id-40-2026',
    ])
    adjusts.forEach((c) => {
      expect(c.params.apply).toBe(false)
      expect(c.params.renames).toEqual({
        'Jesus Encounter-id-39-2026': 'Jesus Encounter-id-40-2026',
        'Blessed Encounter-id-40-2026': 'Blessed Encounter-id-39-2026',
      })
    })
  })
})

// ---------------------------------------------------------------------------
// adjustAggregates
// ---------------------------------------------------------------------------

describe('adjustAggregates', () => {
  const from = { week: 40, year: 2026, month: 10 }
  const to = { week: 39, year: 2026, month: 9 }
  const move = (churchName, oldId, newId, extra = {}) => ({
    churchName,
    church: { name: churchName },
    record: { id: oldId },
    newId,
    ref: 'SYN-222',
    ...extra,
  })

  it('does nothing when there are no moves', async () => {
    const session = makeSession(happyPlan())

    const result = await adjustAggregates(session, {
      moves: [],
      from,
      to,
      apply: true,
    })

    expect(result).toEqual([])
    expect(session.run).not.toHaveBeenCalled()
  })

  it.each([true, false])(
    'runs ADJUST_SNAPSHOTS once per move with exact params (apply=%p)',
    async (apply) => {
      const session = makeSession(happyPlan())

      await adjustAggregates(session, {
        moves: [move('Jesus Encounter', 'b-1-40-2026', 'b-1-39-2026')],
        from,
        to,
        apply,
      })

      expect(queriesRun(session)).toEqual([ADJUST_SNAPSHOTS])
      const { params } = session.calls[0]
      expect(Object.keys(params).sort()).toEqual([
        'apply',
        'fromWeek',
        'fromYear',
        'marker',
        'newId',
        'oldId',
        'renames',
        'toMonth',
        'toWeek',
        'toYear',
      ])
      expect(params.apply).toBe(apply)
      expect(params.renames).toEqual({ 'b-1-40-2026': 'b-1-39-2026' })
      expect(params.oldId).toBe('b-1-40-2026')
      expect(params.newId).toBe('b-1-39-2026')
      expect(params.marker).toBe('SYN-222:b-1-40-2026->b-1-39-2026')
      expect(
        asNumbers(params, [
          'fromWeek',
          'fromYear',
          'toWeek',
          'toYear',
          'toMonth',
        ])
      ).toEqual({
        fromWeek: 40,
        fromYear: 2026,
        toWeek: 39,
        toYear: 2026,
        toMonth: 9,
      })
    }
  )

  it('maps a pending move new → old and every other move old → new', async () => {
    const session = makeSession(happyPlan())

    await adjustAggregates(session, {
      moves: [
        move('A', 'a-40-2026', 'a-39-2026', { pending: true }),
        move('B', 'b-40-2026', 'b-39-2026'),
      ],
      from,
      to,
      apply: false,
    })

    const expected = { 'a-39-2026': 'a-40-2026', 'b-40-2026': 'b-39-2026' }
    expect(adjustCalls(session)).toHaveLength(2)
    adjustCalls(session).forEach((c) =>
      expect(c.params.renames).toEqual(expected)
    )
  })

  it('builds each marker from that move’s own ref and runs moves in order', async () => {
    const session = makeSession(happyPlan())

    const result = await adjustAggregates(session, {
      moves: [
        move('A', 'a-40-2026', 'a-39-2026'),
        move('B', 'uuid-b', 'uuid-b', { ref: 'OPS-7' }),
      ],
      from,
      to,
      apply: true,
    })

    expect(adjustCalls(session).map((c) => c.params.marker)).toEqual([
      'SYN-222:a-40-2026->a-39-2026',
      'OPS-7:uuid-b->uuid-b',
    ])
    expect(result.map((r) => [r.churchName, r.recordId, r.newId])).toEqual([
      ['A', 'a-40-2026', 'a-39-2026'],
      ['B', 'uuid-b', 'uuid-b'],
    ])
  })

  it('normalises snapshot rows: neo4j ints and floats to numbers, null to 0, applied to boolean', async () => {
    const session = makeSession(
      happyPlan({
        [ADJUST_SNAPSHOTS]: () => [
          snapshotRow({
            fromAttendanceBefore: neo4j.int(40),
            fromIncomeAfter: 250.5,
            // A --to snapshot that does not exist yet has no "before".
            toAttendanceBefore: null,
            toIncomeBefore: undefined,
          }),
          snapshotRow({
            fromId: 'council-1-40-2026',
            toId: null,
            blocked: 'owner of the --from snapshot not found',
            applied: null,
            fromAttendanceAfter: null,
            fromIncomeAfter: null,
            toAttendanceAfter: null,
            toIncomeAfter: null,
          }),
        ],
      })
    )

    const [result] = await adjustAggregates(session, {
      moves: [move('Jesus Encounter', 'b-1-40-2026', 'b-1-39-2026')],
      from,
      to,
      apply: true,
    })

    expect(result).toEqual({
      churchName: 'Jesus Encounter',
      recordId: 'b-1-40-2026',
      newId: 'b-1-39-2026',
      alreadyMoved: false,
      snapshots: [
        snapshotOut({
          fromIncome: [350, 250.5],
          toAttendance: [0, 22],
          toIncome: [0, 150],
        }),
        {
          fromId: 'council-1-40-2026',
          toId: null,
          blocked: 'owner of the --from snapshot not found',
          applied: false,
          fromAttendance: [40, 0],
          fromIncome: [350, 0],
          toAttendance: [10, 0],
          toIncome: [50, 0],
        },
      ],
    })
  })

  it('returns an empty snapshot list when no --from snapshot lists the record', async () => {
    const session = makeSession(happyPlan({ [ADJUST_SNAPSHOTS]: () => [] }))

    const result = await adjustAggregates(session, {
      moves: [move('A', 'a-40-2026', 'a-39-2026')],
      from,
      to,
      apply: true,
    })

    expect(result).toEqual([
      {
        churchName: 'A',
        recordId: 'a-40-2026',
        newId: 'a-39-2026',
        alreadyMoved: false,
        snapshots: [],
      },
    ])
  })

  it('propagates a query failure to the caller', async () => {
    const session = makeSession(
      happyPlan({
        [ADJUST_SNAPSHOTS]: () => {
          throw new Error('adjust failed')
        },
      })
    )

    await expect(
      adjustAggregates(session, {
        moves: [move('A', 'a-40-2026', 'a-39-2026')],
        from,
        to,
        apply: true,
      })
    ).rejects.toThrow('adjust failed')
  })
})

// ---------------------------------------------------------------------------
// blockedSnapshots / exitCodeFor
// ---------------------------------------------------------------------------

describe('blockedSnapshots', () => {
  it('returns [] for null (adjustment failed)', () => {
    expect(blockedSnapshots(null)).toEqual([])
  })

  it('flattens blocked snapshots per church with their reason', () => {
    expect(
      blockedSnapshots([
        {
          churchName: 'A',
          snapshots: [
            snapshotOut({ fromId: 'gov-40' }),
            snapshotOut({
              fromId: 'council-40',
              blocked: 'a --to component no longer resolves',
              applied: false,
            }),
          ],
        },
        { churchName: 'B', snapshots: [] },
        {
          churchName: 'C',
          snapshots: [
            snapshotOut({
              fromId: 'ov-40',
              blocked: 'oversight/denomination snapshot has no currency',
              applied: false,
            }),
          ],
        },
      ])
    ).toEqual([
      {
        church: 'A',
        snapshot: 'council-40',
        reason: 'a --to component no longer resolves',
      },
      {
        church: 'C',
        snapshot: 'ov-40',
        reason: 'oversight/denomination snapshot has no currency',
      },
    ])
  })
})

describe('exitCodeFor', () => {
  const clean = () => ({
    planned: [{}],
    moved: [{}],
    alreadyMoved: [{}],
    unresolved: [],
    skipped: [],
    failed: [],
    aggregates: [{ churchName: 'A', snapshots: [snapshotOut()] }],
    aggregateError: null,
  })

  it('is 0 when everything was done', () => {
    expect(exitCodeFor(clean())).toBe(0)
  })

  it('is 0 when aggregates is null without an error (defensive)', () => {
    expect(exitCodeFor({ ...clean(), aggregates: null })).toBe(0)
  })

  it.each([
    ['an unresolved church', { unresolved: [{}] }],
    ['a skipped move', { skipped: [{}] }],
    ['a failed church', { failed: [{}] }],
    ['an aggregate error', { aggregateError: 'boom', aggregates: null }],
    [
      'a blocked snapshot',
      {
        aggregates: [
          {
            churchName: 'A',
            snapshots: [snapshotOut({ blocked: 'x', applied: false })],
          },
        ],
      },
    ],
    [
      'a fresh move that no --from snapshot listed',
      { aggregates: [{ churchName: 'A', alreadyMoved: false, snapshots: [] }] },
    ],
  ])('is 1 with %s', (_n, patch) => {
    expect(exitCodeFor({ ...clean(), ...patch })).toBe(1)
  })

  it('is 0 for a healed record whose adjustment had already finished', () => {
    expect(
      exitCodeFor({
        ...clean(),
        aggregates: [{ churchName: 'A', alreadyMoved: true, snapshots: [] }],
      })
    ).toBe(0)
  })
})

describe('unadjustedMoves', () => {
  it('returns [] for null', () => {
    expect(unadjustedMoves(null)).toEqual([])
  })

  it('lists only fresh moves with no snapshot rows', () => {
    const fresh = { churchName: 'A', alreadyMoved: false, snapshots: [] }
    const healed = { churchName: 'B', alreadyMoved: true, snapshots: [] }
    const adjusted = {
      churchName: 'C',
      alreadyMoved: false,
      snapshots: [snapshotOut()],
    }
    expect(unadjustedMoves([fresh, healed, adjusted])).toEqual([fresh])
  })
})
