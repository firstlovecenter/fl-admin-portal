/**
 * Integration tests for bacenta-graph-aggregator (ADR-014, ADR-008, SM3).
 *
 * Runs against the live **dev** Neo4j instance — never production.
 * Gated under `npm run test:integration`.
 *
 * All test nodes use a unique `RUN_ID` prefix so concurrent runs and the
 * real aggregator data coexist safely. afterAll cleans up every seeded node.
 *
 * Prerequisites:
 *   NEO4J_URI     bolt+ssc://dev-neo4j.firstlovecenter.com:7687
 *   NEO4J_USER    neo4j
 *   NEO4J_PASSWORD <password>
 */

import neo4j, { Driver, Integer, isInt } from 'neo4j-driver'
import { aggregateBussingOnGovernorship } from './query-exec/aggregateAllChurches'
import { zeroAllNullBussingRecords } from './query-exec/aggregateAllChurches'

// neo4j-driver returns floats (e.g. SUM(record.attendance)) as plain JS
// numbers but small integers (COUNT, date().week) as Neo4j Integer objects.
// Normalise both so assertions are type-safe.
const toNum = (v: Integer | number): number =>
  isInt(v) ? (v as Integer).toInt() : Number(v)

// ---------------------------------------------------------------------------
// Test-run-scoped IDs — unique per process invocation
// ---------------------------------------------------------------------------

const RUN_ID = `test-bga-${Date.now()}`
const GOVN_ID = `${RUN_ID}-govn`
const GOVN_LOG_ID = `${RUN_ID}-govn-log`
const BAC1_ID = `${RUN_ID}-bac1`
const BAC1_LOG_ID = `${RUN_ID}-bac1-log`
const BAC2_ID = `${RUN_ID}-bac2`
const BAC2_LOG_ID = `${RUN_ID}-bac2-log`
const BR1_ID = `${RUN_ID}-br1`
const BR2_ID = `${RUN_ID}-br2`

// ---------------------------------------------------------------------------
// Driver lifecycle
// ---------------------------------------------------------------------------

let driver: Driver

beforeAll(async () => {
  driver = neo4j.driver(
    process.env.NEO4J_URI ?? 'bolt+ssc://dev-neo4j.firstlovecenter.com:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USER ?? 'neo4j',
      process.env.NEO4J_PASSWORD ?? 'neo4j'
    )
  )

  await driver.verifyConnectivity()

  // Seed base graph for roll-up math tests:
  //
  //   (:Governorship)-[:CURRENT_HISTORY]->(:ServiceLog)          ← aggregate log
  //   (:Governorship)-[:HAS]->(:Bacenta)                          ← hierarchy
  //   (:Bacenta)-[:CURRENT_HISTORY]->(:ServiceLog)
  //     -[:HAS_BUSSING]->(:BussingRecord {attendance: 60, leaderDeclaration: 60,
  //                                       numberOfSprinters: 1, numberOfUrvans: 2, numberOfCars: 0})
  //     -[:BUSSED_ON]->(:TimeGraph {date: date()})
  //
  // Two Bacentas under the same Governorship so roll-up math can be pinned.
  const s = driver.session()
  try {
    await s.run(
      `
      CREATE (govn:Governorship {id: $govnId, name: 'Test BGA Govn'})
      CREATE (govnLog:ServiceLog {id: $govnLogId})
      CREATE (bac1:Bacenta {id: $bac1Id, name: 'Test Bacenta 1'})
      CREATE (bac1Log:ServiceLog {id: $bac1LogId})
      CREATE (bac2:Bacenta {id: $bac2Id, name: 'Test Bacenta 2'})
      CREATE (bac2Log:ServiceLog {id: $bac2LogId})
      CREATE (br1:BussingRecord {
        id: $br1Id,
        attendance: 60,
        leaderDeclaration: 60,
        numberOfSprinters: 1,
        numberOfUrvans: 2,
        numberOfCars: 0,
        bussingTopUp: 0.0
      })
      CREATE (br2:BussingRecord {
        id: $br2Id,
        attendance: 40,
        leaderDeclaration: 40,
        numberOfSprinters: 0,
        numberOfUrvans: 1,
        numberOfCars: 1,
        bussingTopUp: 0.0
      })
      MERGE (today:TimeGraph {date: date()})
      CREATE (govn)-[:CURRENT_HISTORY]->(govnLog)
      CREATE (govn)-[:HAS]->(bac1)
      CREATE (govn)-[:HAS]->(bac2)
      CREATE (bac1)-[:CURRENT_HISTORY]->(bac1Log)
      CREATE (bac2)-[:CURRENT_HISTORY]->(bac2Log)
      CREATE (bac1Log)-[:HAS_BUSSING]->(br1)
      CREATE (bac2Log)-[:HAS_BUSSING]->(br2)
      CREATE (br1)-[:BUSSED_ON]->(today)
      CREATE (br2)-[:BUSSED_ON]->(today)
      `,
      {
        govnId: GOVN_ID,
        govnLogId: GOVN_LOG_ID,
        bac1Id: BAC1_ID,
        bac1LogId: BAC1_LOG_ID,
        bac2Id: BAC2_ID,
        bac2LogId: BAC2_LOG_ID,
        br1Id: BR1_ID,
        br2Id: BR2_ID,
      }
    )
  } finally {
    await s.close()
  }
})

afterAll(async () => {
  const s = driver.session()
  try {
    await s.run(
      `MATCH (agg:AggregateBussingRecord) WHERE agg.id STARTS WITH $prefix DETACH DELETE agg`,
      { prefix: RUN_ID }
    )
    await s.run(
      `
      MATCH (n) WHERE n.id IN [$govnId, $govnLogId, $bac1Id, $bac1LogId,
                                $bac2Id, $bac2LogId, $br1Id, $br2Id]
      DETACH DELETE n
      `,
      {
        govnId: GOVN_ID,
        govnLogId: GOVN_LOG_ID,
        bac1Id: BAC1_ID,
        bac1LogId: BAC1_LOG_ID,
        bac2Id: BAC2_ID,
        bac2LogId: BAC2_LOG_ID,
        br1Id: BR1_ID,
        br2Id: BR2_ID,
      }
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
      MATCH (agg:AggregateBussingRecord)
      WHERE agg.id STARTS WITH $govnPrefix
        AND agg.week = date().week
        AND agg.year = date().year
      RETURN agg.id                AS id,
             agg.week              AS week,
             agg.year              AS year,
             agg.attendance        AS attendance,
             agg.leaderDeclaration AS leaderDeclaration,
             agg.numberOfSprinters AS numberOfSprinters,
             agg.numberOfUrvans    AS numberOfUrvans,
             agg.numberOfCars      AS numberOfCars
      `,
      { govnPrefix: GOVN_ID }
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
  it('creates an AggregateBussingRecord whose id matches <govnId>-<week>-<year>', async () => {
    await aggregateBussingOnGovernorship(driver)

    const records = await readAggregate()
    expect(records).toHaveLength(1)

    const agg = records[0]
    const week = toNum(agg.get('week') as Integer)
    const year = toNum(agg.get('year') as Integer)
    expect(agg.get('id')).toBe(`${GOVN_ID}-${week}-${year}`)
  })
})

// ---------------------------------------------------------------------------
// 2. Roll-up math: two Bacentas → correct sum
// ---------------------------------------------------------------------------

describe('roll-up math', () => {
  it('sums attendance and vehicle counts from all Bacentas under the Governorship', async () => {
    await aggregateBussingOnGovernorship(driver)

    const records = await readAggregate()
    expect(records).toHaveLength(1)

    const agg = records[0]
    // br1: attendance=60, numberOfSprinters=1, numberOfUrvans=2, numberOfCars=0
    // br2: attendance=40, numberOfSprinters=0, numberOfUrvans=1, numberOfCars=1
    expect(toNum(agg.get('attendance'))).toBe(100)
    expect(toNum(agg.get('numberOfSprinters'))).toBe(1)
    expect(toNum(agg.get('numberOfUrvans'))).toBe(3)
    expect(toNum(agg.get('numberOfCars'))).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 3. Idempotency: two runs → same node, same values
// ---------------------------------------------------------------------------

describe('idempotency — ADR-008', () => {
  it('running the aggregator twice produces exactly one aggregate node with the same values', async () => {
    await aggregateBussingOnGovernorship(driver)
    await aggregateBussingOnGovernorship(driver)

    const records = await readAggregate()
    expect(records).toHaveLength(1)

    // Must be 100, not 200 (would be 200 if attendance were accumulated twice)
    expect(toNum(records[0].get('attendance'))).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// 4. Overwrite semantics: changed data replaces, never accumulates
// ---------------------------------------------------------------------------

describe('overwrite semantics — ADR-014', () => {
  afterEach(async () => {
    const s = driver.session()
    await s
      .run(
        `MATCH (br:BussingRecord {id: $brId}) SET br.attendance = 60`,
        { brId: BR1_ID }
      )
      .finally(() => s.close())
  })

  it('re-running after attendance changes overwrites the aggregate value (not adds to it)', async () => {
    await aggregateBussingOnGovernorship(driver)

    // Mutate br1 attendance: 60 → 80
    const mutate = driver.session()
    await mutate
      .run(
        `MATCH (br:BussingRecord {id: $brId}) SET br.attendance = 80`,
        { brId: BR1_ID }
      )
      .finally(() => mutate.close())

    await aggregateBussingOnGovernorship(driver)

    const records = await readAggregate()
    // 80 (br1) + 40 (br2) = 120, not 100 + 120 = 220 (accumulation)
    expect(toNum(records[0].get('attendance'))).toBe(120)
  })
})

// ---------------------------------------------------------------------------
// 5. Snapshot freeze: prior-week aggregates untouched
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
      const week = toNum(result.records[0].get('week') as Integer)
      const year = toNum(result.records[0].get('year') as Integer)
      if (week === 1) {
        // Some years have 53 ISO weeks. Dec 28 is always in the last ISO week.
        const dec28 = new Date(year - 1, 11, 28)
        const jan1 = new Date(year - 1, 0, 1)
        const dayOfYear =
          Math.round((dec28.getTime() - jan1.getTime()) / 86400000) + 1
        const isoDay = ((dec28.getDay() + 6) % 7) + 1
        priorWeek = Math.ceil((dayOfYear - isoDay + 10) / 7)
        priorYear = year - 1
      } else {
        priorWeek = week - 1
        priorYear = year
      }
    } finally {
      await s.close()
    }

    priorAggId = `${GOVN_ID}-${priorWeek}-${priorYear}`

    const seed = driver.session()
    await seed
      .run(
        `
        CREATE (:AggregateBussingRecord {
          id: $id, week: $week, year: $year,
          attendance: 999, numberOfSprinters: 0, numberOfUrvans: 0, numberOfCars: 0
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
        `MATCH (agg:AggregateBussingRecord {id: $id}) DETACH DELETE agg`,
        { id: priorAggId }
      )
      .finally(() => s.close())
  })

  it('running the aggregator for the current week leaves prior-week aggregates unchanged', async () => {
    await aggregateBussingOnGovernorship(driver)

    const s = driver.session()
    const result = await s
      .run(
        `MATCH (agg:AggregateBussingRecord {id: $id}) RETURN agg.attendance AS attendance`,
        { id: priorAggId }
      )
      .finally(() => s.close())

    expect(result.records).toHaveLength(1)
    expect(toNum(result.records[0].get('attendance'))).toBe(999)
  })
})

// ---------------------------------------------------------------------------
// 6. Vacation Bacenta exclusion — SM3
//
// A Bacenta on vacation has no BussingRecord for the current week. The
// aggregator traverses HAS_BUSSING to find records; if there is none, the
// Bacenta contributes nothing to the SUM — implicit exclusion.
// ---------------------------------------------------------------------------

describe('vacation Bacenta exclusion — SM3', () => {
  const VAC_BAC_ID = `${RUN_ID}-vac-bac`
  const VAC_BAC_LOG_ID = `${RUN_ID}-vac-bac-log`

  beforeAll(async () => {
    // Seed a Bacenta on vacation: has CURRENT_HISTORY→ServiceLog but NO
    // HAS_BUSSING→BussingRecord for today (no bussing happened this week).
    const s = driver.session()
    await s
      .run(
        `
        MATCH (govn:Governorship {id: $govnId})
        CREATE (vacBac:Bacenta {id: $vacBacId, name: 'Vacation Bacenta', vacationStatus: 'Vacation'})
        CREATE (vacBacLog:ServiceLog {id: $vacBacLogId})
        CREATE (govn)-[:HAS]->(vacBac)
        CREATE (vacBac)-[:CURRENT_HISTORY]->(vacBacLog)
        `,
        { govnId: GOVN_ID, vacBacId: VAC_BAC_ID, vacBacLogId: VAC_BAC_LOG_ID }
      )
      .finally(() => s.close())
  })

  afterAll(async () => {
    const s = driver.session()
    await s
      .run(
        `MATCH (n) WHERE n.id IN [$vacBacId, $vacBacLogId] DETACH DELETE n`,
        { vacBacId: VAC_BAC_ID, vacBacLogId: VAC_BAC_LOG_ID }
      )
      .finally(() => s.close())
  })

  it('a Bacenta with no BussingRecord this week does not inflate the aggregate', async () => {
    await aggregateBussingOnGovernorship(driver)

    const records = await readAggregate()
    expect(records).toHaveLength(1)

    // br1(60) + br2(40) = 100 — the vacation Bacenta adds nothing
    expect(toNum(records[0].get('attendance'))).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// 7. Empty hierarchy edge — no Bacentas with bussing → zeroAllNullBussingRecords
//    zeros the null vehicle-count fields (not left as NULL)
// ---------------------------------------------------------------------------

describe('empty hierarchy edge — zeroAllNullBussingRecords', () => {
  const EMPTY_GOVN_ID = `${RUN_ID}-empty-govn`
  const EMPTY_LOG_ID = `${RUN_ID}-empty-log`

  beforeAll(async () => {
    // A Governorship with a CURRENT_HISTORY log but NO Bacentas with bussing
    // records. The aggregator MERGE creates the aggregate node but the SET block
    // never executes (no matching MATCH pattern), leaving vehicle counts NULL.
    const s = driver.session()
    await s
      .run(
        `
        CREATE (govn:Governorship {id: $govnId, name: 'Empty BGA Govn'})
        CREATE (log:ServiceLog {id: $logId})
        CREATE (govn)-[:CURRENT_HISTORY]->(log)
        `,
        { govnId: EMPTY_GOVN_ID, logId: EMPTY_LOG_ID }
      )
      .finally(() => s.close())
  })

  afterAll(async () => {
    const s = driver.session()
    try {
      await s.run(
        `MATCH (agg:AggregateBussingRecord) WHERE agg.id STARTS WITH $prefix DETACH DELETE agg`,
        { prefix: EMPTY_GOVN_ID }
      )
      await s.run(
        `MATCH (n) WHERE n.id IN [$govnId, $logId] DETACH DELETE n`,
        { govnId: EMPTY_GOVN_ID, logId: EMPTY_LOG_ID }
      )
    } finally {
      await s.close()
    }
  })

  it('zeroAllNullBussingRecords zeros vehicle counts that are NULL after an empty-hierarchy run', async () => {
    // First run: creates the aggregate node with NULL vehicle counts
    await aggregateBussingOnGovernorship(driver)

    // Verify the aggregate was created with NULL numberOfSprinters
    const before = driver.session()
    const beforeResult = await before
      .run(
        `
        MATCH (agg:AggregateBussingRecord)
        WHERE agg.id STARTS WITH $prefix
        RETURN agg.numberOfSprinters AS numberOfSprinters
        `,
        { prefix: EMPTY_GOVN_ID }
      )
      .finally(() => before.close())

    expect(beforeResult.records).toHaveLength(1)
    expect(beforeResult.records[0].get('numberOfSprinters')).toBeNull()

    // Zero-out pass
    await zeroAllNullBussingRecords(driver)

    const after = driver.session()
    const afterResult = await after
      .run(
        `
        MATCH (agg:AggregateBussingRecord)
        WHERE agg.id STARTS WITH $prefix
        RETURN agg.attendance        AS attendance,
               agg.numberOfSprinters AS numberOfSprinters,
               agg.numberOfUrvans    AS numberOfUrvans,
               agg.numberOfCars      AS numberOfCars
        `,
        { prefix: EMPTY_GOVN_ID }
      )
      .finally(() => after.close())

    expect(afterResult.records).toHaveLength(1)
    const agg = afterResult.records[0]
    expect(toNum(agg.get('attendance'))).toBe(0)
    expect(toNum(agg.get('numberOfSprinters'))).toBe(0)
    expect(toNum(agg.get('numberOfUrvans'))).toBe(0)
    expect(toNum(agg.get('numberOfCars'))).toBe(0)
  })
})
