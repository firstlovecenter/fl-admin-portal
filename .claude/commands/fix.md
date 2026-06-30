---
description: Diagnose and fix a bug end-to-end. Blocks at any phase if information is missing.
---

You are running the `/fix` workflow on the FL Admin Portal. Walk through the
phases in order. Do not skip a phase, do not collapse two phases. If a phase
cannot be completed because of missing information, **stop and ask** — do not
guess.

The user-supplied bug description follows after this preamble. Treat anything
beyond the description as supplementary context.

---

## Phase 1 — Understand the issue

**Always retrieve Jira attachments first.** If the bug is tied to a SYN issue
(named in the prompt, the branch, or the conversation), fetch the ticket and
download **every** attachment before reasoning about the bug — screenshots
routinely contain the exact error message, stack frame, or affected church
that the text description omits. Do not rely on attachment metadata alone:
the Atlassian MCP returns only filename/size/URL, and `WebFetch` will not
render an image. Use the download-and-`Read` recipe in the global
`~/.claude/CLAUDE.md` ("Viewing Jira attachments"): `curl` the bytes into
`/tmp/jira/<KEY>/` with the Keychain API token, then `Read` each downloaded
image/PDF so you actually see it. If a ticket has no attachments, note that
and move on. Treat attachment contents as potential client PII — they stay in
`/tmp`, never commit them or paste links into tickets.

Restate the bug in your own words. Capture, explicitly:

- **Expected behaviour** — what should happen.
- **Actual behaviour** — what happens instead. Include exact error messages /
  stack frames if provided.
- **Reproduction steps** — the user actions that trigger the bug. If steps are
  not given, ask for them. Do not start reading code without a repro path.
- **Environment** — frontend, backend, lambda, or background script? Which
  package (`web-react-ts`, `api`)? Which role does the affected user hold? Which
  church level / record? Local, dev, or prod?
- **Scope** — single user, all users at a level, or system-wide?

If the bug touches money, arrivals payment, banking, or servant assignment,
re-read `kb/04-state-machines.md` and `kb/06-adr.md` (ADR-005, ADR-006) before
moving on.

**Block here** if any of: repro steps missing, expected behaviour unclear,
environment unknown.

## Phase 2 — Root cause analysis

- Locate the failing code path. Start from the user-visible surface (the page,
  the mutation name, the lambda handler) and trace inward.
- Read the entire call chain. Do not stop at the first suspicious line.
- For frontend bugs: check the component → hooks/contexts → Apollo query →
  network. For backend bugs: check the resolver → Cypher → Neo4j data shape.
- For permission bugs: re-check both `web-react-ts/src/permission-utils.ts` and
  `api/src/resolvers/permissions.ts` (ADR-001 — they can drift).
- For state-machine bugs: confirm the transition is allowed
  (`kb/04-state-machines.md`).
- Identify **why** the bug occurs, not just **where**. State the root cause in
  one sentence.

If the root cause is a workaround for an underlying issue (e.g. a defensive
check papers over a real data integrity bug), say so explicitly.

## Phase 3 — Impact assessment

Before proposing a fix, list:

- What other components / resolvers / lambdas read or write the same field /
  state machine?
- What aggregates, reports, or background jobs depend on the affected data?
  (`service-graph-aggregator`, `bacenta-graph-aggregator`,
  `services-not-banked`, `accra-campus-weekly`, `outside-accra-weekly`,
  `den-office-monthly-report`)
- Which roles' UI surfaces will change (visible / functional)?
- Is there an audit-trail concern (`HistoryLog`, banking confirmation)?

If the bug has been live for a while, flag potential bad data left behind and
whether a backfill / repair script is needed (do not write it yet).

## Phase 4 — Fix design

Propose the **minimal correct fix**. State:

- The change in plain English.
- The files that will be touched (path + function).
- Whether it's a single change or requires mirroring (e.g. permission helpers
  in both packages — ADR-001).
- Why this is the right fix vs. workaround alternatives.

If the fix changes a state-machine transition, schema, or permission rule, **wait
for user approval** before implementing. Otherwise proceed.

## Phase 5 — Implementation

- Follow existing patterns in the touched file (see `kb/01-…` in the relevant
  package and `kb/05-data-entities.md` for shapes).
- Use absolute imports from `src/` (frontend) per ADR-009.
- Resolver changes: keep the standard shape (auth check first, session in
  try/finally, parameterised Cypher) — see
  `api/kb/03-resolver-patterns.md`.
- Frontend changes: reuse design-system components from
  `web-react-ts/kb/02-design-system.md`. No new styling system.
- No new dependencies without an ADR.
- No new comments unless the *why* is non-obvious. Don't narrate the fix in code
  comments — that belongs in the commit message.

## Phase 6 — Verification

Run, in order:

1. **Type-check the affected package:**
   - Frontend: `cd web-react-ts && npx tsc -p tsconfig.json --noEmit`
   - Backend: `cd api && cd src/resolvers && npx tsc -p tsconfig.json --noEmit`
2. **Lint the affected files** (don't run repo-wide; takes too long):
   - `npx eslint <changed files> --max-warnings=0`
3. **No test suite exists** (ADR-010). Do not invent one for this fix unless
   the user has asked. Instead:
   - Describe the manual test steps the user should perform (the repro path
     from Phase 1, plus any adjacent flow surfaced in Phase 3).
   - For backend changes, give the GraphQL mutation / query the user should run
     in Apollo Sandbox (`http://localhost:4001/graphql`) with a Bearer token.
4. **Regressions**: list the adjacent flows from Phase 3 and confirm whether
   they are still expected to behave the same.

## Output

End with:

- ✅ A bullet list of files changed.
- ✅ The manual verification checklist.
- ⚠️ Anything left unverified or any data backfill the user still needs to do.
- 🚫 Any place you blocked and what the user needs to provide to unblock.

Do not claim "tests pass" — there are none.
