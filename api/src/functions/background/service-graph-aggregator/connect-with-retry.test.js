/**
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

  it('default budget is 5 attempts, ~30s of backoff in total', async () => {
    const driver = {
      verifyConnectivity: jest.fn().mockRejectedValue(serviceUnavailable()),
    }
    const wait = noWait()

    await expect(connectWithRetry(driver, { wait })).rejects.toBeTruthy()
    expect(driver.verifyConnectivity).toHaveBeenCalledTimes(5)
    expect(wait.mock.calls.flat()).toEqual([2000, 4000, 8000, 16000])
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

  beforeEach(() => {
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
        connectWithRetry: (driver) =>
          actual.connectWithRetry(driver, { wait: async () => {} }),
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
    expect(mockDriver.verifyConnectivity).toHaveBeenCalledTimes(5)
    expect(mockAggregators.aggregateBacentaOnGovernorship).not.toHaveBeenCalled()
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
