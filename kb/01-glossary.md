# Glossary

Terms exactly as used in this codebase. If a term is not defined here, do not invent
it — search for it first or ask. These are the canonical spellings; do not pluralise
or rename them when writing code (e.g. it is `Bacenta`, not `Bacentas`; `Bussing`, not
`Busing`).

## Church hierarchy

- **Denomination** — top of the hierarchy (one node: First Love Center).
- **Oversight** — a regional grouping of campuses.
- **Campus** — a geographic campus of the church.
- **Stream** — a service-track within a campus. The four canonical names are
  `Anagkazo Encounter`, `Gospel Encounter`, `Holy Ghost Encounter`,
  `First Love Experience` (`StreamOptions` in `web-react-ts/src/global-types.ts`).
- **Council** — a sub-grouping under a Stream that owns Governorships.
- **Governorship** — a sub-grouping under a Council that owns Bacentas.
- **Bacenta** — the leaf node of the church hierarchy; a mid-week home cell.
  A Bacenta has a `meetingDay` of Wednesday | Thursday | Friday | Saturday and
  a `bankingCode`. Fellowships have been removed — Bacenta is now the smallest
  unit.
- **CreativeArts** — a parallel hierarchy under Campus for the creative arts ministry.
- **Ministry** — a sub-unit of CreativeArts (also called a "Sonta" in some contexts).
- **HubCouncil** — a Council inside the CreativeArts/Ministry tree.
- **Hub** — the smallest CreativeArts unit (analogous to a Bacenta but for sontas);
  has a `meetingDay` of Wednesday | Friday | Saturday.

## People

- **Member** — any person in the directory.
- **Servant** — a Member with a leadership or admin assignment. The codebase has a
  `ServantType` union: `Leader | Admin | ArrivalsAdmin | ArrivalsCounter | Teller`.
- **Leader** — the head servant of a church at any level (e.g. `leaderBacenta`).
- **Admin** — an assistant servant for administrative work at a level (e.g.
  `adminCouncil`). No Admin role exists below Governorship.
- **ArrivalsAdmin** / **ArrivalsCounter** / **ArrivalsPayer** / **Teller** —
  specialist servants for the arrivals (bussing) and banking flows. See
  `02-user-roles.md`.
- **Title** — `Pastor | Reverend | Bishop`. Influences the `nameWithTitle` resolver
  (e.g. female Bishop → `Mother`, female Reverend → `LR`, female Pastor → `LP`).
- **Basonta** — a member's creative-arts affiliation (referenced from `Member.basonta`).

## Records

- **ServiceRecord** — a single weekly service entry: attendance, income, family
  picture, treasurers, banking proof. Variants exist as `RehearsalRecord` and
  `StageAttendanceRecord` (same TypeScript union).
- **RehearsalRecord** — service record for a CreativeArts rehearsal.
- **StageAttendanceRecord** — on-stage attendance during a service.
- **BussingRecord** — a Bacenta's record of bringing members to Sunday service:
  attendance, mobilisation/bussing pictures, vehicle records, top-up payments.
- **VehicleRecord** — one vehicle (Sprinter | Urvan | Car) within a BussingRecord,
  with momo-payout fields.
- **HistoryLog** — append-only audit entry attached to every Church node when
  leadership / status / record-state changes. Created by `loggedBy: Member`.
- **EquipmentRecord** — `bluetoothSpeakers`, `offeringBags`, `pulpits` per church.
- **ServiceLog** — Neo4j relationship type that anchors a church's services
  (`(:Church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(:ServiceRecord)`).

## Money / banking

- **Banking** — depositing a service's offering after the service. Lives under
  `api/src/resolvers/banking/` and `web-react-ts/src/pages/services/banking/`.
- **Banking slip** — uploaded image proof of a manual bank deposit
  (`ServiceRecord.bankingSlip`).
- **Banking proof** — boolean flag indicating the slip / payment has been verified
  (`ServiceRecord.bankingProof`).
- **Banking confirmer** — the user who confirms a manual banking
  (`ServiceRecord.bankingConfirmer`).
- **Treasurer** — Bacenta-level Member assigned to handle the offering for a
  service. A service has `treasurers: Member[]`.
- **Treasurer selfie** — photo of the treasurer counting money
  (`ServiceRecord.treasurerSelfie`).
- **Self-banking** — a treasurer/leader initiating a Paystack mobile-money debit on
  their own offering (`BankServiceOffering` resolver).
- **Anagkazo banking** — the special banking flow for the Anagkazo school /
  treasury (`api/src/resolvers/anagkazo/treasury-resolvers`).
- **Defaulter** — a church that has not banked a previous service or has not filled
  this week's service form. Tracked under `pages/services/defaulters/` and the
  background `services-not-banked` job.
- **Code of the day** — a daily rotating PIN used for arrivals payments
  (`api/src/functions/background/code-of-the-day`,
  `BacentaWithArrivals.arrivalsCodeOfTheDay`).
- **MOMO** — Mobile Money. `MOMO_NUM_REGEX` validates Ghanaian numbers.
- **Top-up** — additional fuel/transport money for a vehicle, paid via momo
  (`bussingTopUp`, `vehicleTopUp`).
- **IMCL** — referenced in code as a form to be filled before banking
  (`checkIfIMCLNotFilled`). Acronym not expanded in the source; treat as a Poimen-app
  prerequisite form.

## Arrivals (bussing)

- **Arrivals** — the Sunday flow of buses arriving at a Stream service. The arrivals
  module tracks pre-mobilisation pictures, vehicles in transit, arrival times, and
  payments to drivers.
- **Mobilisation** — the time window before bussing during which Bacentas take a
  pre-mobilisation picture.
- **Outbound** — boolean flag on a Bacenta/VehicleRecord indicating the trip is the
  return journey, not the arrival.
- **Bussing window** — derived from a Stream's `mobilisationStartTime`,
  `mobilisationEndTime`, `arrivalStartTime`, `arrivalEndTime`.
- **Bussing top-up** / **Vehicle top-up** — momo payouts to drivers.
- **Bacentas no activity / mobilising / on the way / below 8 / have arrived /
  not counted** — the named live-status buckets surfaced by the arrivals dashboard
  (`HigherChurchWithArrivals` interface).

## Accounts

- **AccountTransaction** — a deposit, expense, or transfer line on an account
  (`pages/accounts/transaction-history/transaction-types`).
- **Council deposit** — money flowing from a Council into the campus account.
- **Bussing expense** — money paid out for the Sunday bussing operation.
- **Request expense** — pending request for funds; needs approval.
- **Approval** — manager sign-off step on a request expense
  (`pages/accounts/approvals`).
- **HR amount / weekday balance / bussing society balance / bussing amount** —
  named ledger buckets per Council (`CouncilForAccounts` fields).

## Geographic / scheduling

- **Accra campus** vs **Outside Accra** — driven by the weekly background reports
  (`accra-campus-weekly`, `outside-accra-weekly`); used by report logic, not by the
  schema. Outside-Accra timing uses the previous Sunday's date when fellowship-mode
  is active (see commit history).
- **Sabbath** — Mondays after 4am show the Sabbath splash screen
  (`web-react-ts/src/auth/Sabbath.tsx`, currently commented out in `index.tsx`).
- **Maintenance mode** — manual flag; can be enabled by uncommenting in
  `web-react-ts/src/index.tsx`.

## Shepherding

- **Shepherding Control meeting** — a periodic accountability meeting where leaders
  at every level (Bishop down to Bacenta Leader) are assessed against weekly
  performance criteria (attendance, income, bussing, etc.). The aim is threefold:
  surface where shepherds are failing so they can correct course, cull out
  non-performing shepherds and leaders, and encourage those who are doing well.
  Functions as a leaderboard. The portal's **Shepherding Control** view is the
  projection-display tool used to run these meetings live (see SYN-86); each slide
  shows a leader's photo, their church, and a multi-week metric chart. A PDF export
  of the same deck is generated ahead of the meeting so attendees can follow along.

## Codebase patterns

- **Servant resolver factory** — the data-driven generator that turns
  `servant-config.ts` entries into Apollo mutations
  (`api/src/resolvers/directory/servant-resolver-factory.ts`).
- **Route arrays** — every page lives in a `*Routes.ts` array of `LazyRouteTypes`
  and is spread into `AppWithContext.tsx`. Direct `<Route>` JSX is the wrong pattern.
- **`permitMe(level)`** — the union of leader + admin + arrivals + teller roles for
  a given church level, used as the standard "any privileged user at this level" gate.
- **`useClickCard`** — the hook that owns the in-memory IDs of the currently-viewed
  church at every level (`bacentaId`, `governorshipId`, etc.). Avoid duplicating
  this state.
