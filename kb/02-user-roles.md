# User roles

Every role string is enumerated in `web-react-ts/src/global-types.ts` (`Role` union)
and the matching server-side strings in `api/src/resolvers/utils/types.ts`. Permission
helper functions live in:

- Frontend: `web-react-ts/src/permission-utils.ts`
- Backend: `api/src/resolvers/permissions.ts`

⚠️ The two files are **parallel implementations**, not generated from one source.
Any change to one MUST be mirrored in the other (see `kb/06-adr.md`, ADR-001).

## Role families

Roles fall into three families. Listed top-down (highest authority first within each).

### Leader roles

The senior pastoral servant for a church node. Has full read/write at their level
and below.

| Role | Owns | Notes |
| --- | --- | --- |
| `leaderDenomination` | Denomination + everything | Effectively a super-admin |
| `leaderOversight` | One Oversight | |
| `leaderCampus` | One Campus | |
| `leaderStream` | One Stream | |
| `leaderCouncil` | One Council | |
| `leaderGovernorship` | One Governorship | |
| `leaderBacenta` | One Bacenta | Records services, banks offering |
| `leaderFellowship` | One Fellowship | Smallest unit |
| `leaderMinistry` | One Ministry | |

### Admin roles

Administrative assistant servants. Do not have leader authority but can do
directory / record / financial admin at their level. No `adminFellowship` or
`adminBacenta` exists — admin roles start at Governorship.

`adminGovernorship`, `adminCouncil`, `adminStream`, `adminCampus`, `adminOversight`,
`adminDenomination`, `adminMinistry`.

### Specialist roles

Narrow-scope roles for specific operational flows.

| Role | Purpose | Files |
| --- | --- | --- |
| `arrivalsAdminCampus` / `Stream` / `Council` / `Governorship` | Manages Sunday bussing arrivals at the named level | `pages/arrivals/`, `permitArrivals` |
| `arrivalsCounterStream` | Counts arrived members at the Stream | `permitArrivalsCounter` |
| `arrivalsPayerCouncil` | Pays drivers via momo for arrivals at the Council | `permitArrivalsPayer` |
| `tellerStream` | Confirms manual bank deposits for offerings at the Stream | `permitTellerStream` |
| `fishers` | Broad-access **coarse** marker — "a little bit of everything". Can edit Denomination details, bypass account-open checks in expense forms, confirm banking (alongside `tellerStream`), and access service details/special-service forms at elevated scope. Assigned to a small set of trusted users. **Caveat (important):** `fishers` maps to no servant edge, so `edgeToRole`/`rolesAt`/`canDoAt` can **never** grant it per-instance — it only ever passes the coarse `isAuth` check, never `assertCan`. Changing the **Denomination leader** therefore requires `fishers` **AND** `adminDenomination` at that denomination: the factory runs `isAuth(['fishers'], jwt.roles)` then gates on `permitAdmin('Denomination')` (drives validateMutation's isAuth+assertCan). Mirrors the FE — `<RoleView roles={['fishers']}>` around the leader picker + the `permitAdmin('Denomination')` editdenomination route. **Never use `['fishers']` alone as a servant-mutation gate** — `assertCan` rejects it unconditionally (was a dead/always-FORBIDDEN path until fixed 2026-06-01). | `servant-resolver-factory.ts`, `ExpenseForm.tsx`, `ServiceForm.tsx`, `DetailsDenomination.tsx` |
| `all` | Sentinel meaning "any authenticated user" | Used as default when a route declares no roles |

## Permission helpers

Always use these helpers, never hand-build a `Role[]` for a route or `isAuth` call.

| Helper | Returns | Use for |
| --- | --- | --- |
| `permitLeader(level)` | Leader roles at and above `level` (plus a few admin overrides) | Pure leadership actions |
| `permitAdmin(level)` | Admin roles at and above `level` | Pure admin actions |
| `permitLeaderAdmin(level)` | Union of the two | Most directory CRUD |
| `permitArrivals(level)` | Arrivals admin roles for the level | Arrivals dashboards / forms |
| `permitArrivalsHelpers(level)` | Counter + Payer (only for `Stream`) | Arrivals helper screens |
| `permitArrivalsCounter()` | `['arrivalsCounterStream']` | Counter UI |
| `permitArrivalsPayer()` | `['arrivalsPayerCouncil']` | Payer UI |
| `permitLeaderAdminArrivals(level)` | Leader + Admin + Arrivals | Mixed-purpose pages |
| `permitAdminArrivals(level)` | Admin + Arrivals | Admin + arrivals pages |
| `permitTellerStream()` | `['tellerStream']` | Banking confirmation UI |
| `permitMe(level)` | Leader + Admin + Arrivals helpers + Teller | The standard "any privileged user at this level" gate |

## What each role can do

This table is the contract. If a screen needs a different gate, that is a design
question — flag it before changing the helper.

| Action | Required helper |
| --- | --- |
| View a church's directory page | `permitMe(level)` |
| Create / update / delete a church node | `permitLeaderAdmin(parentLevel)` (typically the level above) |
| Make / remove a Servant | `permitAdmin(requiredPermissionLevel)` from `servant-config.ts` |
| Record a service | `permitLeaderAdmin('Bacenta')` (for Bacenta services) |
| Record a cancelled service | Same as recording a service |
| Bank a service offering | `permitLeaderAdmin('Bacenta')` |
| Confirm a manual banking | `permitTellerStream()` |
| Fill a bussing record | `permitLeaderAdmin('Bacenta')` |
| View arrivals dashboard | `permitArrivals(level)` |
| Pay a vehicle | `permitArrivalsPayer()` |
| Count arrived members | `permitArrivalsCounter()` |
| Approve an account expense | `permitAdmin(level)` at Council/Campus/Oversight |

Always rely on `context.jwt.roles` server-side, never on `currentUser.roles` from
the React state — the client value is mutable and is set from the JWT payload, not
re-verified.

## What roles cannot do

- A `leaderBacenta` cannot make a `leaderBacenta` (themselves) — that requires
  `adminFellowship` permission per `servant-config.ts` (yes, the convention is the
  level *below*).
- An `adminGovernorship` cannot make a `leaderCouncil` — admin roles do not
  promote upward.
- An `arrivalsAdminCouncil` cannot record a service or bank an offering — arrivals
  roles are siloed to the bussing flow.
- A `tellerStream` cannot create or modify any record other than confirming a
  banking — they have no leader/admin powers.
- The `all` role is *not* a wildcard for privileged actions — it grants only what
  any authenticated session can do (open the dashboard, view the splash screen,
  etc.).

## Auth flow

1. User authenticates via `/login` against the auth microservice
   (`VITE_AUTH_API_URL`, `lib/auth-service.ts`). Custom JWT, **not Auth0**.
2. JWT (access + refresh tokens) lands in `sessionStorage` and in-memory state via
   `AuthContext`.
3. `AuthContext.getAccessTokenSilently()` returns the access token (auto-refreshes
   if expired and the refresh token is still valid).
4. `index.tsx` Apollo `authLink` adds `Authorization: Bearer <token>` to every
   request.
5. API decodes the JWT (`jwt-decode`) in the Apollo Server `context` and exposes it
   as `context.jwt`. `context.jwt.roles` is the authoritative role list for the
   request.
6. `SetPermissions` resolves the user's `currentUser.roles` from
   `GET_LOGGED_IN_USER` and seeds the React `MemberContext`. This is for UX
   (showing/hiding buttons), not for authorization.
7. Resolvers call `isAuth(permitX(level), context.jwt.roles)` before performing
   any mutation.
