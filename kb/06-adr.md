# Architecture Decision Records

Decisions already in effect across the repo. Each ADR is short and load-bearing —
treat them as constraints when designing changes. New decisions get a new ADR
(append to this file or split if it grows past ~400 lines).

---

## ADR-001 — Permission helpers are duplicated frontend/backend

**Status:** Accepted (live, considered tech debt)

**Context:** `web-react-ts/src/permission-utils.ts` and
`api/src/resolvers/permissions.ts` define the same `permitLeader / permitAdmin /
permitMe / permitArrivals / ...` helpers. They are not generated from a single
source. They are not literally identical (e.g. backend has a `'fellowship'` case
in `permitLeader` that the frontend lacks).

**Decision:** Until this is unified into a shared package, every change to a
permission helper MUST be applied to both files in the same PR.

**Consequences:**
- Drift causes silent UX/security bugs (UI hides what the API allows, or vice
  versa). The API is the security boundary; the UI is cosmetic.
- A future migration could move both copies into `@jaedag/admin-portal-api-core`
  or a new shared package.

---

## ADR-002 — Custom JWT auth, not Auth0

**Status:** Accepted

**Context:** `@auth0/auth0-react` is in `web-react-ts/package.json` but unused.
Authentication is handled by an in-house microservice (`VITE_AUTH_API_URL`) plus
`web-react-ts/src/lib/auth-service.ts` and `contexts/AuthContext.tsx`. The
backend decodes JWTs with `jwt-decode` and trusts the `JWT_SECRET` from
secrets manager via `@neo4j/graphql` `features.authorization.key`.

**Decision:** Do not reach for the Auth0 SDK. Do not introduce a third auth
provider. Auth lives in `lib/auth-service.ts` (FE) and the auth microservice
(external).

**Consequences:**
- The Auth0 dep can eventually be removed.
- Token refresh logic is hand-rolled (`refreshAccessToken` in `AuthContext`).
- Only a real 401 on refresh clears the session — network errors are tolerated.

---

## ADR-003 — Bootstrap 5 + CSS variables; no Tailwind / Chakra

**Status:** Accepted

**Context:** Styling uses Bootstrap 5, react-bootstrap, and a Chakra-style CSS
variable theme in `web-react-ts/src/color-theme.css`. Light/dark theme is
toggled via Bootstrap's `data-bs-theme` attribute on `<html>`. Global utility
classes live in `index.css`.

**Decision:** All new UI must use Bootstrap classes, react-bootstrap components,
and the existing CSS variables. No Tailwind, no Chakra, no styled-components, no
emotion, no MUI.

**Consequences:**
- All semantic colours go through `--bg-card`, `--text-primary`, `--accent-color`,
  feature accents (`--members-accent`, etc.).
- Custom button variants (`btn-success`, `btn-brand`, `btn-purple`, etc.) are
  defined in `color-theme.css`; reuse them.
- Font is Inter for both heading and body (`--chakra-fonts-heading/body`).

---

## ADR-004 — Lazy-loaded routes registered in `*Routes.ts` arrays

**Status:** Accepted

**Context:** Pages are `React.lazy(() => import('...'))` in per-section
`*Routes.ts` files (`pages/services/servicesRoutes.ts`,
`pages/arrivals/arrivalsRoutes.ts`, etc.) typed as `LazyRouteTypes[]`. Arrays
are spread into `AppWithContext.tsx` and rendered through `<ProtectedRoute>`
with the role list from the route entry.

**Decision:** New pages MUST go through this pattern. Inline `<Route>` JSX in
`AppWithContext.tsx` is not allowed. Each route entry must declare `roles` (use
`['all']` only when truly public-after-login).

**Consequences:**
- Every page is automatically code-split.
- `ProtectedRoute` enforces auth + role checks uniformly.
- Adding a page is: (1) component, (2) `lazy()` import, (3) array entry.

---

## ADR-005 — Server is the financial source of truth

**Status:** Accepted

**Context:** Money moves through service banking, account deposits/expenses, and
arrivals payments. The frontend uses Yup / Formik for input validation, but the
client is fundamentally untrusted.

**Decision:** Every monetary field MUST be validated server-side in the resolver:
amount > 0, finite, currency code if applicable. Idempotency keys (Paystack
`transactionReference`) MUST be checked before any write that initiates payment.
Banking transitions follow `kb/04-state-machines.md` SM1 — `success` is terminal
and must not be re-entered.

**Consequences:**
- Resolvers like `BankServiceOffering` call `checkTransactionReference` before
  initiating a Paystack debit.
- Manual confirmations (`tellerStream`) write `tellerConfirmationTime` instead of
  mutating `transactionStatus`, preserving the audit trail.

---

## ADR-006 — Servant mutations are generated from `servant-config.ts`

**Status:** Accepted

**Context:** Before refactor, every `MakeXLeader` / `RemoveXLeader` mutation was
copy-pasted (40+ near-identical resolvers). Now `servant-config.ts` is the
declarative source of truth and `servant-resolver-factory.ts` generates the
resolvers. See `api/src/resolvers/directory/REFACTORING_MASTERCLASS.md`.

**Decision:** New servant mutations are added by appending one line to
`SERVANT_MUTATIONS` in `servant-config.ts`. Do not write hand-rolled
`MakeXLeader` resolvers.

**Consequences:**
- Permission rules per servant slot are declared once
  (`requiredPermissionLevel`).
- The `HistoryLog` and tenure-close logic in `make-remove-servants.ts` is shared.

---

## ADR-007 — `useClickCard` owns church-id state

**Status:** Accepted

**Context:** Many pages need to know "which Bacenta / Council / Stream / ... is
the user looking at right now?" The `useClickCard` hook centralises every
`xId` and `setXId` for the church hierarchy and exposes them through
`ChurchContext`.

**Decision:** Components MUST read church IDs from `ChurchContext`, not from
URL params or local state. New church-level pages set the context ID when the
user "clicks the card" navigating into a sub-level.

**Consequences:**
- The whole router tree is wrapped in `ChurchContext.Provider` in
  `AppWithContext.tsx`.
- A few setter functions are bundled into `doNotUse` to discourage casual writes.

---

## ADR-008 — Aggregation runs in Lambda (and is idempotent)

**Status:** Accepted

**Context:** Per-week service / bussing totals are rolled up Bacenta → Governorship
→ Council → Stream → Campus by background Lambdas (`service-graph-aggregator`,
`bacenta-graph-aggregator`). They are also runnable as CLI scripts in
`api/src/scripts/`.

**Decision:** Aggregation jobs MUST be idempotent: re-running for an already-
aggregated week must not double-count. New rollup logic must follow the same
pattern (compute, then `MERGE` or `SET` rather than `CREATE` + add).

**Consequences:**
- Rerunning a job after a fix is safe.
- Defaulter logic depends on aggregates being fresh; coordinate any change to the
  rollup with downstream consumers.

---

## ADR-009 — Absolute imports via tsconfig `baseUrl: "src"`

**Status:** Accepted

**Context:** ESLint rule `no-relative-import-paths/no-relative-import-paths` is
on (warn at root, off in `api`). Imports use absolute paths from `src/`.

**Decision:** Frontend imports use absolute paths (`import { X } from
'components/foo'`). Same-folder imports may use `./`. No `../../../` chains.

**Consequences:**
- `vite-tsconfig-paths` resolves these at build time.
- Moving a file rarely requires touching its imports.

---

## ADR-010 — No automated test suite; verification = type-check + lint + manual

**Status:** Accepted (debt — desired but not present)

**Context:** `web-react-ts` ships with `@testing-library/*` deps but no `npm test`
script and no test files of consequence. `api` has `"test": "echo 'no test
specified' && exit 1"`.

**Decision:** Until tests exist, verification of a change means:
1. `tsc --noEmit` passes for both packages.
2. `eslint --max-warnings=0` passes.
3. Manual smoke-test of the affected UI flow / GraphQL mutation.

Claude Code commands and agents must not claim "tests pass" — they don't exist.

**Consequences:**
- Refactors carry more risk; favour smaller, more frequent PRs.
- Adding tests anywhere should accompany the feature being changed; do not write
  a parallel test suite that nothing else uses.

---

## ADR-011 — `@jaedag/admin-portal-types` and `-api-core` are private packages

**Status:** Accepted

**Context:** Shared types live in `@jaedag/admin-portal-types`; shared backend
helpers live in `@jaedag/admin-portal-api-core`. Both are published to GitHub
Packages under the `@jaedag` scope and require an `NPM_TOKEN` with read access.

**Decision:** Before introducing a new shared type or helper to the local repo,
check the `@jaedag` packages first. Do not duplicate.

**Consequences:**
- `amplify.yml` configures the `@jaedag` scope at build time.
- Local installs require the developer to have access (see CONTRIBUTING.md).

---

## ADR-012 — Cypher is parameterised; raw string interpolation is forbidden

**Status:** Accepted

**Context:** Custom resolvers compose Cypher queries via template strings in
`*-cypher.ts` files. The Neo4j driver supports `$param` substitution, which is
the only safe way to pass user input.

**Decision:** All variables in custom Cypher MUST be passed through `tx.run(query,
{ param })` parameters. Never `${value}` into the query string. Never accept a
field name from the client and inject it.

**Consequences:**
- `@neo4j/graphql` auto-generated resolvers are already safe.
- New `*-cypher.ts` strings should declare params at the top and reference them
  with `$name`.
