# Push Reminders

Scheduled push-notification reminders for Bacenta leaders. Shares one FCM sender
(`push-sender.js`) across three planned jobs.

## Status

**Enrollment layer: DONE.** Devices register via the Settings → Notifications
toggle; tokens are stored on the `Member.pushTokens` node property through the
self-scoped `RegisterPushToken` / `UnregisterPushToken` mutations.

**Sender + jobs: NOT YET SHIPPABLE.** `push-sender.js` is written but has no
host Lambda, no `package.json`/`firebase-admin` dep, and no schedule. It cannot
send anything until the blockers below clear.

## Hard blockers

1. **Dev FCM 401** — `POST fcmregistrations.googleapis.com/.../registrations`
   returns 401 in dev, so devices can't register. GCP console fix (API key
   authorization for the FCM Registration API on project `flc-platform-dev`).
2. **Prod messaging project** — only `flc-platform-dev` exists. Prod needs its
   own Firebase web app, VAPID key, and service account. See
   `web-react-ts/src/services/firebaseMessaging.ts` (config is hardcoded to dev).
3. **Service-account secrets** — populate `FCM_*` keys (see `push-sender.js`
   header) in `dev/` and `prod/fl-admin-portal`. These belong to the *messaging*
   project, NOT `flc-membership` (which is Firestore-only, used by
   payment-webhook).
4. **Host Lambda wiring** — when the first job is built, this dir needs a
   `package.json` (with `firebase-admin`) and its own `secrets.js` sibling, like
   every other job. `push-sender.js` `require('./secrets')` throws on load until
   that exists — it is inert (unimported) today.

## Data model

Device tokens are nodes, not a Member list property, to avoid a lost-update
race between multi-device registration and the prune job:

```
(:Member)-[:HAS_PUSH_TOKEN]->(:PushToken { token, createdAt, lastSeenAt })
```

Managed by the self-scoped `RegisterPushToken` (MERGE) / `UnregisterPushToken`
(DETACH DELETE) mutations. Sender jobs prune FCM-invalid tokens by DETACH
DELETEing the matching `:PushToken` node. Consider a uniqueness constraint on
`PushToken.token` and age-based eviction via `lastSeenAt` when wiring the jobs.

## Recipients

Bacenta leader only (the servant responsible for recording), resolved from the
church's `LEADS` relationship.

## Category preferences (opt-out)

Each leader has three self-managed flags on their Member node, stored via the
`SetNotificationPreference` mutation and read by `myNotificationPreferences`:

| Category | Flag | Gates |
| --- | --- | --- |
| SERVICES | `notifyServices` | service-form reminder |
| BANKING  | `notifyBanking`  | banking reminder |
| ARRIVALS | `notifyArrivals` | all bussing alerts |

Default ON: a flag that was never set reads as subscribed. **Every job MUST gate
on the relevant flag** before sending, e.g. `WHERE coalesce(leader.notifyBanking,
true) = true`, so an opt-out is honoured.

## Planned jobs (each its own EventBridge schedule, tz `Africa/Accra`)

| Job | When | Rule | Reuses |
| --- | --- | --- | --- |
| Service-form reminder | ~22:00 on each church's **own service day** | ServiceRecord not filled (and not no-service/vacation) → remind leader | defaulter Cypher |
| Banking reminder | next day ~15:00 | recorded income not yet banked → remind leader | `services-not-banked` Cypher (near-verbatim) |
| Bussing arrival alerts | Sunday, poll every ~5 min during bussing hours | per Stream with no arrival recorded, fire at T-60/T-30/T-5/end vs `arrivalEndTime` and T-60 vs `mobilisationEndTime`; per-window idempotency marker so no double-send | `Stream.mobilisationEndTime` / `arrivalStartTime` / `arrivalEndTime` |

Service day is **per-church**, not fixed Sunday — the service reminder must read
each church's service day (confirm the exact field before building).

## Idempotency

Bussing alerts must not double-fire. Each (stream, window, date) that has been
sent gets a marker (e.g. a property/relationship on the bussing/stream node);
the poller skips windows already marked. EventBridge retries are set to 0 for
this reason.

## Sender contract

`sendToTokens(tokens, { title, body, data })` → `{ successCount, failureCount,
invalidTokens }`. Callers MUST prune `invalidTokens` from the Member node
(`messaging/registration-token-not-registered` etc.) so token lists don't grow
unbounded.
