---
description: Scaffold a new feature module — page + queries + types + route + (optional) resolver.
---

You are running `/new-module` on the FL Admin Portal. A "module" here is a
feature added to an existing section (`directory`, `services`, `arrivals`,
`accounts`, `maps`, `reconciliation`, `dashboards`) — typically: a new page,
its GraphQL operations, any new types, the route entry, and any backend
support.

For a new top-level section (rare), pause and ask the user — that warrants a
design discussion first.

The user-supplied module description follows.

---

## Phase 1 — Check the KB for domain rules

Read, in order:

1. `kb/01-glossary.md` — confirm spelling and definitions (Bacenta, Bussing,
   Hub, etc.). Do not invent new domain terms.
2. `kb/02-user-roles.md` — pick the right permission helper for the module's
   role gate.
3. `kb/03-workflows.md` — does this module slot into an existing workflow
   (W1–W8)? If so, follow that flow's pre/post-conditions.
4. `kb/04-state-machines.md` — if the module reads or writes a stateful entity,
   re-read its allowed transitions.
5. `kb/05-data-entities.md` — find the entity type(s) you'll consume; reuse
   them.
6. `kb/06-adr.md` — check ADR-003 (styling), ADR-004 (routes), ADR-005 (money),
   ADR-007 (church-id state).

State which of these you've consulted and what they constrain.

## Phase 2 — Identify the navigation entry point

- Which existing section does this belong under
  (`pages/services/`, `pages/arrivals/`, etc.)?
- Which `*Routes.ts` file will receive the new route?
- Where does the user enter the page (Navigation menu, dashboard card, list
  drill-down)?
- Cross-check `web-react-ts/kb/03-routing-and-permissions.md`.

State the chosen URL and section. If the URL doesn't follow the existing
pattern (`/{entity}/displaydetails`, `/{entity}/displayall`, etc.), justify it.

## Phase 3 — Scaffold

Build in this order; validate at each step.

### 3a. Backend (only if the module needs new server data)

- New SDL fields / types in the relevant `.graphql` file under
  `api/src/schema/`.
- New Cypher in `<domain>-cypher.ts`.
- New resolver in `<domain>-resolvers.ts` following pattern P1/P2 in
  `api/kb/03-resolver-patterns.md`. Auth check first
  (`isAuth(permitX('Level'), context.jwt.roles)`), session in try/finally,
  parameterised Cypher.
- Wire into `api/src/resolvers/resolvers.ts`.
- For servant assignments, add **one line** to `servant-config.ts` (ADR-006).
- Restart `npm run start:dev`; verify in Apollo Sandbox.

### 3b. Frontend types (if any local-only types)

- Co-located file: `pages/<section>/<feature>-types.ts`. Reuse from
  `global-types.ts` first.

### 3c. GraphQL operations

- `pages/<section>/<feature>Queries.ts` (or `<feature>GQL.ts`, both
  conventions exist). One file per page or feature.
- Variable names in `SCREAMING_SNAKE_CASE`.

### 3d. Page component

- `pages/<section>/<PageName>.tsx`. PascalCase, arrow-function.
- Wrap in `<ApolloWrapper>` for loading / error states, or roll your own using
  `LoadingScreen` and `ErrorScreen`.
- Reuse design-system components from `web-react-ts/kb/02-design-system.md`.
- Read church IDs from `ChurchContext` (ADR-007).
- Forms: Formik + Yup, using the in-house `components/formik/*` wrappers.
- Bootstrap classes + CSS variables — no new styling system (ADR-003).
- Keep the page under ~400 lines; extract sub-components if it grows.

### 3e. Route entry

- In `pages/<section>/<section>Routes.ts`:

  ```ts
  const NewPage = lazy(() => import('pages/<section>/<NewPage>'))

  export const <section>: LazyRouteTypes[] = [
    // ...
    {
      path: '/<section>/<kebab-case-route>',
      element: NewPage,
      roles: permit<Helper>('<Level>'),
    },
  ]
  ```

- Confirm the section's array is already spread in `AppWithContext.tsx` (most
  are).

### 3f. Navigation link (if needed)

- Add to `pages/dashboards/Navigation.tsx` only if this is a top-level
  destination. Most modules are reached via dashboards / drill-down lists and
  do not need a menu entry.

### 3g. Mock data

- Only if the feature explicitly needs seeded data for local dev. Do not invent
  fixtures the codebase doesn't already use.

## Phase 4 — Verify compilation and flow

1. `cd api && cd src/resolvers && npx tsc -p tsconfig.json --noEmit` (if
   backend changed)
2. `cd web-react-ts && npx tsc -p tsconfig.json --noEmit`
3. `npx eslint <changed files> --max-warnings=0`
4. **Manual smoke test** (ADR-010):
   - Start backend and frontend.
   - Log in as a user with the gating role (or impersonate via a token whose
     JWT has that role).
   - Navigate the new route via the same path the real user will take.
   - Trigger the mutation; verify the data lands in Neo4j (Browser at
     `http://localhost:7474`).
   - Re-visit any list / dashboard that should reflect the new entity.

## Output

- ✅ Files added (backend + frontend, separate lists).
- ✅ Route URL + role gate used.
- ✅ Manual test checklist (login as ___, navigate to ___, expect ___).
- ⚠️ Anything skipped (e.g. "no Navigation entry — opens via dashboard card").
- 🚫 Anything blocked (e.g. "needs a new permission helper — please confirm
  the role list before I add it to both packages").

Do not claim "tests pass" — they don't exist (ADR-010).
