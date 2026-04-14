# CLAUDE.md — FL Admin Portal

# This is your memory file. Read it first every new session.

---

## Project Overview

**First Love Center Admin Portal** — a GRANDstack church management system for First Love Center, Accra, Ghana.
Manages: membership directory, service attendance/income, bussing arrivals, banking/offerings, geolocation, campaigns, financial accounts.

- **Version:** 8.1.3
- **GitHub:** `github.com/firstlovecenter/fl-admin-portal`
- **Stack:** React 18 + TypeScript (Vite), Apollo Client 3, Node/Express + Apollo Server 4, Neo4j 5, `@neo4j/graphql` v6
- **Deployment:** Frontend on AWS Amplify; backend runs separately (Docker or Lambda)

---

## Folder Structure

```
fl-admin-portal/
├── api/                    # Node.js/Express Apollo GraphQL backend
├── web-react-ts/           # React + TypeScript frontend (Vite)
├── lib/                    # Shared secrets, GraphQL utilities
├── lambda-package/         # AWS Lambda deployment package
├── scripts/                # Monorepo build/release/dev scripts
├── docs/                   # Amplify deployment docs
├── img/                    # Logo assets
├── docker-compose.yml      # Local dev: neo4j + api + ui
├── amplify.yml             # AWS Amplify CI/CD pipeline (frontend only)
├── apollo.config.js        # Apollo tooling config → localhost:4001/graphql
└── package.json            # Monorepo root (orchestration scripts + lint-staged)
```

### Root-Level File Purpose Map

| File                              | Purpose                                                     |
| --------------------------------- | ----------------------------------------------------------- |
| `README.md`                       | Main project documentation and onboarding                   |
| `AMPLIFY_README.md`               | AWS Amplify deployment-specific notes                       |
| `MIGRATION_SUMMARY.md`            | Historical migration notes and outcomes                     |
| `REFACTORING_SUMMARY.md`          | Refactor history and architectural cleanup notes            |
| `CHANGELOG.md`                    | Version-by-version release notes                            |
| `CONTRIBUTING.md`                 | Contribution guidelines for collaborators                   |
| `CODE_OF_CONDUCT.md`              | Community conduct rules                                     |
| `LICENSE.txt`                     | Project license terms                                       |
| `package.json`                    | Root scripts for monorepo orchestration (dev/build/release) |
| `docker-compose.yml`              | Local Docker stack (Neo4j + API + UI)                       |
| `amplify.yml`                     | CI/CD build pipeline for Amplify frontend deployment        |
| `apollo.config.js`                | Apollo IDE/introspection configuration                      |
| `QUICK_REFERENCE_NEW_MUTATION.sh` | Utility script reference for adding GraphQL mutations       |
| `CLAUDE.md`                       | Persistent AI project memory and working conventions        |

---

## Frontend (`web-react-ts/src/`)

**Entry:** `index.tsx` (Apollo + Auth bootstrap)
**Router:** `AppWithContext.tsx` (BrowserRouter + all route arrays + Context Providers)
**Auth gate:** `SimpleApp.tsx`
**Build:** Vite 4, TypeScript strict, absolute imports via `baseUrl: "src"`

### Key Directories

| Path                  | Purpose                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `auth/`               | Route guards, `ProtectedRoute`, `RoleView`, `MaintenanceMode`, `Sabbath`                         |
| `contexts/`           | `AuthContext.tsx` (custom JWT auth), `ChurchContext.js`, `MemberContext.js`, `ServiceContext.js` |
| `hooks/`              | `useClickCard` (manages all church-level ID state), `useChurchLevel`, `useModal`, `usePopup`     |
| `pages/`              | All page-level components, grouped by domain                                                     |
| `components/`         | Shared reusable components (cards, buttons, formik wrappers, charts, etc.)                       |
| `queries/`            | `ListQueries.ts` — shared GraphQL query definitions                                              |
| `lib/auth-service.ts` | REST client for custom auth microservice (`VITE_AUTH_API_URL`)                                   |
| `global-types.ts`     | All shared TypeScript types (church hierarchy, Member, Role, Routes, ServiceRecord)              |
| `global-utils.ts`     | Shared utility functions                                                                         |
| `permission-utils.ts` | Role-based permission helpers (`permitMe`, `permitLeader`, `permitAdmin`, `permitArrivals`)      |
| `color-theme.css`     | **Full design system** — CSS vars, dark/light themes (see Design section)                        |
| `index.css`           | Global utility classes (`.page-container`, `.bg`, `.profile-img`, etc.)                          |

### Pages / Sections

| Section        | Path Prefix                                                                                                           | Description                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Dashboard      | `/`                                                                                                                   | `UserDashboard`, `ServantsDashboard`, `ServantsChurchList`                 |
| Directory      | `/directory`, `/member`, `/bacenta`, `/governorship`, `/council`, `/stream`, `/campus`, `/oversight`, `/denomination` | Full church directory: display, create, update, history, grids, quickfacts |
| Services       | `/services`, `/{level}/record-service`                                                                                | Service records, banking, defaulters, graphs, rehearsals, anagkazo         |
| Arrivals       | `/arrivals`                                                                                                           | Bussing arrivals tracking, bus forms, countdown                            |
| Accounts       | `/accounts`                                                                                                           | Financial accounts: deposits, expenses, approvals, transaction history     |
| Maps           | `/maps`                                                                                                               | Google Maps views for fellowships/venues                                   |
| Reconciliation | `/reconciliation`                                                                                                     | Reconciliation module                                                      |
| Auth           | `/setup-password`                                                                                                     | Password setup page                                                        |
| 404            | `*`                                                                                                                   | `PageNotFound`                                                             |

Route convention: `/{entity}/displaydetails`, `/{entity}/add{entity}`, `/{entity}/edit{entity}`, `/{entity}/displayall`

All routes defined as `LazyRouteTypes[]` arrays in `*Routes.ts` files, spread into `AppWithContext.tsx`.
Each route: `{ path, element, roles, placeholder? }`.

---

## Backend (`api/src/`)

**Entry:** `index.js` — Express + Apollo Server 4 + `@neo4j/graphql` v6
**Schema assembly:** `schema/graphql-schema.js` reads all ~16 `.graphql` SDL files

### Resolver Pattern

Each domain has:

- `*-cypher.ts` — raw Cypher query strings
- `*-resolvers.ts` — resolver functions (use Neo4j driver session directly)

Domains: `accounts`, `anagkazo`, `arrivals`, `banking`, `directory`, `download-credits`, `maps`, `no-income`, `services`, `uploads`

Special: `directory/servant-resolver-factory.ts` — factory for generating servant-related resolvers.

### Background Lambda Jobs (`api/src/functions/background/`)

| Job                         | Description                                     |
| --------------------------- | ----------------------------------------------- |
| `bacenta-graph-aggregator`  | Aggregates bussing data up the church hierarchy |
| `service-graph-aggregator`  | Aggregates service data up the church hierarchy |
| `accra-campus-weekly`       | Weekly report for Accra campus                  |
| `outside-accra-weekly`      | Weekly report for outside Accra                 |
| `den-office-monthly-report` | Monthly PDF report                              |
| `payment-webhook`           | Payment processing callback                     |
| `services-not-banked`       | Defaulter notifications                         |
| `code-of-the-day`           | Daily code pusher                               |

These are also runnable as CLI scripts: `api/src/scripts/run-bacenta-aggregation.js`, `run-service-aggregation.js`.

---

## Domain Model: Church Hierarchy

```
Denomination → Oversight → Campus → Stream → Council → Governorship → Bacenta → Fellowship
                                           ↘ CreativeArts → Ministry → HubCouncil → Hub
```

Types defined in `global-types.ts`, node labels in the GraphQL SDL files.

---

## Design System

**No Tailwind.** Uses **Bootstrap 5** + custom CSS variables (Chakra UI–compatible naming).

### Files

- `web-react-ts/src/color-theme.css` — Main theme file
- `web-react-ts/src/index.css` — Global utility classes

### Typography

- Font: **Inter, sans-serif** for both heading and body (`--chakra-fonts-heading/body`)

### Color Scheme

- Full Chakra-style CSS variable palette on `:root` (gray, red, orange, yellow, green, teal, blue, cyan, purple, pink)
- **Brand accent:** `--custom-color-accent-*` shades (50–900) — a pink/red scale (e.g. `--custom-color-accent-500: #ff4d6b`)
- Dark mode accent: `--accent-color: #690c13`

### Dark / Light Mode

Toggled via Bootstrap's `data-bs-theme` attribute on `<html>` (`'dark'` or `'light'`).
Semantic tokens defined per theme:

- `--icon`, `--bg-card`, `--text-primary`, `--accent-color`
- Feature accents: `--members-accent: #68e0d7`, `--churches-accent`, `--arrivals-accent`, `--defaulters-accent`, `--banking-accent`, `--campaigns-accent`, `--maps-accent`
- Campaign-specific: `--equipment`, `--antibrutish`, `--multiplication`, `--swollensunday`, `--shepherdingcontrol`, `--sheepseeking`

### Bootstrap Button Overrides

Both themes define custom button variants: `btn-success`, `btn-danger`, `btn-primary`, `btn-warning`, `btn-secondary`, `btn-gray`, `btn-brand`, `btn-purple`, `btn-outline-*`.

---

## Apollo / GraphQL

### Frontend (`index.tsx`)

- `httpLink` → `VITE_SYNAGO_GRAPHQL_URI` || `http://localhost:4001/graphql`
- `authLink` → adds `Authorization: Bearer <token>` from in-memory access token
- `retryLink` → 5 attempts, jitter, 300–2000ms delay
- `errorLink` → shows notistack snackbars for errors
- `InMemoryCache`, `errorPolicy: 'all'`

### Auth Flow

Custom JWT auth (NOT Auth0 despite `@auth0/auth0-react` being in `package.json` — unused).

- `AuthContext.tsx` + `auth-service.ts` → REST calls to `VITE_AUTH_API_URL`
- Token stored in-memory + `sessionStorage`

### Backend (`api/src/index.js`)

- `Neo4jGraphQL({ typeDefs, resolvers, driver })` auto-generates Cypher from SDL
- JWT authorization via `features.authorization.key`
- Context: decoded JWT + `executionContext: driver`

---

## Key Absolute File Paths

| File                                        | Purpose                                           |
| ------------------------------------------- | ------------------------------------------------- |
| `web-react-ts/src/index.tsx`                | Apollo + Auth client bootstrap                    |
| `web-react-ts/src/AppWithContext.tsx`       | Router + all context providers + all routes       |
| `web-react-ts/src/color-theme.css`          | Full design system (CSS vars, themes)             |
| `web-react-ts/src/global-types.ts`          | All shared TypeScript types                       |
| `web-react-ts/src/permission-utils.ts`      | Role permission helpers                           |
| `web-react-ts/src/contexts/AuthContext.tsx` | Custom JWT auth context                           |
| `api/src/index.js`                          | API server entry point                            |
| `api/src/resolvers/resolvers.ts`            | Root resolver (aggregates all domains)            |
| `api/src/schema/graphql-schema.js`          | Schema assembly (concatenates all .graphql files) |
| `amplify.yml`                               | AWS Amplify CI/CD (frontend only)                 |
| `docker-compose.yml`                        | Local dev (neo4j + api + ui)                      |
| `web-react-ts/vite.config.ts`               | Vite config (PWA, Sentry, SVG, TS paths)          |

---

## Naming Conventions

- **React components:** PascalCase `.tsx` files
- **Utilities/helpers:** kebab-case or camelCase
- **Cypher files:** `*-cypher.ts`
- **Resolver files:** `*-resolvers.ts`
- **Route arrays:** `*Routes.ts`
- **Hooks:** `use` prefix, camelCase (e.g. `useClickCard`, `useChurchLevel`)
- **Permissions:** `permitMe`, `permitLeader`, `permitAdmin`, `permitArrivals` — all take `ChurchLevel` string

---

## Deployment

### AWS Amplify (Frontend)

- `main` branch → Production (fetches secrets from `prod/fl-admin-portal` in AWS Secrets Manager)
- Other branches → Development (fetches from `dev/fl-admin-portal`)
- Writes secrets to `web-react-ts/.env` at build time
- Configures `@jaedag` npm scope for private GitHub Packages
- Sends Slack notifications on build start/end/failure

### Docker (Local Dev)

```
neo4j:  bolt://7687, HTTP 7474
api:    port 4001
ui:     port 3000 (proxies /graphql → api)
```

### Private Packages

- `@jaedag/admin-portal-types` — TypeScript type definitions (GitHub Packages)
- `@jaedag/admin-portal-api-core` — Shared API utilities (GitHub Packages)

---

## Git Branch Convention

- `deploy` — main/production branch (use for PRs)
- `dev` — active development branch (current)

---

## User Preferences

- Prefers concise, direct responses (no filler)
- No emojis unless explicitly requested
- Uses GitHub-flavored markdown for formatting
- Wants CLAUDE.md as the persistent memory file across sessions
- Prompt-writing preference: include this exact phrase in AI prompts:
  `Can you remove the forced negatives throughout here. Instead of saying "I'm this not this, not this.." Never use such language because that is not how I talk. Speak clearly and simply succinctly.`
  `No jargon, no buzz words, just clear understanding for the lay man`
- UI preference: prefers shadcn-style confirmation dialogs over native browser `confirm()` prompts

---

## Notes & Gotchas

- `@auth0/auth0-react` is in `package.json` but NOT used — auth is fully custom via `AuthContext.tsx`
- Dockerfiles reference `node:12` (outdated, not representative of actual runtime)
- `ChurchContext.js`, `MemberContext.js`, `ServiceContext.js` are plain JS (not TypeScript) — only `AuthContext.tsx` is fully typed
- The `servant-resolver-factory.ts` generates resolvers dynamically — check it when adding new servant types
- Apollo config (`apollo.config.js`) points to localhost — not used at runtime, only for IDE introspection
- Background Lambda jobs can also be run as CLI scripts in `api/src/scripts/`
