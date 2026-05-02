---
description: Implement a feature end-to-end. Blocks if requirements are unclear.
---

You are running the `/implement` workflow on the FL Admin Portal. Walk through
the phases in order. Do not skip a phase. If anything is missing, **stop and
ask**.

The user-supplied feature description follows. It may be a ticket, a paragraph,
or a one-liner — treat it accordingly.

---

## Phase 1 — Requirements

Parse the request and write down:

- **Goal** — what business outcome the feature serves.
- **Actor** — which role(s) will use the feature (`leaderBacenta`,
  `arrivalsAdminCouncil`, `tellerStream`, etc.). Cross-reference
  `kb/02-user-roles.md`.
- **Trigger** — where the user enters the flow (page, button, mutation,
  background job, webhook).
- **Inputs** — every field the user / caller provides, with types and
  validation rules.
- **Outputs** — what the user sees, what is written, what events fire.
- **Constraints** — pre-conditions, state-machine entries (see
  `kb/04-state-machines.md`), permission gate (see `kb/02-user-roles.md`).

**Block here** if any of:
- Actor / role gate is not clear.
- Inputs not enumerated.
- The feature touches money / banking / arrivals payment and the validation
  rules are vague.
- The feature requires a new state-machine transition that is not in
  `kb/04-state-machines.md`.

Do not begin design work to "fill in the gaps" — ask first.

## Phase 2 — Codebase analysis

Before designing, read what already exists:

- Search for similar features. The codebase has a lot of near-duplicates;
  reuse them rather than copy-pasting.
- Check `web-react-ts/kb/02-design-system.md` for any UI component you might
  re-implement.
- Check `api/kb/03-resolver-patterns.md` to see whether your resolver matches
  one of the standard shapes (P1–P8).
- For directory CRUD, confirm whether `servant-config.ts` already covers the
  servant assignment you need (ADR-006). If yes — your work is one config line
  plus UI.
- For routes, follow ADR-004: lazy-loaded entries in the section's
  `*Routes.ts`. Check `web-react-ts/kb/03-routing-and-permissions.md`.
- For shared types, check `@jaedag/admin-portal-types` and
  `@jaedag/admin-portal-api-core` (ADR-011) before declaring a new type.

State your findings: "I will reuse X, Y, Z. I will need to add A, B."

## Phase 3 — Impact assessment

List:

- Schema changes (new SDL types / fields / relationships) and whether they
  require a Neo4j data migration.
- Aggregations affected — does the new field need to be rolled up by
  `service-graph-aggregator` / `bacenta-graph-aggregator`? (ADR-008 —
  idempotency required.)
- Permission helper changes — must mirror to both packages (ADR-001).
- Background job effects — defaulter calculations, weekly reports, code-of-the-
  day, payment webhook.
- Cache implications — does any existing query need `refetchQueries` or a cache
  update?
- Lambda packaging — does `lambda-package/` need a new entry?
- Mobile / offline considerations — none currently in scope (web only), but
  flag if the design assumes online.

## Phase 4 — Design

Propose:

- The schema change (SDL diff).
- The Cypher (for new custom resolvers).
- The resolver function signature(s) and which permission helper gates them.
- The frontend page / component tree, reusing items from
  `web-react-ts/kb/02-design-system.md`.
- The route entry (path, roles helper, lazy import).
- Any `*Queries.ts` / `*GQL.ts` additions.
- Form validation (Yup schema).
- Error / loading / empty states.

**Wait for user approval** of the design before writing any code, unless the
feature is trivial (single new page, no schema change, no permission change).

## Phase 5 — Implementation

Implement in this order so you can validate as you go:

1. **Schema + resolver** (backend) — add SDL, Cypher string, resolver, register
   in `resolvers.ts`. Restart `npm run start:dev`. Test the mutation in Apollo
   Sandbox.
2. **GraphQL queries** in the frontend `*Queries.ts` file. Run `tsc --noEmit`.
3. **Frontend service / utilities** — pure helpers, types.
4. **Component / page** — reuse design-system components. Keep components
   under ~400 lines.
5. **Route entry + role gate** — `*Routes.ts` and any `Navigation` link.
6. **Mock data / seed**, only if the feature requires it for development; do
   not invent fixtures the rest of the codebase doesn't use.

Conventions:
- Absolute imports (ADR-009).
- Bootstrap + CSS variables only (ADR-003).
- No `any` in new TypeScript.
- Resolver shape: auth-first (`isAuth(...)` is line 1), session in try/finally,
  parameterised Cypher (ADR-012).
- Mirror permission helper changes to both packages (ADR-001).
- For monetary / banking changes, follow ADR-005 (server validation,
  idempotency).

## Phase 6 — Verification

1. `cd api && cd src/resolvers && npx tsc -p tsconfig.json --noEmit`
2. `cd web-react-ts && npx tsc -p tsconfig.json --noEmit`
3. `npx eslint <changed files> --max-warnings=0`
4. **Manual smoke test** (ADR-010 — no automated tests):
   - Run `cd api && npm run start:dev` and `cd web-react-ts && npm start`.
   - Walk through the actor's flow in the browser as the right role.
   - Check the GraphQL mutation actually fires (network tab or
     `/graphql` sandbox).
   - Verify any aggregates / dashboards that should reflect the change do.
5. Document the manual checklist for the user, including any unhappy-path
   cases (wrong role, invalid input, repeat submission).

## Output

End with:

- ✅ Files added / modified.
- ✅ Manual test checklist.
- ⚠️ Any deferred / out-of-scope work, with suggested follow-up.
- 🚫 Any place you blocked.

Do not claim "tests pass" — they don't exist.
