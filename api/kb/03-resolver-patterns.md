# Resolver patterns — `api/`

Reusable shapes for the kinds of resolvers that come up over and over. Use the
right pattern; don't invent new ones for problems already solved here.

## P1 — Plain mutation with auth

The standard shape — see `services/service-resolvers.ts` and most domain
mutations.

```ts
RecordX: async (object: any, args: RecordXArgs, context: Context) => {
  isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)

  const session = context.executionContext.session()
  try {
    const result = await session.executeWrite((tx) =>
      tx.run(recordXCypher, { ...args, jwt: context.jwt })
    )
    return rearrangeCypherObject(result)
  } catch (error) {
    return throwToSentry('Failed to record X', error)
  } finally {
    await session.close()
  }
}
```

## P2 — Multi-step mutation with pre-conditions

When a write needs a check + a write (e.g. "must have banked last service before
this banking"). See `BankServiceOffering` and `checkIfLastServiceBanked`.

```ts
SomeMutation: async (object, args, context: Context) => {
  isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)

  // Pre-condition: throws on failure
  await checkSomething(args.id, context)

  const session = context.executionContext.session()
  try {
    const result = await session.executeWrite((tx) =>
      tx.run(writeCypher, args)
    )
    return rearrangeCypherObject(result)
  } finally {
    await session.close()
  }
}
```

Pull pre-condition checks into helper functions exported from the domain folder
(e.g. `checkIfLastServiceBanked`) so they can be reused and tested independently.

## P3 — Servant make/remove (DO NOT hand-write)

Add a single line to `directory/servant-config.ts`:

```ts
{
  name: 'MakeXLeader',
  churchType: 'X',
  servantType: 'Leader',
  requiredPermissionLevel: 'Y',
  action: 'make',
}
```

The factory in `directory/servant-resolver-factory.ts` generates the resolver.
See `directory/REFACTORING_MASTERCLASS.md` for the philosophy.

## P4 — Field resolver augmenting `@neo4j/graphql`

When you need to compute a field whose value isn't in the SDL or needs custom
fetching, add it to the type-level resolver in `resolvers.ts`:

```ts
const resolvers = {
  ...
  Member: {
    fullName: (source: Member) => `${source.firstName} ${source.lastName}`,
    nameWithTitle: async (source, args, context: Context) => {
      // Custom Cypher to fetch related title + gender, return formatted name
    },
  },
  Stream: {
    meetingDay: loadStreamMeetingDay,
    campus: loadStreamCampus,
    ...
  },
}
```

Rules:
- The function receives `(source, args, context)` — `source` is the parent
  object's already-resolved fields.
- Open a fresh session per call. The Apollo / `@neo4j/graphql` execution model
  may invoke this hundreds of times in one query (DataLoader-style batching is
  not in place); keep the Cypher cheap.
- If the parent already has the field populated (e.g. `source.meetingDay`),
  return it directly without a query.

## P5 — Helper that other resolvers reuse

Domain helpers go in `<domain>/helper-functions.ts` or a similar named file
(e.g. `directory/utils.ts`). Keep them pure and `Context`-aware. Don't import
one resolver from another.

## P6 — Webhook handler (external trigger)

`api/src/functions/background/payment-webhook/` is the model. Webhook handlers:

1. Verify the source signature (Paystack signature check, etc.) before reading
   the body.
2. Load secrets from `loadSecrets()`.
3. Look up the matching record by `transactionReference` (the idempotency key).
4. Apply the state transition idempotently — if the record is already in the
   target state, succeed without re-applying.
5. Append a `HistoryLog` entry.
6. Return 200 quickly; long work goes to a separate Lambda or queue.

## P7 — Background job (scheduled)

Pattern under `api/src/functions/background/<job>/`:

- A `handler` exported as the Lambda entrypoint.
- A matching CLI runner under `api/src/scripts/run-<job>.js` so a developer can
  run it locally with `node api/src/scripts/run-<job>.js`.
- Idempotency: re-running for the same input must not double-write (ADR-008).
- Structured logging so CloudWatch is debuggable.
- Secrets via `loadSecrets()` — don't read `process.env` directly.

## P8 — File / image upload

`uploads/upload-resolvers.ts` mediates uploads to S3 / Cloudinary. The pattern
returns a presigned URL or a Cloudinary signature; the client uploads directly
and then sends the resulting URL back via a separate mutation. Don't proxy
binary data through the GraphQL endpoint.

## Anti-patterns

- ❌ Creating a session before the auth check. Fail before opening resources.
- ❌ Sharing one session across multiple parallel `tx.run` calls.
- ❌ Returning Neo4j Integer objects directly to GraphQL `Int` fields without
   `parseNeoNumber`. (`@neo4j/graphql` handles this for auto-generated
   resolvers; custom code does not.)
- ❌ Throwing the raw Neo4j error to the client. Use `throwToSentry(message,
   error)` so the user sees a friendly message.
- ❌ Reading `process.env.JWT_SECRET` directly. Use `loadSecrets()` so secrets
   come from AWS Secrets Manager in deployed envs and `.env` locally.
- ❌ String-interpolating user input into Cypher. Always `$param`.
- ❌ Removing `tellerConfirmationTime` to "let the user re-bank". The audit
   trail must stay.
