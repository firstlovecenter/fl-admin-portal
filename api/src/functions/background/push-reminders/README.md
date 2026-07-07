# Push Reminders

Scheduled push-notification reminders for Bacenta leaders. **One Lambda,
three EventBridge schedules** — each schedule invokes the same handler with a
constant payload selecting the job.

## Status

**Enrollment layer: DONE and verified end-to-end (2026-07-07).** Devices
register via the Settings → Notifications toggle or the soft-ask card; tokens
are stored as `(:Member)-[:HAS_PUSH_TOKEN]->(:PushToken)` nodes through the
self-scoped `RegisterPushToken` / `UnregisterPushToken` mutations.

**Sender + jobs: BUILT, not yet scheduled.** `index.js` implements all three
jobs behind an `event.job` dispatcher; `run-push-reminders.js` in
`api/src/scripts/` exercises them from the CLI. What remains is AWS wiring:
create the Lambda, attach the three EventBridge rules below, grant the
Secrets Manager read.

### Historical blockers — all RESOLVED 2026-07-07

1. ~~Dev FCM 401~~ — was a **VAPID key mismatch**: the Amplify app-level env
   carried the *prod* VAPID key, which the dev branch inherited.
   `fcmregistrations.googleapis.com` rejects a mismatched
   `applicationPubKey` with a misleading generic `401 UNAUTHENTICATED`.
   Fixed with branch-level env overrides (dev → dev key; main → full
   flc-platform-prod config). Registration + a real FCM v1 send verified.
2. ~~Prod web app / `VITE_FIREBASE_*`~~ — the Synago prod web app exists
   (`1:803927251916:web:96301637d3f57b14e31b69`) and main's branch env now
   carries the full flc-platform-prod config. Takes effect on the next main
   deploy.
3. ~~Service-account secret~~ — populated and verified in BOTH
   `dev/fl-admin-portal` and `prod/fl-admin-portal` under the key
   **`FIREBASE_SERVICE_ACCOUNT`** (the whole downloaded SA JSON as one
   string; dev → flc-platform-dev SA, prod → flc-platform-prod SA).
   `loadSecrets()` resolves per env, so the sender targets the matching
   project automatically. These are the *messaging* projects — NOT
   `flc-membership` (Firestore-only, used by payment-webhook, whose loose
   `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` keys still live in the dev
   secret; don't confuse the two).

## Architecture

```
EventBridge rule "push-reminders-service"  { "job": "service" }  ┐
EventBridge rule "push-reminders-banking"  { "job": "banking" }  ├→ ONE Lambda (index.js)
EventBridge rule "push-reminders-bussing"  { "job": "bussing" }  ┘      │
                                                                        ├─ reminders-cypher.js  (targeting queries)
                                                                        ├─ push-sender.js       (firebase-admin, FCM v1)
                                                                        └─ secrets.js           (Secrets Manager)
```

Ghana is UTC+0 year-round, so UTC cron **is** Africa/Accra time.

| Rule | Schedule (UTC = Accra) | Payload | Retries |
| --- | --- | --- | --- |
| service | `cron(0 22 * * ? *)` — daily 22:00 | `{"job":"service"}` | 2, max age 1 h |
| banking | `cron(0 15 * * ? *)` — daily 15:00 | `{"job":"banking"}` | 2, max age 1 h |
| bussing | `cron(0/5 4-12 ? * SUN *)` — Sundays, every 5 min 04:00–12:55 | `{"job":"bussing"}` | **0** |

Retry semantics depend on the handler's error behaviour: for `service` and
`banking` the handler RETHROWS on failure so the async invocation registers a
function error and the schedule's retry policy re-runs the missed reminder.
For `bussing` the handler swallows errors (returns 500) — the next 5-minute
tick is the retry, idempotency markers make re-fires no-ops, and the
schedule's retries are set to 0 so a slow tick is never replayed on top of
the next one.

## Jobs

| Job | Targets | Reuses |
| --- | --- | --- |
| `service` | Bacentas whose own `MEETS_ON → ServiceDay` is **today** with no filled/cancelled ServiceRecord this Tue–Sun week | `formDefaultersThisWeek` idiom (services.graphql) |
| `banking` | Bacentas with a filled record in the trailing 6 days, `income > 0`, not banked by any rail (`bankingSlip` / `transactionStatus` success **or pending** / `tellerConfirmationTime`) | `services-not-banked` predicate |
| `bussing` | Per Stream and window: `mob-60` → Bacentas with **no BussingRecord today** (`bacentasNoActivity` idiom); `arr-60/30/5/end` → Bacentas **on the way** (record exists, a `VehicleRecord.arrivalTime` is null — `bacentasOnTheWay` idiom) | arrivals.graphql Stream fields; times stitched to today like `arrivalEndTimeCalculator` |

Deliberate deviations from the source queries, for reminder ergonomics:
- Banking uses a **trailing-6-day window**, not the Tue-anchored week — on
  Mondays the Tue-anchored "current week" points forward and would never see
  yesterday's Sunday service. It also treats `pending` as banked (a
  self-banking payment in flight resolves on its own; if it fails, the next
  day's run picks the record back up) and skips `income = 0` records.
- Arrival windows do **not** re-alert never-mobilised Bacentas — they already
  got the `mob-60` alert, and "arrival closing" is meaningless for a bus that
  never left.

## Data model

Device tokens are nodes, not a Member list property, to avoid a lost-update
race between multi-device registration and pruning:

```
(:Member)-[:HAS_PUSH_TOKEN]->(:PushToken { token, createdAt, lastSeenAt })
```

Managed by the self-scoped `RegisterPushToken` (MERGE) / `UnregisterPushToken`
(DETACH DELETE) mutations. The jobs prune FCM-dead tokens
(`registration-token-not-registered` etc.) by DETACH DELETEing the matching
node after each run.

Bussing idempotency lives in marker nodes, claimed **before** sending
(claim-then-send: a missed alert beats a double alert):

```
(:PushReminderMarker { id: "<streamId>-<window>-<yyyy-mm-dd>", createdAt, job })
```

Markers older than 30 days are swept at the start of each bussing run.

**Deploy prerequisites (per target Neo4j — all done on dev 2026-07-07):**

1. Marker uniqueness — the claim is only race-proof with this constraint
   (without it, two concurrent MERGEs can each create their own node and
   both read "new"). The claim code treats `ConstraintValidationFailed` from
   the losing racer as "not claimed" and skips the window.

   ```cypher
   CREATE CONSTRAINT push_reminder_marker_id IF NOT EXISTS
   FOR (m:PushReminderMarker) REQUIRE m.id IS UNIQUE
   ```

2. Token lookup index — makes the prune a seek instead of a per-token label
   scan:

   ```cypher
   CREATE INDEX push_token_token IF NOT EXISTS FOR (p:PushToken) ON (p.token)
   ```

3. ServiceDay integrity — `MATCH (d:ServiceDay) RETURN d.day, d.dayNumber`.
   Every node needs a non-null `dayNumber` (ISO, Mon=1…Sun=7; dev's Saturday
   was null → Saturday Bacentas silently never reminded). If a **Monday**
   ServiceDay exists, do NOT enable the service schedule until the
   Tue-anchored window question is resolved (a Monday Bacenta would sit
   outside the window and be nagged even after filling the form —
   `formDefaultersThisWeek` shares the hole).

## Recipients & preferences (opt-out, default ON)

Recipient = the Bacenta's **leader** (`LEADS`, `:Active:Member`). Every query
gates on the category flag with `coalesce(leader.notifyX, true) = true`:

| Category | Flag | Gates |
| --- | --- | --- |
| SERVICES | `notifyServices` | service-form reminder |
| BANKING  | `notifyBanking`  | banking reminder |
| ARRIVALS | `notifyArrivals` | all bussing alerts |

Vacation Bacentas are excluded structurally: vacation is a **label**
(`:Vacation:Bacenta`), and every query matches `:Active:Bacenta` (SM3).

## Running locally

```
node api/src/scripts/run-push-reminders.js --job service --dryRun
node api/src/scripts/run-push-reminders.js --job banking --dryRun
node api/src/scripts/run-push-reminders.js --job bussing --dryRun --force
```

`--dryRun` logs targets + message bodies and sends nothing, claims no
markers, prunes no tokens. `--force` skips the bussing Sunday guard. Without
`--dryRun` the run sends REAL pushes to every matching leader in the
connected environment.

## Sender contract

`sendToTokens(tokens, { title, body, data })` → `{ successCount,
failureCount, invalidTokens }`. Callers prune `invalidTokens` via
`PRUNE_INVALID_TOKENS` so dead tokens don't accumulate.
