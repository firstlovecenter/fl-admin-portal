# Frontend conventions — `web-react-ts/`

Rules that apply only to the React/Vite app. Cross-package rules are in the root
`kb/`.

## Project shape

- React 18 + TypeScript 4.7 (strict).
- Vite 4. Dev server on `http://localhost:3000`. PWA enabled via
  `vite-plugin-pwa`. Sentry uploads source maps if `SENTRY_AUTH_TOKEN` is set.
- Apollo Client 3, Apollo cache `InMemoryCache`, default `errorPolicy: 'all'`,
  retry link (5 attempts, 300–2000ms jitter), error link surfaces snackbars via
  `notistack`.
- Routing via `react-router-dom` v6. All routes are lazy-loaded — see
  `kb/03-routing-and-permissions.md`.
- Forms: Formik + Yup. Heavy in-house wrapper library at
  `src/components/formik/`. Use those wrappers (`Input`, `Select`, `RadioButtons`,
  `SearchBacenta`, `SearchMember`, `ImageUpload`, `FileUpload`, `Combobox`)
  rather than raw Formik fields.

## File and folder rules

- Component files: `PascalCase.tsx`. One component per file (small helpers may
  co-locate).
- Hooks: `useFoo.tsx` or `useFoo.ts`, camelCase. New hooks live in
  `src/hooks/`.
- CSS: prefer Bootstrap classes + CSS variables from `color-theme.css`.
  Component-scoped CSS files (`Foo.css` next to `Foo.tsx`) exist and are okay
  for non-trivial styling. No CSS modules, no styled-components.
- Tests: there is no test suite. If you add tests, set up the runner for the
  whole feature; do not commit single test files into nothing.
- Domain pages: `src/pages/<section>/...`. Route arrays end in `*Routes.ts`.
- Shared building blocks: `src/components/<group>/...` (e.g. `formik/`,
  `buttons/`, `card/`, `members-grids/`).

## Import conventions

- Absolute imports from `src/` (e.g. `import { useAuth } from
  'contexts/AuthContext'`). ESLint rule `no-relative-import-paths` is on as a
  warning. Same-folder relative imports (`./Foo`) are allowed.
- Use named imports unless the module exports a single default.
- Order: react / third-party → absolute project paths → same-folder. The
  formatter handles spacing.

## TypeScript rules

- No `any` in new code. Existing `any` is tolerated but not encouraged. Many
  contexts still pass `as any` — when you touch them, type them properly.
- All Member / Church / record types live in `global-types.ts`. Reuse them; do
  not redeclare.
- Forms: type the values shape (`type FormikValues = { ... }`) and pass it as
  the Formik generic.
- React component definitions are arrow-function (ESLint enforces this).

## Apollo conventions

- One `*Queries.ts` (or `*GQL.ts`) file per page or module
  (`pages/services/ServicesQueries.ts`, `pages/accounts/accountsGQL.ts`).
  Co-locate them with the consuming page.
- `gql\`\`` template literal; query variable name in `SCREAMING_SNAKE_CASE`
  (e.g. `GET_LOGGED_IN_USER`, `BANK_SERVICE_OFFERING`).
- Use the `useQuery` / `useMutation` hooks. For polling dashboards, use the
  `LONG_POLL_INTERVAL` / `SHORT_POLL_INTERVAL` constants in
  `global-utils.ts`.
- Mutations that change state which other components display should call
  `refetchQueries` or update the cache; bare mutations leave stale UI.
- The API runs `@neo4j/graphql` **v7**. Every `where`, `sort`, `limit`, and
  `offset` uses the v7 input shape. The full v6 → v7 cheat-sheet
  (`{ eq: ... }`, flat pagination, list-form sort, nested `some/none/all`
  list-relation filters, `NOT` block instead of `_NOT`, etc.) lives in
  `api/kb/02-graphql-and-cypher.md` ("v7 input cheat-sheet"). Read it before
  copying old patterns or hand-writing a query.

## Forms

- Submit handlers must `setSubmitting(false)` in a `finally` and surface errors
  through `notistack` or `ErrorText`.
- Server errors return through Apollo's snackbar already — do not double-toast.
- `BtnSubmitText` standardises submit-button label transitions.

## State

- `AuthContext` — auth (TS).
- `MemberContext` — current user + jobs (JS).
- `ChurchContext` — every church-level ID via `useClickCard` (JS).
- `ServiceContext` — currently-being-edited record IDs (JS).

The non-TS contexts work, but adding new state to them means adding to a `.js`
file. If a refactor opportunity comes up, migrate to TS.

## Logging

- `no-console` ESLint rule is `warn` for the FE package (relaxed). Avoid
  `console.log` in committed code; use the error link's snackbar surface for
  user-visible errors and Sentry for diagnostics.

## What not to do

- Do not introduce a new state-management library (Redux, Zustand, Jotai). Use
  Apollo cache + React context.
- Do not import from `@auth0/auth0-react` (dead dep).
- Do not write inline `<Route>` JSX in `AppWithContext.tsx`. Add to the route
  arrays.
- Do not re-implement church-id state outside `useClickCard` /
  `ChurchContext`.
- Do not write new Bootstrap — the design system is Shadcn/UI + Tailwind CSS.
  Do not use Chakra / styled-components / MUI either.
- Do not mix Bootstrap and Tailwind on the same page.
- Do not use `@apply` in CSS files — write Tailwind utilities in JSX.
- Do not replace `notistack` — it is wired into the Apollo error link.
