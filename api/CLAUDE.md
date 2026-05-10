# CLAUDE.md — `api/`

Backend package of the FL Admin Portal. Read the root `CLAUDE.md` first; this
file scopes to backend conventions only.

## What this package is

Node + Apollo Server 4 + `@neo4j/graphql` v7 GraphQL API on top of Neo4j 5.
Babel-compiled JS with TS files mixed in via `@babel/preset-typescript`.
Custom resolvers under `src/resolvers/`; SDL under `src/schema/`. Background
Lambdas under `src/functions/background/` (also CLI-runnable from
`src/scripts/`).

## Stack reminders (full table in root CLAUDE.md)

- Apollo Server 4 + Express, port 4001.
- `@neo4j/graphql` v7 generates Cypher from 16 `.graphql` SDL files. v7 changed
  the auto-generated input shapes — see `kb/02-graphql-and-cypher.md` "v7 input
  cheat-sheet" for the v6 → v7 rules every FE query and mutation must follow.
- Neo4j 5 driver (`neo4j-driver` 5.28).
- AWS SDK v3 (S3, Secrets Manager, Lambda) + `serverless-http`.
- `firebase-admin`, `googleapis`, `axios`, `csv-parse`, Cloudinary.
- Auth: JWT (`jwt-decode`) — `JWT_SECRET` from `loadSecrets()`.
- `serverless-http` for Lambda packaging; `@as-integrations/aws-lambda` for
  Apollo handler.

## Knowledge base for this package

| File | Contents |
| --- | --- |
| `kb/01-backend-conventions.md` | Folder layout, resolver shape, SDL rules, sessions, what not to do |
| `kb/02-graphql-and-cypher.md` | Adding fields / relationships / `@cypher` / mutations; Cypher style |
| `kb/03-resolver-patterns.md` | P1–P8 reusable resolver patterns; anti-patterns |

Cross-package KB lives in `../kb/`.

## Mandatory rules (backend-specific)

- **`isAuth(permitX('Level'), context.jwt.roles)` is the first line** of every
  custom resolver function body. No exceptions.
- **Trust only `context.jwt.roles`** — never `args.roles`, never anything
  client-supplied.
- **Cypher uses `$param` bindings.** No string interpolation (ADR-012).
- **Permission helpers** in `src/resolvers/permissions.ts` MUST stay in sync
  with `../web-react-ts/src/permission-utils.ts` (ADR-001).
- **Sessions** — open per call (`context.executionContext.session()`), close
  in `finally`. No shared sessions across `await`s. Use `executeRead` for
  reads, `executeWrite` for writes.
- **Servant make/remove** — add **one line** to
  `src/resolvers/directory/servant-config.ts` (ADR-006). Do not write
  hand-rolled `MakeXLeader` resolvers.
- **Errors** — wrap with `throwToSentry('Friendly message', error)`. Never
  throw raw Neo4j errors to the client.
- **Money** — server-side validation (positive, finite, idempotent). ADR-005,
  SM1, SM2.
- **Aggregation** — must be idempotent (ADR-008). `MERGE` + `SET`, not
  `CREATE` + `+=`.
- **Secrets** — via `loadSecrets()`. Never `process.env.JWT_SECRET` directly.
- **Logging** — `console.log` allowed (Sentry not wired). Don't log full JWTs,
  momo numbers, or PII.

## Key files

| File | Purpose |
| --- | --- |
| `src/index.js` | Express + Apollo bootstrap, Neo4j driver init, JWT decode |
| `src/schema/graphql-schema.js` | Concatenates the 16 `.graphql` SDL files |
| `src/schema/*.graphql` | SDL — type definitions, `@cypher` blocks, `@authorization` |
| `src/resolvers/resolvers.ts` | Root resolver — aggregates per-domain mutations |
| `src/resolvers/permissions.ts` | Server-side role helpers (mirror to FE) |
| `src/resolvers/secrets.ts` | AWS Secrets Manager loader |
| `src/resolvers/utils/utils.ts` | `isAuth`, `throwToSentry`, `rearrangeCypherObject` |
| `src/resolvers/directory/servant-config.ts` | Source of truth for every servant mutation |
| `src/resolvers/directory/servant-resolver-factory.ts` | Generates servant resolvers from config |
| `src/resolvers/banking/banking-resolver.ts` + `banking-cypher.ts` | Banking flow + state machine |
| `src/functions/background/<job>/` | Scheduled Lambdas |
| `src/scripts/run-<job>.js` | CLI runners for the same Lambdas |

## Local dev

```
# from api/
npm install
npm run start:dev      # nodemon on src/, port 4001
```

Visit `http://localhost:4001/graphql` for Apollo Sandbox. Add `Authorization:
Bearer <token>` from the running FE app's `sessionStorage.token`.

## Verification

- `cd src/resolvers && npx tsc -p tsconfig.json --noEmit`
- `npx eslint <files> --max-warnings=0`
- `npm test` (Jest — full suite) or `npm test -- <pattern>` for the
  touched file. Tests are written as code is refactored or extended,
  per **ADR-013**. Refactors require tests on the target before they
  begin (use `/refactor`). The Jest stack uses `babel-jest` and reuses
  the existing `babel.config.js` — same transformer as the production
  build.
- `npm run test:integration` is gated and runs only when explicitly
  invoked. Integration tests target the dev Neo4j instance via the
  `neo4j` MCP server. **Never** target production data.
- Run the new mutation in Apollo Sandbox; check Cypher in server console
  (`features.config.debug = true`).
- Verify in Neo4j Browser (`http://localhost:7474`) that data wrote correctly.
- Don't claim "tests pass" without running them — quote the runner output.
