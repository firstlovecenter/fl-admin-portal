/**
 * Unit tests for service-graph-aggregator (ADR-014 weekly keying, ADR-008
 * idempotency). No Neo4j connection required — Cypher strings are inspected
 * statically and the driver is mocked.
 *
 * Integration tests (live dev Neo4j) live in the sibling
 * service-graph-aggregator.integration.test.ts file and run under
 * `npm run test:integration`.
 */

import {
  aggregateBacentaOnGovernorshipQuery,
  aggregateGovernorshipOnCouncilQuery,
  aggregateCouncilOnStreamQuery,
  aggregateStreamOnCampusQuery,
  aggregateCampusOnOversightQuery,
  aggregateOversightOnDenominationQuery,
} from './sevice-cypher'

import {
  aggregateBacentaOnGovernorship,
  aggregateGovernorshipOnCouncil,
  aggregateCouncilOnStream,
  aggregateStreamOnCampus,
  aggregateCampusOnOversight,
  aggregateOversightOnDenomination,
} from './query-exec/aggregateAllChurches'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const ALL_QUERIES = [
  {
    name: 'Bacenta→Governorship',
    query: aggregateBacentaOnGovernorshipQuery,
    returnKey: 'governorshipCount',
    fn: aggregateBacentaOnGovernorship,
  },
  {
    name: 'Governorship→Council',
    query: aggregateGovernorshipOnCouncilQuery,
    returnKey: 'councilCount',
    fn: aggregateGovernorshipOnCouncil,
  },
  {
    name: 'Council→Stream',
    query: aggregateCouncilOnStreamQuery,
    returnKey: 'streamCount',
    fn: aggregateCouncilOnStream,
  },
  {
    name: 'Stream→Campus',
    query: aggregateStreamOnCampusQuery,
    returnKey: 'campusCount',
    fn: aggregateStreamOnCampus,
  },
  {
    name: 'Campus→Oversight',
    query: aggregateCampusOnOversightQuery,
    returnKey: 'oversightCount',
    fn: aggregateCampusOnOversight,
  },
  {
    name: 'Oversight→Denomination',
    query: aggregateOversightOnDenominationQuery,
    returnKey: 'denominationCount',
    fn: aggregateOversightOnDenomination,
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
  test.each(ALL_QUERIES)(
    '$name: MERGEs on <church.id>-<week>-<year>',
    ({ query }) => {
      // id: <level>.id + '-' + toString(date().week) + '-' + toString(date().year)
      expect(query).toMatch(
        /MERGE\s*\(\w+\s*:\s*AggregateServiceRecord\s*\{\s*id\s*:\s*\w+\.id\s*\+\s*'-'\s*\+\s*toString\s*\(\s*date\s*\(\s*\)\.week\s*\)\s*\+\s*'-'\s*\+\s*toString\s*\(\s*date\s*\(\s*\)\.year\s*\)\s*\}\s*\)/
      )
    }
  )
})

// ---------------------------------------------------------------------------
// 2. ADR-014: overwrite semantics — SET never +=
// ---------------------------------------------------------------------------

describe('Cypher invariants — ADR-014 overwrite semantics', () => {
  test.each(ALL_QUERIES)(
    '$name: writes aggregate properties with = (never +=)',
    ({ query }) => {
      expect(query).not.toMatch(/aggregate\.\w+\s*\+=/)
      expect(query).toMatch(/SET aggregate\.attendance\s*=/)
      expect(query).toMatch(/aggregate\.income\s*=/)
      expect(query).toMatch(/aggregate\.numberOfServices\s*=/)
      // recomputedAt stamp is required by ADR-014 §4 for the FE dedup sort
      expect(query).toMatch(/aggregate\.recomputedAt\s*=\s*datetime\s*\(\s*\)/)
    }
  )
})

// ---------------------------------------------------------------------------
// 2b. Currency rule — income source per level (SYN-193)
//
// Campus and below are single-currency, so income is the raw local sum
// (income = totalIncome). Oversight and Denomination *may* consolidate campuses
// across multiple currencies, so their income is currency-aware: the native
// local sum when every campus shares one currency (e.g. all-GHS Outside Accra),
// and the USD-converted total only when the church genuinely spans currencies.
// The resolved currency is stamped on the aggregate so consumers can label it.
// ---------------------------------------------------------------------------

describe('Cypher invariants — currency rule', () => {
  const LOCAL_LEVEL_QUERIES = ALL_QUERIES.filter((q) =>
    [
      'Bacenta→Governorship',
      'Governorship→Council',
      'Council→Stream',
      'Stream→Campus',
    ].includes(q.name)
  )

  const CONSOLIDATING_LEVEL_QUERIES = ALL_QUERIES.filter((q) =>
    ['Campus→Oversight', 'Oversight→Denomination'].includes(q.name)
  )

  test.each(LOCAL_LEVEL_QUERIES)(
    '$name: income is the local sum (income = totalIncome)',
    ({ query }) => {
      expect(query).toMatch(/aggregate\.income\s*=\s*totalIncome\b/)
      expect(query).not.toMatch(/aggregate\.income\s*=\s*totalDollarIncome\b/)
    }
  )

  test.each(CONSOLIDATING_LEVEL_QUERIES)(
    '$name: income is currency-aware (native when single-currency, USD when mixed)',
    ({ query }) => {
      // income switches on the resolved currency rather than always taking USD.
      expect(query).toMatch(
        /aggregate\.income\s*=\s*CASE WHEN resolvedCurrency\s*=\s*'USD' THEN totalDollarIncome ELSE totalIncome END/
      )
      // dollarIncome stays the USD total, and the resolved currency is stamped.
      expect(query).toMatch(/aggregate\.dollarIncome\s*=\s*totalDollarIncome\b/)
      expect(query).toMatch(/aggregate\.currency\s*=\s*resolvedCurrency\b/)
      // resolvedCurrency is derived from the church's own campus currencies.
      expect(query).toMatch(/campusCurrencies/)
      // income must NOT be an unconditional raw mixed-currency sum.
      expect(query).not.toMatch(/aggregate\.income\s*=\s*totalIncome\b/)
    }
  )
})

// ---------------------------------------------------------------------------
// 3. ADR-008: idempotency — MERGE not CREATE for aggregate nodes
// ---------------------------------------------------------------------------

describe('Cypher invariants — ADR-008 idempotency (MERGE not CREATE)', () => {
  test.each(ALL_QUERIES)(
    '$name: uses MERGE (not CREATE) for AggregateServiceRecord',
    ({ query }) => {
      expect(query).toMatch(/MERGE\s*\(\w+\s*:\s*AggregateServiceRecord/)
      expect(query).not.toMatch(/CREATE\s*\(\w+\s*:\s*AggregateServiceRecord/)
    }
  )
})

// ---------------------------------------------------------------------------
// 4. 168e2909 regression: CURRENT_HISTORY for the ServiceLog edge
// ---------------------------------------------------------------------------

describe('Cypher invariants — stale-edge guard (168e2909)', () => {
  test.each(ALL_QUERIES)(
    '$name: uses CURRENT_HISTORY (not HAS_HISTORY) to resolve the ServiceLog',
    ({ query }) => {
      // The MATCH that resolves the log for HAS_SERVICE_AGGREGATE must use
      // CURRENT_HISTORY — the pre-fix code used HAS_HISTORY which traversed
      // all historical logs and double-counted.
      expect(query).toMatch(
        /MATCH\s*\(\w+\)\s*-\s*\[:\s*CURRENT_HISTORY\s*\]\s*->\s*\(\s*log\s*:\s*ServiceLog\s*\)/
      )
    }
  )

  test.each(ALL_QUERIES)(
    '$name: first MATCH traverses via CURRENT_HISTORY (not unconstrained HAS_HISTORY)',
    ({ query }) => {
      // The service-record traversal must start with CURRENT_HISTORY so stale
      // tenure logs are excluded. We pin that the relationship set starts with
      // CURRENT_HISTORY.
      expect(query).toMatch(/MATCH\s*\(\w+:\w+\)\s*-\s*\[:\s*CURRENT_HISTORY\|/)
    }
  )
})

// ---------------------------------------------------------------------------
// 5. Driver contract — session lifecycle
// ---------------------------------------------------------------------------

describe('aggregation functions — driver contract', () => {
  test.each(ALL_QUERIES)(
    '$name: calls session.run with its own Cypher query',
    async ({ fn, query, returnKey }) => {
      const { driver, session } = makeDriver(returnKey)
      await fn(driver)
      expect(session.run).toHaveBeenCalledWith(query)
    }
  )

  test.each(ALL_QUERIES)(
    '$name: re-throws and closes the session when run throws',
    async ({ fn }) => {
      const mockSession = {
        run: jest.fn().mockRejectedValue(new Error('DB down')),
        close: jest.fn().mockResolvedValue(undefined),
      }
      const driver = { session: jest.fn().mockReturnValue(mockSession) }
      await expect(fn(driver)).rejects.toThrow('DB down')
      expect(mockSession.close).toHaveBeenCalledTimes(1)
    }
  )

  test.each(ALL_QUERIES)(
    '$name: returns an array of count strings and fetches the correct result column',
    async ({ fn, returnKey }) => {
      const { driver, mockRecord } = makeDriver(returnKey, 7)
      const result = await fn(driver)
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toEqual(['7'])
      expect(mockRecord.get).toHaveBeenCalledWith(returnKey)
    }
  )
})
