/**
 * Unit tests for the SYN-219 TimeGraph date-type normalisation.
 *
 * No Neo4j connection required — the Cypher strings are inspected statically
 * and the session is mocked. The live-database behaviour these queries encode
 * (apoc.refactor.mergeNodes moving relationships and unioning labels, and the
 * TimeGraph.date index seek behind the USING INDEX hint) was verified against
 * dev Neo4j while working SYN-219.
 */

const fs = require('fs')

const {
  migrate,
  isIsoCalendarDate,
  looksLikeProd,
  AUDIT_NON_DATE,
  FIND_CANONICAL,
  MERGE_INTO_CANONICAL,
  CAST_IN_PLACE,
} = require('./migrate-timegraph-string-dates')

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

const auditRow = (overrides = {}) => ({
  elementId: '4:db:1',
  rawDate: '2023-03-07',
  dateType: 'STRING NOT NULL',
  labels: ['TimeGraph'],
  extraProps: [],
  degree: 0,
  ...overrides,
})

const mergeResult = (overrides = {}) => ({
  elementId: '4:db:99',
  labels: ['TimeGraph'],
  expectedDegree: 0,
  actualDegree: 0,
  ...overrides,
})

// ---------------------------------------------------------------------------
// Cypher shape
// ---------------------------------------------------------------------------

describe('SYN-219 cleanup Cypher', () => {
  // Asserting on the SOURCE, not the exported constants: by the time the
  // module is imported the template literals have already been evaluated, so
  // an interpolated `${...}` could never show up in the runtime string.
  const source = fs.readFileSync(
    require.resolve('./migrate-timegraph-string-dates'),
    'utf8'
  )

  it('interpolates nothing into any Cypher template literal (ADR-012)', () => {
    const cypherTemplates = source.match(/`\n(?:[^`\\]|\\.)*`/g) || []
    const withCypher = cypherTemplates.filter((t) =>
      /\b(MATCH|MERGE|SET|CALL|RETURN)\b/.test(t)
    )
    expect(withCypher.length).toBeGreaterThanOrEqual(4)
    withCypher.forEach((template) => expect(template).not.toContain('${'))
  })

  it('audits every non-DATE type, not just STRING', () => {
    expect(AUDIT_NON_DATE).toContain(
      "valueType(legacy.date) <> 'DATE NOT NULL'"
    )
    // STARTS WITH 'DATE' would wrongly swallow "DATETIME NOT NULL".
    expect(AUDIT_NON_DATE).not.toContain("STARTS WITH 'DATE'")
  })

  it('reports what a merge would carry across', () => {
    expect(AUDIT_NON_DATE).toContain('extraProps')
    expect(AUDIT_NON_DATE).toContain('labels(legacy) AS labels')
  })

  it('orders the audit deterministically so plan rows are reproducible', () => {
    expect(AUDIT_NON_DATE).toContain('ORDER BY dateType, elementId')
  })

  it('re-asserts the bad type inside both write queries', () => {
    expect(MERGE_INTO_CANONICAL).toContain(
      "valueType(legacy.date) <> 'DATE NOT NULL'"
    )
    expect(CAST_IN_PLACE).toContain("valueType(legacy.date) <> 'DATE NOT NULL'")
  })

  it('keeps the canonical DATE value and moves relationships when merging', () => {
    expect(MERGE_INTO_CANONICAL).toContain('apoc.refactor.mergeNodes')
    // canonical is listed first + properties: 'discard' => the DATE wins.
    expect(MERGE_INTO_CANONICAL).toContain('[canonical, legacy]')
    expect(MERGE_INTO_CANONICAL).toContain("properties: 'discard'")
    expect(MERGE_INTO_CANONICAL).toContain('mergeRels: true')
    expect(MERGE_INTO_CANONICAL).toContain('produceSelfRel: false')
  })

  it('returns both degrees so a collapsed relationship cannot be silent', () => {
    expect(MERGE_INTO_CANONICAL).toContain('expectedDegree')
    expect(MERGE_INTO_CANONICAL).toContain(
      'COUNT { (node)--() } AS actualDegree'
    )
  })

  it('casts in place rather than deleting when there is no canonical twin', () => {
    expect(CAST_IN_PLACE).toContain('SET legacy.date = date($isoDate)')
    expect(CAST_IN_PLACE).not.toMatch(/DELETE/i)
  })

  it('pins the canonical lookup to the TimeGraph.date index', () => {
    expect(FIND_CANONICAL).toContain('USING INDEX canonical:TimeGraph(date)')
    expect(FIND_CANONICAL).toContain('canonical.date = date($isoDate)')
    expect(FIND_CANONICAL).toContain('elementId(canonical) <> $elementId')
  })

  it('counts degree via COUNT {} rather than materialising a list', () => {
    expect(AUDIT_NON_DATE).toContain('COUNT { (legacy)--() }')
    expect(AUDIT_NON_DATE).not.toContain('size([(legacy)--()')
  })
})

// ---------------------------------------------------------------------------
// isIsoCalendarDate
// ---------------------------------------------------------------------------

describe('isIsoCalendarDate', () => {
  it.each(['2023-03-07', '2024-02-29', '1999-12-31'])(
    'accepts the real calendar day %s',
    (value) => {
      expect(isIsoCalendarDate(value)).toBe(true)
    }
  )

  it.each([
    ['a rolled-over day', '2023-02-30'],
    ['a rolled-over month', '2023-13-01'],
    ['a non-leap 29 Feb', '2023-02-29'],
    ['a non-ISO format', '07/03/2023'],
    ['a datetime string', '2023-03-07T00:00:00Z'],
    ['an empty string', ''],
  ])('rejects %s', (_label, value) => {
    expect(isIsoCalendarDate(value)).toBe(false)
  })

  it.each([[null], [undefined], [42], [{}], [['2023-03-07']]])(
    'rejects the non-string %p',
    (value) => {
      expect(isIsoCalendarDate(value)).toBe(false)
    }
  )
})

// ---------------------------------------------------------------------------
// looksLikeProd
// ---------------------------------------------------------------------------

describe('looksLikeProd', () => {
  it('flags the production host', () => {
    expect(looksLikeProd('neo4j+s://neo4j.firstlovecenter.com:7687')).toBe(true)
  })

  it('does not flag the dev host', () => {
    expect(looksLikeProd('bolt+ssc://dev-neo4j.firstlovecenter.com:7687')).toBe(
      false
    )
  })

  it.each([
    ['localhost', 'bolt://localhost:7687'],
    ['an empty uri', ''],
  ])('does not flag %s', (_label, uri) => {
    expect(looksLikeProd(uri)).toBe(false)
  })

  it('cannot see through an IP or tunnel — documents the known gap', () => {
    expect(looksLikeProd('bolt://10.0.0.4:7687')).toBe(false)
  })

  it.each([[null], [undefined]])('tolerates %p', (uri) => {
    expect(looksLikeProd(uri)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// migrate()
// ---------------------------------------------------------------------------

describe('migrate', () => {
  it('is a no-op when every date is already a DATE', async () => {
    const session = makeSession({ [AUDIT_NON_DATE]: () => [] })

    const result = await migrate(session, { dryRun: false })

    expect(result.rows).toEqual([])
    expect(result.unresolved).toEqual([])
    expect(result.merged).toBe(0)
    expect(result.cast).toBe(0)
    expect(session.run).toHaveBeenCalledTimes(1)
  })

  it('merges into the existing DATE node when a canonical twin exists', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [
        auditRow({ labels: ['TimeGraph', 'SwellDate'], degree: 8 }),
      ],
      [FIND_CANONICAL]: () => [{ elementId: '4:db:99' }],
      [MERGE_INTO_CANONICAL]: () => [
        mergeResult({ expectedDegree: 9, actualDegree: 9 }),
      ],
    })

    const result = await migrate(session, { dryRun: false })

    expect(result.merged).toBe(1)
    expect(result.cast).toBe(0)
    expect(result.rows[0].action).toBe('merge')
    expect(result.degreeWarnings).toEqual([])

    const write = session.calls.find((c) => c.query === MERGE_INTO_CANONICAL)
    expect(write.params).toEqual({
      elementId: '4:db:1',
      canonicalElementId: '4:db:99',
    })
    expect(session.calls.some((c) => c.query === CAST_IN_PLACE)).toBe(false)
  })

  it('flags a merge that ended with fewer relationships than expected', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [auditRow({ degree: 8 })],
      [FIND_CANONICAL]: () => [{ elementId: '4:db:99' }],
      [MERGE_INTO_CANONICAL]: () => [
        mergeResult({ expectedDegree: 9, actualDegree: 7 }),
      ],
    })

    const result = await migrate(session, { dryRun: false })

    expect(result.merged).toBe(1)
    expect(result.degreeWarnings).toHaveLength(1)
    expect(result.degreeWarnings[0]).toMatchObject({ expected: 9, actual: 7 })
  })

  it('casts in place when there is no canonical twin', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [
        auditRow({ elementId: '4:db:2', rawDate: '2024-09-02' }),
      ],
      [FIND_CANONICAL]: () => [],
      [CAST_IN_PLACE]: (params) => [{ elementId: params.elementId }],
    })

    const result = await migrate(session, { dryRun: false })

    expect(result.cast).toBe(1)
    expect(result.merged).toBe(0)

    const write = session.calls.find((c) => c.query === CAST_IN_PLACE)
    expect(write.params).toEqual({
      elementId: '4:db:2',
      isoDate: '2024-09-02',
    })
  })

  it('reports a write that matched nothing as skipped, never as migrated', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [
        auditRow({ elementId: '4:db:1', rawDate: '2023-03-07' }),
        auditRow({ elementId: '4:db:2', rawDate: '2024-09-02' }),
      ],
      [FIND_CANONICAL]: (params) =>
        params.isoDate === '2023-03-07' ? [{ elementId: '4:db:99' }] : [],
      // Both writes no-op: the re-asserted type guard filtered the node out.
      [MERGE_INTO_CANONICAL]: () => [],
      [CAST_IN_PLACE]: () => [],
    })

    const result = await migrate(session, { dryRun: false })

    expect(result.merged).toBe(0)
    expect(result.cast).toBe(0)
    expect(result.skipped.map((r) => r.elementId)).toEqual(['4:db:1', '4:db:2'])
  })

  it('writes nothing in dry-run mode but still reports the plan', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [
        auditRow({ elementId: '4:db:1', rawDate: '2023-03-07' }),
        auditRow({ elementId: '4:db:2', rawDate: '2024-09-02' }),
      ],
      [FIND_CANONICAL]: (params) =>
        params.isoDate === '2023-03-07' ? [{ elementId: '4:db:99' }] : [],
    })

    const result = await migrate(session, { dryRun: true })

    expect(result.rows.map((r) => r.action)).toEqual(['merge', 'cast'])
    expect(result.merged).toBe(0)
    expect(result.cast).toBe(0)
    expect(
      session.calls.some(
        (c) => c.query === MERGE_INTO_CANONICAL || c.query === CAST_IN_PLACE
      )
    ).toBe(false)
  })

  it('skips a string that is not a real calendar day instead of passing it to date()', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [
        auditRow({ elementId: '4:db:3', rawDate: 'not-a-date', degree: 2 }),
      ],
      [FIND_CANONICAL]: () => [],
    })

    const result = await migrate(session, { dryRun: false })

    expect(result.rows).toHaveLength(0)
    expect(result.unresolved).toHaveLength(1)
    expect(result.unresolved[0].rawDate).toBe('not-a-date')
    // The bad value never reaches Neo4j — not even the canonical lookup.
    expect(session.run).toHaveBeenCalledTimes(1)
  })

  it('reports a non-STRING date type as unresolved rather than claiming success', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [
        auditRow({
          elementId: '4:db:7',
          rawDate: ['2023-03-07'],
          dateType: 'LIST<STRING NOT NULL> NOT NULL',
        }),
      ],
    })

    const result = await migrate(session, { dryRun: false })

    expect(result.rows).toHaveLength(0)
    expect(result.unresolved).toHaveLength(1)
    expect(result.unresolved[0].dateType).toBe('LIST<STRING NOT NULL> NOT NULL')
  })

  it('folds a second string node sharing a day into the one it just cast', async () => {
    const canonicals = {}
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [
        auditRow({ elementId: '4:db:4', rawDate: '2024-10-15' }),
        auditRow({ elementId: '4:db:5', rawDate: '2024-10-15' }),
      ],
      // Mirrors the live DB: once :4 is cast it becomes the canonical twin.
      [FIND_CANONICAL]: (params) =>
        canonicals[params.isoDate] &&
        canonicals[params.isoDate] !== params.elementId
          ? [{ elementId: canonicals[params.isoDate] }]
          : [],
      [CAST_IN_PLACE]: (params) => {
        canonicals[params.isoDate] = params.elementId
        return [{ elementId: params.elementId }]
      },
      [MERGE_INTO_CANONICAL]: () => [mergeResult()],
    })

    const result = await migrate(session, { dryRun: false })

    expect(result.cast).toBe(1)
    expect(result.merged).toBe(1)
    expect(result.rows.map((r) => r.action)).toEqual(['cast', 'merge'])
  })

  it('reports the same two-in-one-day plan in dry-run, without writing', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [
        auditRow({ elementId: '4:db:4', rawDate: '2024-10-15' }),
        auditRow({ elementId: '4:db:5', rawDate: '2024-10-15' }),
      ],
      [FIND_CANONICAL]: () => [],
    })

    const result = await migrate(session, { dryRun: true })

    expect(result.rows.map((r) => r.action)).toEqual(['cast', 'merge'])
  })

  it('never reports merge while executing a cast in a live run', async () => {
    // A cast no-ops, so the next same-day row must NOT inherit a stale
    // "already cast, therefore merge" plan — it has to re-derive from the DB.
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [
        auditRow({ elementId: '4:db:4', rawDate: '2024-10-15' }),
        auditRow({ elementId: '4:db:5', rawDate: '2024-10-15' }),
      ],
      [FIND_CANONICAL]: () => [],
      [CAST_IN_PLACE]: () => [],
    })

    const result = await migrate(session, { dryRun: false })

    expect(result.rows.map((r) => r.action)).toEqual(['cast', 'cast'])
    expect(result.skipped).toHaveLength(2)
    expect(result.cast).toBe(0)
  })

  it('keeps going when one row errors, and records it', async () => {
    const session = {
      calls: [],
      run: jest.fn(async (query, params = {}) => {
        session.calls.push({ query, params })
        if (query === AUDIT_NON_DATE) {
          return {
            records: [
              auditRow({ elementId: '4:db:8', rawDate: '2024-10-15' }),
              auditRow({ elementId: '4:db:9', rawDate: '2024-10-16' }),
            ].map(record),
          }
        }
        if (query === FIND_CANONICAL && params.isoDate === '2024-10-15') {
          throw new Error('transient bolt failure')
        }
        if (query === CAST_IN_PLACE) {
          return { records: [record({ elementId: params.elementId })] }
        }
        return { records: [] }
      }),
    }

    const result = await migrate(session, { dryRun: false })

    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].error).toBe('transient bolt failure')
    // The second row still ran.
    expect(result.cast).toBe(1)
  })

  it('defaults to dry-run when no options are passed', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [auditRow()],
      [FIND_CANONICAL]: () => [],
    })

    await migrate(session)

    expect(session.calls.some((c) => c.query === CAST_IN_PLACE)).toBe(false)
  })

  it('normalises neo4j Integer degrees to plain numbers', async () => {
    const session = makeSession({
      [AUDIT_NON_DATE]: () => [auditRow({ degree: { toNumber: () => 8 } })],
      [FIND_CANONICAL]: () => [],
    })

    const result = await migrate(session, { dryRun: true })

    expect(result.rows[0].degree).toBe(8)
  })
})
