---
description: Behavior-preserving refactor of a specified target. Enforces the test-first loop from ADR-013 — characterize, refactor, verify, review. Blocks at any phase if information is missing.
---

You are running the `/refactor` workflow on the FL Admin Portal. Walk through
the phases in order. Do not skip a phase, do not collapse two phases. If a
phase cannot be completed because of missing information, **stop and ask** —
do not guess.

This command exists to enforce **ADR-013 §3** — the test-first refactor loop.
You orchestrate two agents (`test-author`, `refactor`) and one reviewer
(`code-reviewer`, plus `cypher-reviewer` / `security-reviewer` when their
triggers fire). You do not write or edit production code yourself in this
command — you delegate to the agents and report the results.

The user-supplied refactor target follows after this preamble. Treat anything
beyond the target as supplementary context.

---

## Phase 1 — Frame the refactor

Restate the change in your own words. Capture, explicitly:

- **Target** — file path or symbol, concrete. If the user said "clean up the
  arrivals page", **block** and ask them to pick a single file or symbol.
- **Move** — which of the allowed moves from the `refactor` agent's
  contract: rename, extract, inline, dedupe, replace conditional with
  lookup / polymorphism, move file, tighten types,
  class→function. If the move is not on that list, **block** and ask the
  user whether they actually want `/fix`, `/implement`, or `/design`.
- **Rationale** — why now? Two duplicate call sites? An upcoming feature
  needs a seam? Type-tightening to unblock a downstream change? "Felt
  ugly" is not a rationale; ask.
- **Package** — `web-react-ts`, `api`, or `lib/`.
- **Domain risk** — does the target touch money, banking, arrivals,
  permissions, state machines? If yes, re-read `kb/04-state-machines.md`
  and the relevant ADRs (ADR-001, ADR-005, ADR-006, ADR-012) before
  proceeding.

**Block here** if any of: target is a theme not a file, move is out of
scope, rationale is unclear.

## Phase 2 — Test coverage check

Run the test runner against the target's existing tests:

- Frontend: `cd web-react-ts && npm run test:run -- <target-pattern>`
- Backend: `cd api && npm test -- <target-pattern>`

One of three things is true:

1. **Tests exist and are green.** Continue to Phase 3.
2. **Tests exist but are red.** Stop. The target is broken on the
   baseline. The user must fix the bug (`/fix`) before any refactor.
   Report which tests are red and what they assert.
3. **No tests exist for the target.** Continue to Phase 3 — characterize
   first.

If the test infrastructure for the package has not been set up yet
(no `vitest.config.ts` / no `jest.config.js`, no `test:run` / `test`
script), **block**. Setup is its own PR per ADR-013 §Consequences. Tell
the user: "The package's test runner is not set up. Want me to scaffold
it as a separate change first?" — do not improvise a config inline.

## Phase 3 — Characterize (skip if Phase 2 produced green tests)

Dispatch `test-author` with:

- The target file(s).
- The behaviors to lock in (you derive these from a reading of the code,
  not from imagination): the public functions / hooks / components, their
  inputs, their observable outputs, and any side effects (Apollo cache
  writes, Neo4j writes, Sentry breadcrumbs).
- An instruction to capture any bugs as `TODO(refactor):` rather than
  fix them.

Wait for the agent's report. Verify it ran the tests and they pass on the
current code. If the agent refused (target untestable as-given), **block**
and report. The user has to decide: introduce a seam first via `/fix`, or
abandon the refactor.

After characterization tests are written and green, **stop and ask the
user to confirm the test report looks right** before refactoring. Tests
that pin in the wrong behavior will lock the refactor to a buggy spec.

## Phase 4 — Refactor

Dispatch `refactor` with:

- The target.
- The exact move from Phase 1 (one move, no bundling).
- A pointer to the test command from Phase 2/3 so it can verify against
  the same baseline.

The agent's preflight will re-verify the working tree is clean (modulo
the test additions from Phase 3) and that `tsc` + ESLint are green. If
its preflight refuses, propagate the refusal verbatim — do not "help"
by skipping checks.

If the refactor agent reverts mid-flight (verification gate failed after
edits), **stop**. Report what it found. The refactor as scoped is not
safe; the user has to either narrow the move further or run `/fix` on
the underlying issue first.

## Phase 5 — Verify

After the `refactor` agent reports success, independently re-run the
verification gate to confirm:

1. The same test command — must be all green.
2. `tsc --noEmit` for the package.
3. `eslint` on the touched files (`--max-warnings=0`).
4. **No production behavior change.** If the agent said it renamed
   something, grep for any leftover references to the old name. If it
   extracted, grep for inadvertently changed strings or numbers in the
   diff (`git diff --stat` then read the diff itself).

If any check fails, the refactor is not done. Report and stop.

## Phase 6 — Review

Dispatch reviewers in this order:

1. `code-reviewer` — always, no exceptions.
2. `cypher-reviewer` — only if any `*-cypher.ts` was touched (rare for
   refactor; the `refactor` agent excludes Cypher semantics by default,
   but renames of Cypher params still warrant a look).
3. `security-reviewer` — if anything under `api/src/resolvers/`,
   `api/src/schema/`, `api/src/functions/`,
   `lib/auth-service.ts`, `permission-utils.ts`, or money / banking /
   arrivals / accounts code was touched.

Surface every Must-Fix back to the user. Do not silently apply reviewer
suggestions — refactor is a chain of explicit moves; an unprompted fix
contaminates the diff.

## Output

End with:

- ✅ Files changed (separating test additions from production refactor).
- ✅ The exact verification commands and their outputs.
- ✅ Reviewer summaries (one bullet each: pass / Must-Fix / Should-Fix /
  Consider).
- ⚠️ Bugs noticed but deliberately not fixed (with file:line references).
- 🚫 Any phase that blocked, and what the user needs to provide.

Do **not** offer to `/commit` automatically. The user inspects the diff
and runs `/commit` themselves when satisfied — refactors are easy to
mis-scope, and the human-in-the-loop checkpoint is the safety net.
