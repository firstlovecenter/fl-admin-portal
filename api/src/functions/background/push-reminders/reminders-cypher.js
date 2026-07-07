// Cypher for the push-reminder jobs. All variable inputs are $param bindings
// (ADR-012). Every recipient query ends the same way: resolve the Bacenta's
// active leader, gate on the category's opt-out flag (default-ON via coalesce
// — see notification-prefs-cypher.ts), and collect the leader's PushToken
// nodes. Leaders with zero registered devices simply produce no row.
//
// Vacation gating (SM3): vacation is a LABEL (`:Vacation:Bacenta`), mutually
// exclusive with `:Active`, so matching `:Active:Bacenta` already excludes
// vacation Bacentas — no property check needed (this mirrors
// formDefaultersThisWeek in services.graphql).

// ─── Service-form reminder (runs ~22:00 Accra, daily) ────────────────────────
//
// Targets Bacentas whose OWN meeting day (MEETS_ON → ServiceDay.dayNumber,
// 1=Mon…7=Sun, same numbering as Cypher date().dayOfWeek) is TODAY and that
// have neither a filled ServiceRecord (attendance) nor a cancellation
// (noServiceReason) inside the Tue–Sun window. NOTE: the church week proper is
// Mon–Sun (kb/01-glossary.md); Tue-anchoring is the formDefaultersThisWeek /
// WEEK_RANGE idiom (services.graphql, defaulters-cypher.ts) mirrored here so
// the push agrees with the dashboard. Deploy prerequisite: verify every
// ServiceDay node has a non-null dayNumber (dev had Saturday = null — a
// silent never-reminded hole) and that no Monday ServiceDay exists (a Monday
// bacenta would fall outside the Tue-anchored window and be falsely nagged).
const SERVICE_REMINDER_RECIPIENTS = `
  WITH date() AS today
  WITH today, today.weekDay AS theDay
  WITH today, date(today) - duration({days: (theDay - 2)}) AS startDate
  WITH today, [d IN range(0, 5) | startDate + duration({days: d})] AS dates
  MATCH (bacenta:Active:Bacenta)-[:MEETS_ON]->(day:ServiceDay)
  WHERE day.dayNumber = today.dayOfWeek
    AND NOT EXISTS {
      MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(serviceDate:TimeGraph)
      WHERE serviceDate.date IN dates
        AND (record.attendance IS NOT NULL OR record.noServiceReason IS NOT NULL)
    }
  MATCH (bacenta)<-[:LEADS]-(leader:Active:Member)
  WHERE coalesce(leader.notifyServices, true) = true
  MATCH (leader)-[:HAS_PUSH_TOKEN]->(pushToken:PushToken)
  RETURN bacenta.id AS churchId,
         bacenta.name AS churchName,
         collect(DISTINCT pushToken.token) AS tokens
`

// ─── Banking reminder (runs ~15:00 Accra, daily) ─────────────────────────────
//
// Targets Bacentas with a filled, non-cancelled ServiceRecord in the trailing
// 6 days (yesterday back — never today, banking is "next day") that carries
// real income and is not banked by ANY rail. The unbanked predicate mirrors
// services-not-banked/index.js, with two deliberate additions:
//   - income > 0: a zero-income service has nothing to bank; reminding is noise.
//   - transactionStatus 'pending' also counts as handled: a self-banking
//     payment in flight (SM1) resolves on its own; nagging mid-payment is a
//     false alarm. If it fails/abandons, the record reverts to unbanked and
//     the next day's run picks it up again.
// The trailing window (not the Tue-anchored week) is what makes Monday-after-
// Sunday work: on Mondays the Tue-anchored "current week" points FORWARD, so
// a Sunday service would never be seen by a week-window query. Consequence:
// a record still unbanked after 6 days ages out of push reminders for good —
// the weekly services-not-banked spreadsheet is the backstop for those.
// Anchored on the TimeGraph(date) index (repo convention) so cost scales with
// the trailing window, not with all-time ServiceRecord history.
const BANKING_REMINDER_RECIPIENTS = `
  WITH date() AS today
  WITH [d IN range(1, 6) | today - duration({days: d})] AS dates
  MATCH (serviceDate:TimeGraph)
  USING INDEX serviceDate:TimeGraph(date)
  WHERE serviceDate.date IN dates
  MATCH (serviceDate)<-[:SERVICE_HELD_ON]-(record:ServiceRecord)
  WHERE record.attendance IS NOT NULL
    AND record.noServiceReason IS NULL
    AND coalesce(record.income, 0) > 0
    AND record.bankingSlip IS NULL
    AND (record.transactionStatus IS NULL OR NOT record.transactionStatus IN ['success', 'pending'])
    AND record.tellerConfirmationTime IS NULL
  MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Active:Bacenta)
  WITH DISTINCT bacenta, record, serviceDate
  ORDER BY serviceDate.date DESC
  WITH bacenta, collect({income: record.income, foreignCurrency: record.foreignCurrency, date: toString(serviceDate.date)}) AS unbanked
  MATCH (bacenta)<-[:LEADS]-(leader:Active:Member)
  WHERE coalesce(leader.notifyBanking, true) = true
  MATCH (leader)-[:HAS_PUSH_TOKEN]->(pushToken:PushToken)
  RETURN bacenta.id AS churchId,
         bacenta.name AS churchName,
         unbanked,
         collect(DISTINCT pushToken.token) AS tokens
`

// ─── Bussing arrival alerts (Sunday poll) ────────────────────────────────────

// Streams that have arrival windows configured. mobilisation/arrival times are
// full ISO datetime strings where only the time-of-day part is meaningful —
// the JS side stitches today's date on, exactly like arrivalEndTimeCalculator
// in arrivals-resolvers.ts.
const STREAMS_WITH_ARRIVAL_TIMES = `
  MATCH (stream:Active:Stream)
  WHERE stream.arrivalEndTime IS NOT NULL
     OR stream.mobilisationEndTime IS NOT NULL
  RETURN stream.id AS streamId,
         stream.name AS streamName,
         stream.mobilisationEndTime AS mobilisationEndTime,
         stream.arrivalEndTime AS arrivalEndTime
`

// Mobilisation window targets: Bacentas in the stream with NO BussingRecord at
// all for today (mobilisation not submitted). Mirrors Stream.bacentasNoActivity
// in arrivals.graphql (Stream -[:HAS*3]-> Bacenta).
const BUSSING_NOT_MOBILISED_RECIPIENTS = `
  MATCH (stream:Stream {id: $streamId})-[:HAS*3]->(bacenta:Active:Bacenta)
  OPTIONAL MATCH (bussingDate:TimeGraph {date: date($date)})
  WITH bacenta, bussingDate
  WHERE bussingDate IS NULL OR NOT EXISTS {
    MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(:BussingRecord)-[:BUSSED_ON]->(bussingDate)
  }
  MATCH (bacenta)<-[:LEADS]-(leader:Active:Member)
  WHERE coalesce(leader.notifyArrivals, true) = true
  MATCH (leader)-[:HAS_PUSH_TOKEN]->(pushToken:PushToken)
  RETURN bacenta.id AS churchId,
         bacenta.name AS churchName,
         collect(DISTINCT pushToken.token) AS tokens
`

// Arrival window targets: Bacentas ON THE WAY — a BussingRecord exists for
// today but at least one of its vehicles has not recorded arrival. Mirrors
// Stream-scoped bacentasOnTheWay in arrivals.graphql. Bacentas with no record
// at all are NOT re-alerted here — they already got the mobilisation alert,
// and "arrival closing" is meaningless for a bus that was never mobilised.
const BUSSING_NOT_ARRIVED_RECIPIENTS = `
  MATCH (bussingDate:TimeGraph {date: date($date)})<-[:BUSSED_ON]-(bussing:BussingRecord)<-[:HAS_BUSSING]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Active:Bacenta)
  WHERE EXISTS {
      MATCH (bussing)-[:INCLUDES_RECORD]->(vehicle:VehicleRecord)
      WHERE vehicle.arrivalTime IS NULL
    }
    AND EXISTS { MATCH (:Stream {id: $streamId})-[:HAS*3]->(bacenta) }
  MATCH (bacenta)<-[:LEADS]-(leader:Active:Member)
  WHERE coalesce(leader.notifyArrivals, true) = true
  MATCH (leader)-[:HAS_PUSH_TOKEN]->(pushToken:PushToken)
  RETURN bacenta.id AS churchId,
         bacenta.name AS churchName,
         collect(DISTINCT pushToken.token) AS tokens
`

// ─── Idempotency marker (bussing) ────────────────────────────────────────────
//
// Claim-then-send: each (stream, window, date) is claimed exactly once via
// MERGE (which takes a node lock, so two overlapping pollers cannot both see
// "new"). The `claimed` flag trick surfaces whether THIS transaction created
// the node: ON CREATE sets it, the WITH reads it, REMOVE clears it — a
// pre-existing marker reads false. If a send fails after the claim, the window
// stays claimed (a missed alert beats a double alert — EventBridge retries are
// 0 for the same reason).
const CLAIM_REMINDER_MARKER = `
  MERGE (marker:PushReminderMarker {id: $markerId})
  ON CREATE SET marker.claimed = true,
                marker.createdAt = datetime(),
                marker.job = $job
  WITH marker, coalesce(marker.claimed, false) AS isNew
  REMOVE marker.claimed
  RETURN isNew
`

// Markers are per-day artefacts; sweep anything older than 30 days on each
// bussing run so the label never accumulates unbounded.
const SWEEP_OLD_MARKERS = `
  MATCH (marker:PushReminderMarker)
  WHERE marker.createdAt < datetime() - duration({days: 30})
  DETACH DELETE marker
`

// ─── Token pruning ───────────────────────────────────────────────────────────
//
// FCM reported these tokens as dead (unregistered/invalid). DETACH DELETE the
// matching nodes so they are never fanned out to again. Node-scoped, so it
// cannot race a concurrent re-registration of a DIFFERENT token (see
// push-token-cypher.ts for why tokens are nodes).
const PRUNE_INVALID_TOKENS = `
  UNWIND $tokens AS invalidToken
  MATCH (:Member)-[:HAS_PUSH_TOKEN]->(pushToken:PushToken {token: invalidToken})
  DETACH DELETE pushToken
`

module.exports = {
  SERVICE_REMINDER_RECIPIENTS,
  BANKING_REMINDER_RECIPIENTS,
  STREAMS_WITH_ARRIVAL_TIMES,
  BUSSING_NOT_MOBILISED_RECIPIENTS,
  BUSSING_NOT_ARRIVED_RECIPIENTS,
  CLAIM_REMINDER_MARKER,
  SWEEP_OLD_MARKERS,
  PRUNE_INVALID_TOKENS,
}
