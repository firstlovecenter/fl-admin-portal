/**
 * SYN-265: also covers the longer capped budget and the Lambda deadline.
 *
 * SYN-225: a single transient ECONNREFUSED from Neo4j at 02:00 UTC failed the
 * whole service-graph-aggregator run. These tests cover the bounded retry in
 * connect-with-retry.js and the handler wiring in index.js (retry, driver
 * close on every path). No Neo4j connection required — the driver is mocked.
 */

const {
  connectWithRetry,
  isTransientNeo4jError,
} = require('./connect-with-retry')

// Shape of the error from the ticket: code ServiceUnavailable, retriable true
const serviceUnavailable = () =>
  Object.assign(new Error('Could not perform discovery'), {
    code: 'ServiceUnavailable',
    retriable: true,
  })

const authError = () =>
  Object.assign(new Error('The client is unauthorized'), {
    code: 'Neo.ClientError.Security.Unauthorized',
    retriable: false,
  })

const noWait = () => jest.fn().mockResolvedValue(undefined)

describe('isTransientNeo4jError', () => {
  it('treats retriable / ServiceUnavailable / SessionExpired as transient', () => {
    expect(isTransientNeo4jError(serviceUnavailable())).toBe(true)
    expect(isTransientNeo4jError({ code: 'ServiceUnavailable' })).toBe(true)
    expect(isTransientNeo4jError({ code: 'SessionExpired' })).toBe(true)
    expect(isTransientNeo4jError({ retriable: true })).toBe(true)
  })

  it('treats auth errors, plain errors and nullish values as permanent', () => {
    expect(isTransientNeo4jError(authError())).toBe(false)
    expect(isTransientNeo4jError(new Error('boom'))).toBe(false)
    expect(isTransientNeo4jError(undefined)).toBe(false)
  })
})

describe('connectWithRetry', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('connects first time without waiting', async () => {
    const driver = { verifyConnectivity: jest.fn().mockResolvedValue({}) }
    const wait = noWait()

    await connectWithRetry(driver, { wait })

    expect(driver.verifyConnectivity).toHaveBeenCalledTimes(1)
    expect(wait).not.toHaveBeenCalled()
  })

  it('recovers from a transient refusal with exponential backoff', async () => {
    const driver = {
      verifyConnectivity: jest
        .fn()
        .mockRejectedValueOnce(serviceUnavailable())
        .mockRejectedValueOnce(serviceUnavailable())
        .mockResolvedValue({}),
    }
    const wait = noWait()

    await connectWithRetry(driver, { wait, baseDelayMs: 2000 })

    expect(driver.verifyConnectivity).toHaveBeenCalledTimes(3)
    expect(wait.mock.calls).toEqual([[2000], [4000]])
  })

  it('gives up after the attempt budget and rethrows the last error', async () => {
    const last = serviceUnavailable()
    const driver = {
      verifyConnectivity: jest
        .fn()
        .mockRejectedValueOnce(serviceUnavailable())
        .mockRejectedValueOnce(serviceUnavailable())
        .mockRejectedValueOnce(last),
    }
    const wait = noWait()

    await expect(connectWithRetry(driver, { attempts: 3, wait })).rejects.toBe(
      last
    )
    expect(driver.verifyConnectivity).toHaveBeenCalledTimes(3)
    expect(wait).toHaveBeenCalledTimes(2)
  })

  it('fails fast on a non-transient error', async () => {
    const err = authError()
    const driver = { verifyConnectivity: jest.fn().mockRejectedValue(err) }
    const wait = noWait()

    await expect(connectWithRetry(driver, { wait })).rejects.toBe(err)
    expect(driver.verifyConnectivity).toHaveBeenCalledTimes(1)
    expect(wait).not.toHaveBeenCalled()
  })

  // SYN-265: the old 5-attempt / ~30s budget ran out during the 02:00 UTC
  // prod Neo4j outage; the default now rides out a ~3 min restart
  it('default budget is 10 attempts, waits capped at 30s, ~3 min in total', async () => {
    const driver = {
      verifyConnectivity: jest.fn().mockRejectedValue(serviceUnavailable()),
    }
    const wait = noWait()

    await expect(connectWithRetry(driver, { wait })).rejects.toBeTruthy()
    expect(driver.verifyConnectivity).toHaveBeenCalledTimes(10)
    const waits = wait.mock.calls.flat()
    expect(waits).toEqual([
      2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000, 30000,
    ])
    expect(waits.reduce((a, b) => a + b, 0)).toBe(180000)
  })

  it('recovers when Neo4j comes back after more than the old 30s budget', async () => {
    // 6 refusals = 2+4+8+16+30+30s = 90s of outage: failed under SYN-225's
    // budget (5 attempts)
    const verifyConnectivity = jest.fn()
    for (let i = 0; i < 6; i += 1) {
      verifyConnectivity.mockRejectedValueOnce(serviceUnavailable())
    }
    verifyConnectivity.mockResolvedValue({})
    const wait = noWait()

    await connectWithRetry({ verifyConnectivity }, { wait })

    expect(verifyConnectivity).toHaveBeenCalledTimes(7)
    expect(wait.mock.calls.flat().reduce((a, b) => a + b, 0)).toBe(90000)
  })

  it('gives up before a wait would pass the deadline, rethrowing the error', async () => {
    let clock = 0
    const now = () => clock
    const wait = jest.fn(async (ms) => {
      clock += ms
    })
    const last = serviceUnavailable()
    const driver = {
      verifyConnectivity: jest
        .fn()
        .mockRejectedValueOnce(serviceUnavailable())
        .mockRejectedValueOnce(serviceUnavailable())
        .mockRejectedValueOnce(last),
    }

    // 2s + 4s fit in 10s; the next 8s wait would end at 14s > 10s
    await expect(
      connectWithRetry(driver, { wait, now, deadline: 10000 })
    ).rejects.toBe(last)
    expect(wait.mock.calls.flat()).toEqual([2000, 4000])
    expect(driver.verifyConnectivity).toHaveBeenCalledTimes(3)
    expect(console.warn).toHaveBeenLastCalledWith(
      expect.stringContaining('giving up')
    )
  })

  it('counts time spent inside a slow attempt against the deadline', async () => {
    let clock = 0
    const now = () => clock
    const wait = jest.fn(async (ms) => {
      clock += ms
    })
    // Each attempt hangs for the full 10s connect timeout before failing
    const driver = {
      verifyConnectivity: jest.fn(async () => {
        clock += 10000
        throw serviceUnavailable()
      }),
    }

    // t=10s fail -> wait 2s; t=22s fail -> 22+4+10 = 36 > 30, give up
    await expect(
      connectWithRetry(driver, {
        wait,
        now,
        deadline: 30000,
        attemptTimeoutMs: 10000,
      })
    ).rejects.toBeTruthy()
    expect(wait.mock.calls.flat()).toEqual([2000])
    expect(driver.verifyConnectivity).toHaveBeenCalledTimes(2)
  })

  it('reserves the next attempt duration, not just the wait', async () => {
    const driver = {
      verifyConnectivity: jest.fn().mockRejectedValue(serviceUnavailable()),
    }
    const wait = noWait()

    // A 2s wait fits a 5s deadline, but 2s wait + 10s attempt does not
    await expect(
      connectWithRetry(driver, {
        wait,
        now: () => 0,
        deadline: 5000,
        attemptTimeoutMs: 10000,
      })
    ).rejects.toBeTruthy()
    expect(wait).not.toHaveBeenCalled()
  })

  it('a wait that ends exactly on the deadline is still allowed', async () => {
    const driver = {
      verifyConnectivity: jest
        .fn()
        .mockRejectedValueOnce(serviceUnavailable())
        .mockResolvedValue({}),
    }
    const wait = noWait()

    await connectWithRetry(driver, { wait, now: () => 0, deadline: 2000 })

    expect(wait.mock.calls.flat()).toEqual([2000])
  })

  it('uses a real timer when no wait is injected', async () => {
    jest.useFakeTimers()
    try {
      const driver = {
        verifyConnectivity: jest
          .fn()
          .mockRejectedValueOnce(serviceUnavailable())
          .mockResolvedValue({}),
      }
      const p = connectWithRetry(driver, { baseDelayMs: 10 })
      await jest.advanceTimersByTimeAsync(10)
      await p
      expect(driver.verifyConnectivity).toHaveBeenCalledTimes(2)
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('service-graph-aggregator handler (SYN-225)', () => {
  const mockDriver = {
    verifyConnectivity: jest.fn(),
    close: jest.fn(),
  }
  const mockAggregators = {
    aggregateBacentaOnGovernorship: jest.fn(),
    aggregateGovernorshipOnCouncil: jest.fn(),
    aggregateCouncilOnStream: jest.fn(),
    aggregateStreamOnCampus: jest.fn(),
    aggregateCampusOnOversight: jest.fn(),
    aggregateOversightOnDenomination: jest.fn(),
  }

  let handler
  let connectOptions

  beforeEach(() => {
    connectOptions = []
    jest.resetModules()
    jest.doMock('neo4j-driver', () => ({
      driver: jest.fn(() => mockDriver),
      auth: { basic: jest.fn(() => ({})) },
    }))
    jest.doMock('./secrets.js', () => ({
      loadSecrets: jest.fn(async () => ({
        NEO4J_URI: 'bolt://localhost:7687',
        NEO4J_ENCRYPTED: 'false',
      })),
    }))
    jest.doMock('./query-exec/aggregateAllChurches.js', () => mockAggregators)
    // Collapse the backoff so the handler test does not sleep for real
    jest.doMock('./connect-with-retry.js', () => {
      const actual = jest.requireActual('./connect-with-retry.js')
      return {
        ...actual,
        connectWithRetry: (driver, options) => {
          connectOptions.push(options)
          return actual.connectWithRetry(driver, {
            ...options,
            wait: async () => {},
          })
        },
      }
    })

    mockDriver.verifyConnectivity.mockReset().mockResolvedValue({})
    mockDriver.close.mockReset().mockResolvedValue(undefined)
    Object.values(mockAggregators).forEach((fn) =>
      fn.mockReset().mockResolvedValue([['1']])
    )
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})

    // eslint-disable-next-line global-require
    ;({ handler } = require('./index.js'))
  })

  it('returns 200 after a transient refusal clears, and closes the driver', async () => {
    mockDriver.verifyConnectivity
      .mockRejectedValueOnce(serviceUnavailable())
      .mockResolvedValue({})

    const res = await handler({}, {})

    expect(res.statusCode).toBe(200)
    expect(mockDriver.verifyConnectivity).toHaveBeenCalledTimes(2)
    Object.values(mockAggregators).forEach((fn) =>
      expect(fn).toHaveBeenCalledWith(mockDriver)
    )
    expect(mockDriver.close).toHaveBeenCalledTimes(1)
  })

  it('returns 500 when Neo4j stays down, skips aggregation, still closes the driver', async () => {
    mockDriver.verifyConnectivity.mockRejectedValue(serviceUnavailable())

    const res = await handler({}, {})

    expect(res.statusCode).toBe(500)
    expect(JSON.parse(res.body).error).toBe('Could not perform discovery')
    expect(mockDriver.verifyConnectivity).toHaveBeenCalledTimes(10)
    expect(
      mockAggregators.aggregateBacentaOnGovernorship
    ).not.toHaveBeenCalled()
    expect(mockDriver.close).toHaveBeenCalledTimes(1)
  })

  it('creates the driver with a capped per-attempt connectionTimeout', async () => {
    // eslint-disable-next-line global-require
    const neo4j = require('neo4j-driver')

    await handler({}, {})

    expect(neo4j.driver).toHaveBeenCalledWith(
      'bolt://localhost:7687',
      expect.anything(),
      { connectionTimeout: 10000 }
    )
  })

  // SYN-265: the longer retry budget must not run past the Lambda timeout
  it('bounds the connect retries by the Lambda remaining time minus a query reserve', async () => {
    const context = { getRemainingTimeInMillis: () => 330000 }

    const before = Date.now()
    const res = await handler({}, context)
    const after = Date.now()

    expect(res.statusCode).toBe(200)
    expect(connectOptions).toHaveLength(1)
    const { deadline, attemptTimeoutMs } = connectOptions[0]
    expect(attemptTimeoutMs).toBe(10000)
    expect(deadline).toBeGreaterThanOrEqual(before + 330000 - 90000)
    expect(deadline).toBeLessThanOrEqual(after + 330000 - 90000)
  })

  it('gives up on the deadline through the handler and returns 500', async () => {
    mockDriver.verifyConnectivity.mockRejectedValue(serviceUnavailable())
    // Less than the 90s reserve left: no time to wait at all
    const context = { getRemainingTimeInMillis: () => 60000 }

    const res = await handler({}, context)

    expect(res.statusCode).toBe(500)
    expect(mockDriver.verifyConnectivity).toHaveBeenCalledTimes(1)
    expect(
      mockAggregators.aggregateBacentaOnGovernorship
    ).not.toHaveBeenCalled()
    expect(mockDriver.close).toHaveBeenCalledTimes(1)
  })

  it('has no deadline when run without a Lambda context (CLI)', async () => {
    await handler()

    expect(connectOptions).toEqual([
      { deadline: Infinity, attemptTimeoutMs: 10000 },
    ])
  })

  it('fails fast through the handler on a non-transient (auth) error', async () => {
    mockDriver.verifyConnectivity.mockRejectedValue(authError())

    const res = await handler({}, {})

    expect(res.statusCode).toBe(500)
    expect(mockDriver.verifyConnectivity).toHaveBeenCalledTimes(1)
    expect(mockDriver.close).toHaveBeenCalledTimes(1)
  })

  it('still returns the result when driver.close() rejects', async () => {
    mockDriver.close.mockRejectedValue(new Error('close failed'))

    const res = await handler({}, {})

    expect(res.statusCode).toBe(200)
    expect(console.warn).toHaveBeenCalledWith(
      '[Neo4j] Failed to close driver:',
      'close failed'
    )
  })

  it('closes the driver when an aggregation query fails', async () => {
    mockAggregators.aggregateCouncilOnStream.mockRejectedValue(
      new Error('query failed')
    )

    const res = await handler({}, {})

    expect(res.statusCode).toBe(500)
    expect(mockDriver.close).toHaveBeenCalledTimes(1)
  })
})
