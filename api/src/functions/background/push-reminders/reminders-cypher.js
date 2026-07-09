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

// ─── Defaulters roundup (Fri 12:00 & 15:00, Sat 09:00 Accra) ─────────────────
//
// One summary push per SUPERVISORY church node (Governorship / Council /
// Stream) that has at least one defaulting Bacenta in its subtree THIS WEEK,
// delivered to every leader (LEADS) and admin (IS_ADMIN_FOR) of that node who
// hasn't muted the DEFAULTERS category. Collapsing all of a node's overseers
// into ONE row (tokens collected together) is deliberate: the message names
// the node, so every governor/admin over it gets the same single summary.
//
// Defaulter definitions:
//   - form defaulter: an Active Bacenta whose MEETS_ON day has ALREADY PASSED
//     this week (dayNumber < today, or == today after 20:30) with neither a
//     filled (attendance) nor a cancelled (noServiceReason) ServiceRecord in
//     the Tue–Sun week. A Bacenta that hasn't met yet is NOT counted — so a
//     Sunday Bacenta is never nagged on Friday. The meeting-day-passed gate
//     matches the dashboard's formDefaultersThisWeekCount (services.graphql);
//     the "serviced" test (attendance OR noServiceReason present) matches
//     SERVICE_REMINDER above. (The dashboard @cypher additionally collapses to
//     0 when the week has no ServiceRecords graph-wide — a latent dashboard
//     quirk this query deliberately does not inherit.)
//   - banking defaulter: an Active Bacenta with a FILLED record this week not
//     banked by any rail (bankingSlip / transactionStatus 'success' /
//     tellerConfirmationTime). Mirrors the defaulters DOWNLOAD
//     (defaulters-cypher.ts CHILD_BACENTA_BUCKETS): filled record + :Active,
//     no income>0 filter. NOTE this is intentionally stricter than the
//     dashboard's bankingDefaultersThisWeekCount, which omits the attendance
//     requirement and includes Closed/vacation Bacentas — so this can
//     under-count vs the dashboard but agrees with the download the admin sees.
// Vacation Bacentas are excluded structurally (:Active:Bacenta — SM3).
//
// Performance: both CALLs anchor on the TimeGraph(date) index for the ~6 dates
// of the week (like BANKING_REMINDER_RECIPIENTS), so cost scales with the
// WEEK's records, not each Bacenta's all-time history. The form CALL collects
// the week's serviced Bacentas via that anchored scan and anti-joins the
// subtree's meeting-day-passed Bacentas against it (never a per-Bacenta
// full-history NOT EXISTS).
//
// The node anchor is `MATCH (node:<Level>)` WITHOUT `:Active`: supervisory
// nodes (Council/Governorship/Stream) do not reliably carry the `:Active`
// label — dashboards/downloads always address them by id, never scan by
// `:Active:Level`. Dormant nodes are already filtered downstream: a node with
// no defaulting Bacenta (`> 0` gate) or no active overseer with a device
// (`<-[:LEADS|IS_ADMIN_FOR]-(:Active:Member)-[:HAS_PUSH_TOKEN]->`) yields no
// row.
//
// The three queries differ ONLY in the level label and the :HAS-depth from the
// node down to its Bacentas, so they are built from one template. They take NO
// runtime parameters — the week is derived from date() — so ADR-012's $param
// rule has nothing to bind: every interpolated fragment is a module-private
// compile-time literal.

/* eslint-disable fl-cypher/no-interpolated-cypher --
 * `level` and `subtreeSuffix` are module-private compile-time literals (see the
 * three call sites below); no user or runtime input is interpolated, and the
 * built queries take no parameters at all. */
// `subtreeSuffix` is the :HAS chain from the supervisory node down to (but not
// including) the leaf Bacenta, so a Bacenta variable can be appended in either
// direction: `${subtreeSuffix}(bacenta:Active:Bacenta)` to bind a fresh leaf,
// or `${subtreeSuffix}(b)` inside an EXISTS to test that an already-bound `b`
// belongs to this node's subtree.
const buildDefaultersRecipients = (level, subtreeSuffix) => `
  WITH date() AS today
  WITH today, today.weekDay AS theDay
  WITH today, date(today) - duration({days: (theDay - 2)}) AS startDate
  WITH today, [d IN range(0, 5) | startDate + duration({days: d})] AS dates
  MATCH (node:${level})
  CALL {
    WITH node, today, dates
    CALL {
      WITH node, dates
      MATCH (serviceDate:TimeGraph)
      USING INDEX serviceDate:TimeGraph(date)
      WHERE serviceDate.date IN dates
      MATCH (serviceDate)<-[:SERVICE_HELD_ON]-(record:ServiceRecord)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(b:Active:Bacenta)
      WHERE (record.attendance IS NOT NULL OR record.noServiceReason IS NOT NULL)
        AND EXISTS { MATCH ${subtreeSuffix}(b) }
      RETURN collect(DISTINCT b) AS serviced
    }
    MATCH ${subtreeSuffix}(bacenta:Active:Bacenta)-[:MEETS_ON]->(day:ServiceDay)
    WHERE (day.dayNumber < today.dayOfWeek
           OR (day.dayNumber = today.dayOfWeek AND time() > time('20:30')))
      AND NOT bacenta IN serviced
    RETURN count(DISTINCT bacenta) AS formDefaulters
  }
  CALL {
    WITH node, dates
    MATCH (serviceDate:TimeGraph)
    USING INDEX serviceDate:TimeGraph(date)
    WHERE serviceDate.date IN dates
    MATCH (serviceDate)<-[:SERVICE_HELD_ON]-(record:ServiceRecord)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(bacenta:Active:Bacenta)
    WHERE record.attendance IS NOT NULL
      AND record.noServiceReason IS NULL
      AND record.bankingSlip IS NULL
      AND (record.transactionStatus IS NULL OR record.transactionStatus <> 'success')
      AND record.tellerConfirmationTime IS NULL
      AND EXISTS { MATCH ${subtreeSuffix}(bacenta) }
    RETURN count(DISTINCT bacenta) AS bankingDefaulters
  }
  WITH node, formDefaulters, bankingDefaulters
  WHERE formDefaulters > 0 OR bankingDefaulters > 0
  MATCH (node)<-[:LEADS|IS_ADMIN_FOR]-(member:Active:Member)
  WHERE coalesce(member.notifyDefaulters, true) = true
  MATCH (member)-[:HAS_PUSH_TOKEN]->(pushToken:PushToken)
  RETURN node.id AS churchId,
         node.name AS churchName,
         '${level}' AS level,
         formDefaulters,
         bankingDefaulters,
         collect(DISTINCT pushToken.token) AS tokens
`

const DEFAULTERS_REMINDER_RECIPIENTS_GOVERNORSHIP = buildDefaultersRecipients(
  'Governorship',
  '(node)-[:HAS]->'
)
const DEFAULTERS_REMINDER_RECIPIENTS_COUNCIL = buildDefaultersRecipients(
  'Council',
  '(node)-[:HAS]->(:Governorship)-[:HAS]->'
)
const DEFAULTERS_REMINDER_RECIPIENTS_STREAM = buildDefaultersRecipients(
  'Stream',
  '(node)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->'
)
/* eslint-enable fl-cypher/no-interpolated-cypher */

// Iterated by the defaulters job; each row is one node-level summary. Order is
// cosmetic (Governorship → Council → Stream).
const DEFAULTERS_REMINDER_QUERIES = [
  DEFAULTERS_REMINDER_RECIPIENTS_GOVERNORSHIP,
  DEFAULTERS_REMINDER_RECIPIENTS_COUNCIL,
  DEFAULTERS_REMINDER_RECIPIENTS_STREAM,
]

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
  DEFAULTERS_REMINDER_QUERIES,
  STREAMS_WITH_ARRIVAL_TIMES,
  BUSSING_NOT_MOBILISED_RECIPIENTS,
  BUSSING_NOT_ARRIVED_RECIPIENTS,
  CLAIM_REMINDER_MARKER,
  SWEEP_OLD_MARKERS,
  PRUNE_INVALID_TOKENS,
}
