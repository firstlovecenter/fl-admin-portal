/* eslint-disable no-console, no-await-in-loop */

// Push-reminders Lambda — ONE function, THREE EventBridge schedules. Each
// schedule rule invokes this same handler with a constant JSON payload:
//
//   { "job": "service" }   daily 22:00 Africa/Accra  → cron(0 22 * * ? *)
//   { "job": "banking" }   daily 15:00 Africa/Accra  → cron(0 15 * * ? *)
//   { "job": "bussing" }   Sundays every 5 min, 04:00–13:00 Africa/Accra
//                          → cron(0/5 4-12 ? * SUN *), retries MUST be 0
//                            (idempotency markers make a retry a no-op, but a
//                            retried tick is still a wasted invocation)
//
// Ghana is UTC+0 year-round (no DST), so UTC cron expressions ARE Accra time
// and JS Date/now math needs no timezone shifting.
//
// Optional event fields:
//   dryRun: true   — compute + log recipients, but send nothing, claim no
//                    markers, prune no tokens. Safe against any environment.
//   force: true    — (bussing only) skip the it-must-be-Sunday guard, for
//                    weekday testing via the CLI runner.

const neo4j = require('neo4j-driver')

const { loadSecrets } = require('./secrets')
const { sendToTokens } = require('./push-sender')
const {
  SERVICE_REMINDER_RECIPIENTS,
  BANKING_REMINDER_RECIPIENTS,
  STREAMS_WITH_ARRIVAL_TIMES,
  BUSSING_NOT_MOBILISED_RECIPIENTS,
  BUSSING_NOT_ARRIVED_RECIPIENTS,
  CLAIM_REMINDER_MARKER,
  SWEEP_OLD_MARKERS,
  PRUNE_INVALID_TOKENS,
} = require('./reminders-cypher')

// Neo4j ints arrive as `{ low, high }` — convert to JS number when possible.
const toNumber = (n) => {
  if (n === null || n === undefined) return null
  if (typeof n === 'number') return n
  if (typeof n.toNumber === 'function') return n.toNumber()
  return n
}

// ─── Shared send/prune plumbing ──────────────────────────────────────────────

// Sends one message per recipient row and accumulates FCM's dead-token
// verdicts. Rows carry `tokens` (all of one leader's devices for one Bacenta);
// a leader with several Bacentas gets one message per Bacenta by design — each
// names the church that needs action.
const sendAll = async (rows, buildMessage, dryRun) => {
  let sent = 0
  let failed = 0
  const invalidTokens = []

  // Message bodies carry church names + income figures; only echo them on a
  // CLI run — a dryRun invoke of the DEPLOYED function must not write
  // per-Bacenta financial data into CloudWatch.
  const isCli = !process.env.AWS_LAMBDA_FUNCTION_NAME

  for (const row of rows) {
    const message = buildMessage(row)
    if (dryRun) {
      console.log('[dryRun] would send', {
        church: row.churchName,
        tokenCount: row.tokens.length,
        title: message.title,
        ...(isCli ? { body: message.body } : {}),
      })
    } else {
      // Per-row confinement: one FCM/network failure must not abort the rest
      // of the fan-out (or, for bussing, strand already-claimed windows).
      try {
        const result = await sendToTokens(row.tokens, message)
        sent += result.successCount
        failed += result.failureCount
        invalidTokens.push(...result.invalidTokens)
      } catch (error) {
        failed += row.tokens.length
        console.error(`Send failed for church ${row.churchId}:`, error.message)
      }
    }
  }

  return { sent, failed, invalidTokens }
}

const pruneInvalidTokens = async (driver, invalidTokens, dryRun) => {
  if (dryRun || invalidTokens.length === 0) return
  const session = driver.session()
  try {
    await session.executeWrite((tx) =>
      tx.run(PRUNE_INVALID_TOKENS, { tokens: invalidTokens })
    )
    console.log(`Pruned ${invalidTokens.length} dead push token(s)`)
  } finally {
    await session.close()
  }
}

const readRows = async (driver, query, params = {}) => {
  const session = driver.session()
  try {
    const result = await session.executeRead((tx) => tx.run(query, params))
    return result.records.map((record) => record.toObject())
  } finally {
    await session.close()
  }
}

// ─── Job: service-form reminder ──────────────────────────────────────────────

const runServiceReminder = async (driver, { dryRun }) => {
  const rows = await readRows(driver, SERVICE_REMINDER_RECIPIENTS)
  console.log(`Service reminder: ${rows.length} leader/Bacenta target(s)`)

  const outcome = await sendAll(
    rows,
    (row) => ({
      title: 'Service form reminder',
      body: `${row.churchName}: today's service form hasn't been filled yet. Please record your service before the day closes.`,
      data: { category: 'SERVICES', churchId: row.churchId },
    }),
    dryRun
  )

  await pruneInvalidTokens(driver, outcome.invalidTokens, dryRun)
  return { job: 'service', targets: rows.length, ...outcome }
}

// ─── Job: banking reminder ───────────────────────────────────────────────────

// Outside Accra records store income in a foreign currency (ServiceRecord.
// foreignCurrency) — label with it so a USD figure is never presented as GHS.
const formatMoney = (amount, currency) => {
  const value = toNumber(amount)
  if (value === null) return ''
  return `${currency || 'GHS'} ${value.toLocaleString('en-GH')}`
}

const runBankingReminder = async (driver, { dryRun }) => {
  const rows = await readRows(driver, BANKING_REMINDER_RECIPIENTS)
  console.log(`Banking reminder: ${rows.length} leader/Bacenta target(s)`)

  const outcome = await sendAll(
    rows,
    (row) => {
      // Most recent unbanked service leads the message; extra ones are counted.
      const [latest] = row.unbanked
      const more =
        row.unbanked.length > 1
          ? ` (+${row.unbanked.length - 1} more unbanked service${
              row.unbanked.length > 2 ? 's' : ''
            })`
          : ''
      return {
        title: 'Banking reminder',
        body: `${row.churchName}: ${formatMoney(
          latest.income,
          latest.foreignCurrency
        )} from your ${
          latest.date
        } service hasn't been banked yet${more}. Please bank it today.`,
        data: { category: 'BANKING', churchId: row.churchId },
      }
    },
    dryRun
  )

  await pruneInvalidTokens(driver, outcome.invalidTokens, dryRun)
  return { job: 'banking', targets: rows.length, ...outcome }
}

// ─── Job: bussing arrival alerts ─────────────────────────────────────────────

// Stream times are full ISO datetime strings where only the time-of-day is
// meaningful. Stitch today's date onto the stored time-of-day — same idiom as
// arrivalEndTimeCalculator in arrivals-resolvers.ts. Returns null when the
// stream has no such time configured.
const todayAt = (storedIsoTime, now) => {
  if (!storedIsoTime) return null
  const timePart = new Date(storedIsoTime).toISOString().slice(10)
  return new Date(now.toISOString().slice(0, 10) + timePart)
}

const MINUTE_MS = 60 * 1000

// Recording is actually accepted until arrivalEndTime + 15 min — the
// COUNTINGBUFFER in arrivals-resolvers.ts (arrivalEndTimeCalculator). The
// "closed" alert must respect it or it lies during those 15 minutes.
const COUNTING_BUFFER_MIN = 15

// A window "fires" when `now` has entered [alertAt, expiresAt). The countdown
// windows expire at the deadline itself (a "closes in 30 min" alert sent after
// close would be a lie); the `end` window starts after the counting buffer and
// gets a 30-minute grace tail so a poll tick just after still announces the
// close exactly once.
const WINDOWS = [
  {
    key: 'mob-60',
    base: 'mobilisationEndTime',
    offsetMin: 60,
    recipients: BUSSING_NOT_MOBILISED_RECIPIENTS,
    message: (streamName, deadline) => ({
      title: 'Mobilisation closing soon',
      body: `Mobilisation for ${streamName} closes at ${deadline}. Submit your mobilisation now.`,
    }),
  },
  {
    key: 'arr-60',
    base: 'arrivalEndTime',
    offsetMin: 60,
    recipients: BUSSING_NOT_ARRIVED_RECIPIENTS,
    message: (streamName, deadline) => ({
      title: 'Arrival window closing in 1 hour',
      body: `${streamName} arrivals close at ${deadline}. Record your bus arrival as soon as you land.`,
    }),
  },
  {
    key: 'arr-30',
    base: 'arrivalEndTime',
    offsetMin: 30,
    recipients: BUSSING_NOT_ARRIVED_RECIPIENTS,
    message: (streamName, deadline) => ({
      title: 'Arrival window closing in 30 minutes',
      body: `${streamName} arrivals close at ${deadline}. Record your bus arrival now.`,
    }),
  },
  {
    key: 'arr-5',
    base: 'arrivalEndTime',
    offsetMin: 5,
    recipients: BUSSING_NOT_ARRIVED_RECIPIENTS,
    message: (streamName, deadline) => ({
      title: 'Arrival window closing NOW',
      body: `${streamName} arrivals close at ${deadline} — only minutes left to record your arrival.`,
    }),
  },
  {
    key: 'arr-end',
    base: 'arrivalEndTime',
    offsetMin: 0,
    bufferMin: COUNTING_BUFFER_MIN,
    graceMin: 30,
    recipients: BUSSING_NOT_ARRIVED_RECIPIENTS,
    message: (streamName, deadline) => ({
      title: 'Arrival window closed',
      body: `${streamName} arrivals closed at ${deadline}. Your bus was not marked arrived — contact your admin if it did arrive.`,
    }),
  },
]

const formatAccraTime = (dateObj) => dateObj.toISOString().slice(11, 16) // Ghana is UTC — HH:MM of the ISO string

const runBussingAlerts = async (driver, { dryRun, force }) => {
  const now = new Date()

  // Bussing is a Sunday operation; the schedule only fires Sundays, but guard
  // anyway so a misconfigured rule (or a manual invoke) can't spam leaders.
  if (now.getUTCDay() !== 0 && !force) {
    console.log('Not Sunday (UTC/Accra) — bussing alerts skipped')
    return { job: 'bussing', skipped: 'not-sunday' }
  }

  // Housekeeping: markers older than 30 days are dead weight. Once per Sunday
  // is plenty — gate to the first ticks of the day instead of all ~108.
  if (!dryRun && now.getUTCHours() < 5) {
    const session = driver.session()
    try {
      await session.executeWrite((tx) => tx.run(SWEEP_OLD_MARKERS))
    } finally {
      await session.close()
    }
  }

  const streams = await readRows(driver, STREAMS_WITH_ARRIVAL_TIMES)
  const dateISO = now.toISOString().slice(0, 10)
  const summary = []
  const invalidTokens = []

  // Whether (stream, window) is due right now. The deadline the USER is told
  // is the official time; the arr-end fire time additionally waits out the
  // counting buffer (recording is still accepted until official + buffer).
  const dueInfo = (stream, window) => {
    const official = todayAt(stream[window.base], now)
    if (!official) return null

    const effective = window.bufferMin
      ? new Date(official.getTime() + window.bufferMin * MINUTE_MS)
      : official
    const alertAt = new Date(effective.getTime() - window.offsetMin * MINUTE_MS)
    const expiresAt =
      window.offsetMin === 0
        ? new Date(effective.getTime() + (window.graceMin || 0) * MINUTE_MS)
        : effective
    if (now < alertAt || now >= expiresAt) return null
    return { alertAt, officialLabel: formatAccraTime(official) }
  }

  // Claim (stream, window, date) exactly once. Returns false when another
  // tick (or an earlier suppression) already owns it.
  const claimWindow = async (stream, window) => {
    const markerId = `${stream.streamId}-${window.key}-${dateISO}`
    const session = driver.session()
    try {
      const result = await session.executeWrite((tx) =>
        tx.run(CLAIM_REMINDER_MARKER, { markerId, job: 'bussing' })
      )
      return result.records[0]?.get('isNew') === true
    } catch (error) {
      // The :PushReminderMarker(id) uniqueness constraint (a deploy
      // prerequisite — see README) turns a create/create race into a
      // constraint violation on the loser. That means the other tick owns
      // the window — not-claimed, not an error.
      if (String(error.code).includes('ConstraintValidationFailed')) {
        return false
      }
      throw error
    } finally {
      await session.close()
    }
  }

  const fireWindow = async (stream, window, officialLabel) => {
    const rows = await readRows(driver, window.recipients, {
      streamId: stream.streamId,
      date: dateISO,
    })
    console.log(
      `Bussing ${window.key} for ${stream.streamName}: ${rows.length} target(s)`
    )

    const outcome = await sendAll(
      rows,
      (row) => ({
        ...window.message(stream.streamName, officialLabel),
        data: { category: 'ARRIVALS', churchId: row.churchId },
      }),
      dryRun
    )
    invalidTokens.push(...outcome.invalidTokens)
    return {
      stream: stream.streamName,
      window: window.key,
      targets: rows.length,
      sent: outcome.sent,
      failed: outcome.failed,
    }
  }

  for (const stream of streams) {
    // Group due windows by base time so a late/recovered poller doesn't stack
    // "closes in 60/30/5" back-to-back: fire only the MOST IMMINENT due window
    // per base and claim (suppress) the staler ones.
    const dueByBase = new Map()
    WINDOWS.forEach((window) => {
      const due = dueInfo(stream, window)
      if (due) {
        const list = dueByBase.get(window.base) || []
        list.push({ window, ...due })
        dueByBase.set(window.base, list)
      }
    })

    for (const dueList of dueByBase.values()) {
      dueList.sort((a, b) => b.alertAt - a.alertAt) // most imminent first
      const [head, ...stale] = dueList

      const claimed = dryRun || (await claimWindow(stream, head.window))
      if (claimed) {
        summary.push(await fireWindow(stream, head.window, head.officialLabel))
      }
      if (!dryRun) {
        for (const s of stale) {
          await claimWindow(stream, s.window) // suppress without sending
        }
      }
    }
  }

  await pruneInvalidTokens(driver, invalidTokens, dryRun)
  return { job: 'bussing', windowsFired: summary }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

const JOBS = {
  service: runServiceReminder,
  banking: runBankingReminder,
  bussing: runBussingAlerts,
}

exports.handler = async (event = {}) => {
  const { job } = event
  const dryRun = event.dryRun === true
  const force = event.force === true

  if (!JOBS[job]) {
    const message = `Unknown job "${job}" — expected one of: ${Object.keys(
      JOBS
    ).join(', ')}`
    console.error(message)
    return { statusCode: 400, body: JSON.stringify({ message }) }
  }

  console.log('Push reminders invoked', { job, dryRun, force })

  const SECRETS = await loadSecrets()

  // Match the main API's connection logic: use the URI as-is and toggle
  // encryption config based on the scheme. SYN-180: validate against the
  // system CA store, never TRUST_ALL_CERTIFICATES.
  const uri = SECRETS.NEO4J_URI || 'bolt://localhost:7687/'
  const hasEncryptionInUri =
    uri.includes('neo4j+s://') || uri.includes('neo4j+ssc://')
  const driverConfig = {
    maxConnectionPoolSize: 10,
    connectionTimeout: 30000,
  }
  if (!hasEncryptionInUri) {
    driverConfig.encrypted = 'ENCRYPTION_ON'
    driverConfig.trust = 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES'
  }

  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    ),
    driverConfig
  )

  try {
    await driver.verifyConnectivity()
    const result = await JOBS[job](driver, { dryRun, force })
    console.log('Push reminders finished', result)
    return { statusCode: 200, body: JSON.stringify(result) }
  } catch (error) {
    console.error(`Push reminders job "${job}" failed:`, error)
    // service/banking: RETHROW so the async invocation registers a function
    // error and EventBridge Scheduler's retry policy actually re-runs the
    // missed reminder (a returned 500 payload counts as success and would
    // silently drop the day's reminders). bussing: swallow — the next 5-min
    // tick is the retry, and its schedule sets retries to 0 by design.
    if (job !== 'bussing') throw error
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Job "${job}" failed`,
        error: error.message,
      }),
    }
  } finally {
    await driver.close()
  }
}
