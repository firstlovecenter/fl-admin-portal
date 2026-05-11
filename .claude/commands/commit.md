---
description: Stage changes and create a Conventional Commits commit. Never commit without this format.
---

You are running `/commit` on the FL Admin Portal. Use Conventional Commits.
Never commit without this format.

## Format

```
<type>(<scope>): <description>

<optional body>

<optional footer>
```

- Subject line: lowercase, no trailing period, **≤ 72 characters**.
- Description: imperative mood ("add", "fix", "refactor" — not "added", "fixes").
- Body (optional): wrap at ~72 cols. Explain *why*, not *what*. Reference the
  ticket if there is one.

## Valid types

| Type | Use for |
| --- | --- |
| `feat` | A new user-visible feature or new GraphQL operation |
| `fix` | A bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | A performance improvement |
| `docs` | Documentation only (kb/, README, CLAUDE.md, code comments) |
| `style` | Formatting / lint changes — no logic change |
| `chore` | Tooling, deps, config, build scripts |
| `ci` | Changes to `.github/`, `amplify.yml`, deploy pipeline |
| `revert` | Reverts a previous commit (`revert: <prior subject>`) |

`test` exists in the spec but the project has no test suite (ADR-010); avoid it
unless you actually add tests.

## Valid scopes

Use the package or section the change touches. Common scopes:

| Scope | Area |
| --- | --- |
| `web` | Anything under `web-react-ts/src/` not better captured by a specific scope |
| `api` | Anything under `api/src/` not better captured by a specific scope |
| `directory` | Member / church CRUD (FE pages or API resolvers) |
| `services` | Service recording, defaulters, on-stage |
| `banking` | Banking flow (self-banking, slip, teller confirmation) |
| `arrivals` | Bussing arrivals (FE pages, API resolvers, code-of-the-day) |
| `accounts` | Account deposits / expenses / approvals |
| `maps` | Maps pages |
| `reconciliation` | Reconciliation module |
| `dashboards` | Dashboards / Navigation |
| `auth` | Login / token / setup-password / permissions |
| `schema` | `.graphql` SDL changes |
| `cypher` | Custom Cypher (`*-cypher.ts`) |
| `lambda` | Background jobs under `api/src/functions/background/` |
| `scripts` | Root or `api/src/scripts/` runners |
| `kb` | Knowledge base under `kb/` (root or per-package) |
| `claude` | `.claude/` harness (commands, agents, settings) |
| `deps` | Dependency updates |
| `release` | Version bumps via `npm run release:*` |

If the change spans multiple scopes, pick the dominant one. If truly
cross-cutting, omit the scope: `feat: …`.

## Examples

```
feat(arrivals): add code-of-the-day rotation for outbound trips

fix(banking): block re-entry into pending after success

refactor(directory): collapse hand-rolled servant resolvers into factory config

docs(kb): expand SM1 with send-OTP transitions

chore(deps): bump @neo4j/graphql to 6.3.0

ci: send Slack failure pings on amplify build error
```

## Scope: current session only (default)

By default, `/commit` only commits work produced in **this session/thread**.

- Identify the set of files this session actually edited, created, or deleted
  (from the conversation's tool history — Edit/Write/Bash mutations you ran in
  this thread).
- Treat any other modified/untracked files in the working tree as **out of
  scope**. Do not stage them. Do not include them in the diff you review for
  the message.
- If `git status` shows pre-existing changes you don't recognise from this
  session, leave them alone — they belong to the user or a prior session.
- If the user explicitly says "commit everything" / "include the other
  changes" / names specific extra files, expand scope to match the ask.

## Workflow

1. Build the in-scope file list from this session's tool history (files you
   edited, wrote, moved, or deleted in this thread).
2. Run `git status` and `git diff -- <in-scope files>` to see exactly what's
   about to be committed. Sanity-check that nothing pre-existing has snuck in.
3. Run `git log -n 10 --oneline` to match the recent style.
4. Group the in-scope changes into a single coherent commit. If they are not
   coherent, **stop and ask** which subset to commit.
5. Pick `type(scope)` per the tables above.
6. Draft the subject. Keep it under 72 chars.
7. If the body adds value (the *why*), include it. Skip it if the subject is
   self-explanatory.
8. Stage **only the in-scope files** by name (`git add <specific files>`).
   Never `git add -A`, `git add .`, or `git add -u` — those sweep up
   out-of-session work.
9. Commit with a HEREDOC if the message has multiple lines:

   ```
   git commit -m "$(cat <<'EOF'
   feat(arrivals): add code-of-the-day rotation for outbound trips

   Drivers on the return journey were re-using the morning code, which
   meant payouts could be triggered after the daily rotation window. The
   webhook now stamps a separate outbound code per Bacenta.
   EOF
   )"
   ```

10. Run `git status` to confirm. Pre-existing out-of-session changes should
    still be unstaged — that is expected, not a problem.
11. **Do not push.** Only push if the user explicitly asks.

## Hard rules

- Never use `git commit --no-verify` (skips lint-staged).
- Never amend a previous commit unless the user asks.
- Never commit `.env`, secrets, or generated artifacts (`build/`, `dist/`,
  `node_modules/`, `package-lock.json` changes you didn't intend).
- Never commit if `git status` shows files you don't recognise — investigate
  first. Default behaviour is to leave them unstaged, not to add them.
- Never use `git add -A`, `git add .`, or `git add -u`. Always stage by
  explicit file path so out-of-session changes stay out.
- If lint-staged hooks fail, fix the underlying issue and create a **new**
  commit. Don't `--no-verify`.
