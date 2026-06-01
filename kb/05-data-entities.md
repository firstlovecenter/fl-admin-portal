# Data entities

The shape of every important entity. Mirrors `web-react-ts/src/global-types.ts`,
the GraphQL SDL files in `api/src/schema/`, and the Neo4j node/relationship labels.
When the schema and the TypeScript types disagree, the schema wins — but flag the
divergence.

## Core conventions

- **Neo4j 5** stores the data; `@neo4j/graphql` v7 generates Apollo resolvers from
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
             └─ Stream
                  ├─ Council
                  │    └─ Governorship
                  │         └─ Bacenta
                  │              └─ Fellowship
                  └─ Ministry
```

| Level | Extra fields | Relationships |
| --- | --- | --- |
| `Denomination` | — | `oversight: Oversight` |
| `Oversight` | — | `streams: Stream` (note: SDL exposes plural; type is single in TS) |
| `Campus` | — | `streams?: Stream[]`, `oversight: Oversight` |
| `Stream` | `name: StreamOptions`, `bankAccount: string`, `meetingDay: { day: 'Friday'|'Saturday'|'Sunday' }`, `mobilisation*Time`, `arrival*Time`, `arrivalsPayers`, `arrivalsCounters` | `campus: Campus`, `ministries?: Ministry[]`, `councils?: Council[]` |
| `Council` | — | `stream: Stream`, `governorships?: Governorship[]` |
| `Governorship` | — | `stream: Stream`, `council: Council` |
| `Bacenta` | `bankingCode: number`, `meetingDay: { day: 'Wednesday'|'Thursday'|'Friday'|'Saturday' }`, `vacationStatus`, `services: ServiceRecord[]` | `governorship: Governorship`, `council: Council` |
| `Fellowship` | (smallest unit) | parent Bacenta |
| `Ministry` | `bankAccount: string` | `stream: Stream` |

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

A `:ServiceLog` is a `:HistoryLog` that also carries weekly records and
aggregates. A church reaches its logs two ways: `HAS_HISTORY` (permanent, every
log it has ever had) and `CURRENT_HISTORY` (exactly the latest). Both also point
from the leading `:Member`. The aggregation Lambdas and `recordService` read via
`CURRENT_HISTORY`, the FE graphs read via `HAS_HISTORY`.

**Invariant:** a church with a `:LEADS` leader has **exactly one**
`(church)-[:CURRENT_HISTORY]->(:ServiceLog)`. Zero = orphan (invisible to
aggregation and `recordService`); more than one = duplicate (income inflation,
SYN-57/59/60). Leadership writes go through `makeServantCypher` atomically to
keep this true — see ADR-016 and the monitor query in
`api/kb/02-graphql-and-cypher.md`. Records on *rotated-away* ServiceLogs are
still real and reachable only via `HAS_HISTORY`; any aggregation backfill or
completeness check must account for them (ADR-016).

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

## AI Assistant knowledge base (ADR-015)

Phase 1 of the AI Assistant adds five node labels backing the dashboard
"tip of the week" widget. Two of them carry 1536-dim vector embeddings
(OpenAI `text-embedding-3-small`) and are reachable via the
`bookPassageEmbedding` and `verseEmbedding` vector indexes.

| Label | Keying | Notes |
| --- | --- | --- |
| `:Book` | `id` = slug of title | One per ingested founder book. Constraint: unique id. |
| `:BookChapter` | `id` = `<bookId>-c<order>` | Linked `(Book)-[:HAS_CHAPTER]->(BookChapter)`. |
| `:BookPassage` | `id` = `<chapterId>-p<order>` | Carries `text`, `embedding` (1536 floats), `citationLabel`, `order`, `tokenCount`. Linked `(BookChapter)-[:HAS_PASSAGE]->(BookPassage)` and `(BookPassage)-[:NEXT_PASSAGE]->(BookPassage)` for context expansion. Indexed by `bookPassageEmbedding`. |
| `:Verse` | `id` = `<translation>-<abbrev>-<chapter>-<verse>` (e.g. `KJV-JHN-3-16`) | KJV + WEB ingested; both public domain. Carries `book`, `chapter`, `verse`, `translation`, `text`, `embedding`. Indexed by `verseEmbedding`. |
| `:WeeklyTip` | `id` = `<churchId>-<year>-<week>` (ADR-014 keying) | Written by the weekly-tip-generator Lambda. **The tip belongs to the church, not the leader** — co-leaders of one church share a tip; a leader of multiple churches gets one tip per church and the dashboard shows the tip for the currently-selected scope. Outgoing edges: `(WeeklyTip)-[:CITES_SCRIPTURE]->(Verse)`, `(WeeklyTip)-[:QUOTES_PASSAGE]->(BookPassage)`, `(WeeklyTip)-[:RECOMMENDS_BOOK]->(Book)`. Inbound: `(Church)-[:HAS_WEEKLY_TIP]->(WeeklyTip)` where `Church` is the interface implemented by `:Bacenta`, `:Governorship`, `:Council`, `:Stream`, `:Campus`, `:Oversight`, `:Denomination` — the resolver's primary lookup edge. |

Ingestion scripts live at `api/src/scripts/ingest-book.js` and
`api/src/scripts/ingest-bible.js`. They are CLI-only and call OpenAI
embeddings + write directly to Neo4j. The runtime resolver
(`myWeeklyTip` in `api/src/resolvers/assistant/`) reads `WeeklyTip`
nodes only — it never calls an LLM.

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

## Where shared types and utilities live

- Frontend types: `web-react-ts/src/global-types.ts` (`Member`, `Church`,
  `Stream`, `Role`, `ServiceRecord`, etc.). Reuse, do not duplicate.
- Frontend utilities: `web-react-ts/src/global-utils.ts` (date helpers like
  `getWeekNumber`, `last3Weeks`, `getHumanReadableDate`,
  `getHumanReadableDateTime`; financial helpers like `repackDecimals`; auth
  helpers like `isAuthorised`). Reuse, do not duplicate.
- Backend utilities: `api/src/resolvers/utils/utils.ts` (`isAuth`,
  `throwToSentry`, `rearrangeCypherObject`, `checkIfArrayHasRepeatingValues`)
  and `api/src/resolvers/utils/financial-utils.ts` (`getMobileCode`,
  `padNumbers`).
- Permission helpers: mirrored between
  `web-react-ts/src/permission-utils.ts` and
  `api/src/resolvers/permissions.ts` per ADR-001.

The `@jaedag/admin-portal-types` and `@jaedag/admin-portal-api-core` private
packages were removed in the deprecation of ADR-011.
