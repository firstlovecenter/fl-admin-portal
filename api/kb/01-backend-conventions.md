# Backend conventions — `api/`

Rules that apply only to the GraphQL/Neo4j API. Cross-package rules are in the
root `kb/`.

## Project shape

- Apollo Server 4 (`@apollo/server`) + Express + `expressMiddleware`.
- `@neo4j/graphql` v7 generates Cypher from the SDL and exposes a runnable
  schema. v7 input shapes (scalar `where`, flat pagination, list-form sort)
  differ from v6 — see `kb/02-graphql-and-cypher.md` for the cheat-sheet.
- Neo4j 5 driver (`neo4j-driver`).
- Babel-compiled JS with TypeScript files mixed in
  (`@babel/preset-typescript`). `prebuild` step runs `tsc` over
  `src/resolvers/`.
- Local dev: `npm run start:dev` (nodemon on `src/`, port 4001).
- Lambdas: `api/src/functions/` (graphql + background jobs).

## Folder layout

```
api/src/
├── index.js                          # Express + Apollo bootstrap
├── schema/                           # 16 .graphql SDL files
│   ├── graphql-schema.js             # concatenates them
│   ├── schema.graphql                # core types
│   ├── directory*.graphql, services*.graphql, banking*.graphql,
│   │   arrivals*.graphql, accounts.graphql, maps.graphql, etc.
├── resolvers/
│   ├── resolvers.ts                  # root (aggregates all domains)
│   ├── permissions.ts                # parallel to FE permission-utils.ts
│   ├── secrets.ts                    # AWS Secrets Manager loader
│   ├── authenticate.ts
│   ├── tsconfig.json                 # TS just for resolvers
│   ├── utils/                        # isAuth, neo4j-types, throwToSentry, ...
│   ├── accounts/                     # *-cypher.ts + *-resolvers.ts pairs
│   ├── anagkazo/
│   ├── arrivals/
│   ├── banking/
│   ├── directory/                    # also: servant-resolver-factory, servant-config
│   ├── download-credits/
│   ├── maps/
│   ├── no-income/
│   ├── services/
│   └── uploads/
├── functions/
│   ├── graphql/                      # Lambda GraphQL handler
│   └── background/                   # 9 scheduled jobs (also CLI-runnable)
├── scripts/                          # CLI runners for the background jobs
└── db/
```

## Domain-folder convention

Each resolver domain has the pair:

- `<domain>-cypher.ts` — exported Cypher query strings (named exports).
- `<domain>-resolvers.ts` — Apollo resolver functions that import the strings,
  open a Neo4j session, and run them.
- Optional `<domain>-types.ts` for local TS types.

Add a new domain folder rather than dumping into an existing one if the surface
area is meaningful.

## Resolver function shape

```ts
const myMutation = {
  MyMutationName: async (
    object: any,
    args: { /* declare every arg */ },
    context: Context
  ) => {
    isAuth(permitX('Level'), context.jwt.roles)

    const session = context.executionContext.session()
    try {
      const result = await session.executeWrite((tx) =>
        tx.run(myCypherString, { ...args, jwt: context.jwt })
      )
      return rearrangeCypherObject(result)
    } catch (error) {
      return throwToSentry('Friendly message', error)
    } finally {
      await session.close()
    }
  },
}
```

Rules:
- **First line of the body** is the `isAuth(...)` call. Always.
- Always close the session in a `finally`.
- Use `executeRead` for read-only Cypher, `executeWrite` for mutations.
- Always pass values as `$params`, never interpolate into the Cypher (ADR-012).
- Let `throwToSentry` produce errors with a friendly user message; never throw
  raw Neo4j errors to the client.
- Mutations that change financial state must follow ADR-005 (server validation,
  idempotency).

## Schema (SDL) conventions

- One `.graphql` file per domain. Add the file to `graphql-schema.js` if you
  create a new one.
- Use `@neo4j/graphql` directives (`@relationship`, `@cypher`, `@authorization`,
  `@populatedBy`, etc.) where possible — they generate efficient Cypher for free.
- Custom `@cypher` blocks should: declare `columnName`, return shapes that match
  the SDL field, and use named parameters (`$jwt`, `$id`).
- Inline Cypher literals in SDL must be exact-spelled strings; typos fail at
  schema-build time and crash boot.

## Auth in the schema

`Neo4jGraphQL` is configured with
`features: { authorization: { key: SECRETS.JWT_SECRET } }`. SDL-side `@authorization`
directives can express role / filter conditions and are preferred for read paths.
For write paths, custom resolvers must call `isAuth` themselves — the directive
does not wrap them.

`context.jwt` is the decoded token (or `{}` if no/invalid auth header). The
`context.jwt.roles` array is the trustworthy source of role information.

## Sessions and Cypher patterns

- `context.executionContext.session()` — open a fresh session per request /
  per parallel branch. Don't share sessions between awaits.
- `executeRead((tx) => tx.run(...))` for reads.
- `executeWrite((tx) => tx.run(...))` for writes.
- Use `Promise.all([...])` with separate sessions when you need parallel queries
  (see `checkIfLastServiceBanked` in banking-resolver).
- `rearrangeCypherObject(response)` flattens a single-record result; pass
  `horizontal: true` for an array result.

## Background Lambdas

`api/src/functions/background/<job>/` typically contains:

- `index.js` (or `.ts`) — the Lambda handler.
- A small README or comment block describing trigger and schedule.
- A matching CLI runner under `api/src/scripts/run-<job>.js`.

Idempotency is required (ADR-008).

## Logging

- `console.log` / `console.error` is allowed — `no-console` is off in the API
  ESLint config.
- Sentry is **not** wired (`utils.ts` notes "Sentry integration removed - error
  logged to console only"). Log enough to debug from CloudWatch / local stdout.

## What not to do

- Do not add a new ORM / query builder. `neo4j-driver` + raw Cypher is the
  pattern.
- Do not write hand-rolled `MakeXLeader` / `RemoveXLeader` resolvers; use
  `servant-config.ts` (ADR-006).
- Do not import resolvers into other resolvers; export shared logic from
  `utils/` or domain `helper-functions.ts` files.
- Do not bypass `isAuth` even for "read-only" mutations — they're still
  mutations.
- Do not duplicate types that already live in `api/src/resolvers/utils/types.ts`
  or `web-react-ts/src/global-types.ts` (FE counterpart for shared shapes).
