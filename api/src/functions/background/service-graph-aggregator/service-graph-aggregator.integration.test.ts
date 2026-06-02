/**
 * Integration tests for service-graph-aggregator (ADR-014, ADR-008).
 *
 * Runs against the live **dev** Neo4j instance — never production.
 * Gated under `npm run test:integration`.
 *
 * All test nodes use a unique `RUN_ID` prefix so concurrent runs and the
 * real aggregator data coexist safely. afterAll cleans up every seeded node.
 *
 * Prerequisites:
 *   NEO4J_URI     bolt://dev-neo4j.firstlovecenter.com:7687   (or bolt://localhost:7687)
 *   NEO4J_USER    neo4j
 *   NEO4J_PASSWORD <password>
 */

import neo4j, { Driver, Integer, isInt } from 'neo4j-driver'
import { aggregateBacentaOnGovernorship } from './query-exec/aggregateAllChurches'

// neo4j-driver returns floats (e.g. round(toFloat(SUM(...)))) as plain JS
// numbers but small integers (COUNT, date().week) as Neo4j Integer objects.
// Normalise both so assertions are type-safe.
const toNum = (v: Integer | number): number =>
  isInt(v) ? (v as Integer).toInt() : Number(v)

// ---------------------------------------------------------------------------
// Test-run-scoped IDs — unique per process invocation
// ---------------------------------------------------------------------------

const RUN_ID = `test-sga-${Date.now()}`
const GOVN_ID = `${RUN_ID}-govn`
const LOG1_ID = `${RUN_ID}-log1`
const LOG2_ID = `${RUN_ID}-log2` // used only in stale-edge block
const SR1_ID = `${RUN_ID}-sr1`

// ---------------------------------------------------------------------------
// Driver lifecycle
// ---------------------------------------------------------------------------

let driver: Driver

beforeAll(async () => {
  const uri =
    process.env.NEO4J_URI ?? 'bolt+ssc://dev-neo4j.firstlovecenter.com:7687'
  const hasSecureScheme =
    uri.includes('neo4j+s://') || uri.includes('neo4j+ssc://')
  driver = neo4j.driver(
    uri,
    neo4j.auth.basic(
      process.env.NEO4J_USER ?? 'neo4j',
      process.env.NEO4J_PASSWORD ?? 'neo4j'
    ),
    hasSecureScheme
      ? undefined
      : { encrypted: 'ENCRYPTION_ON', trust: 'TRUST_ALL_CERTIFICATES' }
  )

  await driver.verifyConnectivity()

  // Seed base graph:
  //   (:Governorship)-[:CURRENT_HISTORY]->(:ServiceLog)
  //     -[:HAS_SERVICE]->(:ServiceRecord {attendance:100, income:500})
  //     -[:SERVICE_HELD_ON]->(:TimeGraph {date: date()})
  //
  // The 2-hop path (CURRENT_HISTORY + HAS_SERVICE) is matched by the
  // `[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..3]` varargs in the Bacenta→Governorship
  // query, so this minimal graph is picked up by the aggregator.
  const s = driver.session()
  try {
    await s.run(
      `
      CREATE (govn:Governorship {id: $govnId, name: 'Test SGA Govn'})
      CREATE (log1:ServiceLog {id: $log1Id})
      CREATE (sr1:ServiceRecord {id: $sr1Id, attendance: 100, income: 500.0, dollarIncome: 0.0})
      MERGE  (today:TimeGraph {date: date()})
      CREATE (govn)-[:CURRENT_HISTORY]->(log1)
      CREATE (log1)-[:HAS_SERVICE]->(sr1)
      CREATE (sr1)-[:SERVICE_HELD_ON]->(today)
      `,
      { govnId: GOVN_ID, log1Id: LOG1_ID, sr1Id: SR1_ID }
    )
  } finally {
    await s.close()
  }
})

afterAll(async () => {
  const s = driver.session()
  try {
    // Delete test aggregate nodes (keyed by govnId prefix)
    await s.run(
      `MATCH (agg:AggregateServiceRecord) WHERE agg.id STARTS WITH $prefix DETACH DELETE agg`,
      { prefix: RUN_ID }
    )
    // Delete the rest of the seeded test graph
    await s.run(
      `
      MATCH (n) WHERE n.id IN [$govnId, $log1Id, $log2Id, $sr1Id]
      DETACH DELETE n
      `,
      { govnId: GOVN_ID, log1Id: LOG1_ID, log2Id: LOG2_ID, sr1Id: SR1_ID }
    )
    // TimeGraph {date: date()} is shared — do not delete it
  } finally {
    await s.close()
    await driver.close()
  }
})

// ---------------------------------------------------------------------------
// Helper: read the current week aggregate for our test governorship
// ---------------------------------------------------------------------------

const readAggregate = async () => {
  const s = driver.session()
  try {
    const result = await s.run(
      `
      MATCH (agg:AggregateServiceRecord)
      WHERE agg.id STARTS WITH $prefix
        AND agg.week = date().week
        AND agg.year = date().year
      RETURN agg.id          AS id,
             agg.week        AS week,
             agg.year        AS year,
             agg.attendance  AS attendance,
             agg.income      AS income,
             agg.numberOfServices AS numberOfServices
      `,
      { prefix: RUN_ID }
    )
    return result.records
  } finally {
    await s.close()
  }
}

// ---------------------------------------------------------------------------
// 1. Key shape: <church.id>-<week>-<year>
// ---------------------------------------------------------------------------

describe('key shape — ADR-014', () => {
  it('creates an AggregateServiceRecord whose id matches <govnId>-<week>-<year>', async () => {
    await aggregateBacentaOnGovernorship(driver)

    const records = await readAggregate()
    expect(records).toHaveLength(1)

    const agg = records[0]
    const week = (agg.get('week') as Integer).toInt()
    const year = (agg.get('year') as Integer).toInt()
    expect(agg.get('id')).toBe(`${GOVN_ID}-${week}-${year}`)
  })
})

// ---------------------------------------------------------------------------
// 2. Idempotency: two runs → same node, same values
// ---------------------------------------------------------------------------

describe('idempotency — ADR-008', () => {
  it('running the aggregator twice produces exactly one aggregate node with the same values', async () => {
    await aggregateBacentaOnGovernorship(driver)
    await aggregateBacentaOnGovernorship(driver)

    const records = await readAggregate()
    // MERGE must not create a duplicate
    expect(records).toHaveLength(1)

    const attendance = toNum(records[0].get('attendance'))
    // 100, not 200 (would be 200 if attendance were accumulated twice)
    expect(attendance).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// 3. Overwrite semantics: changed data replaces, never accumulates
// ---------------------------------------------------------------------------

describe('overwrite semantics — ADR-014', () => {
  it('re-running after attendance changes overwrites the aggregate value (not adds to it)', async () => {
    await aggregateBacentaOnGovernorship(driver)

    // Mutate the service record
    const mutate = driver.session()
    await mutate
      .run(
        `MATCH (sr:ServiceRecord {id: $srId}) SET sr.attendance = 200`,
        { srId: SR1_ID }
      )
      .finally(() => mutate.close())

    // Second run
    await aggregateBacentaOnGovernorship(driver)

    const records = await readAggregate()
    const attendance = toNum(records[0].get('attendance'))
    // Must be 200, not 300 (100 + 200 would mean accumulation)
    expect(attendance).toBe(200)
  })

  afterEach(async () => {
    // Restore sr1 to 100 so later tests start from a known baseline
    const s = driver.session()
    await s
      .run(
        `MATCH (sr:ServiceRecord {id: $srId}) SET sr.attendance = 100`,
        { srId: SR1_ID }
      )
      .finally(() => s.close())
  })
})

// ---------------------------------------------------------------------------
// 4. Snapshot freeze: prior-week aggregates untouched
// ---------------------------------------------------------------------------

describe('snapshot freeze — ADR-014 Model-A', () => {
  let priorAggId: string

  beforeAll(async () => {
    const s = driver.session()
    let priorWeek: number
    let priorYear: number
    try {
      const result = await s.run(
        `RETURN date().week AS week, date().year AS year`
      )
      const week = (result.records[0].get('week') as Integer).toInt()
      const year = (result.records[0].get('year') as Integer).toInt()
      if (week === 1) {
        priorWeek = 52
        priorYear = year - 1 // ISO week 52 belongs to the previous year
      } else {
        priorWeek = week - 1
        priorYear = year
      }
    } finally {
      await s.close()
    }

    priorAggId = `${GOVN_ID}-${priorWeek}-${priorYear}`

    // Seed a prior-week aggregate with a sentinel value
    const seed = driver.session()
    await seed
      .run(
        `
        CREATE (:AggregateServiceRecord {
          id: $id, week: $week, year: $year,
          attendance: 999, income: 0.0, numberOfServices: 0
        })
        `,
        { id: priorAggId, week: priorWeek, year: priorYear }
      )
      .finally(() => seed.close())
  })

  afterAll(async () => {
    const s = driver.session()
    await s
      .run(
        `MATCH (agg:AggregateServiceRecord {id: $id}) DETACH DELETE agg`,
        { id: priorAggId }
      )
      .finally(() => s.close())
  })

  it('running the aggregator for the current week leaves prior-week aggregates unchanged', async () => {
    await aggregateBacentaOnGovernorship(driver)

    const s = driver.session()
    const result = await s
      .run(
        `MATCH (agg:AggregateServiceRecord {id: $id}) RETURN agg.attendance AS attendance`,
        { id: priorAggId }
      )
      .finally(() => s.close())

    expect(result.records).toHaveLength(1)
    const attendance = toNum(result.records[0].get('attendance'))
    expect(attendance).toBe(999)
  })
})

// ---------------------------------------------------------------------------
// 5. Stale-edge regression — 168e2909
//
// A church with two CURRENT_HISTORY edges (the pre-fix state) must not
// produce an inflated aggregate. `WITH DISTINCT governorship, record`
// deduplicates the same ServiceRecord found via two paths before the SUM.
// ---------------------------------------------------------------------------

describe('stale-edge regression — 168e2909', () => {
  beforeAll(async () => {
    // Add a second CURRENT_HISTORY edge and a second ServiceLog that also
    // points to the same ServiceRecord — this replicates the topology that
    // caused income/attendance inflation before 168e2909.
    const s = driver.session()
    await s
      .run(
        `
        MATCH (govn:Governorship {id: $govnId})
        MATCH (sr:ServiceRecord {id: $srId})
        CREATE (log2:ServiceLog {id: $log2Id})
        CREATE (govn)-[:CURRENT_HISTORY]->(log2)
        CREATE (log2)-[:HAS_SERVICE]->(sr)
        `,
        { govnId: GOVN_ID, srId: SR1_ID, log2Id: LOG2_ID }
      )
      .finally(() => s.close())
  })

  afterAll(async () => {
    const s = driver.session()
    await s
      .run(
        `MATCH (n:ServiceLog {id: $log2Id}) DETACH DELETE n`,
        { log2Id: LOG2_ID }
      )
      .finally(() => s.close())
  })

  it('attendance is not doubled when the same ServiceRecord is reachable via two CURRENT_HISTORY edges', async () => {
    await aggregateBacentaOnGovernorship(driver)

    const records = await readAggregate()
    expect(records).toHaveLength(1)

    const attendance = toNum(records[0].get('attendance'))
    const numberOfServices = toNum(records[0].get('numberOfServices'))

    // WITH DISTINCT governorship, record deduplicates the duplicate path
    expect(attendance).toBe(100) // not 200
    expect(numberOfServices).toBe(1) // not 2
  })
})
