# State machines

Every stateful entity in the system, with valid states, valid transitions, and the
actor that triggers each. If you are touching a transition not listed here, add it
to this file in the same PR.

## SM1 — `ServiceRecord.transactionStatus` (banking)

States observed in `api/src/resolvers/banking/banking-cypher.ts` and
`banking-resolver.ts`:

```
            ┌─────────┐
            │  null   │   (record created with no banking attempt yet)
            └────┬────┘
                 │ initiate self-banking
                 ▼
            ┌─────────┐    OTP required    ┌──────────┐
            │ pending │───────────────────▶│ send OTP │
            └────┬────┘                    └────┬─────┘
                 │                              │ submit OTP
       Paystack  │                              │
       webhook   │                              ▼
                 │                          ┌─────────┐
                 ├─────────────────────────▶│ pending │
                 │                          └────┬────┘
                 ▼                               │
       ┌─────────────┐  webhook            ┌────▼────┐
       │   success   │◀────────────────────│  ...    │
       └─────────────┘                     └────┬────┘
                                                │ webhook fail
                                                ▼
                                          ┌──────────┐
                                          │  failed  │
                                          └─────┬────┘
                                                │ user retries
                                                ▼
                                            (back to pending)
```

| From | To | Triggered by | Where |
| --- | --- | --- | --- |
| `null` | `pending` | `BankServiceOffering` initiates Paystack | `initiateServiceRecordTransaction` |
| `pending` | `send OTP` | Paystack returns OTP requirement | `setRecordTransactionReferenceWithOTP` |
| `send OTP` | `pending` | User submits OTP | `SendPaymentOTP` mutation |
| `pending` | `success` | Paystack webhook with successful charge | `setTransactionStatusSuccess` |
| `pending` \| `send OTP` | `failed` \| `abandoned` | Paystack webhook/verify with failure (`abandoned` = user never authorised the momo prompt) | `setTransactionStatusFailed` |
| `null` \| `failed` | `failed` | `ConfirmOfferingPayment` defensive write (no-reference / transaction_not_found / verify failure) | `setTransactionStatusFailed` |
| `failed` \| `abandoned` | `pending` | User re-initiates banking | `BankServiceOffering` |
| `pending` \| `send OTP` \| `failed` \| `success` | `reversed` | Paystack verify reports `reversed` (refund to customer) | `setTransactionStatusReversed` |
| any | (reset) | Manual confirmation by `tellerStream` overrides via `ManuallyConfirmOfferingPayment` (sets `tellerConfirmationTime` instead of touching `transactionStatus`) | `manuallyConfirmOfferingPayment` |

**Rules:**
- `success` is terminal for self-banking — with one exception: `success → reversed`
  when Paystack reports the charge was reversed (customer refunded).
- `reversed` is terminal once written.
- `abandoned` is a Paystack-verify failure status (the charge was never authorised).
  It is **equivalent to `failed`** for retry purposes — both are valid source
  states for `BankServiceOffering` re-initiation and for the admin
  `setRecordTransactionReferenceManually` recovery path. It is kept distinct from
  `failed` only so the `BankingHistoryLog` audit trail can tell an abandoned
  charge apart from a gateway-declined one.
- A new banking attempt for a service that already has `bankingSlip` or
  `tellerConfirmationTime` set must be rejected (`checkIfLastServiceBanked`).
- The aggregation Cypher treats `WHERE record.transactionStatus IN ['pending','success']`
  as "in flight or done" — anything else (`null`, `failed`, `abandoned`, `send OTP`,
  `reversed`) is treated as not-banked when computing defaulters.

## SM2 — Service banking proof presence

A service is considered **banked** when at least one of the following is true (per
`checkIfLastServiceBanked`):

- `bankingSlip` field is set (manual upload), OR
- `transactionStatus === 'success'` (Paystack), OR
- `tellerConfirmationTime` field is set (teller manually confirmed)

Otherwise it is a **defaulter** for the week and blocks new bankings.

## SM3 — Bacenta vacation status

`vacationStatus: 'Vacation' | 'Active'` on `Bacenta`.

| From | To | Triggered by | Notes |
| --- | --- | --- | --- |
| `Active` | `Vacation` | Leader / admin sets vacation | Bacenta excused from defaulter checks |
| `Vacation` | `Active` | Leader / admin returns from vacation | Defaulter checks resume |

A vacation Bacenta with no service record for the week is **not** a defaulter.
Defaulter logic must check `vacationStatus` first.

## SM4 — Servant assignment

Per `servant-config.ts`, every (church, servantType) slot has at most one current
servant. The state is implicit in the Neo4j relationship `(:Member)-[:LEADS|IS_ADMIN_FOR|...]->(:Church)`.

| From | To | Triggered by |
| --- | --- | --- |
| no servant | servant A | `Make<Type><Role>` mutation by an admin at `requiredPermissionLevel` |
| servant A | servant B | `Make<Type><Role>` mutation — closes A's tenure and opens B's |
| servant A | no servant | `Remove<Type><Role>` mutation |

Every transition appends a `HistoryLog` entry (`make-remove-servants.ts`). Servants
must have an email (`errorHandling`); reject with a clear message otherwise.

## SM5 — Vehicle / bussing record (arrivals)

Implicit state surfaced via the `HigherChurchWithArrivals` "buckets":

```
bacentasNoActivity
       │ uploads mobilisationPicture
       ▼
bacentasMobilising
       │ creates VehicleRecord(s)
       ▼
bacentasOnTheWay  ──────────────▶  bacentasBelow8 (if leaderDeclaration < 8)
       │ counter records attendance
       ▼
bacentasHaveArrived
       │ payer pays
       ▼
(complete)

bacentasNotCounted = arrived but counter never logged attendance
```

`tellerStream` is **not** an SM5 actor. It belongs to SM1 / SM2 (banking
confirmation for offerings). Arrivals payouts run through `arrivalsPayerCouncil`
on Paystack Transfers, not through tellers.

| Field | Set by | Notes |
| --- | --- | --- |
| `mobilisationPicture` | Bacenta leader | Required to leave `noActivity` |
| `numberOfBusses/Sprinters/Urvans/Cars` | Bacenta leader | Declared at dispatch |
| `leaderDeclaration` | Bacenta leader | Declared headcount |
| `attendance` | `arrivalsCounterStream` | Counted at arrival |
| `counted_by` | `arrivalsCounterStream` | Set with `attendance` |
| `arrivalTime` | Counter | Server-side time |
| `vehicleTopUp` | `arrivalsCounterStream` \| `arrivalsPayerCouncil` | Approved payout amount; see actor matrix below |
| `transactionReference` / `transactionStatus` (vehicle) | `arrivalsPayerCouncil` | Momo payout — payer only |
| `outbound: true` | Same flow, marks return journey | Separate set of VehicleRecords |

### Actor matrix (resolver-level)

| Transition | Resolver | Permission gate | Notes |
| --- | --- | --- | --- |
| onTheWay → counted → approved (records attendance **and** derives `vehicleTopUp`) | `ConfirmVehicleByAdmin` | `permitArrivalsCounter()` = counter only | Sets `attendance`, `counted_by`, `arrivalTime`, then derives the eligible `vehicleTopUp` in the **same** round trip. The attendance write is once-only (`WHERE arrivalTime IS NULL`); a re-confirm leaves it untouched but re-derives the top-up, so a record orphaned by a dropped first response heals on resubmit (SYN-165). Approving is a calculation, not a money move. |
| counted → approved (re-derives `vehicleTopUp`) | `SetVehicleSupport` | `permitArrivalsHelpers('Stream')` = counter + payer | Stand-alone re-approval / back-office repair path. Idempotent; the counter normally approves inside `ConfirmVehicleByAdmin` instead. |
| approved → paid (Paystack Transfer) | `SendVehicleSupport` | `permitArrivalsPayer()` = payer only | **Separation of duties.** The person who confirms attendance cannot also release momo. Tightened in commit `6d972eb1` (May 2026) — the resolver previously inherited the helpers gate. |

If a future change wants to merge the approval + payment transitions back
into a single role, update this table and add a regression test pinning
`arrivalsCounterStream` out of `SendVehicleSupport`.

## SM6 — Account expense request

(Inferred from `pages/accounts/approvals` and `accounts-resolvers.ts` — verify
when modifying.)

```
draft (in client) ─▶ pending ─┬─▶ approved ─▶ paid
                              └─▶ rejected
```

A paid expense becomes an `AccountTransaction` row. Rejection writes a comment.

## SM7 — Auth session

```
unauthenticated ─login─▶ authenticated (access valid)
authenticated ──access expires──▶ authenticated (refreshing)
                                    ├─ refresh ok ──▶ authenticated
                                    └─ refresh 401 ─▶ unauthenticated
authenticated ─logout──▶ unauthenticated
unauthenticated ─migrated user with no password─▶ /setup-password ─▶ unauthenticated → login
```

Only a real 401 on refresh clears the session. Network 5xx errors keep the user
logged in (`AuthContext.refreshAccessToken`).

## SM8 — App-wide modal states

`Sabbath` (Mondays after 4am, currently disabled) and `MaintenanceMode` (manual
toggle) short-circuit the entire app and replace `<AppWithContext>`. Re-enabling
either is an explicit edit in `web-react-ts/src/index.tsx`. Don't re-enable
without coordinating with the team.
