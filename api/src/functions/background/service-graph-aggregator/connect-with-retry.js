// SYN-225: one ECONNREFUSED blip from Neo4j failed a whole run because
// verifyConnectivity() was tried once. Retry only transient connection errors;
// auth/config errors still fail fast. The aggregation queries are NOT retried —
// the scheduled re-run already repeats the idempotent MERGEs (ADR-008/014).
//
// SYN-265: prod Neo4j can refuse bolt for minutes (a restart, not a blip), so
// the budget is ~3 min with waits capped at 30s. A bigger fixed count alone
// could overrun the Lambda timeout, so callers pass a `deadline` and we give
// up rather than start a wait + attempt that would end after it.

const TRANSIENT_CODES = ['ServiceUnavailable', 'SessionExpired']

const isTransientNeo4jError = (error) =>
  Boolean(error) &&
  (error.retriable === true || TRANSIENT_CODES.includes(error.code))

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * Verify Neo4j connectivity, retrying transient failures with capped backoff.
 * Default: 10 attempts with 2s, 4s, 8s, 16s, then 30s waits (~3 min of
 * backoff), stopping early if the next wait plus attempt would pass `deadline`.
 * @param {Object} driver - Neo4j driver instance
 * @param {Object} [options]
 * @param {number} [options.attempts=10] - total attempts, including the first
 * @param {number} [options.baseDelayMs=2000] - delay before the 2nd attempt
 * @param {number} [options.maxDelayMs=30000] - cap on any single wait
 * @param {number} [options.deadline=Infinity] - epoch ms the next attempt must finish by
 * @param {number} [options.attemptTimeoutMs=0] - worst-case duration of one attempt
 * @param {Function} [options.now] - injectable clock, for tests
 * @param {Function} [options.wait] - injectable sleep, for tests
 * @returns {Promise<void>}
 */
const connectWithRetry = async (
  driver,
  {
    attempts = 10,
    baseDelayMs = 2000,
    maxDelayMs = 30000,
    deadline = Infinity,
    attemptTimeoutMs = 0,
    now = Date.now,
    wait = sleep,
  } = {}
) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await driver.verifyConnectivity()
      return
    } catch (error) {
      if (attempt >= attempts || !isTransientNeo4jError(error)) throw error

      const delayMs = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs)
      if (now() + delayMs + attemptTimeoutMs > deadline) {
        console.warn(
          `[Neo4j] Connection attempt ${attempt}/${attempts} failed (${error.code}: ${error.message}); no time left before the deadline, giving up`
        )
        throw error
      }
      console.warn(
        `[Neo4j] Connection attempt ${attempt}/${attempts} failed (${error.code}: ${error.message}); retrying in ${delayMs}ms`
      )
      // eslint-disable-next-line no-await-in-loop
      await wait(delayMs)
    }
  }
}

module.exports = { connectWithRetry, isTransientNeo4jError }
