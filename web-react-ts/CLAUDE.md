# CLAUDE.md — `web-react-ts/`

Frontend package of the FL Admin Portal. Read the root `CLAUDE.md` first; this
file scopes to frontend conventions only.

## What this package is

The React 18 + TypeScript admin web app. Built with Vite 4. Talks to the
backend at `VITE_SYNAGO_GRAPHQL_URI` (default `http://localhost:4001/graphql`).
Authenticates via the custom auth microservice at `VITE_AUTH_API_URL`
(`lib/auth-service.ts`).

## Stack reminders (full table in root CLAUDE.md)

- React 18, TypeScript 4.7 strict.
- Vite 4 + `vite-plugin-pwa` + Sentry (when `SENTRY_AUTH_TOKEN` set).
- Apollo Client 3 (retry + error link, `errorPolicy: 'all'`, `notistack`
  snackbars).
- **Shadcn/UI + Tailwind CSS v4** (`@tailwindcss/vite`). Design tokens in
  `src/design-tokens.css`; Tailwind entry in `src/app.css`. Shadcn components
  in `src/components/ui/`. Use `cn` from `lib/utils`.
- Bootstrap 5 + react-bootstrap remain for legacy (untouched) pages only.
  Do not write new Bootstrap. Do not mix Bootstrap and Tailwind on the same page.
- Formik + Yup; in-house wrappers in `src/components/formik/`.
- Custom JWT auth in `src/contexts/AuthContext.tsx`. **Not Auth0.**
- `react-router-dom` v6, lazy-loaded routes in `*Routes.ts` arrays.

## Knowledge base for this package

| File | Contents |
| --- | --- |
| `kb/01-frontend-conventions.md` | Project shape, file rules, imports, TS, Apollo, forms, state, what not to do |
| `kb/02-design-system.md` | Theme tokens, feature accents, button variants, components-to-reuse table |
| `kb/03-routing-and-permissions.md` | `LazyRouteTypes`, adding pages, URL conventions, `ProtectedRoute` behaviour |

Cross-package KB lives in `../kb/`.

## Mandatory rules (frontend-specific)

- **Shadcn/UI + Tailwind for all new and touched pages.** No Chakra, MUI,
  styled-components. Bootstrap is legacy-only (untouched pages). Run `/design`
  for any UI work.
- **No `@auth0/auth0-react` imports** — dead dep (ADR-002).
- **Routes** go through `*Routes.ts` arrays as `LazyRouteTypes` and are spread
  into `AppWithContext.tsx`. No inline `<Route>` JSX (ADR-004).
- **Church IDs** come from `ChurchContext` via `useClickCard` — never
  duplicated into `useState` or read from URL params (ADR-007).
- **Permission helpers** — use the helpers in `src/permission-utils.ts`. Any
  change to these MUST be mirrored in `../api/src/resolvers/permissions.ts`
  (ADR-001).
- **Forms** use `components/formik/*` wrappers, not bare Formik fields.
- **No `any`** in new code.
- **Absolute imports** from `src/` (ADR-009). Same-folder relative is fine.
- **Components stay under ~400 lines.** Split when they grow.
- **Reuse** the design-system components catalogued in `kb/02-design-system.md`
  before writing a new one.

## Key files

| File | Purpose |
| --- | --- |
| `src/index.tsx` | Apollo + Auth bootstrap + cache buster |
| `src/AppWithContext.tsx` | Router + every context provider + every route array |
| `src/SimpleApp.tsx` | Auth gate above the router |
| `src/auth/ProtectedRoute.tsx` | Per-route role + auth gate |
| `src/auth/SetPermissions.tsx` | Loads `currentUser` from `GET_LOGGED_IN_USER` |
| `src/contexts/AuthContext.tsx` | Custom JWT auth (the only TS context) |
| `src/contexts/ChurchContext.js` | Per-level church IDs (JS — leave as JS unless refactoring) |
| `src/global-types.ts` | Shared TypeScript types — reuse, do not duplicate |
| `src/global-utils.ts` | Constants, regexes, Formik option lists |
| `src/permission-utils.ts` | Permission helpers (mirror to backend) |
| `src/app.css` | Tailwind v4 entry point (`@import "tailwindcss"` + `@theme inline`) |
| `src/design-tokens.css` | All HSL design tokens (light + dark). Single source of truth |
| `src/color-theme.css` | Legacy Bootstrap theme (untouched pages only — do not edit) |
| `src/index.css` | Global utility classes (Bootstrap-era — do not add Tailwind here) |
| `src/lib/utils.ts` | `cn` helper (clsx + tailwind-merge) |
| `src/components/ui/` | Shadcn component library |
| `vite.config.mts` | Vite + Tailwind + PWA + Sentry + tsconfig paths |

## Local dev

```
# from web-react-ts/
npm install
npm start              # vite dev server on :3000
```

## Verification

- `npx tsc -p tsconfig.json --noEmit`
- `npx eslint <files> --max-warnings=0`
- `npm run test:run` (Vitest — full suite) or `npm run test:run -- <pattern>`
  for the touched file. Tests are written as code is refactored or extended,
  per **ADR-013**. Refactors require tests on the target before they begin
  (use `/refactor`).
- Click through the actual flow in the browser as the gating role.
- Don't claim "tests pass" without running them — quote the runner output.
