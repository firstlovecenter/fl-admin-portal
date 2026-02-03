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

## Universal Developer Guidelines

All code in this project must follow these core principles for **readability, testability, predictability, and evolvability**:

### 1. Single Source of Truth
- **Every piece of logic or data must have one authoritative place**
- Never duplicate business rules across frontend and backend
- If logic exists in two places, at least one is wrong

### 2. Deterministic Code Only
- Code must behave the same way given the same inputs
- No hidden globals, no implicit state
- Explicit inputs → explicit outputs → clear naming

### 3. File & Module Size Discipline
- **Max 400 lines per file** (target < 300 lines)
- Split by responsibility: one component/service/concept per file
- Large files hide bugs; small files reveal intent

### 4. Layered Architecture
Code must clearly separate:
- **Interfaces** (HTTP handlers, CLI, UI components)
- **Application Logic** (use cases, workflows, orchestration)
- **Domain Logic** (rules, models, decisions)
- **Infrastructure** (databases, APIs, external services)

Business logic never depends on infrastructure; infrastructure is replaceable.

### 5. Explicit Data Flow
- Trace where values come from, who transformed them, where they're stored
- No magic mutations, no hidden transformations
- Data must flow forward predictably

### 6. Error Handling as First-Class Design
- Errors are outputs, not afterthoughts
- Every function either returns valid results or clearly defined errors
- No silent failures; no swallowed exceptions

### 7. Naming as Contract
- Names explain intent, not implementation
- Good names answer: What is this? Why does it exist? When should it be used?
- If naming is hard, the abstraction is wrong

### 8. Testability is Mandatory
- Every important unit must be testable in isolation
- Pure functions where possible; dependency injection always
- No hard-coded globals

### 9. Replaceability Over Optimization
- Design assuming every dependency will be replaced one day
- Abstractions enable replacement, not complexity
- Performance and cleverness come last

### 10. No Hidden Framework Magic
- Frameworks are tools, not architects
- Every non-obvious behavior must be explicit, commented, and testable
- Avoid relying on undocumented behavior

### 11. Comments Explain Why, Not What
- Code explains what; comments explain why
- Good comment: `// Retry count capped to prevent infinite loops`
- Bad comment: `// increment i`

### 12. Red Flags (Stop & Refactor)
Stop if you see:
- "We'll clean this later" / "Just this once"
- Files > 400 lines
- Logic copied across layers
- Functions with unclear inputs/outputs
- Silent errors

These always become production problems.

### 13. Definition of Done
A task is done only if:
- Code is readable without explanation
- Logic exists in one place
- Files are appropriately sized
- Errors are handled explicitly
- Tests exist (or are trivial to add)
- Dependencies are replaceable

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
onfirmingApply is not defined
app/notes/review/page.tsx (804:23) @ SuggestionsModal


  802 |           <Button
  803 |             onClick={onApply}
> 804 |             disabled={confirmingApply}
      |                       ^
  805 |             className="gap-2"
  806 |           >
  807 |             {confirmingApply && (
Call Stack
14

Show 12 ignore-listed frame(s)
SuggestionsModal
app/notes/review/page.tsx (804:23)
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
- **Deploy branches**: Uses `main` as default; production and preview contexts have separate secret injection

## Testing & Validation

- **ESLint**: Configured with prettier, no relative imports; run `npm run format` to auto-fix
- **Commit Hooks**: Commitlint enforces conventional commits via Husky
- **TypeScript**: Used in resolvers, React frontend; check `tsconfig.json` in each service

## When Debugging Queries

Always ask: Does this data relationship exist in every record? If not → **use OPTIONAL MATCH**.
