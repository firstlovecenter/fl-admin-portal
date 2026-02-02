# Next.js Migration Guide

## Progress Summary

✅ **Completed:**

1. Updated `package.json` - Replaced Vite with Next.js dependencies
2. Created `next.config.js` - Next.js configuration with webpack SVGR support
3. Updated `tsconfig.json` - Next.js compatible TypeScript config with path aliases
4. Created `.env.local` - Environment variables for development
5. Created `src/lib/ApolloWrapper.tsx` - Apollo Client setup for Next.js
6. Created `src/app/layout.tsx` - Root layout with providers
7. Created `src/app/page.tsx` - Main entry point
8. Updated `src/AppWithContext.tsx` - Removed React Router, made context-based
9. Created `src/lib/hooks.ts` - Navigation and route protection hooks

## What Needs to Be Done

### Phase 1: Page Structure Migration

The original project uses React Router with route configuration files. You need to convert these to Next.js file-based routing.

**Original Route Files to Migrate:**

```
src/pages/dashboards/dashboardRoutes.ts
src/pages/directory/directoryRoutes.ts
src/pages/services/servicesRoutes.ts
src/pages/arrivals/arrivalsRoutes.ts
src/pages/reconciliation/reconRoutes.ts
src/pages/maps/mapsRoutes.ts
src/pages/accounts/accountsRoutes.ts
```

**How to Convert Routes:**

Each route configuration like:

```typescript
{
  path: '/dashboard/denominational-leader',
  element: DenominationalLeaderDashboard,
  roles: ['Oversight']
}
```

Becomes a file: `src/app/(protected)/dashboard/denominational-leader/page.tsx`

### Phase 2: Create App Router Structure

You need to create the `app/` directory structure:

```
src/app/
├── (protected)/          # Route group for protected pages
│   ├── dashboard/
│   │   ├── denominational-leader/page.tsx
│   │   ├── page.tsx
│   │   └── ...
│   ├── directory/
│   ├── services/
│   ├── arrivals/
│   ├── reconciliation/
│   └── maps/
├── (auth)/               # Route group for auth pages
│   ├── login/page.tsx
│   └── callback/page.tsx
├── layout.tsx           # ✅ Already created
└── page.tsx            # ✅ Already created
```

### Phase 3: Protected Routes

Create a middleware to protect routes:

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth0_token')

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/directory/:path*', '/services/:path*'],
}
```

### Phase 4: Route Helpers

Create a utility to help with routing:

**Step 1:** Update route configurations to work with Next.js:

```typescript
// src/config/routes.ts
import type { ComponentType } from 'react'

export interface Route {
  path: string
  component: ComponentType
  roles?: string[]
  placeholder?: boolean
}

export const routes = {
  dashboards: [
    {
      path: '/dashboard/denominational-leader',
      component: async () =>
        (await import('@/pages/dashboards/DenominationalLeaderDashboard'))
          .default,
      roles: ['Oversight'],
    },
    // ... more routes
  ],
}
```

**Step 2:** Create layout wrappers for each section:

```typescript
// src/app/(protected)/dashboard/layout.tsx
import { ReactNode } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
```

### Phase 5: Files to Delete/Replace

Delete these Vite-specific files:

- `vite.config.ts`
- `vite-env.d.ts`
- `index.html`
- `public/manifest.json` (keep but update for Next.js)

Replace with Next.js equivalents:

- Remove `src/index.tsx` (replaced by `src/app/layout.tsx` and `src/app/page.tsx`)
- Keep but update: `src/CacheBuster.tsx`, `src/TestProvider.tsx`

### Phase 6: Import Paths Update

Update all imports from React Router to use `next/navigation`:

```typescript
// Before (React Router)
import { useNavigate, useLocation } from 'react-router-dom'

// After (Next.js)
import { useRouter, usePathname } from 'next/navigation'
```

### Phase 7: Test & Verify

1. Run `npm install` to install dependencies
2. Run `npm run build` to verify build succeeds
3. Run `npm start` to test locally
4. Check that all routes work
5. Verify protected routes redirect to login

## Key Differences from Vite Setup

| Feature       | Vite            | Next.js           |
| ------------- | --------------- | ----------------- |
| Dev Server    | `npm run start` | `npm run start` ✓ |
| Build         | `npm run build` | `npm run build` ✓ |
| Port          | 3000            | 3000 ✓            |
| CSS Imports   | Direct imports  | Works ✓           |
| Bootstrap     | Works           | Works ✓           |
| API Proxy     | Vite config     | next.config.js ✓  |
| Auth0         | Works           | Works (updated) ✓ |
| Apollo Client | Works           | Works (updated) ✓ |

## Next Steps

1. Create `src/app/(protected)` and `src/app/(auth)` route groups
2. Migrate each dashboard page from `dashboardRoutes.ts` to `app/(protected)/dashboard/*/page.tsx`
3. Repeat for directory, services, arrivals, etc.
4. Create layout files for each major section
5. Update `ProtectedRoute` component to work with Next.js
6. Test routing and auth flow
7. Remove `src/index.tsx` file

## Notes

- Auth0Provider is now in `src/app/layout.tsx`
- Apollo Client is provided via `src/lib/ApolloWrapper.tsx`
- All contexts are still working and available
- Environment variables use `NEXT_PUBLIC_*` prefix for client-side
- Image optimization available via `next/image`
- Built-in API Routes available via `src/app/api/` directory
