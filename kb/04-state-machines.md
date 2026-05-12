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
| `pending` \| `send OTP` | `failed` | Paystack webhook with failure | `setTransactionStatusFailed` |
| `null` \| `failed` | `failed` | `ConfirmOfferingPayment` defensive write (no-reference / transaction_not_found / verify failure) | `setTransactionStatusFailed` |
| `failed` | `pending` | User re-initiates banking | `BankServiceOffering` |
| `pending` \| `send OTP` \| `failed` \| `success` | `reversed` | Paystack verify reports `reversed` (refund to customer) | `setTransactionStatusReversed` |
| any | (reset) | Manual confirmation by `tellerStream` overrides via `ManuallyConfirmOfferingPayment` (sets `tellerConfirmationTime` instead of touching `transactionStatus`) | `manuallyConfirmOfferingPayment` |

**Rules:**
- `success` is terminal for self-banking — with one exception: `success → reversed`
  when Paystack reports the charge was reversed (customer refunded).
- `reversed` is terminal once written.
- A new banking attempt for a service that already has `bankingSlip` or
  `tellerConfirmationTime` set must be rejected (`checkIfLastServiceBanked`).
- The aggregation Cypher treats `WHERE record.transactionStatus IN ['pending','success']`
  as "in flight or done" — anything else (`null`, `failed`, `send OTP`, `reversed`) is
  treated as not-banked when computing defaulters.

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

| Field | Set by | Notes |
| --- | --- | --- |
| `mobilisationPicture` | Bacenta leader | Required to leave `noActivity` |
| `numberOfBusses/Sprinters/Urvans/Cars` | Bacenta leader | Declared at dispatch |
| `leaderDeclaration` | Bacenta leader | Declared headcount |
| `attendance` | `arrivalsCounterStream` | Counted at arrival |
| `counted_by` | `arrivalsCounterStream` | Set with `attendance` |
| `arrivalTime` | Counter | Server-side time |
| `transactionReference` / `transactionStatus` (vehicle) | `arrivalsPayerCouncil` | Momo payout |
| `outbound: true` | Same flow, marks return journey | Separate set of VehicleRecords |

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
