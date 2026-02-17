# Copilot Instructions for First Love Church Admin Portal

## Architecture Overview

This is a **GRANDstack** monorepo (GraphQL, React, Apollo, Neo4j Database) managing a church administrative system with member directory, attendance/income records, campaigns, and geographic services.

### Key Components

- **`api/`** - Apollo GraphQL server with Neo4j driver, resolvers, and serverless background functions
- **`web-react-ts/`** - React TypeScript frontend (Vite, Apollo Client)
- **`lambda-package/`** - Compiled GraphQL schema for Netlify Functions
- **`mcp-server/`** - Model Context Protocol server for external integrations

### Data Flow

1. **Frontend** → GraphQL mutations via Apollo Client in React components (`web-react-ts/src/queries/`)
2. **GraphQL API** → Neo4j resolvers handle authentication, permissions, database queries
3. **Background Jobs** → Scheduled Netlify Functions aggregate data (e.g., `outside-accra-weekly/`)
4. **Database** → Neo4j relationships model church hierarchy (Oversight→Campus→Stream→Council)

## Monorepo Structure & Workflows

### Local Development

```bash
npm run dev          # Starts concurrent API (port 4000) + React (port 3000) via doppler secrets
npm run build        # Builds api/ and web-react-ts/ for production
npm run start        # Alias for npm run dev
```

### Production Deployment

- **React**: Deployed to `web-react-ts/dist` on Netlify
- **GraphQL API**: Deployed as Netlify Functions in `api/build/functions/graphql/`
- **Schema**: Auto-copied to functions during build (`cp -r api/build/schema api/build/functions/graphql/`)
- **Secrets**: Encrypted via Doppler; injected during deploy-preview and production builds

### Monorepo Scripts

All npm scripts run from root; see `scripts/README.md`. Key ones:

- `release:{major|minor|patch}` - Builds, bumps version, deploys both services
- `encrypt-secrets` / `inject-secrets` - Doppler CLI wrappers for secret management

## GraphQL & Database Patterns

### Schema Organization

- **`api/src/schema/`** - GraphQL type definitions split by domain (e.g., `directory.graphql`, `services.graphql`)
- **`combined-schema.gql`** - Auto-generated merged schema; don't edit directly
- **`api/src/resolvers/`** - Custom resolvers (auth, permissions, account-specific logic)

### Resolver Pattern

- **`authenticate.ts`** - JWT decoding and token validation
- **`permissions.ts`** - Authorization logic checking user roles/context
- **`resolvers.ts`** - Custom resolvers mapping GraphQL fields to Neo4j queries

### Neo4j Hierarchy (Critical Pattern)

```
Oversight → Campus → Stream → Council (weekday fellowships)
                   ↓
              ServiceRecord (attendance/income per service)
```

**Important**: Queries must account for **optional relationships**. Example: `Akropong PWCE Campus` has no Council children, so weekday queries use `OPTIONAL MATCH (stream)-[:HAS]->(council:Council)` not `MATCH ... -[:HAS]->(council)`.

### Cypher in Background Functions

- Queries live in `api/src/functions/background/*/cypher.js` (e.g., `outside-accra-weekly/cypher.js`)
- Use `OPTIONAL MATCH` for relationships that may not exist (councils, service records)
- Always use `date($paramName).year` and `.week` filters for weekly/monthly aggregations
- Export as CommonJS (`module.exports`) for Lambda compatibility

## Frontend Patterns

### Context & State

- **`MemberContext`, `ServiceContext`, `ChurchContext`** - Global state in `web-react-ts/src/contexts/`
- **Apollo Client** - Caches GraphQL queries; see `web-react-ts/src/queries/` for all mutation/query definitions
- **`useClickCard` hook** - Custom navigation hook for breadcrumb patterns

### Page Structure

- **Routes**: Defined in `pages/dashboards/dashboardRoutes.ts`, `pages/directory/directoryRoutes.ts`, etc.
- **Protected Routes**: `auth/ProtectedRoute.tsx` wraps pages requiring auth; checks JWT roles
- **Permission Utils**: `permission-utils.ts` evaluates user roles against resource permissions

### Auth Flow

- **Auth0 Integration**: `useAuth0()` hook provides `loginWithRedirect()`, token
- **JWT Decoding**: Roles extracted from `https://flcadmin.netlify.app/roles` claim
- **Role-Based Access**: Church hierarchy determines visible data (member sees own bacenta, leader sees constituency)

## Key Files to Reference

| File                                       | Purpose                                             |
| ------------------------------------------ | --------------------------------------------------- |
| `api/src/index.js`                         | Apollo Server setup, Neo4j driver init, JWT context |
| `api/src/resolvers/resolvers.ts`           | Custom resolver implementations                     |
| `web-react-ts/src/AppWithContext.tsx`      | Main routing, contexts, lazy-loaded dashboards      |
| `api/src/functions/background/*/cypher.js` | Aggregation queries for weekly/monthly reports      |
| `api/src/schema/combined-schema.gql`       | Full merged GraphQL schema (generated)              |
| `scripts/start-dev.js`                     | Dev server startup logic                            |

## Common Workflows

### Adding a New Resolver

1. Define field in schema (e.g., `api/src/schema/services.graphql`)
2. Implement resolver in `api/src/resolvers/resolvers.ts` or domain-specific subdirectory
3. Ensure JWT context extracts required user data in `api/src/index.js` context builder
4. Test via GraphQL Playground at `http://localhost:4000` during dev

### Creating Background Job (Scheduled Function)

1. Create directory under `api/src/functions/background/` (e.g., `my-weekly-job/`)
2. Add `cypher.js` with named queries exported as CommonJS
3. Use `OPTIONAL MATCH` to handle missing relationships gracefully
4. Netlify Functions auto-deploy functions in `api/build/functions/`

### Debugging Database Issues

- Check Neo4j connection: logs show "✅ Neo4j connection verified" on startup
- Use Neo4j Desktop/Browser to inspect relationships directly
- Missing data often due to failed `MATCH` (use `OPTIONAL MATCH` instead)
- Check constraints in `api/src/db/constraints/`

## Conventions & Gotchas

- **File Size Limits**: No file should exceed 500 lines unless absolutely necessary. When approaching this limit, extract logic into separate files or helper modules. Even when necessary, keep the file as minimal as possible.
- **Monorepo dependency isolation**: Root `package.json` has dev tools; each service has own `package.json` and dependencies
- **Schema rebuilds**: Changing resolvers requires stopping/restarting dev server
- **Lambda compatibility**: Use CommonJS exports in background functions; async/await works fine
- **Date handling**: Neo4j temporal filters use `date($param).year`, `.week`, `.month`
- **Secrets**: Doppler manages env vars; `.vscode/mcp.json` ignored (see `.gitignore`)
- **Deploy branches**: Uses `deploy` as default; production and preview contexts have separate secret injection

## Testing & Validation

- **ESLint**: Configured with prettier, no relative imports; run `npm run format` to auto-fix
- **TypeScript**: Used in resolvers, React frontend; check `tsconfig.json` in each service

## When Debugging Queries

Always ask: Does this data relationship exist in every record? If not → **use OPTIONAL MATCH**.
