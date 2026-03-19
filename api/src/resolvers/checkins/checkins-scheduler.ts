import { getCheckinsDb } from './firebase'
import { EVENTS_COLLECTION, CHECKINS_COLLECTION } from './checkins-service'
import { CheckInEvent } from './checkins-types'

const SCHEDULER_INTERVAL_MS = 60 * 1000 // Run every minute
const BATCH_CHUNK_SIZE = 490 // Firestore batch limit is 500

/**
 * Auto-checkouts all checked-in members for events whose end time has passed,
 * then marks those events as ENDED.
 */
async function runAutoCheckoutJob(): Promise<void> {
  const db = await getCheckinsDb()
  if (!db) return

  const now = new Date()

  // Fetch all ACTIVE events and filter by endsAt in memory
  // (Firestore doesn't support DateTime comparisons on ISO strings without Timestamp type)
  const snapshot = await db
    .collection(EVENTS_COLLECTION)
    .where('status', '==', 'ACTIVE')
    .get()

  if (snapshot.empty) return

  const expiredEvents = snapshot.docs.filter((doc) => {
    const event = doc.data() as CheckInEvent
    return new Date(event.endsAt) <= now
  })

  if (expiredEvents.length === 0) return

  console.log(
    `[CheckIn Scheduler] Found ${expiredEvents.length} expired event(s) — processing auto-checkout`
  )

  const nowIso = now.toISOString()

  for (const eventDoc of expiredEvents) {
    const event = eventDoc.data() as CheckInEvent
    try {
      // Fetch all check-in records for this event
      const recordsSnapshot = await db
        .collection(CHECKINS_COLLECTION)
        .where('eventId', '==', event.id)
        .get()

      const uncheckedOut = recordsSnapshot.docs.filter(
        (doc) => !doc.data().checkedOutAt
      )

      // Write in chunks to respect Firestore's 500 ops/batch limit
      for (let i = 0; i < uncheckedOut.length; i += BATCH_CHUNK_SIZE) {
        const chunk = uncheckedOut.slice(i, i + BATCH_CHUNK_SIZE)
        const batch = db.batch()
        for (const recordDoc of chunk) {
          batch.update(recordDoc.ref, {
            checkedOutAt: nowIso,
            autoCheckedOut: true,
          })
        }
        await batch.commit()
      }

      // Mark the event as ENDED
      await eventDoc.ref.update({ status: 'ENDED' })

      console.log(
        `[CheckIn Scheduler] Event "${event.name}" (${event.id}) ended — auto-checked out ${uncheckedOut.length} member(s)`
      )
    } catch (err) {
      console.error(
        `[CheckIn Scheduler] Error processing event ${event.id}:`,
        err
      )
    }
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
