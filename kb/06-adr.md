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
source.

**Decision:** Until this is unified into a shared package, every change to a
permission helper MUST be applied to both files in the same PR.

**Regression net:** `lib/permission-test-scenarios.ts` is the single shared
scenario fixture imported by both test suites
(`web-react-ts/src/permission-utils.test.ts` via Vitest and
`api/src/resolvers/permissions.test.ts` via Jest). Adding a role or level
requires one edit to the fixture; a one-sided change will fail the mirrored
suite.

**Consequences:**
- Drift causes silent UX/security bugs (UI hides what the API allows, or vice
  versa). The API is the security boundary; the UI is cosmetic.
- A future migration could move both copies into a new shared internal package.

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

**Status:** Superseded by ADR-013 (2026-05-02)

**Context:** `web-react-ts` ships with `@testing-library/*` deps but no `npm test`
script and no test files of consequence. `api` has `"test": "echo 'no test
specified' && exit 1"`.

**Decision (historical):** Until tests exist, verification of a change means:
1. `tsc --noEmit` passes for both packages.
2. `eslint --max-warnings=0` passes.
3. Manual smoke-test of the affected UI flow / GraphQL mutation.

**Why superseded:** A staged refactor of the codebase is now in flight. Behavior-
preserving refactors without tests are unsafe at this scale. ADR-013 establishes
the test stack and the test-first refactor loop. Existing code without tests is
not retroactively required to add them — tests are added as the surrounding code
is refactored or extended.

---

## ADR-011 — `@jaedag/admin-portal-types` and `-api-core` are private packages

**Status:** Superseded — `@jaedag` packages have been removed from the project.

**Context (historical):** Shared types had lived in `@jaedag/admin-portal-types`;
shared backend helpers in `@jaedag/admin-portal-api-core`. Both were published
to GitHub Packages under the `@jaedag` scope and required an `NPM_TOKEN` /
`GITHUB_TOKEN` with `read:packages` scope to install.

**Why superseded:** The token requirement created a recurring CI/onboarding
friction point. Audit showed `admin-portal-api-core` was unused in source
(zero imports under `api/src/`); `admin-portal-types` was used in 11 frontend
files for a small set of utility functions (`getWeekNumber`, `last3Weeks`,
`getHumanReadableDate`, `getHumanReadableDateTime`) and three types
(`Member`, `Church`, `Stream`). The types already existed locally in
`web-react-ts/src/global-types.ts`; `repackDecimals` and `isAuthorised` were
already locally re-implemented in `global-utils.ts`. The remaining four
utility functions were inlined into `global-utils.ts`, the package deps were
dropped, and the GitHub Packages auth wiring was removed from `amplify.yml`
and the two GitHub Actions workflows.

**Replacement rule:** Shared types and utilities live in
`web-react-ts/src/global-types.ts` / `global-utils.ts` (frontend) and
`api/src/resolvers/utils/` (backend). Mirror the FE/BE permission helpers
manually per ADR-001.

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
- Enforced at lint time by the `fl-cypher/no-interpolated-cypher` ESLint rule
  (see `api/eslint-plugin-fl-cypher/`).

---

## ADR-013 — Test stack and the test-first refactor loop

**Status:** Accepted (2026-05-02). Supersedes ADR-010.

**Context:** The codebase is entering a phased refactor. ADR-010 forbade tests
on the basis that none existed and a parallel suite would rot. That trade-off
flips once we are deliberately changing internals — behavior-preserving
refactors at this scale need an executable safety net, not just `tsc` + manual
QA. We also need a uniform place to capture the invariants that today live only
in `kb/04-state-machines.md` (transaction status idempotency, vacation
handling, banking proof, etc.).

**Decision:**

1. **Frontend (`web-react-ts`) uses Vitest + React Testing Library + MSW.**
   - Vitest is chosen over Jest because the build is Vite-native:
     `vite-tsconfig-paths`, ESM module graph, and the existing `vite.config.ts`
     resolve identically in tests with zero extra config. Jest on Vite
     requires `babel-jest` / `ts-jest` shims that fight the build. The Vitest
     API is Jest-compatible (`describe` / `it` / `expect` / `vi.mock`), so
     muscle memory and AI tooling carry over.
   - DOM tests run under `jsdom`. Apollo Client mocking via
     `@apollo/client/testing` (`MockedProvider`) for shallow tests; MSW for
     anything that exercises the network layer (retry link, error link,
     auth header).

2. **Backend (`api`) uses Jest + babel-jest.**
   - Jest is chosen for the API because the runtime is plain Node, and
     there is no Vite to align with.
   - **babel-jest, not ts-jest.** The api already ships a complete
     `babel.config.js` with `@babel/preset-typescript`,
     `babel-plugin-module-resolver` for the `src/` alias, and
     `@babel/preset-env` targeting Node. Using babel-jest means tests use
     the **same transformer as the production build** — tests cannot pass
     while the build breaks. ts-jest would be a parallel TypeScript
     transformer competing with Babel, would need its own tsconfig
     (the api currently only has `src/resolvers/tsconfig.json`), and
     would not exercise the same module-resolution path as runtime.
     Type-checking happens separately via the existing
     `cd src/resolvers && tsc -p tsconfig.json --noEmit` in lint-staged.
   - Cypher resolvers use a thin in-memory neo4j-driver mock for unit tests
     (assert the query string and params your resolver issued, plus the
     mapped response). Resolvers that exercise multi-step Cypher use the dev
     Neo4j instance via the `neo4j` MCP server for characterization tests
     gated under `npm run test:integration`. Production data is never
     touched.

3. **The test-first refactor loop is mandatory.** A refactor change MUST
   follow this order:
   1. **Characterize** — write tests against the *current* behavior of the
      target. The tests pass on the current code, even if the current code
      is ugly or has minor bugs (capture the bug as a `TODO` in the test, do
      not fix it in the same change).
   2. **Refactor** — change the implementation, leave the tests untouched
      (renaming a public symbol is the only edit allowed to the test file
      during a refactor).
   3. **Verify** — tests still green, `tsc --noEmit` green, ESLint green.
   4. **Review** — `code-reviewer` on the refactor diff. `cypher-reviewer`
      and `security-reviewer` if their triggers fire.

4. **What MUST be tested first.** Tests are written as the surrounding code
   is touched, but the highest-priority surfaces — to be covered before
   any refactor in their area — are:
   - `web-react-ts/src/permission-utils.ts` and
     `api/src/resolvers/permissions.ts` (ADR-001 mirroring; scenario table
     lives in `lib/permission-test-scenarios.ts` and is imported by both
     suites — a one-sided role change will fail the mirrored test).
   - `kb/04-state-machines.md` invariants: `transactionStatus` idempotency
     (SM1, ADR-005), banking proof transitions (SM2), vacation handling
     (SM3), servant slot transitions (SM4).
   - Money math: anything that adds, settles, or reconciles cedis or
     foreign-currency amounts on `ServiceRecord`, accounts expenses, or
     arrivals payments.

5. **What we do NOT test.** Trivial getters / DTO mappers. Pure
   presentational components. Auto-generated `@neo4j/graphql` resolvers
   (their behavior is the library's contract, not ours). Snapshot tests of
   rendered Bootstrap markup — too brittle to be useful.

6. **File layout and naming.** Tests live next to the source as
   `*.test.ts` / `*.test.tsx`. No `__tests__/` folders. A test file imports
   only from its sibling and from test utilities under
   `web-react-ts/src/test-utils/` or `api/src/test-utils/`.

7. **Coverage is a signal, not a gate.** No coverage threshold blocks CI.
   Coverage is reported on PRs touching tested code so reviewers can see
   what was actually exercised. A "100% covered" file with assertion-free
   tests is worse than 60% with sharp assertions.

**Consequences:**
- Two new agents and one slash command formalise the loop:
  `test-author` writes the characterization / unit tests, `refactor`
  performs the behavior-preserving change (and refuses to run unless tests
  exist for the target), `/refactor` orchestrates the full loop.
- `web-react-ts/package.json` gains `vitest`, `@vitest/ui`, `jsdom`,
  `@testing-library/jest-dom`, `msw`, `@apollo/client/testing`. Test scripts:
  `test`, `test:run`, `test:coverage`, `test:ui`.
- `api/package.json` replaces the placeholder `test` script with `jest`,
  adds `jest`, `babel-jest`, `@types/jest`. New scripts: `test`,
  `test:integration` (gated), `test:coverage`.
- Test infrastructure setup is its own PR per package, kept narrow: install
  deps, add config files, add one canary test that actually runs. No
  parallel work mixed in.
- Old code without tests stays untested until it is refactored or extended.
  We do not write a backfill suite for unchanged code.

---

## ADR-014 — Weekly aggregates are keyed on `(church.id, week, year)` and are Model-A snapshots

**Status:** Accepted (2026-05-06). Refines ADR-008.

**Context:** Every higher church (Governorship, Council, Stream, Campus, Oversight,
Denomination, Ministry) gets a new `:ServiceLog` node every time its leadership
rotates (via the servant-config flow — see ADR-006 and
`directory/servant-cypher.ts`). Aggregate nodes were previously keyed
`<week>-<year>-<log.id>`, so each leader tenure produced its own aggregate node
for the same week. Because the FE @cypher resolvers in `aggregates.graphql` walk
`(this)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(aggregate)` —
i.e. every ServiceLog the church has ever had — multiple aggregates for the same
(church, week) were returned and the line graphs showed duplicate points.

The form-time aggregate write in `recordService` / `recordSpecialService` was
also additive (`aggregate.attendance = aggregateAttendance + attendance`), which
double-counted on retry and conflicted with the lambda's overwrite semantics.

Aggregates also need to be stable under hierarchy changes: when a Bacenta is
transferred from one Governorship to another, **historical aggregates must not
move**. A week-12 aggregate computed when the Bacenta was under X should remain
attributed to X, even after the transfer.

**Decision:**

1. **Aggregate id format** is `<church.id>-<week>-<year>` (with `toString()`
   applied to the integer week and year). One canonical node per
   `(church × week × year)`. Applies to:
   - `AggregateServiceRecord`
   - `AggregateBussingRecord`
   - `AggregateRehearsalRecord`
   - `AggregateMinistryMeetingRecord`
   - `AggregateStageAttendanceRecord`

2. **The `(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(aggregate)` relationship is
   preserved.** The historical drill-down ("what did this church look like
   under Leader A's tenure") relies on it. After the id change, both the old
   and new ServiceLogs `MERGE` to the same aggregate node for any given
   (church, week, year), so the relationship is fan-in rather than a duplicate.

3. **FE @cypher resolvers in `aggregates.graphql` dedup by `(week, year)`
   using `recomputedAt DESC NULLS LAST`.** Pattern:
   ```cypher
   MATCH (this)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(aggregate:AggregateServiceRecord)
   WHERE aggregate.year = date().year OR aggregate.year = date().year - 1
   WITH aggregate ORDER BY aggregate.recomputedAt DESC NULLS LAST
   WITH aggregate.week AS w, aggregate.year AS y, head(collect(aggregate)) AS aggregate
   RETURN aggregate ORDER BY y DESC, w DESC SKIP $skip LIMIT $limit
   ```
   New aggregates carry `recomputedAt: datetime()`; legacy old-format
   aggregates do not, so they always lose to fresh writes. This means the
   re-keying does NOT require a data migration to take effect — old nodes
   coexist harmlessly until they're cleaned up (or never).

4. **All aggregate writes use `SET` (overwrite), never `+= / append`.**
   The old additive form-time write is removed from `recordService`,
   `recordSpecialService`, `absorbAllTransactions`, and the rehearsal record
   mutations. ADR-008 idempotency is restated and tightened: every write is
   a full overwrite of the aggregated values, and every write stamps
   `recomputedAt: datetime()`.

5. **Attribution model is Model A (snapshot).** The lambda only recomputes
   the **current week**. Historical aggregates are frozen at the org structure
   that existed when they were last written. A Bacenta transfer therefore
   does not retroactively rewrite past weeks for the old or new Governorship.
   The Bacenta's own data (its `ServiceRecord` nodes and its own per-week
   aggregate) lives on its own ServiceLog and is unaffected by transfers.

6. **Synchronous compute is exactly ONE aggregate write: the immediate
   parent of the submitter.** When `recordService` / `recordSpecialService`
   is called, the resolver wraps three writes inside a single
   `session.executeWrite` so a failure anywhere rolls everything back
   (ADR-005 idempotency for money-bearing flows):
   1. `recordService` (creates the `ServiceRecord`).
   2. `absorbAllTransactions` (folds online giving into the record).
   3. `recomputeAggregateChainAfterServiceRecord` — a single Cypher with
      four `CALL { ... }` subqueries, one per immediate-parent pair:
      - **Bacenta → Governorship** (only when `church:Bacenta`).
      - **Governorship → Council** (only when `church:Governorship`).
      - **Council → Stream** (only when `church:Council`).
      - **Stream → Campus** (only when `church:Stream`).

      Each subquery is gated by `OPTIONAL MATCH (:<Label> {id: $churchId})
      <-[:HAS]-(target:<ParentLabel>)` so at most one parent rollup fires
      per submission; the other three are no-ops. The submitter's OWN
      level is not written synchronously — that is the lambda's job.

   The week/year are taken from the just-created ServiceRecord's
   `serviceDate` so back-dated and future-dated records land in the
   correct weekly bucket.

7. **The lambda is the primary writer for general aggregation.** It runs
   every 30 minutes (`service-graph-aggregator`, `bacenta-graph-aggregator`)
   and recomputes Governorship → Council → Stream → Campus → Oversight →
   Denomination from live ServiceRecords. The synchronous immediate-parent
   write is purely a UX optimisation so the leader sees the parent
   dashboard reflect their submission instantly. Every other level — the
   submitter's own and every level above the immediate parent — picks up
   the change on the next lambda run.

8. **Uniqueness constraints** are present in `api/cypher/constraints.cypher`
   and `api/src/db/constraints/bacenta-aggregation-constraints.js` for every
   aggregate label, but they are defence-in-depth only. They are NOT
   load-bearing because the `(week, year)` dedup in the FE @cypher
   absorbs duplicate nodes.

9. **Migration is OPTIONAL.** `api/cypher/migrate-aggregate-ids.cypher`
   deletes all aggregate nodes keyed under the old format. Skip it unless
   you also want to apply the strict uniqueness constraints (which would
   otherwise fail) or reclaim disk space. The system is correct without it.

**Consequences:**
- Duplicate graph points are eliminated structurally, not by FE-side dedup.
- Lambda runs are now safely re-runnable: same key, same set, same result.
- Bacenta-level submissions update the parent Governorship in real time.
  Higher-level leaders (Governorship, Council, Stream) recording their own
  direct service still see lambda-driven roll-ups (worst case ~1 hour
  staleness).
- Historical drill-down via `(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(aggregate)`
  still works — multiple logs can fan in to the same aggregate node, which
  is the correct semantic for Model A.
- `recomputedAt: datetime()` is now stamped on every aggregate write, giving
  ops a way to reason about how fresh a given aggregate is.

## ADR-015 — AI Assistant knowledge base lives in Neo4j; RAG via vector indexes

**Status:** Accepted, 2026-05-14.

**Context:** Phase 1 of the AI Assistant ships a per-leader "tip of the
week" widget on the unified dashboard. Each tip is grounded in (1) the
founder's books, (2) Scripture, and (3) the leader's own 12-week trend
data (attendance, bussing, income). We considered several storage
options for the knowledge base — a separate vector DB (Pinecone /
Weaviate), Postgres + pgvector, or extending the existing Neo4j store —
before settling on Neo4j.

**Decision:**
1. **Knowledge base lives in the same Neo4j as the rest of the app.**
   New labels: `:Book`, `:BookChapter`, `:BookPassage`, `:Verse`,
   `:WeeklyTip`. Relationships are spelled out in
   `kb/05-data-entities.md`.
2. **Embeddings** are OpenAI `text-embedding-3-small` — 1536 dimensions,
   cosine similarity. Stored as Neo4j `Float[]` on `:BookPassage` and
   `:Verse`. Vector indexes are `bookPassageEmbedding` and
   `verseEmbedding` (created via
   `api/src/scripts/setup-vector-indexes.js`).
3. **Tip generation** uses Anthropic Claude — `claude-haiku-4-5` as the
   primary model with `claude-sonnet-4-6` as the JSON-recovery
   fallback. Generation runs once per **church** per ISO week in a
   background Lambda (`api/src/functions/background/weekly-tip-generator/`)
   keyed `<churchId>-<year>-<week>` per ADR-014. The tip belongs to the
   church — co-leaders share it, and a leader of multiple churches gets
   one tip per church (the dashboard shows the tip for the currently
   selected scope). The Lambda is idempotent — `MERGE … SET` on
   `:WeeklyTip` — so re-runs are safe.
4. **Bible translations** ingested are KJV and WEB (both public
   domain). The model picks the more readable translation per quote.
5. **Trends** are computed inline by the Lambda from the same raw
   `ServiceRecord` / `BussingRecord` data the dashboard reads (Bacenta
   level) or from stored `AggregateServiceRecord` / `AggregateBussingRecord`
   nodes (Governorship+). The "trend brief" passed to the LLM is
   numeric-only — no leader names, no PII.
6. **Chat (Phase 2)** will be built with
   [`@assistant-ui`](https://www.assistant-ui.com/) and will reuse the
   same retrieval pipeline. A separate ADR will cover the streaming
   transport choice when Phase 2 lands.

**Why not a dedicated vector DB?**
- The retrieval queries are graph-shaped — a passage is anchored to a
  chapter, which is anchored to a book; a tip cites a verse and a
  passage; future work will join retrieval against the leader's own
  church spine. Keeping everything in one graph store is a meaningful
  ergonomic win.
- Neo4j 5's vector indexes are first-class — `db.index.vector.queryNodes`
  returns nodes with cosine scores; we get HNSW-grade recall without
  running a second service.
- Operational cost: one DB to back up, one driver to maintain, one
  network hop per request. Pinecone / Weaviate would add a per-token
  cost and a separate failure mode.

**Why OpenAI embeddings over Voyage?**
- Voyage is the Anthropic-recommended pairing and would be the cleanest
  single-vendor choice, but `text-embedding-3-small` is roughly 10× cheaper
  per token, the dimension is well-supported (1536), and the quality gap
  on doctrinal/scripture prose is small enough that the cost difference
  dominates. Revisitable if Voyage pricing or quality changes.

**Why pre-compute weekly tips?**
- Predictable cost — one Claude call per leader per week instead of one
  per dashboard load.
- Predictable latency — the dashboard renders the tip in ~30 ms from a
  cached Neo4j read, not 2–4 s waiting on an LLM.
- Reviewable — a Denomination admin can inspect `WeeklyTip` nodes before
  the week starts; "regenerate this tip" is a future affordance.
- Failure-tolerant — a per-leader Lambda error skips one leader, not the
  whole batch.

**Consequences:**
- New AWS secret keys: `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` live in
  `dev/fl-admin-portal` and `prod/fl-admin-portal`, loaded via
  `loadSecrets()` like every other external credential.
- Prod must run `setup-vector-indexes.js` before the feature ships
  (tracked under SYN-116 in Jira).
- New ingestion scripts (`ingest-book.js`, `ingest-bible.js`) write
  large amounts of data and are CLI-only — they are not exposed via
  GraphQL. Re-running them is idempotent.
- Vector indexes carry a real disk cost (~6 KB per 1536-dim row × tens
  of thousands of verses + passages). Acceptable but worth monitoring.
- `WeeklyTip` writes never store PII in the body — the system prompt
  forbids leader names, and the trend brief passed to the model is
  numeric-only.

