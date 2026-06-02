# Routing and permissions — `web-react-ts/`

How a request flows from URL → role check → rendered page. If you add a screen,
follow this exact pipeline.

## Route entry shape

Every page is a `LazyRouteTypes` entry:

```ts
type LazyRouteTypes = {
  path: string                                 // react-router pattern
  element: LazyExoticComponent<() => JSX.Element>
  placeholder?: boolean                        // see below
  roles: Role[]                                // who can see it
}
```

Defined in per-section route arrays:

| File | Section |
| --- | --- |
| `pages/dashboards/dashboardRoutes.ts` | Dashboards (`/`, user dashboard) |
| `pages/directory/directoryRoutes.ts` | Directory (member + church CRUD/views) |
| `pages/services/servicesRoutes.ts` | Services + banking + defaulters + graphs |
| `pages/services/rehearsalRoutes.ts` | Ministry rehearsals |
| `pages/arrivals/arrivalsRoutes.ts` | Arrivals (bussing) |
| `pages/reconciliation/reconRoutes.ts` | Reconciliation |
| `pages/maps/mapsRoutes.ts` | Maps |
| `pages/accounts/accountsRoutes.ts` | Accounts (deposits / expenses) |

`AppWithContext.tsx` spreads them into one `Routes` block and wraps each with
`<ProtectedRoute>`.

## Adding a new page

1. Create the component as `pages/<section>/<Name>.tsx` (PascalCase).
2. In the matching `*Routes.ts` file:

   ```ts
   const MyNewPage = lazy(() => import('pages/services/MyNewPage'))

   export const services: LazyRouteTypes[] = [
     // ... existing
     {
       path: '/services/my-new-page',
       element: MyNewPage,
       roles: permitLeaderAdmin('Bacenta'),
     },
   ]
   ```

3. If the section's route array is not yet spread into `AppWithContext.tsx`,
   add it (rare — most sections already are).
4. Verify: `tsc --noEmit` and click the route in the running app.

Do **not** add inline `<Route>` JSX in `AppWithContext.tsx`. The only inline
routes there are `/setup-password`, `/dashboard/servants`, and the catch-all
`*` — and that is by design (they have non-standard wrappers).

## URL conventions

Per existing routes, follow these patterns:

| Action | Path pattern |
| --- | --- |
| Display details | `/{entity}/displaydetails` |
| Add | `/{entity}/add{entity}` (e.g. `/bacenta/addbacenta`) |
| Edit | `/{entity}/edit{entity}` |
| List all | `/{entity}/displayall` |
| Section index | `/{section}` (e.g. `/services`, `/arrivals`) |
| Sub-page | `/{section}/{action}` (kebab-case for multi-word) |

## `<ProtectedRoute>` behaviour

`auth/ProtectedRoute.tsx` is the auth + role gate.

- If the user is not loaded yet → `LoadingScreen`.
- If the user is not authenticated and the route is `/` → `Login` screen.
- If `isAuthorised(roles, currentUser.roles)` → render the page.
- If `placeholder: true` and the user is at least a Bacenta-level leader → set
  the relevant church ID in `ChurchContext` and render the page anyway. (This
  lets a leader land on a generic page and have their own context auto-loaded.)
- Otherwise → `UnauthMsg`.

`<MembersDirectoryRoute>` wraps directory routes that need the search/filter
context as well.

`<ProtectedRouteHome>` is used for the servants dashboard root.

## Roles on a route

Always use a permission helper:

```ts
roles: permitLeaderAdmin('Council')
roles: permitMe('Bacenta')
roles: permitArrivals('Stream')
roles: ['all']                  // any authenticated user
```

Do not hand-build `Role[]` arrays per route. If you need a combination not
covered by an existing helper, add a new helper to `permission-utils.ts` and
mirror it to `api/src/resolvers/permissions.ts` (ADR-001).

## Reading the current church

Inside a page:

```ts
const { bacentaId, councilId, /* etc */ } = useContext(ChurchContext)
```

Do not duplicate this state into `useState` or read from URL params — the
`ChurchContext` is the single source of truth (ADR-007).

## Setting the current church

`useClickCard` already exposes `setBacentaId`, `setCouncilId`, etc. via the
`doNotUse` bag in `ChurchContext` — so most pages don't write IDs. Cards in list
views (`DisplayChurchList`, `ChurchButton`) handle navigation + ID setting in
one place.

## Navigation menu

Lives in `pages/dashboards/Navigation.tsx`. New top-level destinations may need
an entry there.

## Public routes

The only fully public path is `/setup-password` (handled outside
`<ProtectedRoute>`). Everything else requires authentication.

`PUBLIC_AUTH_ROUTES` in `auth/SetPermissions.tsx` lists paths that skip the
`GET_LOGGED_IN_USER` query — currently `/login`, `/signup`, `/forgot-password`,
`/reset-password`, `/setup-password`.
