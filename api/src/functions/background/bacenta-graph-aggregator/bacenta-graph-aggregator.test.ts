/**
 * Unit tests for bacenta-graph-aggregator (ADR-014 weekly keying, ADR-008
 * idempotency). No Neo4j connection required — Cypher strings are inspected
 * statically and the driver is mocked.
 *
 * Integration tests (live dev Neo4j) live in the sibling
 * bacenta-graph-aggregator.integration.test.ts and run under
 * `npm run test:integration`.
 */

import {
  aggregateBussingOnGovernorshipQuery,
  aggregateBussingOnCouncilQuery,
  aggregateBussingOnStreamQuery,
  aggregateBussingOnCampusQuery,
  aggregateBussingOnOversightQuery,
  aggregateBussingOnDenominationQuery,
  zeroAllNullBussingRecordsCypher,
} from './bacenta-cypher'

import {
  aggregateBussingOnGovernorship,
  aggregateBussingOnCouncil,
  aggregateBussingOnStream,
  aggregateBussingOnCampus,
  aggregateBussingOnOversight,
  aggregateBussingOnDenomination,
  zeroAllNullBussingRecords,
} from './query-exec/aggregateAllChurches'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const ROLLUP_QUERIES = [
  {
    name: 'Bacenta→Governorship',
    query: aggregateBussingOnGovernorshipQuery,
    returnKey: 'governorshipCount',
    fn: aggregateBussingOnGovernorship,
  },
  {
    name: 'Governorship→Council',
    query: aggregateBussingOnCouncilQuery,
    returnKey: 'councilCount',
    fn: aggregateBussingOnCouncil,
  },
  {
    name: 'Council→Stream',
    query: aggregateBussingOnStreamQuery,
    returnKey: 'streamCount',
    fn: aggregateBussingOnStream,
  },
  {
    name: 'Stream→Campus',
    query: aggregateBussingOnCampusQuery,
    returnKey: 'campusCount',
    fn: aggregateBussingOnCampus,
  },
  {
    name: 'Campus→Oversight',
    query: aggregateBussingOnOversightQuery,
    returnKey: 'oversightCount',
    fn: aggregateBussingOnOversight,
  },
  {
    name: 'Oversight→Denomination',
    query: aggregateBussingOnDenominationQuery,
    returnKey: 'denominationCount',
    fn: aggregateBussingOnDenomination,
  },
]

const makeDriver = (returnKey: string, countValue = 1) => {
  const mockRecord = {
    get: jest.fn().mockReturnValue({ toString: () => String(countValue) }),
  }
  const mockResult = { records: [mockRecord] }
  const mockSession = {
    run: jest.fn().mockResolvedValue(mockResult),
    close: jest.fn().mockResolvedValue(undefined),
  }
  const driver = { session: jest.fn().mockReturnValue(mockSession) }
  return { driver, session: mockSession, mockRecord }
}

// ---------------------------------------------------------------------------
// 1. ADR-014: aggregate ID key shape
// ---------------------------------------------------------------------------

describe('Cypher invariants — ADR-014 key shape', () => {
  test.each(ROLLUP_QUERIES)(
    '$name: MERGEs AggregateBussingRecord on <church.id>-<week>-<year>',
    ({ query }) => {
      expect(query).toMatch(
        /MERGE\s*\(\w+\s*:\s*AggregateBussingRecord\s*\{\s*id\s*:\s*\w+\.id\s*\+\s*'-'\s*\+\s*toString\s*\(\s*date\s*\(\s*\)\.week\s*\)\s*\+\s*'-'\s*\+\s*toString\s*\(\s*date\s*\(\s*\)\.year\s*\)\s*\}\s*\)/
      )
    }
  )
})

// ---------------------------------------------------------------------------
// 2. ADR-014: overwrite semantics — SET never +=
// ---------------------------------------------------------------------------

describe('Cypher invariants — ADR-014 overwrite semantics', () => {
  test.each(ROLLUP_QUERIES)(
    '$name: writes aggregate properties with = (never +=)',
    ({ query }) => {
      expect(query).not.toMatch(/aggregate\.\w+\s*\+=/)
      // Bacenta queries open the SET clause with leaderDeclaration; attendance
      // follows on the next line without repeating the SET keyword.
      expect(query).toMatch(/aggregate\.attendance\s*=/)
      expect(query).toMatch(/aggregate\.leaderDeclaration\s*=/)
      expect(query).toMatch(/aggregate\.numberOfSprinters\s*=/)
      // recomputedAt stamp required by ADR-014 §4 for the FE dedup sort
      expect(query).toMatch(/aggregate\.recomputedAt\s*=\s*datetime\s*\(\s*\)/)
    }
  )
})

// ---------------------------------------------------------------------------
// 3. ADR-008: idempotency — MERGE not CREATE for aggregate nodes
// ---------------------------------------------------------------------------

describe('Cypher invariants — ADR-008 idempotency (MERGE not CREATE)', () => {
  test.each(ROLLUP_QUERIES)(
    '$name: uses MERGE (not CREATE) for AggregateBussingRecord',
    ({ query }) => {
      expect(query).toMatch(/MERGE\s*\(\w+\s*:\s*AggregateBussingRecord/)
      expect(query).not.toMatch(/CREATE\s*\(\w+\s*:\s*AggregateBussingRecord/)
    }
  )
})

// ---------------------------------------------------------------------------
// 4. Vacation / empty-hierarchy: zeroAllNullBussingRecordsCypher
// ---------------------------------------------------------------------------

describe('Cypher invariants — zero-out pass (SM3 / empty hierarchy)', () => {
  it('targets aggregates where the vehicle counts are NULL (not zero)', () => {
    // Checks for null on the three vehicle-count fields — these are the ones
    // that remain unset when a higher-level church has no bussing Bacentas
    // this week.  The explicit IS NULL guards prevent inadvertent overwrites of
    // already-zeroed aggregates.
    expect(zeroAllNullBussingRecordsCypher).toMatch(
      /numberOfSprinters\s+IS\s+NULL/
    )
    expect(zeroAllNullBussingRecordsCypher).toMatch(/numberOfUrvans\s+IS\s+NULL/)
    expect(zeroAllNullBussingRecordsCypher).toMatch(/numberOfCars\s+IS\s+NULL/)
  })

  it('uses SET (not +=) to zero out the null aggregate properties', () => {
    expect(zeroAllNullBussingRecordsCypher).not.toMatch(/aggregate\.\w+\s*\+=/)
    expect(zeroAllNullBussingRecordsCypher).toMatch(
      /aggregate\.attendance\s*=\s*0/
    )
    expect(zeroAllNullBussingRecordsCypher).toMatch(
      /aggregate\.numberOfSprinters\s*=\s*0/
    )
  })

  it('uses MATCH (not MERGE/CREATE) to target existing AggregateBussingRecord nodes', () => {
    // The zero-out pass targets nodes that already exist — MATCH, not MERGE.
    expect(zeroAllNullBussingRecordsCypher).toMatch(
      /MATCH\s*\(\w+\s*:\s*AggregateBussingRecord/
    )
    expect(zeroAllNullBussingRecordsCypher).not.toMatch(
      /CREATE\s*\(\w+\s*:\s*AggregateBussingRecord/
    )
    expect(zeroAllNullBussingRecordsCypher).not.toMatch(
      /MERGE\s*\(\w+\s*:\s*AggregateBussingRecord/
    )
  })
})

// ---------------------------------------------------------------------------
// 5. Bacenta traversal uses CURRENT_HISTORY
// ---------------------------------------------------------------------------

describe('Cypher invariants — CURRENT_HISTORY traversal', () => {
  test.each(ROLLUP_QUERIES)(
    '$name: traverses to Bacentas via CURRENT_HISTORY (not HAS_HISTORY)',
    ({ query }) => {
      // The bacenta bussing traversal must start from the log via CURRENT_HISTORY
      // so stale tenure logs are excluded from the roll-up
      expect(query).toMatch(
        /\(bacentas\)\s*-\s*\[:\s*CURRENT_HISTORY\s*\]\s*->\s*\(\s*:\s*ServiceLog\s*\)/
      )
    }
  )

  test.each(ROLLUP_QUERIES)(
    '$name: resolves the aggregate ServiceLog via CURRENT_HISTORY',
    ({ query }) => {
      // Bacenta queries label the church node: (denomination:Denomination)-[:CURRENT_HISTORY]
      // Allow for an optional :Label suffix in the subject node.
      expect(query).toMatch(
        /\(\w+(?::\w+)?\)\s*-\s*\[:\s*CURRENT_HISTORY\s*\]\s*->\s*\(\s*log\s*:\s*ServiceLog\s*\)/
      )
    }
  )
})

// ---------------------------------------------------------------------------
// 6. Driver contract — session lifecycle
// ---------------------------------------------------------------------------

describe('aggregation functions — driver contract', () => {
  test.each(ROLLUP_QUERIES)(
    '$name: calls session.run with its own Cypher query',
    async ({ fn, query, returnKey }) => {
      const { driver, session } = makeDriver(returnKey)
      await fn(driver)
      expect(session.run).toHaveBeenCalledWith(query)
    }
  )

  test.each(ROLLUP_QUERIES)(
    '$name: always closes the session even when run throws',
    async ({ fn }) => {
      const mockSession = {
        run: jest.fn().mockRejectedValue(new Error('DB down')),
        close: jest.fn().mockResolvedValue(undefined),
      }
      const driver = { session: jest.fn().mockReturnValue(mockSession) }
      await fn(driver)
      expect(mockSession.close).toHaveBeenCalledTimes(1)
    }
  )

  test.each(ROLLUP_QUERIES)(
    '$name: returns an array of count strings and fetches the correct result column',
    async ({ fn, returnKey }) => {
      const { driver, mockRecord } = makeDriver(returnKey, 5)
      const result = await fn(driver)
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toEqual(['5'])
      expect(mockRecord.get).toHaveBeenCalledWith(returnKey)
    }
  )

  it('zeroAllNullBussingRecords: calls session.run with the zero-out Cypher', async () => {
    const { driver, session } = makeDriver('aggregateCount')
    await zeroAllNullBussingRecords(driver)
    expect(session.run).toHaveBeenCalledWith(zeroAllNullBussingRecordsCypher)
    expect(session.close).toHaveBeenCalledTimes(1)
  })

  it('zeroAllNullBussingRecords: closes the session even when run throws', async () => {
    const mockSession = {
      run: jest.fn().mockRejectedValue(new Error('DB down')),
      close: jest.fn().mockResolvedValue(undefined),
    }
    const driver = { session: jest.fn().mockReturnValue(mockSession) }
    await zeroAllNullBussingRecords(driver)
    expect(mockSession.close).toHaveBeenCalledTimes(1)
  })
})
