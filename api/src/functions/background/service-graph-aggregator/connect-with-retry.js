// SYN-225: one ECONNREFUSED blip from Neo4j failed a whole run because
// verifyConnectivity() was tried once. Retry only transient connection errors;
// auth/config errors still fail fast. The aggregation queries are NOT retried —
// the hourly schedule already re-runs the idempotent MERGEs (ADR-008/014).

const TRANSIENT_CODES = ['ServiceUnavailable', 'SessionExpired']

const isTransientNeo4jError = (error) =>
  Boolean(error) &&
  (error.retriable === true || TRANSIENT_CODES.includes(error.code))

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * Verify Neo4j connectivity, retrying transient failures with backoff.
 * Default: 5 attempts with 2s, 4s, 8s, 16s waits between them (~30s of
 * backoff, plus each attempt's own connectionTimeout set in index.js).
 * @param {Object} driver - Neo4j driver instance
 * @param {Object} [options]
 * @param {number} [options.attempts=5] - total attempts, including the first
 * @param {number} [options.baseDelayMs=2000] - delay before the 2nd attempt
 * @param {Function} [options.wait] - injectable sleep, for tests
 * @returns {Promise<void>}
 */
const connectWithRetry = async (
  driver,
  { attempts = 5, baseDelayMs = 2000, wait = sleep } = {}
) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await driver.verifyConnectivity()
      return
    } catch (error) {
      if (attempt >= attempts || !isTransientNeo4jError(error)) throw error

      const delayMs = baseDelayMs * 2 ** (attempt - 1)
      console.warn(
        `[Neo4j] Connection attempt ${attempt}/${attempts} failed (${error.code}: ${error.message}); retrying in ${delayMs}ms`
      )
      // eslint-disable-next-line no-await-in-loop
      await wait(delayMs)
    }
  }
}

module.exports = { connectWithRetry, isTransientNeo4jError }
