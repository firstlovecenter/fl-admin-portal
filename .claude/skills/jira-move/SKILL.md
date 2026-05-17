---
name: jira-move
description: Move a Jira issue in the SYN project through the workflow columns (To Do → In Progress → Review → Done) as work progresses. Trigger proactively when starting work on a SYN-X ticket (move to In Progress), when finishing work and ready for human review (move to Review), or after the user confirms the PR has merged into staging (move to Done). Also trigger when the user says "move SYN-X to <column>", "transition SYN-X", "I'm starting on SYN-X", "SYN-X is ready for review", or pastes a SYN-X Jira link in a work-starting context.
---

# /jira-move — Transition a SYN issue through the board

Move a Jira issue in the FLC Synago (`SYN`) project to the appropriate column
based on the stage of work. Default behaviour is **proactive**: the agent
calls this skill on its own when it starts or finishes work on a SYN-X
ticket, and announces the transition in one short sentence before it happens.

## When to fire (target column matrix)

| Stage of work | Target column |
| --- | --- |
| You're about to start coding for `SYN-X` | **In Progress** |
| You finished implementation, reviewers ran, build is green, change is ready for human review (PR opened or pushed) | **Review** ← **final automatic step** |
| You have **verified** that the PR is merged into `staging` or `main` (via `git log` or a user-pasted merge confirmation that you can independently check) | **Done** |

**Review is the end of the automatic loop.** After moving a ticket to
Review, stop. Do not transition further on your own.

**Done is never claimed proactively.** It only fires when:

1. The user explicitly asks ("close out SYN-123", "mark SYN-123 done"), AND
2. You have **independently verified** the merge by running:

   ```
   git fetch origin staging main
   git log origin/staging --oneline | grep -i SYN-123
   git log origin/main --oneline | grep -i SYN-123
   ```

   At least one of those must return a hit. If neither does, **stop and
   tell the user** — do not move the ticket. The whole point of waiting on
   Done is so that whoever is reading the board can trust that "Done" means
   the change is actually live in `staging`/`main` and they can check it.

If the user insists the merge happened but `git log` shows no commit
referencing the key, ask them for the merge commit SHA and verify that.
Never take "trust me, it's merged" at face value.

## Hard rules

- **Announce, then act.** Before transitioning, output one short sentence:
  `Moving SYN-123 to In Progress before I start.` or `Moving SYN-123 to Review.`
- **Review is the final automatic step.** Stop moving tickets after Review.
  Do not chain into Done.
- **Done requires proof of merge.** Both conditions must be true:
  (a) the user explicitly asks for it, AND (b) `git log` of `origin/staging`
  or `origin/main` shows a commit referencing the issue key. If you cannot
  see the merge yourself, refuse and report what you tried.
- **Never invent issue keys.** If the key is not in scope, ask.
- **Never pass `transition.name`.** The MCP only accepts `transition.id`.
- **Never silently skip.** If the requested transition isn't available from
  the current column (e.g., the issue is already in Review and you tried to
  move it back to In Progress), report the available options and ask.
- **No-op early.** If the issue is already in the target column, stop and
  report no-op without firing a transition.

## SYN project reference

| Field | Value |
| --- | --- |
| Project key | `SYN` |
| Cloud ID | `a15d0f93-d1b0-4577-92dd-973145588c2d` |
| Instance | `codefoundry.atlassian.net` |
| Board URL | https://codefoundry.atlassian.net/jira/software/projects/SYN/boards |
| Issue URL pattern | `https://codefoundry.atlassian.net/browse/SYN-<n>` |

## Workflow columns

```
To Do → In Progress → Review → Done
```

| Target status | Transition ID |
| --- | --- |
| To Do | `11` |
| In Progress | `21` |
| Review | `2` |
| Done | `31` |

These four transitions are all marked `isGlobal: true` on the SYN board, which
means each one is callable from any current status — so e.g. `To Do → Review`
works directly with `id: "2"` and no In-Progress hop is required. Verified
2026-05-17 against `SYN-146`.

**Do not confuse transition IDs with status IDs.** The MCP's
`transition.id` field takes the transition ID (`2`, `11`, `21`, `31`); the
five-digit numbers you see in `status.id` (`10637` To Do / `10638` In
Progress / `10738` Review / `10639` Done) are the destination status IDs
and will be rejected if passed as `transition.id`.

If a transition fails with `Transition id 'X' is not valid for this issue`,
the board's workflow has been edited — fall back to
`getTransitionsForJiraIssue` and use the freshly fetched ID.

## Procedure

### 1. Resolve the issue key

Try these sources in order — first hit wins:

1. **Slash-command argument**: `/jira-move SYN-123 review` → key `SYN-123`,
   target `review`.
2. **User message / recent conversation**: explicit `SYN-\d+` mentions, or a
   Jira link the user pasted.
3. **Current git branch**: run `git branch --show-current` and look for a
   `SYN-\d+` prefix or substring (e.g., `SYN-123-fix-thing`,
   `feature/SYN-123-fix-thing`).

If no key is found across all three sources, **stop and ask** the user.
Do not guess.

### 2. Determine the target column

- If the user named a column ("move to review"), honour their wording.
- Otherwise infer from the stage of work using the matrix at the top of this
  file.
- If still ambiguous, ask the user.

### 3. (Optional) Read the current status

Cheap pre-flight to avoid no-op transitions and to know which transitions
will be available:

```
mcp__atlassian__getJiraIssue with:
  cloudId: "a15d0f93-d1b0-4577-92dd-973145588c2d"
  issueIdOrKey: "SYN-123"
  fields: ["status", "summary"]
```

If `status.name` already equals the target column, stop and report no-op.

### 4. Announce the move

Output exactly one short line before firing the transition. Examples:

- `Moving SYN-123 to In Progress before I start.`
- `Implementation looks done — moving SYN-123 to Review.`
- `Marking SYN-123 Done now that it's merged into staging.`

### 5. Fetch available transitions (only as a fallback)

The four IDs in the table above are global on the SYN board and can be used
without a fetch. Only fall back to the dynamic fetch when an apply step
fails with `Transition id 'X' is not valid for this issue`:

```
mcp__atlassian__getTransitionsForJiraIssue with:
  cloudId: "a15d0f93-d1b0-4577-92dd-973145588c2d"
  issueIdOrKey: "SYN-123"
```

Pick the transition whose `to.name` matches the target column and use its
`id` as `transition.id` in the next step.

### 6. Apply the transition

```
mcp__atlassian__transitionJiraIssue with:
  cloudId: "a15d0f93-d1b0-4577-92dd-973145588c2d"
  issueIdOrKey: "SYN-123"
  transition: { id: "TRANSITION_ID" }
```

### 7. Confirm

Report a single line with the new status, summary, and URL:

```
SYN-123 → In Progress  ·  [Bacenta] Add stage attendance form  ·  https://codefoundry.atlassian.net/browse/SYN-123
```

## Proactive behaviour during a feature/bug task

When a user gives you a task that references `SYN-X` (or your branch starts
with `SYN-X-`), weave this skill into the lifecycle of the task:

1. **Before coding starts** — call this skill with target `In Progress`.
2. **After implementation, reviewers, and a green build** — call this skill
   with target `Review`. Do not move to Review until `code-reviewer` (and any
   other relevant reviewer) has signed off.
3. **Stop here.** Do not move to Done on your own.

The Done transition is a separate, manual step that only happens when the
user comes back and asks you to close out the ticket — and even then only
after you verify the merge yourself via `git log` (see the matrix and hard
rules above). The reason for this gate: people reading the board treat
"Done" as a signal that the change is live in `staging`/`main` and worth
spot-checking. Premature Done transitions break that trust.

If the task spans multiple SYN tickets, transition each one independently in
the same lifecycle.

## Slash-command form

The user can also invoke this skill explicitly:

```
/jira-move SYN-123 in-progress
/jira-move SYN-123 review
/jira-move SYN-123 done
```

Accept these column aliases case-insensitively:

| Input | Resolves to |
| --- | --- |
| `to-do`, `todo`, `to do` | To Do |
| `in-progress`, `in progress`, `progress`, `start`, `wip` | In Progress |
| `review`, `in-review`, `pr` | Review |
| `done`, `complete`, `closed`, `merged` | Done |

If the explicit form omits a target, fall back to the inferred-target logic
from step 2.

## Failure handling

| Symptom | What to do |
| --- | --- |
| MCP returns `transition not available` | Fetch transitions, list the available `to.name` values to the user, ask which one they want. |
| Issue not found | Verify the key with the user; do not guess a different key. |
| MCP unavailable / authentication error | Report the error verbatim. Do not retry blindly. |
| Issue is in a non-SYN project | Stop. This skill only handles SYN. |

## What this skill does NOT do

- Create issues — that's `jira-story-writer`.
- Comment on issues, log work, or assign issues.
- Track multiple issues in batch — call once per key.
- Move issues backward by default — only forward through the workflow unless
  the user explicitly asks ("move SYN-123 back to In Progress").
