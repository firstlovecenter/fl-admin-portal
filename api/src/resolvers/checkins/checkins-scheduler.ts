import { getCheckinsDriver } from './firebase'

const SCHEDULER_INTERVAL_MS = 60 * 1000 // Run every minute

/**
 * Auto-checkouts all checked-in members for events whose end time has passed,
 * then marks those events as ENDED.
 */
async function runAutoCheckoutJob(): Promise<void> {
  const driver = getCheckinsDriver()
  if (!driver) return

  const session = driver.session()
  try {
    const nowIso = new Date().toISOString()

    // Find expired active events, auto-checkout unchecked-out members, and end events
    const result = await session.run(
      `MATCH (e:CheckInEvent {status: 'ACTIVE'})
       WHERE e.endsAt <= $nowIso
       OPTIONAL MATCH (r:CheckInRecord {eventId: e.id})
       WHERE r.checkedOutAt IS NULL
       WITH e, collect(r) AS records
       FOREACH (r IN records | SET r.checkedOutAt = $nowIso, r.autoCheckedOut = true)
       SET e.status = 'ENDED'
       RETURN e.id AS eventId, e.name AS eventName, size(records) AS checkedOut`,
      { nowIso }
    )

    for (const record of result.records) {
      const name = record.get('eventName')
      const id = record.get('eventId')
      const count = record.get('checkedOut')?.toNumber?.() ?? 0
      console.log(
        `[CheckIn Scheduler] Event "${name}" (${id}) ended — auto-checked out ${count} member(s)`
      )
    }
  } catch (err) {
    console.error('[CheckIn Scheduler] Error:', err)
  } finally {
    await session.close()
  }
}

/**
 * Starts the background auto-checkout scheduler.
 * Runs immediately on start, then once per minute.
 * Call this once during server startup.
 */
export function startAutoCheckoutScheduler(): ReturnType<typeof setInterval> {
  console.log('[CheckIn Scheduler] Starting (interval: 60s)')

  // Run once immediately so events expired at startup are handled without waiting
  runAutoCheckoutJob().catch((err) =>
    console.error('[CheckIn Scheduler] Initial run error:', err)
  )

  return setInterval(() => {
    runAutoCheckoutJob().catch((err) =>
      console.error('[CheckIn Scheduler] Error:', err)
    )
  }, SCHEDULER_INTERVAL_MS)
}
