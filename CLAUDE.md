# CLAUDE.md — FL Admin Portal

This is the contract between Claude and this repo. Read it first every new
session. The mandatory rules below are non-negotiable.

---

## What this is

Internal church-management software for **First Love Center**, a Pentecostal
church headquartered in Accra, Ghana. The portal is used by pastors, admins,
and church leaders (not end-members) to manage the membership directory, weekly
service attendance and offerings, Sunday bussing arrivals, banking, financial
accounts, and weekly/monthly reports. The product spans a React/TypeScript
admin web app, a Node + Apollo GraphQL API on top of Neo4j, and a set of AWS
Lambda background jobs for aggregation, reporting, and webhooks.

This repo is the entire product. Frontend is deployed on AWS Amplify; backend
runs as Docker (locally) and Lambda (in cloud). Stack version: `8.1.3`.

---

## Project structure

```
fl-admin-portal/
├── api/                            # Node + Apollo Server 4 + @neo4j/graphql v6 + Neo4j 5
│   ├── kb/                         # Backend-specific knowledge base
│   ├── src/
│   │   ├── index.js                # Express + Apollo bootstrap
│   │   ├── schema/                 # 16 .graphql SDL files; assembled by graphql-schema.js
│   │   ├── resolvers/
│   │   │   ├── resolvers.ts        # Root resolver (aggregates all domains)
│   │   │   ├── permissions.ts      # Server-side role helpers (parallels web-react-ts/src/permission-utils.ts)
│   │   │   ├── secrets.ts          # AWS Secrets Manager loader
│   │   │   ├── utils/              # isAuth, neo4j-types, throwToSentry
│   │   │   ├── accounts/, anagkazo/, arrivals/, banking/, directory/,
│   │   │   ├── download-credits/, maps/, no-income/, services/, uploads/
│   │   ├── functions/
│   │   │   ├── graphql/            # Lambda GraphQL handler
│   │   │   └── background/         # 9 scheduled jobs (also CLI-runnable)
│   │   └── scripts/                # CLI runners for the background jobs
├── web-react-ts/                   # React 18 + TypeScript + Vite + Apollo Client 3
│   ├── kb/                         # Frontend-specific knowledge base
│   ├── src/
│   │   ├── index.tsx               # Apollo + Auth bootstrap
│   │   ├── AppWithContext.tsx      # Router + every context provider + every route array
│   │   ├── auth/                   # ProtectedRoute, RoleView, SetPermissions, Sabbath, Maintenance
│   │   ├── contexts/               # AuthContext (TS) + ChurchContext / MemberContext / ServiceContext (JS)
│   │   ├── hooks/                  # useClickCard, useChurchLevel, useModal, usePopup
│   │   ├── pages/                  # accounts, arrivals, auth, dashboards, directory,
│   │   │                           # maps, page-not-found, reconciliation, services, splash-screen
│   │   ├── components/             # base-component, buttons, formik (heavy), card, ...
│   │   ├── color-theme.css         # Full design system (Bootstrap 5 + CSS vars)
│   │   ├── global-types.ts         # Shared TS types
│   │   ├── permission-utils.ts     # Frontend role helpers (parallels api/src/resolvers/permissions.ts)
│   │   └── lib/auth-service.ts     # Custom JWT auth client (NOT Auth0)
├── kb/                             # Cross-package knowledge base (project-wide)
├── lib/                            # Shared secrets / GraphQL utilities
├── lambda-package/                 # AWS Lambda artifact for the API
├── scripts/                        # Monorepo orchestration (Node)
├── .claude/                        # Claude Code harness (commands, agents, settings)
├── .github/, .vscode/, .netlify/
├── docker-compose.yml              # Local dev: neo4j (7474/7687) + api (4001) + ui (3000)
├── amplify.yml                     # AWS Amplify CI/CD (frontend only)
├── apollo.config.js                # Apollo IDE introspection (NOT runtime)
└── package.json                    # Monorepo root (orchestration + lint-staged)
```

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend framework | React 18 + TypeScript 4.7 |
| Build tool (FE) | Vite 4 (PWA, Sentry, SVG, TS paths) |
| Styling | **Shadcn/UI + Tailwind CSS** (migration in progress from Bootstrap 5). New and touched pages use Shadcn + Tailwind; legacy untouched pages retain Bootstrap. Design tokens in `src/index.css`. |
| Forms | Formik + Yup (in-house wrappers in `components/formik/`) |
| Routing | `react-router-dom` v6 (lazy-loaded, declared in `*Routes.ts` arrays) |
| GraphQL client | Apollo Client 3 (retry + error links, snackbar surface via `notistack`) |
| State | Apollo cache + React Context (`Auth`, `Church`, `Member`, `Service`) |
| Auth | Custom JWT (`lib/auth-service.ts` + `contexts/AuthContext.tsx`) — NOT Auth0 |
| Backend framework | Node + Express + Apollo Server 4 |
| GraphQL schema | `@neo4j/graphql` v6 over 16 `.graphql` SDL files |
| Database | Neo4j 5 (`neo4j-driver` 5.28) |
| Background jobs | AWS Lambda (also CLI-runnable from `api/src/scripts/`) |
| Cloud | AWS Amplify (FE), AWS Lambda + Secrets Manager + S3 (BE), Cloudinary (images) |
| Tests | None (ADR-010) |
| Linter / formatter | ESLint (Airbnb + react-app + Prettier + import) + Prettier + lint-staged |
| Type checker | `tsc --noEmit` per package (run via lint-staged) |
| Deployment | AWS Amplify pulls secrets from `prod/fl-admin-portal` (main) or `dev/fl-admin-portal` (other branches); Slack notifications on build status |
| Private packages | `@jaedag/admin-portal-types`, `@jaedag/admin-portal-api-core` (GitHub Packages, scope `@jaedag`) |

---

## PWA

The frontend is deployed and **primarily used as an installed PWA** on Android and iOS devices by church leaders and pastors. This is not a "PWA as a bonus" — it is the primary delivery surface. Treat every UI change as a mobile-first, installable-app change.

### How it is built

| Aspect | Detail |
| --- | --- |
| Plugin | `vite-plugin-pwa` with `registerType: 'autoUpdate'` |
| Service worker | Workbox (auto-generated). Precaches all Vite build artifacts (JS, CSS, assets). Activates immediately on new deploy without user action. |
| Manifest | `web-react-ts/public/manifest.json` — `display: standalone`, theme `#000000`, splash `#ff2c5e` |
| App name | "FLC Servants Synago Portal" (short: "FLC State of the Flock") |
| Shortcuts | `/directory`, `/services/church-list`, `/arrivals` — appear in long-press app icon menu |

### Mandatory PWA rules

- ❌ **No `target="_blank"` links for in-app navigation.** Standalone mode has no browser chrome — new-tab links leave users stranded. Use `react-router-dom` `<Link>` or `useNavigate`.
- ❌ **No "back to browser" assumptions.** There is no address bar, no browser back button (unless the device OS provides one). Every page needs a clear in-app back/close path.
- ❌ **No touch targets under 44 × 44 px.** Use Bootstrap spacing / button sizing. Small tap targets are unusable on mobile.
- ❌ **No `hover`-only interactions.** Touch devices have no hover state. Interactive elements must work on tap.
- ✅ **Use `type="tel"` / `type="number"` / `type="email"` on inputs.** Triggers the correct mobile keyboard.
- ✅ **Respect safe areas.** Use `env(safe-area-inset-*)` in CSS where content risks being clipped by notches or home bars.
- ✅ **Apollo cache is the offline buffer.** API calls require network. Cached data displays stale; fresh data requires connectivity. Design loading and error states accordingly — users may open the app offline.

### Service worker cache behaviour

Workbox precaches all hashed build assets. When a new build is deployed:
1. The new SW installs in the background.
2. `autoUpdate` activates it immediately (no "reload to update" prompt).
3. The user gets the new version on next navigation or app foreground.

**Implication:** Asset changes take effect on next SW activation, not immediately. Do not rely on hard-refreshes in production testing — test the full install-and-open cycle on mobile or via Chrome DevTools → Application → Service Workers → "Update on reload".

### Testing PWA changes

Manual smoke test checklist for any UI change:
- [ ] Open the feature in standalone mode (Chrome DevTools → Application → Manifest → "Add to homescreen", or test on a real Android/iOS device)
- [ ] Verify touch targets are tappable without zooming
- [ ] Verify back navigation works without using a browser back button
- [ ] Verify the feature is usable on a 375 px wide screen (iPhone SE baseline)
- [ ] Verify no horizontal scroll is introduced

---

## Shared knowledge base

The KB is the source of truth for terminology, roles, workflows, and rules.
Read the relevant file before working on a related area — do not guess.

### Root `kb/` (cross-package)

| File | Contents |
| --- | --- |
| [`kb/01-glossary.md`](kb/01-glossary.md) | Project-specific terms (church hierarchy, money/banking, arrivals, accounts, code patterns) |
| [`kb/02-user-roles.md`](kb/02-user-roles.md) | Every `Role`, every permission helper, what each role can / cannot do, auth flow |
| [`kb/03-workflows.md`](kb/03-workflows.md) | W1–W8 — record service, rehearsals, servant changes, arrivals, accounts, reports, login, cache busting |
| [`kb/04-state-machines.md`](kb/04-state-machines.md) | SM1–SM8 — `transactionStatus`, banking proof, vacation, servant slots, vehicles, expenses, auth, app modal |
| [`kb/05-data-entities.md`](kb/05-data-entities.md) | Church hierarchy, Member, ServiceRecord, BussingRecord, HistoryLog, Equipment, accounts; constants |
| [`kb/06-adr.md`](kb/06-adr.md) | ADR-001…012 — duplicated permissions, custom JWT, Bootstrap, route arrays, financial truth, servant factory, useClickCard, idempotent aggregation, absolute imports, no tests, @jaedag, parameterised Cypher |
| [`kb/07-test-accounts.md`](kb/07-test-accounts.md) | Test login credentials for all roles (Bacenta, Creative Arts, Arrivals, Banking). Password: `password`. Use for Chrome DevTools e2e testing. |

### `web-react-ts/kb/` (frontend)

| File | Contents |
| --- | --- |
| [`web-react-ts/kb/01-frontend-conventions.md`](web-react-ts/kb/01-frontend-conventions.md) | TS / Apollo / forms / imports / state / logging rules; what not to introduce |
| [`web-react-ts/kb/02-design-system.md`](web-react-ts/kb/02-design-system.md) | Theme tokens, feature accents, button variants, components-to-reuse table |
| [`web-react-ts/kb/03-routing-and-permissions.md`](web-react-ts/kb/03-routing-and-permissions.md) | `LazyRouteTypes`, adding pages, URL conventions, `ProtectedRoute` behaviour |

### `api/kb/` (backend)

| File | Contents |
| --- | --- |
| [`api/kb/01-backend-conventions.md`](api/kb/01-backend-conventions.md) | Folder layout, resolver shape, SDL rules, sessions, what not to do |
| [`api/kb/02-graphql-and-cypher.md`](api/kb/02-graphql-and-cypher.md) | Adding fields / relationships / `@cypher` blocks / mutations; Cypher style; validation flow |
| [`api/kb/03-resolver-patterns.md`](api/kb/03-resolver-patterns.md) | P1–P8 reusable resolver patterns; anti-patterns |

---

## Claude Code tools

| Tool | Type | Purpose |
| --- | --- | --- |
| `/fix` | Command | Diagnose and fix a bug end-to-end. Blocks at any phase if information is missing |
| `/implement` | Command | Implement a feature end-to-end. Blocks if requirements are unclear |
| `/refactor` | Command | Behavior-preserving refactor of a specified target. Enforces the test-first loop from ADR-013 (characterize → refactor → verify → review) |
| `/design` | Command | Redesign a page or component using Shadcn/UI + Tailwind. Use for all new UI work and Bootstrap migrations |
| `/new-component` | Command | Scaffold a reusable React component under `web-react-ts/src/components/` |
| `/new-module` | Command | Scaffold a feature module — page + queries + types + route + (optional) resolver |
| `/commit` | Command | Stage changes and create a Conventional Commits commit |
| `code-reviewer` | Agent (blue) | Reviews a diff for code quality, conventions, framework correctness, TS, architecture, domain. Severity-grouped output |
| `security-reviewer` | Agent (red) | Audits a diff for auth, authorisation, financial, injection, exposure issues. Critical/High/Medium/Low |
| `cypher-reviewer` | Agent (green) | Reviews Cypher (in `*-cypher.ts` and SDL `@cypher` blocks) for correctness, performance, parameter safety |
| `test-author` | Agent (yellow) | Writes characterization or unit tests for a target. Vitest+RTL+MSW (FE), Jest+babel-jest (BE). Refuses to write tests it cannot run |
| `refactor` | Agent (purple) | Performs one behavior-preserving move on a target. Refuses without passing tests on the baseline. Always reverts on red |
| `e2e-tester` | Agent (cyan) | Drives Chrome DevTools against the local dev server to verify UI features end-to-end. Always logs in with the role-appropriate test account from `kb/07-test-accounts.md`. Reports pass/fail with screenshot and network evidence |

---

## Mandatory rules

These rules override any default behaviour. They are not suggestions.

### KB reading — if working on X, you MUST read Y

| If you are working on… | You MUST read |
| --- | --- |
| Anything new (start of any task) | `CLAUDE.md` (this file) |
| New domain term, name, or church level | `kb/01-glossary.md` |
| Permission gate, role check, or auth route | `kb/02-user-roles.md` and both `web-react-ts/src/permission-utils.ts` and `api/src/resolvers/permissions.ts` |
| Workflow that touches services, arrivals, banking, or accounts | `kb/03-workflows.md` |
| Anything stateful (banking, vacation, servant slots, vehicles, expenses, auth) | `kb/04-state-machines.md` |
| Reading or writing any entity (Member, Church, ServiceRecord, BussingRecord, HistoryLog) | `kb/05-data-entities.md` |
| Architectural decision or anything that "feels structural" | `kb/06-adr.md` |
| Frontend component, page, or styling | `web-react-ts/kb/01-frontend-conventions.md` and `web-react-ts/kb/02-design-system.md`. Run `/design` for any UI work |
| New page or route | `web-react-ts/kb/03-routing-and-permissions.md` |
| Resolver or `*-cypher.ts` change | `api/kb/01-backend-conventions.md` and `api/kb/03-resolver-patterns.md` |
| GraphQL SDL change or new `@cypher` block | `api/kb/02-graphql-and-cypher.md` |
| Refactoring any code | `kb/06-adr.md` (ADR-013) and `kb/04-state-machines.md`. Run `/refactor` — never refactor outside the test-first loop |
| Writing or modifying tests | `kb/06-adr.md` (ADR-013) for stack and conventions. Vitest on FE, Jest on BE |

### Command usage — if asked to do X, you MUST use /command

| If asked to… | Use |
| --- | --- |
| Diagnose / fix a bug | `/fix` |
| Build a new feature | `/implement` |
| Refactor existing code (rename, extract, dedupe, tighten types, …) | `/refactor` |
| Redesign a page or UI component | `/design` |
| Add a reusable UI component | `/new-component` |
| Add a new page or feature module | `/new-module` |
| Commit changes | `/commit` |

Do not improvise these workflows; they encode the multi-phase blocking pattern
that prevents shallow work.

### Agent dispatch — if doing X, you MUST dispatch agent

| If you just… | Dispatch |
| --- | --- |
| **Wrote or modified any code — MANDATORY, no exceptions** | `code-reviewer` |
| Touched anything under `api/src/resolvers/`, `api/src/schema/`, `api/src/functions/`, `lib/auth-service.ts`, `permission-utils.ts`, or any money / banking / arrivals / accounts code | `security-reviewer` |
| Wrote or modified Cypher (in `*-cypher.ts` or SDL `@cypher` blocks) or aggregation logic | `cypher-reviewer` |
| Are about to refactor a target that has no tests yet | `test-author` (write characterization tests **before** the refactor — ADR-013) |
| Are performing a behavior-preserving refactor on a target with passing tests | `refactor` (one move per dispatch; reverts on red) |
| Need to verify a UI feature works in the browser (after implementation, after a bug fix, or when the user asks to test something) | `e2e-tester` (logs in as the correct role, exercises the feature, reports with evidence) |

`code-reviewer` is **not optional**. Every code change, no matter how small,
must go through it before the user is asked to verify or before `/commit`.

Reviewers run **after** implementation, **before** the user is asked to verify
or before `/commit`.

### Must not

- ❌ **Auth0.** Do not import `@auth0/auth0-react`. Auth is custom (ADR-002).
- ❌ **Chakra / styled-components / MUI.** The design system is Shadcn/UI +
  Tailwind CSS. Bootstrap is being phased out — do not write new Bootstrap.
  Do not mix Bootstrap and Tailwind on the same page (ADR-003 superseded by
  `/design` skill).
- ❌ **Inline `<Route>` JSX.** Routes go through `LazyRouteTypes[]` arrays in
  `*Routes.ts` files (ADR-004).
- ❌ **Drift between FE and BE permission helpers.** Any change to
  `web-react-ts/src/permission-utils.ts` MUST be mirrored in
  `api/src/resolvers/permissions.ts` (ADR-001).
- ❌ **String-interpolated Cypher.** All variable inputs go through `$param`
  bindings (ADR-012).
- ❌ **Hand-rolled `MakeXLeader` / `RemoveXLeader` resolvers.** Add a single
  line to `api/src/resolvers/directory/servant-config.ts` (ADR-006).
- ❌ **Skipping `isAuth(...)` in a resolver.** It must be the first line of
  the function body. The `@neo4j/graphql` authorization directive does not
  cover custom resolvers.
- ❌ **Trusting client-supplied roles.** Use `context.jwt.roles`, never
  `currentUser.roles` from the React state.
- ❌ **Mutating money / `transactionStatus` without idempotency.** ADR-005,
  SM1.
- ❌ **Marking vacation Bacentas as defaulters.** `vacationStatus = 'Vacation'`
  is a valid reason for no service record (SM3).
- ❌ **`../../../` import chains.** Absolute imports from `src/` (ADR-009).
- ❌ **Editing lock files** (`package-lock.json`, etc.) directly. Use the
  package manager. (Pre-tool hook blocks this.)
- ❌ **Editing `.env` / `secrets.json` / `credentials.json`.** Update AWS
  Secrets Manager. (Pre-tool hook blocks this.)
- ❌ **Force pushing.** Especially to `main` or `deploy`. (Deny-listed.)
- ❌ **`npm run release:*`.** Releases are human-gated. (Deny-listed.)
- ❌ **Refactoring code without tests on the target.** ADR-013 supersedes
  ADR-010 — refactors must follow the test-first loop (characterize → refactor
  → verify → review). Use `/refactor`. Bug fixes and feature work do not
  require tests unless the user opts in or the surrounding code is being
  refactored.
- ❌ **Claiming "tests pass" when no tests exist for the change.** Run them
  and quote the output. If a package's test runner is not yet configured, say
  so — do not improvise a config inline (test infra is its own PR per
  ADR-013).
- ❌ **Logging the JWT, momo numbers, or email/PII.** `index.js` already logs
  the decoded JWT — do not expand it; ideally trim it.
- ❌ **Pushing to a remote without explicit user request.** PRs are user-
  initiated.

---

## Operational context

- **Team size:** Small. Releases are coordinated; do not surprise the team
  with structural changes.
- **Branches:** `deploy` is production (PR target). `dev` is active development.
  `main` is the AWS Amplify production trigger (Amplify pipeline pulls prod
  secrets when the build is on `main`); other branches use `dev` secrets.
- **Region:** Ghana. Phone numbers use `MOMO_NUM_REGEX` (Ghanaian mobile
  money). Currency is cedis (GHS) with foreign-currency overrides on
  ServiceRecords.
- **Compliance:** No formal compliance regime, but financial flows
  (banking, account expenses, arrivals payments) carry real money — server-
  side validation and idempotency are required (ADR-005).
- **Secrets:** AWS Secrets Manager (`prod/fl-admin-portal`,
  `dev/fl-admin-portal`). Loaded by `loadSecrets()` in
  `api/src/resolvers/secrets.ts`. Never committed to the repo.
- **Audit trail:** `HistoryLog` nodes are append-only. Every leadership change,
  banking confirmation, and major state transition appends one. Do not skip.
- **MCP servers** (`.mcp.json`):

  | Server | Target | When to use |
  | --- | --- | --- |
  | `neo4j` | `dev-neo4j.firstlovecenter.com` (dev, plain bolt) | Query the live dev database — schema verification, data shape, Cypher prototype testing. **Read-only by preference.** |
  | `neo4j-prod` | `neo4j.firstlovecenter.com` (prod, TLS bolt) | ⚠️ **Production data.** Only use when the user explicitly asks to inspect prod. Never mutate without explicit user approval. |
  | `context7` | Upstash Context7 | Up-to-date library docs (Apollo, `@neo4j/graphql`, React Router, etc.). Use when you need current API signatures rather than training-data guesses. |
  | `shadcn` | shadcn CLI | Look up Shadcn component APIs and available components. Use `npx shadcn@latest add <name>` to scaffold components into `src/components/ui/`. |
  | `chrome-devtools` | Local Chrome instance | Browser DevTools automation — DOM inspection, console, network tab. Useful for PWA debugging and verifying service-worker state. |

  Never mutate production data via MCP. Dev mutations require explicit user approval.
- **Pre-tool / post-tool hooks** (configured in `.claude/settings.json`):
  - PreToolUse: blocks edits to lock files and env / secret files.
  - PostToolUse: runs `tsc --noEmit` for the touched package and `eslint` for
    the touched file. Output is capped to last 20 lines, 20s timeout.
- **Test stack (ADR-013):** Vitest + RTL + MSW on `web-react-ts`, Jest +
  babel-jest on `api` (reusing the existing `babel.config.js`). Tests are
  written as code is refactored or extended —
  there is no backfill for unchanged code. A refactor without tests on the
  target is forbidden. Bug fixes and feature work do not require tests
  unless the user opts in. Manual smoke tests still backstop UI flows that
  tests cannot reasonably cover (PWA install, Sabbath gating, Apollo offline
  cache).
