# Next.js Migration Status Summary

## ✅ Completed Tasks

### 1. Package Configuration

- [x] Updated `web-react-ts/package.json` to use Next.js instead of Vite
- [x] Removed all Vite-specific dependencies
- [x] Added Next.js and required dependencies
- [x] Updated npm scripts for Next.js

### 2. Configuration Files

- [x] Created `next.config.js` with:
  - SVGR support via webpack
  - Environment variables configuration
  - API rewrites for GraphQL proxy
  - Sentry configuration
  - Module transpilation for @jaedag/admin-portal-types
- [x] Updated `tsconfig.json` to Next.js standards with:
  - Next.js plugin
  - Path aliases (@/_, components/_, pages/\*, etc.)
  - Proper module resolution
- [x] Created `.env.local` with development environment variables
- [x] Created `next-env.d.ts` for TypeScript environment types

### 3. App Router Structure

- [x] Created `src/app/layout.tsx` (Root layout with providers)
  - Auth0Provider wrapper
  - ApolloWrapper for GraphQL
  - Bootstrap and CSS imports
  - Metadata configuration
- [x] Created `src/app/page.tsx` (Main entry point)
  - Auth state handling
  - Login/splash screen integration
  - CacheBuster integration
- [x] Created `src/app/(protected)/layout.tsx`
  - Protected route wrapper
  - Auth0 integration
  - Loading states
- [x] Created `src/app/(protected)/dashboard/layout.tsx`
  - Dashboard-specific layout
  - Navigation component
- [x] Created `src/app/(protected)/dashboard/page.tsx` (Template)

### 4. Apollo Client Setup

- [x] Created `src/lib/ApolloWrapper.tsx`
  - Apollo Client initialization
  - Token management
  - Auth0 integration
  - Error handling with Notistack
  - Retry logic
  - SSR compatible

### 5. Utilities & Helpers

- [x] Created `src/lib/hooks.ts`
  - `useNavigation()` hook for client-side routing
  - `useRouteProtection()` hook for permission checking

### 6. Middleware

- [x] Created `src/middleware.ts`
  - Next.js middleware template
  - Ready for route protection enhancements

### 7. Updated Files

- [x] Modified `src/AppWithContext.tsx`
  - Removed React Router dependencies
  - Removed route configuration mappings
  - Made it compatible with Next.js App Router
  - Kept all context providers intact
- [x] Updated `netlify.toml`
  - Changed publish directory from `web-react-ts/dist` to `web-react-ts/.next`
  - Kept build commands intact

### 8. Documentation

- [x] Created `NEXT_JS_MIGRATION.md` with comprehensive migration guide

---

## 🚧 Remaining Tasks

### Phase 1: Page Migration (Most Time-Consuming)

**What needs to be done:**
Convert all React Router pages to Next.js App Router file structure

**Files to process:**

1. `src/pages/dashboards/dashboardRoutes.ts` → Create multiple `src/app/(protected)/dashboard/*/page.tsx`
2. `src/pages/directory/directoryRoutes.ts` → Create `src/app/(protected)/directory/*/page.tsx`
3. `src/pages/services/servicesRoutes.ts` → Create `src/app/(protected)/services/*/page.tsx`
4. `src/pages/arrivals/arrivalsRoutes.ts` → Create `src/app/(protected)/arrivals/*/page.tsx`
5. `src/pages/reconciliation/reconRoutes.ts` → Create `src/app/(protected)/reconciliation/*/page.tsx`
6. `src/pages/maps/mapsRoutes.ts` → Create `src/app/(protected)/maps/*/page.tsx`
7. `src/pages/accounts/accountsRoutes.ts` → Create `src/app/(protected)/accounts/*/page.tsx`

**Pattern for conversion:**

```typescript
// OLD: dashboardRoutes.ts
{ path: '/dashboard/denominational-leader', element: DenominationalLeaderDashboard, roles: ['Oversight'] }

// NEW: src/app/(protected)/dashboard/denominational-leader/page.tsx
'use client'
import DenominationalLeaderDashboard from '@/pages/dashboards/DenominationalLeaderDashboard'
export default function Page() { return <DenominationalLeaderDashboard /> }
```

### Phase 2: Route Protection

- Update or create `ProtectedRoute` component for Next.js
- Implement role-based route protection in layout files
- Set up proper error boundaries

### Phase 3: Import Updates

- Update all imports from React Router to Next.js routing
- Replace `import { useNavigate } from 'react-router-dom'` with `import { useRouter } from 'next/navigation'`

### Phase 4: Cleanup

- [ ] Delete `src/index.tsx` (no longer needed)
- [ ] Delete `src/index.css` content that's already in app/layout.tsx
- [ ] Delete `src/color-theme.css` integration (copy to layout)
- [ ] Delete `public/index.html` (Next.js provides this)
- [ ] Delete Vite-specific files (`vite.config.ts`, `vite-env.d.ts`)
- [ ] Remove React Router types (@types/react-router-dom)

### Phase 5: Testing

- [ ] `npm install` to verify dependencies
- [ ] `npm run build` to verify TypeScript and build
- [ ] `npm run start` to test locally
- [ ] Verify all routes are accessible
- [ ] Test protected routes redirect properly
- [ ] Verify Auth0 login flow
- [ ] Check Apollo Client queries work
- [ ] Verify all styles load correctly

---

## Key Architecture Changes

### Before (React Router)

```
src/index.tsx
  └─ AppWithContext
     └─ <Router>
        └─ <Routes>
           ├─ <Route path="/dashboard/leader">
           ├─ <Route path="/directory">
           └─ ...
```

### After (Next.js App Router)

```
src/app/
  ├─ layout.tsx (Providers + Root Layout)
  ├─ page.tsx (/)
  └─ (protected)/
     ├─ layout.tsx (Auth + Contexts)
     ├─ dashboard/
     │  ├─ layout.tsx (Navigation)
     │  ├─ page.tsx (/dashboard)
     │  ├─ leader/
     │  │  └─ page.tsx (/dashboard/leader)
     │  └─ ...
     ├─ directory/
     │  ├─ page.tsx (/directory)
     │  └─ ...
     └─ ...
```

---

## Deployment Notes

### For Netlify

- Build command remains the same
- Publish directory changed from `dist` to `.next`
- Next.js automatically creates optimized production build
- API routes would be available at `/.netlify/functions/graphql` (already configured)

### For Local Development

```bash
cd web-react-ts
npm install
npm run start
# Opens at http://localhost:3000
```

---

## Next Action Items (Priority Order)

1. **Create page structure** - This is the main work remaining

   - Examine each dashboardRoutes.ts, directoryRoutes.ts, etc.
   - Create corresponding .next/app files
   - Copy component imports

2. **Test build** - Verify no TypeScript errors

   - `npm run build` in web-react-ts directory
   - Fix any type issues

3. **Test locally** - Verify runtime behavior

   - `npm run start`
   - Test auth flow
   - Test GraphQL queries
   - Test navigation

4. **Clean up Vite files** - Remove old config
   - Delete src/index.tsx
   - Delete vite.config.ts
   - Delete public/index.html
   - Update .gitignore

---

## Environment Variables

The following need to be set in your hosting provider:

```
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-graphql-endpoint.com/graphql
NEXT_PUBLIC_AUTH0_DOMAIN=flcadmin.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
```

These are already in `.env.local` for development.

---

## Support Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Deployment](https://nextjs.org/docs/deployment)
