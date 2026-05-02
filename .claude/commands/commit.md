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

## Workflow

1. Run `git status` and `git diff` (staged + unstaged) to see what's about to be
   committed.
2. Run `git log -n 10 --oneline` to match the recent style.
3. Group the staged changes into a single coherent commit. If they are not
   coherent, **stop and ask** which subset to commit.
4. Pick `type(scope)` per the tables above.
5. Draft the subject. Keep it under 72 chars.
6. If the body adds value (the *why*), include it. Skip it if the subject is
   self-explanatory.
7. Stage only the files that belong in this commit (`git add <specific files>`,
   not `git add -A`).
8. Commit with a HEREDOC if the message has multiple lines:

   ```
   git commit -m "$(cat <<'EOF'
   feat(arrivals): add code-of-the-day rotation for outbound trips

   Drivers on the return journey were re-using the morning code, which
   meant payouts could be triggered after the daily rotation window. The
   webhook now stamps a separate outbound code per Bacenta.
   EOF
   )"
   ```

9. Run `git status` to confirm a clean tree (or expected leftovers).
10. **Do not push.** Only push if the user explicitly asks.

## Hard rules

- Never use `git commit --no-verify` (skips lint-staged).
- Never amend a previous commit unless the user asks.
- Never commit `.env`, secrets, or generated artifacts (`build/`, `dist/`,
  `node_modules/`, `package-lock.json` changes you didn't intend).
- Never commit if `git status` shows files you don't recognise — investigate
  first.
- If lint-staged hooks fail, fix the underlying issue and create a **new**
  commit. Don't `--no-verify`.
