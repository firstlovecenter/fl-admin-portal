# Core workflows

Step-by-step descriptions of the workflows that drive the product. Use these as the
sequence-of-truth when implementing or fixing anything that touches them — never
collapse a step.

## W1 — Record a Bacenta service (and bank the offering)

**Actors:** `leaderBacenta` (or `adminMinistry`), assisted by treasurers, then a
`tellerStream` for confirmation.

**Pre-conditions:**
- The Bacenta has a current leader (`HAS_HISTORY` → `ServiceLog` exists, or one is
  auto-created via `checkServantHasCurrentHistory`).
- Last week's service has been banked (`bankingSlip` set OR
  `transactionStatus === 'success'` OR `tellerConfirmationTime` set), or there
  was no last service.

**Steps:**
1. Leader navigates to `Services → Record Service` for their Bacenta.
2. Frontend submits the `RecordService` mutation with attendance, income, foreign
   currency, treasurers (Member IDs), treasurer selfie, family picture.
3. Resolver runs `isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)`.
4. Resolver auto-creates a `ServiceLog` for the Bacenta if missing.
5. **Inside one atomic `session.executeWrite` transaction (ADR-005, ADR-014):**
   1. `recordService` writes the `ServiceRecord` and links it via
      `(ServiceLog)-[:HAS_SERVICE]->(record)`. HistoryLog entry written.
   2. `absorbAllTransactions` folds any pending Paystack online giving
      into the new `ServiceRecord`'s income.
   3. `recomputeAggregateChainAfterServiceRecord` runs four `CALL { ... }`
      subqueries — one per supported parent rollup (Bacenta→Governorship,
      Governorship→Council, Council→Stream, Stream→Campus). Each is gated
      on the **exact** submitting label so exactly one parent recompute
      runs per submission. The submitter's own level is not written
      synchronously — that's the lambda's job. Aggregates are keyed
      `<target.id>-<week>-<year>` on the service date's week (ADR-014).
6. Once the resolver returns, the immediate parent has a fresh aggregate.
7. The `service-graph-aggregator` and `bacenta-graph-aggregator` Lambdas
   (every 30 minutes) are the **primary writer for general aggregation**:
   they re-roll Governorship → Council → Stream → Campus → Oversight →
   Denomination from live ServiceRecords. Every level above the
   submission's immediate parent picks up the change at the next run.
8. Leader returns later to bank: chooses self-banking (Paystack momo) or manual
   slip upload.
   - **Self-banking:** `BankServiceOffering` mutation initiates Paystack debit;
     `transactionStatus` flows `pending` → `success` (or `failed`, or `send OTP`).
   - **Manual:** `SubmitBankingSlip` mutation sets `bankingSlip`; later a
     `tellerStream` calls `ManuallyConfirmOfferingPayment` to set
     `tellerConfirmationTime` and `bankingConfirmer`.

**Post-conditions:**
- Bacenta has a new `ServiceRecord` for the week.
- The week is no longer counted as a defaulter for that Bacenta.
- Every level's weekly aggregate (leaf → Denomination) is up to date.
- HistoryLog entry written.

**Cancel path:** If no service was held, the leader files a `RecordCancelledService`
mutation with `noServiceReason` instead of attendance/income.

## W2 — Record a ministry rehearsal

**Actors:** `leaderMinistry` (or admin equivalents above).

Same shape as W1 but uses the `RehearsalRecord` typename, `rehearsal-resolver.ts`,
and the rehearsal Cypher in `rehearsal-cypher.ts`. Banking is not part of this
flow.

## W3 — Make / remove a servant

**Actors:** A user with the role declared as `requiredPermissionLevel` in
`servant-config.ts` (always at the **admin** of the parent level — e.g. making a
`leaderBacenta` requires `adminFellowship`-level admin in the parent chain;
making a `leaderCampus` requires admin of `Oversight`).

**Steps:**
1. Admin navigates to the church's `displaydetails` page → `Edit Leader` or
   `Edit Admin`.
2. Frontend submits `Make<ChurchType><ServantType>` mutation
   (e.g. `MakeBacentaLeader`) with `leaderId` (Member ID) and the church ID.
3. The factory-generated resolver
   (`api/src/resolvers/directory/servant-resolver-factory.ts`) calls
   `isAuth(permitAdmin(requiredPermissionLevel), context.jwt.roles)`.
4. `make-remove-servants.ts` walks the existing leader (if any), closes their
   tenure with a `HistoryLog`, and creates the new tenure relationship. Errors if
   the new servant has no email (`errorHandling`).
5. `Remove<ChurchType><ServantType>` is symmetric.

⚠️ When adding a new servant assignment to the schema, add **one line** to
`servant-config.ts`. Do not write a new resolver by hand. See the
`REFACTORING_MASTERCLASS.md` next to that file.

## W4 — Sunday arrivals (bussing)

**Actors:** `leaderBacenta` (mobilises and drives), `arrivalsCounterStream` (counts
on arrival), `arrivalsPayerCouncil` (pays drivers), `arrivalsAdmin*` (oversees).

**Pre-conditions:**
- Stream has `mobilisationStartTime`, `mobilisationEndTime`, `arrivalStartTime`,
  `arrivalEndTime` configured.
- A code-of-the-day has been generated for the day
  (`code-of-the-day` Lambda runs daily and writes `arrivalsCodeOfTheDay` per
  Bacenta).

**Steps:**
1. **Pre-mobilisation:** Bacenta leader uploads a `mobilisationPicture` to a new
   `BussingRecord` for the week.
2. **Vehicle dispatch:** Leader fills one or more `VehicleRecord` entries
   (vehicle = `Sprinter | Urvan | Car`, momo number, momo name, mobile network,
   declared headcount, picture).
3. **In transit:** Bussing dashboard buckets the Bacenta into
   `bacentasMobilising` → `bacentasOnTheWay`.
4. **Arrival:** `arrivalsCounterStream` counts the bus and updates each
   VehicleRecord with `attendance` and `counted_by`.
5. **Payment:** `arrivalsPayerCouncil` initiates momo top-up payouts
   (`vehicleTopUp`, `bussingTopUp`). This sets `transactionReference` and
   `transactionStatus` on the VehicleRecord.
6. **Outbound:** Same flow with `outbound: true` for the return journey.

**Defaulters:** If a Bacenta is not in `bacentasHaveArrived` by the end of the
arrival window and is not `vacationStatus = 'Vacation'`, it is treated as a
no-show.

## W5 — Account deposit / expense / approval

**Actors:** Council/Campus/Oversight admins (`adminCouncil`, `adminCampus`,
`adminOversight`).

**Steps:**
1. **Council deposit:** Council admin records money paid in via the
   `pages/accounts/council-deposit` flow → mutation in
   `accounts-resolvers.ts`.
2. **Request expense:** Any admin requests funds (e.g. for bussing) via
   `pages/accounts/request-expense`. Status begins as a pending request.
3. **Approval:** A higher admin reviews under `pages/accounts/approvals` and
   approves or rejects.
4. **Bussing expense:** Specialised expense flow under
   `pages/accounts/bussing-expense` for Sunday operations.
5. **Transaction history:** `pages/accounts/transaction-history` lists all
   `AccountTransaction` rows for audit.

⚠️ Money values: server must validate amounts (positive, finite) and never trust
the client. See `kb/06-adr.md` ADR-005.

## W6 — Weekly reports (background)

Lambdas (also runnable as CLI scripts under `api/src/scripts/`):

- `accra-campus-weekly` — weekly Accra report.
- `outside-accra-weekly` — weekly Outside-Accra report. The dating logic uses last
  Sunday or the report date, depending on fellowship-mode (see recent commits
  d3d2db0f, 9ff6832d).
- `den-office-monthly-report` — monthly PDF for the denomination office.
- `services-not-banked` — defaulter notifications.
- `code-of-the-day` — daily code rotation.
- `service-graph-aggregator` / `bacenta-graph-aggregator` — aggregate
  service / bussing data upward through the hierarchy. Must be **idempotent**:
  re-running for an already-aggregated week must not double-count.
  Aggregate nodes are keyed on `<church.id>-<week>-<year>` and written with
  `MERGE … SET` (overwrite, never `+=`). Only the **current week** is
  recomputed; historical aggregates are Model-A snapshots and are not
  rewritten when a Bacenta is transferred between Governorships. Per
  ADR-014 these lambdas are the **primary writer for general aggregation**
  — `recordService` only synchronously updates the leaf and the immediate
  parent; the lambda fills in every level above. See ADR-014.
- `payment-webhook` — Paystack callback handler that promotes a service's
  `transactionStatus` from `pending` to `success` / `failed`.

Run a script locally with e.g.
`npm run aggregate-bacenta` (root `package.json` script).

## W7 — Login / token refresh

1. User submits credentials to `auth-service.login`.
2. Auth microservice returns `{ accessToken, refreshToken, user }`.
3. `storeAuth` persists tokens to `sessionStorage`; `AuthContext.user` is set.
4. On app boot, `AuthContext` reads tokens from storage; if access token is
   expired, calls `refreshAccessToken()`. Only clears auth on a real 401 from
   refresh — network errors keep the session.
5. `getAccessTokenSilently` is the single source for "give me a usable token".
6. `setupPassword` is for migrated users with no password yet
   (`/setup-password` route).

## W8 — Cache busting / new deploy

`CacheBuster.tsx` polls `meta.json` and forces a hard reload when a new
`generate-build-version` build is detected. Do not bypass this — without it,
clients can run a stale UI against a newer schema.
