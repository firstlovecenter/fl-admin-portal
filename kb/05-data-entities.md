# Data entities

The shape of every important entity. Mirrors `web-react-ts/src/global-types.ts`,
the GraphQL SDL files in `api/src/schema/`, and the Neo4j node/relationship labels.
When the schema and the TypeScript types disagree, the schema wins — but flag the
divergence.

## Core conventions

- **Neo4j 5** stores the data; `@neo4j/graphql` v6 generates Apollo resolvers from
  the SDL. Custom resolvers live in `api/src/resolvers/` and override or augment.
- **`id`** on every node is a string (`uuid` in practice).
- **`createdAt`** is a `TimeGraph` node: `{ date: string }`.
- **`__typename`** is the canonical Neo4j label (e.g. `'Bacenta'`, `'Member'`).
- Every Church node has `members: Member[]`, `leader: Member`, optional `admin`,
  `history: HistoryLog[]`, `vacationStatus`, and `memberCount`.
- Counts on higher churches (`fellowshipCount`, `bacentaCount`, etc.) are
  aggregate fields produced by `@cypher` directives.

## Church hierarchy

```
Denomination
   └─ Oversight
        └─ Campus
             ├─ Stream
             │    └─ Council
             │         └─ Governorship
             │              └─ Bacenta
             │                   └─ Fellowship
             └─ CreativeArts
                  └─ Ministry
                       └─ HubCouncil
                            └─ Hub
```

| Level | Extra fields | Relationships |
| --- | --- | --- |
| `Denomination` | — | `oversight: Oversight` |
| `Oversight` | — | `streams: Stream` (note: SDL exposes plural; type is single in TS) |
| `Campus` | — | `streams?: Stream[]`, `oversight: Oversight`, `creativeArts?: CreativeArts[]` |
| `Stream` | `name: StreamOptions`, `bankAccount: string`, `meetingDay: { day: 'Friday'|'Saturday'|'Sunday' }`, `mobilisation*Time`, `arrival*Time`, `arrivalsPayers`, `arrivalsCounters` | `campus: Campus`, `ministries?: Ministry[]`, `councils?: Council[]` |
| `Council` | — | `stream: Stream`, `governorships?: Governorship[]`, `hubCouncils?: HubCouncil[]` |
| `Governorship` | — | `stream: Stream`, `council: Council` |
| `Bacenta` | `bankingCode: number`, `meetingDay: { day: 'Wednesday'|'Thursday'|'Friday'|'Saturday' }`, `vacationStatus`, `services: ServiceRecord[]` | `governorship: Governorship`, `council: Council` |
| `Fellowship` | (smallest unit) | parent Bacenta |
| `CreativeArts` | — | `campus: Campus`, `ministries?: Ministry[]` |
| `Ministry` | `bankAccount: string`, all higher counts | `creativeArts: CreativeArts`, `stream: Stream`, `councils: Council[]`, `hubCouncils?: HubCouncil[]` |
| `HubCouncil` | — | `hub: Hub`, `council: Council`, `ministry: Ministry` |
| `Hub` | `location: { latitude, longitude }`, `activeHubFellowshipCount`, `vacationHubFellowshipCount`, `meetingDay: { day: 'Wednesday'|'Friday'|'Saturday' }`, `vacationStatus` | `hubCouncil: HubCouncil`, `governorship: Governorship`, `creativeArts: Campus` |

`StreamOptions = 'Anagkazo Encounter' | 'Gospel Encounter' | 'Holy Ghost Encounter'
| 'First Love Experience'`

## Member

```ts
interface Member {
  __typename: 'Member'
  id: string
  firstName: string
  middleName?: string
  lastName: string
  fullName: string                // resolver: firstName + lastName
  nameWithTitle: string           // resolver: short title + first + last
  currentTitle: 'Pastor'|'Reverend'|'Bishop'
  email: string                   // required for any servant role
  pictureUrl: string
  phoneNumber: string             // PHONE_NUM_REGEX
  whatsappNumber: string
  dob: { date: string }
  maritalStatus: { status: 'Married'|'Single' }
  gender: { gender: 'Male'|'Female' }
  occupation: { occupation: string }
  bacenta: Bacenta
  fellowship: { id, name }
  basonta: { id, name }
  visitationArea?: string
  location?: string
  stickyNote?: string
}
```

`MemberWithChurches` extends `Member` with `roles?: Role[]` and a `leadsX[]` /
`isAdminForX[]` array per church level (see `global-types.ts`).

## Servant

A `Servant` is just `{ id, roles }` — i.e. a Member viewed through their assigned
role list. Created/removed via the `MakeX` / `RemoveX` mutations generated from
`servant-config.ts`.

`ServantType = 'Leader' | 'Admin' | 'ArrivalsAdmin' | 'ArrivalsCounter' | 'Teller'`

## ServiceRecord (and variants)

Single TypeScript type covers `ServiceRecord | RehearsalRecord |
StageAttendanceRecord` (different `__typename` values).

```ts
type ServiceRecord = {
  __typename: 'ServiceRecord' | 'RehearsalRecord' | 'StageAttendanceRecord'
  id: string
  createdAt: string
  created_by: Member
  attendance: number
  cash: number
  income: number
  onlineGiving?: number
  numberOfTithers: number
  foreignCurrency: string
  week: number
  familyPicture: string
  onStagePictures?: string[]
  treasurers: Member[]
  stream_name: StreamOptions
  noServiceReason: string             // set if cancelled
  name?: string                       // for Special services
  description?: string
  serviceDate: { date: string }       // ISO date

  // Banking subfields
  treasurerSelfie: string
  bankingProof: boolean
  tellerConfirmationTime: string
  bankingSlip: string
  transactionStatus: 'pending'|'success'|'failed'|'send OTP'
  bankingSlipUploader: Member
  offeringBankedBy: Member
  bankingConfirmer: Member
}
```

Stored in Neo4j as `(Bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(:ServiceRecord)-[:SERVICE_HELD_ON]->(:TimeGraph)`.

## BussingRecord

```ts
interface BussingRecord {
  id: string
  week: number
  createdAt: string
  mobilisationPicture: string
  created_by: Member
  serviceDate: TimeGraph
  bussingPictures?: string[]
  attendance: number
  leaderDeclaration: number
  numberOfBusses: number
  numberOfSprinters: number
  numberOfUrvans: number
  numberOfCars: number
  bussingTopUp: number
  counted_by: [Member]
  comments: string
  arrivalTime: Date
  transactionId: number
  arrival_confirmed_by: Member
  mobileNetwork: 'MTN'|'Vodafone'|'AirtelTigo'|'Airtel'|'Tigo'
  momoNumber: string
  momoName: string
  vehicleRecords: VehicleRecord[]
}

type VehicleRecord = {
  id: string
  created_by: Member
  createdAt: string
  leaderDeclaration: number
  attendance: number
  vehicle: 'Sprinter'|'Urvan'|'Car'
  momoNumber: string
  momoName: string
  mobileNetwork: Network
  vehicleTopUp: number
  picture: string
  counted_by: Member
  outbound: boolean              // true = return journey
  comments: string
  arrivalTime: string
  transactionReference?: string
  transactionStatus?: string
}
```

## HistoryLog

```ts
type HistoryLog = {
  __typename: 'HistoryLog'
  id: string
  timeStamp: string
  historyRecord: string
  createdAt: { date: string }
  loggedBy: MemberWithoutBioData
}
```

Linked to every Church node. Append-only. Never delete entries; they are the audit
trail for servant changes, banking confirmations, etc.

## EquipmentRecord

```ts
type EquipmentRecord = {
  __typename: string
  bluetoothSpeakers: number
  offeringBags: number
  pulpits: number
}
```

Plus per-church count fields:
`fellowshipEquipmentFilledCount`, `governorshipEquipmentFilledCount`.

## AccountTransaction (accounts module)

Lives in `web-react-ts/src/pages/accounts/transaction-history/transaction-types`.
Read it before modifying; not all fields are lifted into `accounts-types.ts`.
Aggregate fields per Council:

```ts
interface CouncilForAccounts extends Council {
  hrAmount: number
  amountSpent: number
  bussingAmount: number
  weekdayBalance: number
  bussingSocietyBalance: number
  transactions: AccountTransaction[]
}
```

## Constants and validation

Defined in `web-react-ts/src/global-utils.ts`:

| Constant | Pattern / Value |
| --- | --- |
| `PHONE_NUM_REGEX` | E.164-ish phone number |
| `MOMO_NUM_REGEX` | Ghanaian mobile money number |
| `DECIMAL_NUM_REGEX` | Signed decimal |
| `DECIMAL_NUM_REGEX_POSITIVE_ONLY` | Positive decimal |
| `USER_PLACEHOLDER` | Default Cloudinary asset |
| `DEBOUNCE_TIMER` | 500ms |
| `LONG_POLL_INTERVAL` | 60_000 |
| `SHORT_POLL_INTERVAL` | 30_000 |
| `YES_NO_OPTIONS`, `GENDER_OPTIONS`, `MARITAL_STATUS_OPTIONS`, `VACATION_OPTIONS`, `VACATION_ONLINE_OPTIONS`, `TITLE_OPTIONS`, `SERVICE_DAY_OPTIONS`, `STREAM_SERVICE_DAY_OPTIONS` | Formik select options — reuse them, do not re-declare |

## What lives in the private `@jaedag` packages

- `@jaedag/admin-portal-types` — shared TypeScript types (`AuthUser`, `last3Weeks`,
  more). Used by both packages. **Do not duplicate types into the local repo if
  they already live here.**
- `@jaedag/admin-portal-api-core` — shared backend utilities. If you find yourself
  writing a generic helper, check this package first.

Both come from a private GitHub Packages registry under the `@jaedag` scope.
