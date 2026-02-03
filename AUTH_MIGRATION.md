# Auth0 to Custom Auth Service Migration

## Overview

This project has been migrated from Auth0 to a custom authentication microservice. This document outlines the changes made and how to configure the system.

## What Changed

### Frontend (web-react-ts/)

#### Removed

- `@auth0/auth0-react` package
- `@sentry/nextjs`, `@sentry/react`, `@sentry/tracing` packages
- Auth0 environment variables (`NEXT_PUBLIC_AUTH0_DOMAIN`, `NEXT_PUBLIC_AUTH0_CLIENT_ID`)
- Sentry environment variables and configuration

#### Added

- Custom `AuthContext` (`src/contexts/AuthContext.tsx`)
- Auth service client library (`src/lib/auth-service.ts`)
- Login page (`src/app/login/page.tsx`)
- `NEXT_PUBLIC_AUTH_API_URL` environment variable

#### Modified

- All components using `useAuth0()` now use `useAuth()` from custom AuthContext
- `ApolloWrapper` updated to use custom auth tokens
- `ProtectedRoute` updated to use custom auth
- `Providers` component now uses `AuthProvider` instead of `Auth0Provider`

### Backend (api/)

#### Removed

- Auth0 user management functions (create, update, delete users)
- Auth0 role management functions
- `jwt-decode` package (no longer needed)
- Auth0 environment variables
- Sentry integration

#### Added

- Custom JWT verification (`src/resolvers/custom-auth.ts`)
- `AUTH_API_URL` environment variable (to be added to Secrets Manager)
- Role fetching from Neo4j database

#### Modified

- `src/index.js`: Context creation now verifies tokens with custom auth service and fetches roles from Neo4j
- `src/resolvers/directory/make-remove-servants.ts`: Simplified to remove Auth0 user management, now only sends emails
- All resolver authenticate logic unchanged (still uses JWT from context)

## Configuration

### Environment Variables

#### Frontend (.env.local)

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
NEXT_PUBLIC_AUTH_API_URL=https://your-auth-service-url.com
```

#### Backend (AWS Secrets Manager)

Add the following to your Secrets Manager configuration:

```json
{
  "AUTH_API_URL": "https://your-auth-service-production-url.com"
}
```

## How Authentication Works Now

### 1. Login Flow

1. User enters credentials on `/login` page
2. Frontend calls custom auth service `/auth/login` endpoint
3. Auth service validates credentials and returns JWT tokens
4. Frontend stores tokens in localStorage
5. Frontend redirects to dashboard

### 2. GraphQL Requests

1. ApolloClient intercepts request
2. Retrieves access token from localStorage (refreshes if expired)
3. Sends token in `Authorization: Bearer <token>` header
4. API verifies token with auth service
5. API fetches user roles from Neo4j
6. API constructs context with user data and roles
7. Resolvers use context for authorization

### 3. Token Refresh

- Access tokens expire in 30 minutes
- Refresh tokens expire in 7 days
- Frontend automatically refreshes tokens before expiration
- If refresh fails, user is logged out

## User Management

### Creating New Users

Users are no longer created via Auth0. Instead:

1. **Admin creates member in database** (existing flow)
2. **Admin triggers "Make Servant" mutation** (existing flow)
3. **Email sent to user** with link to login page
4. **User logs in** using credentials from auth service

### Password Setup

For migrated users or new users without passwords:

1. Auth service provides setup token
2. Email sent with setup link
3. User clicks link, sets password
4. User can then log in normally

### Role Management

Roles are now stored only in Neo4j database:

- `Member.roles` property contains array of role strings
- API fetches roles on each request
- No more Auth0 role synchronization needed

## Migration Notes

### Data Migration

If you have existing Auth0 users, you'll need to:

1. **Export user emails from Auth0**
2. **Generate setup tokens** for each user via auth service
3. **Send setup emails** to all users
4. **Users set their passwords** using setup links

### Role Migration

Existing roles in Neo4j database are already used, so no migration needed. The system will:

1. Read roles from `Member.roles` property
2. Use these roles for authorization (same as before)

### Testing Checklist

- [ ] Users can log in with credentials
- [ ] GraphQL requests include valid JWT tokens
- [ ] Roles are correctly fetched from Neo4j
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Token refresh works automatically
- [ ] Logout clears all auth data
- [ ] Make/Remove Servant emails are sent correctly
- [ ] No references to Auth0 remain in code

## Troubleshooting

### "No access token available" Error

- Check that `NEXT_PUBLIC_AUTH_API_URL` is set correctly
- Verify user is logged in (check localStorage for tokens)
- Try logging out and back in

### "Token verification failed" Error

- Check that `AUTH_API_URL` is set in Secrets Manager
- Verify auth service is running and accessible
- Check network logs for auth service requests

### Roles Not Working

- Verify `Member.roles` exists in Neo4j database
- Check GraphQL context includes roles
- Review server logs for role-fetching errors

## Rollback Plan

If you need to rollback to Auth0:

1. Restore Auth0 environment variables
2. Run `npm install @auth0/auth0-react` in web-react-ts
3. Run `npm install jwt-decode` in api
4. Revert changes to:
   - `web-react-ts/src/app/providers.tsx`
   - `web-react-ts/src/lib/ApolloWrapper.tsx`
   - `api/src/index.js`
   - `api/src/resolvers/directory/make-remove-servants.ts`
5. Remove custom auth files:
   - `web-react-ts/src/contexts/AuthContext.tsx`
   - `web-react-ts/src/lib/auth-service.ts`
   - `api/src/resolvers/custom-auth.ts`

## Support

For issues with:

- **Auth service**: Contact auth service maintainer
- **Frontend auth**: Check `web-react-ts/src/contexts/AuthContext.tsx`
- **Backend auth**: Check `api/src/resolvers/custom-auth.ts`
- **Role permissions**: Check Neo4j database `Member.roles` property
