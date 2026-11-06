jest.mock('dotenv', () => ({ config: jest.fn() }))

const {
  repair,
  run,
  parseArgs,
  looksLikeProd,
  assertTargetAllowed,
  isNonFinite,
  REPAIR_RECORDS,
  REPAIR_AGGREGATES,
  SELECT_REMAINING,
  WRITE_HISTORY_LOG,
} = require('./repair-nonfinite-dollar-income')

const OPTIONS = { campusName: 'La Belle Église', rate: 10 }
const APPLY = { ...OPTIONS, apply: true, expectRecords: 1 }

const rowResult = (rows) => ({
  records: rows.map((row) => ({
    keys: Object.keys(row),
    get: (key) => row[key],
  })),
})

// Mirrors the driver: a failed query or commit closes the transaction, so
// isOpen() is false and rollback is never called on those paths.
const buildSession = (runImpl) => {
  let open = true
  const tx = {
    run: jest.fn(async (...args) => {
      try {
        return await runImpl(...args)
      } catch (error) {
        open = false
        throw error
      }
    }),
    commit: jest.fn(async () => {
      open = false
    }),
    rollback: jest.fn(async () => {
      open = false
    }),
    isOpen: jest.fn(() => open),
  }
  return { tx, session: { beginTransaction: jest.fn(() => tx) } }
}

const recordRow = {
  recordId: 'bacenta-1-36-2026',
  date: '2026-09-04',
  income: 100,
  campus: 'La Belle Église',
  currency: 'GHS',
  rate: 10,
  newDollarIncome: 10,
}

const aggregateRow = {
  aggregateId: 'denomination-1-36-2026',
  week: 36,
  year: 2026,
  currency: 'USD',
  numberOfServices: { toNumber: () => 862 },
  oldDollarIncome: 'Infinity',
  oldIncome: 'Infinity',
  newDollarIncome: 1234.5,
  newIncome: 1234.5,
}

const stubbedRuns = ({ records = [recordRow], remaining = [] } = {}) => {
  const results = [
    rowResult(records),
    rowResult([aggregateRow]),
    rowResult(remaining),
    rowResult([{ historyLogId: 'log-1' }]),
  ]
  return () => Promise.resolve(results.shift())
}

describe('repair', () => {
  it('rolls back a dry run, writing no HistoryLog', async () => {
    const { tx, session } = buildSession(stubbedRuns())

    const result = await repair(session, OPTIONS)

    expect(tx.rollback).toHaveBeenCalledTimes(1)
    expect(tx.commit).not.toHaveBeenCalled()
    expect(tx.run).toHaveBeenCalledTimes(3)
    expect(result.committed).toBe(false)
  })

  it('binds the expected campus and rate, and repairs records first', async () => {
    const { tx, session } = buildSession(stubbedRuns())

    await repair(session, OPTIONS)

    expect(tx.run.mock.calls).toEqual([
      [REPAIR_RECORDS, { campusName: 'La Belle Église', rate: 10 }],
      [REPAIR_AGGREGATES],
      [SELECT_REMAINING],
    ])
  })

  it('commits on apply and records one audit log naming campus, rate and weeks', async () => {
    const { tx, session } = buildSession(stubbedRuns())

    const result = await repair(session, APPLY)

    expect(tx.commit).toHaveBeenCalledTimes(1)
    expect(tx.rollback).not.toHaveBeenCalled()
    expect(result.committed).toBe(true)
    expect(tx.run).toHaveBeenLastCalledWith(WRITE_HISTORY_LOG, {
      campusName: 'La Belle Église',
      historyRecord:
        'Repaired non-finite dollarIncome for La Belle Église at rate 10: 1 service record(s), 1 aggregate(s), weeks W36/2026',
    })
  })

  it('refuses to commit when the record count differs from the expected one', async () => {
    const { tx, session } = buildSession(stubbedRuns())

    await expect(
      repair(session, { ...APPLY, expectRecords: 112 })
    ).rejects.toThrow('Expected 112 repaired record(s) but found 1')

    expect(tx.commit).not.toHaveBeenCalled()
    expect(tx.rollback).toHaveBeenCalledTimes(1)
  })

  it('refuses to commit while anything stays non-finite', async () => {
    const remaining = [{ type: 'ServiceRecord', id: 'orphan-1' }]
    const { tx, session } = buildSession(stubbedRuns({ remaining }))

    await expect(repair(session, APPLY)).rejects.toThrow(
      '1 node(s) would stay non-finite'
    )

    expect(tx.commit).not.toHaveBeenCalled()
  })

  it('allows leftovers only with allowRemaining', async () => {
    const remaining = [{ type: 'ServiceRecord', id: 'orphan-1' }]
    const { tx, session } = buildSession(stubbedRuns({ remaining }))

    await repair(session, { ...APPLY, allowRemaining: true })

    expect(tx.commit).toHaveBeenCalledTimes(1)
  })

  it.each([[0], [2]])(
    'refuses to commit when %i audit logs were written',
    async (count) => {
      const results = [
        rowResult([recordRow]),
        rowResult([aggregateRow]),
        rowResult([]),
        rowResult(Array(count).fill({ historyLogId: 'log-1' })),
      ]
      const { tx, session } = buildSession(() =>
        Promise.resolve(results.shift())
      )

      await expect(repair(session, APPLY)).rejects.toThrow(
        `Expected 1 audit HistoryLog but wrote ${count}`
      )

      expect(tx.commit).not.toHaveBeenCalled()
      expect(tx.rollback).toHaveBeenCalledTimes(1)
    }
  )

  it('propagates a failed commit without attempting a rollback', async () => {
    const { tx, session } = buildSession(stubbedRuns())
    tx.commit.mockImplementationOnce(async () => {
      tx.isOpen.mockReturnValue(false)
      throw new Error('connection lost')
    })

    await expect(repair(session, APPLY)).rejects.toThrow('connection lost')

    expect(tx.rollback).not.toHaveBeenCalled()
  })

  it('writes no audit log and commits nothing when there is nothing to repair', async () => {
    const results = [rowResult([]), rowResult([]), rowResult([])]
    const { tx, session } = buildSession(() => Promise.resolve(results.shift()))

    const result = await repair(session, { ...APPLY, expectRecords: 0 })

    expect(tx.run).toHaveBeenCalledTimes(3)
    expect(tx.commit).not.toHaveBeenCalled()
    expect(result.committed).toBe(false)
  })

  it('unwraps Neo4j integers', async () => {
    const { session } = buildSession(stubbedRuns())

    const result = await repair(session, OPTIONS)

    expect(result.aggregates[0].numberOfServices).toBe(862)
  })

  it('does not roll back a transaction the driver already closed', async () => {
    const { tx, session } = buildSession(() =>
      Promise.reject(new Error('query failed'))
    )

    await expect(repair(session, APPLY)).rejects.toThrow('query failed')

    expect(tx.commit).not.toHaveBeenCalled()
    expect(tx.rollback).not.toHaveBeenCalled()
  })

  it('keeps the original error when the rollback also fails', async () => {
    const { tx, session } = buildSession(stubbedRuns())
    tx.rollback.mockRejectedValueOnce(new Error('rollback failed'))
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(
      repair(session, { ...APPLY, expectRecords: 2 })
    ).rejects.toThrow('Expected 2 repaired record(s)')

    log.mockRestore()
  })
})

describe('run', () => {
  let exitCode

  beforeEach(() => {
    exitCode = process.exitCode
    jest.spyOn(console, 'log').mockImplementation(() => undefined)
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    jest.spyOn(console, 'table').mockImplementation(() => undefined)
  })

  afterEach(() => {
    process.exitCode = exitCode
    jest.restoreAllMocks()
  })

  it('reports failure through the exit code and still closes everything', async () => {
    const { session } = buildSession(() => Promise.reject(new Error('boom')))
    session.close = jest.fn().mockResolvedValue(undefined)
    const driver = {
      session: () => session,
      close: jest.fn().mockResolvedValue(undefined),
    }

    await run(driver, OPTIONS)

    expect(process.exitCode).toBe(1)
    expect(session.close).toHaveBeenCalledTimes(1)
    expect(driver.close).toHaveBeenCalledTimes(1)
  })

  it('still closes the driver when closing the session fails', async () => {
    const { session } = buildSession(stubbedRuns())
    session.close = jest.fn().mockRejectedValue(new Error('close failed'))
    const driver = {
      session: () => session,
      close: jest.fn().mockResolvedValue(undefined),
    }

    await expect(run(driver, { ...OPTIONS, limit: 200 })).rejects.toThrow(
      'close failed'
    )

    expect(driver.close).toHaveBeenCalledTimes(1)
  })
})

describe('assertTargetAllowed', () => {
  const PROD = 'neo4j+s://neo4j.firstlovecenter.com:7687'

  it('refuses production without --allow-prod', () => {
    expect(() => assertTargetAllowed(PROD, { allowProd: false })).toThrow(
      'looks like production'
    )
  })

  it('allows production with --allow-prod', () => {
    expect(() => assertTargetAllowed(PROD, { allowProd: true })).not.toThrow()
  })

  it('allows a dev host without the flag', () => {
    expect(() =>
      assertTargetAllowed('bolt://dev-neo4j.firstlovecenter.com:7687', {
        allowProd: false,
      })
    ).not.toThrow()
  })
})

describe('parseArgs', () => {
  const base = ['--expect-campus', 'La Belle Église', '--expect-rate', '10']

  it('is a dry run unless told otherwise', () => {
    expect(parseArgs(base)).toMatchObject({
      apply: false,
      allowProd: false,
      allowRemaining: false,
      campusName: 'La Belle Église',
      rate: 10,
    })
  })

  it('does not treat --allow-prod as permission to write', () => {
    expect(parseArgs([...base, '--allow-prod']).apply).toBe(false)
  })

  it('requires the campus and a positive rate', () => {
    expect(() => parseArgs(['--expect-rate', '10'])).toThrow('--expect-campus')
    expect(() => parseArgs(['--expect-campus', 'X'])).toThrow('--expect-rate')
    expect(() =>
      parseArgs(['--expect-campus', 'X', '--expect-rate', '0'])
    ).toThrow('--expect-rate')
  })

  it('requires an expected record count to apply', () => {
    expect(() => parseArgs([...base, '--apply'])).toThrow('--expect-records')
    expect(
      parseArgs([...base, '--apply', '--expect-records', '112']).expectRecords
    ).toBe(112)
  })

  it('refuses a limit that would hide rows', () => {
    expect(() => parseArgs([...base, '--limit', 'abc'])).toThrow('--limit')
    expect(() => parseArgs([...base, '--limit', '-1'])).toThrow('--limit')
  })

  it('refuses contradictory flags', () => {
    expect(() =>
      parseArgs([...base, '--apply', '--dry-run', '--expect-records', '1'])
    ).toThrow('contradict')
  })
})

describe('looksLikeProd', () => {
  it.each([
    'bolt://localhost:7687',
    'neo4j://127.0.0.1:7687',
    'bolt://neo4j:7687',
    'bolt+ssc://dev-neo4j.firstlovecenter.com:7687',
  ])('accepts the known non-production host %s', (uri) => {
    expect(looksLikeProd(uri)).toBe(false)
  })

  it.each([
    'neo4j+s://neo4j.firstlovecenter.com:7687',
    'bolt://NEO4J.FIRSTLOVECENTER.COM:7687',
    'bolt://10.0.0.5:7687',
    'bolt://dev-trick.example.com:7687',
    'bolt://user:pass@neo4j.firstlovecenter.com:7687',
    'not-a-uri',
  ])('treats anything else as production: %s', (uri) => {
    expect(looksLikeProd(uri)).toBe(true)
  })
})

describe('repair Cypher', () => {
  it('pins the exact predicate, including the negation', () => {
    expect(isNonFinite('r.dollarIncome')).toBe(
      '(r.dollarIncome IS NOT NULL AND NOT coalesce(abs(toFloat(r.dollarIncome)) < 1.0e308, false))'
    )
  })

  it('scopes records to the bound campus and rate', () => {
    expect(REPAIR_RECORDS).toContain('size(campuses) = 1')
    expect(REPAIR_RECORDS).toContain('campuses[0].name = $campusName')
    expect(REPAIR_RECORDS).toContain(
      'campuses[0].conversionRateToDollar = $rate'
    )
    expect(REPAIR_RECORDS).toContain('round(toFloat(r.income) / $rate, 2)')
  })

  it('does not filter campuses on rate before the uniqueness check', () => {
    expect(REPAIR_RECORDS).not.toContain('conversionRateToDollar > 0')
  })

  it('excludes NoService records and non-finite income', () => {
    expect(REPAIR_RECORDS).toContain('NOT r:NoService')
    expect(REPAIR_RECORDS).toContain(`NOT ${isNonFinite('r.income')}`)
  })

  it('never writes ServiceRecord.income', () => {
    expect(REPAIR_RECORDS).not.toMatch(/r\.income\s*=(?!=)/)
  })

  it('re-sums the stored snapshot instead of walking the live hierarchy (ADR-014)', () => {
    expect(REPAIR_AGGREGATES).toContain('a.componentServiceIds')
    expect(REPAIR_AGGREGATES).not.toContain('HAS_HISTORY')
    expect(REPAIR_AGGREGATES).not.toContain(':HAS')
  })

  it('only repairs an aggregate this run can explain', () => {
    expect(REPAIR_AGGREGATES).toContain('size(records) = size(ids)')
    expect(REPAIR_AGGREGATES).toContain('size(ids) > 0')
    expect(REPAIR_AGGREGATES).toContain(
      'any(x IN records WHERE x.dollarIncomeRepairedAt IS NOT NULL)'
    )
    expect(REPAIR_AGGREGATES).toContain(
      `AND NOT ${isNonFinite('x.dollarIncome')}`
    )
    expect(REPAIR_AGGREGATES).toContain(
      'x.dollarIncome IS NOT NULL OR coalesce(x.income, 0) = 0'
    )
  })

  it('leaves finite values alone and never matches unrepairable income', () => {
    expect(REPAIR_AGGREGATES).toContain(
      `WHEN ${isNonFinite('a.dollarIncome')} THEN total`
    )
    expect(REPAIR_AGGREGATES).toContain('ELSE a.dollarIncome')
    expect(REPAIR_AGGREGATES).toContain('ELSE a.income')
    expect(REPAIR_AGGREGATES).toContain(
      `(NOT ${isNonFinite('a.income')} OR a.currency = 'USD')`
    )
  })

  it('leaves recomputedAt alone', () => {
    expect(REPAIR_AGGREGATES).not.toContain('recomputedAt')
  })

  it('reports why an aggregate was left behind', () => {
    expect(SELECT_REMAINING).toContain('unresolvedComponents')
    expect(SELECT_REMAINING).toContain('size(records) AS found')
  })
})
