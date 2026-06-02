[![Netlify Status](https://api.netlify.com/api/v1/badges/3fc1e26f-bccb-4196-ba57-705d3b09bb82/deploy-status)](https://app.netlify.com/sites/flcadmin/deploys)



This project was built using [GRANDstack](https://grandstack.io) (GraphQL, React, Apollo, Neo4j Database) application.
<br/><br/>

[![First Love Logo](/img/flc-logo-small.png)](https://www.firstlovecenter.com)

# Where Are We Going?

<br/>

> _"The problem in a Mega Church is blindness"_
>
> \- DHM

<br/>

The aim is to build a Church Management Portal for Managing the [First Love Church](https://www.firstlovecenter.com) in Accra.
All Contributors welcome. Go ahead and fork the project and submit a PR. Read the [Contributor Guide](./CONTRIBUTING.md) for guidelines.

- [PHASE 1: Directory (State of the Flock Part 1) ✅](#phase-1-directory-state-of-the-flock-part-1-)
- [PHASE 2: Attendance and Income Records (State of the Flock Part 2) ✅](#phase-2-attendance-and-income-records-state-of-the-flock-part-2-)
- [PHASE 3: Records of the Campaigns (SSMG) ✅](#phase-3-records-of-the-campaigns-ssmg-)
- [PHASE 4: Geolocation (Google Earth Replacement) (Sheep Seeking) ✅](#phase-4-geolocation-google-earth-replacement-sheep-seeking-)
- [PHASE 5: Bussing Registration and Monitoring (Bacenta Proliferation) ✅](#phase-5-bussing-registration-and-monitoring-bacenta-proliferation-)
- [PHASE 6: Future Ideas](#phase-6-future-ideas)

### Completed in 2023

## PHASE 1: Directory (State of the Flock Part 1) ✅

1.  Be able to hold all membership and leadership records (Bacenta and Basonta).
2.  Be able to search and filter all membership records based on selected criteria.
3.  Be able to display information on one member
4.  Display registration numbers at all levels (Constituency, Bacenta, Basonta)
5.  Be able to import data in a csv file, and export data in a csv file
6.  An extensive transaction log of leadership histories.
7.  Database Backups to occur every day or twice a day.
    <br/>

## PHASE 2: Attendance and Income Records (State of the Flock Part 2) ✅

1.  Replacing all current forms for accepting income and attendance for all services and Basonta Meetings (treasurers & picture uploads)
2.  Accepting all data from all services weekly.
    - Bacenta Fellowship
    - Constituency Joint Service
    - First Love Federal Services (Campus and Revival)
3.  Integrate a way of sending broadcast reminders (SMS/ WhatsApp) to leaders/admins who haven’t filled their forms and such
4.  Monitor outstanding penalties for fellowships who default
5.  A Way to Integrate with Bank to confirm if offering payments have been made??
6.  Generating monthly graph reports at the bishops level/ COs level, bacenta level.
7.  Requesting records on any leader in the church (Graphs)
8.  Bishops Monthly Report sent via Mail as a PDF.
9.  Monthly CO Reports per Constituency.
10. Requesting records on any bacenta in the church.
11. Monitoring the tithes of leaders (Needs ideas on how to achieve this)
    <br/>

## PHASE 3: Records of the Campaigns (SSMG) ✅

1. Replacing all current forms for SSMG
2. All Campaign Forms
3. Generating monthly and annual reports for all campaigns
4. Understanding School Data per member
   <br/>

## PHASE 4: Geolocation (Google Earth Replacement) (Sheep Seeking) ✅

1. Plot fellowships, bacentas, and centres on a map
2. Plot all members on a map
3. Plot outreach venues on a map with information on area populations, cost of bussing, etc
4. Plot hostel information of universities on the map
   <br/>

## PHASE 5: Bussing Registration and Monitoring (Bacenta Proliferation) ✅

1. Maintain an accurate Bacenta Directory
2. Accept Bacenta Records of Attendance, Cost, Offering Raised, Amount Paid from the Church
3. Close Down any Bacenta/IC that busses under 8 for four consecutive weeks
4. Registration of Reds
5. Graduate IC to Bacenta after bussing above 8 for 4 consecutive weeks.
6. Accept IC Records of Attendance, Cost, Offering Raised, Amount Paid from the Church
7. IC Training Attendance Tracking. Attendance to be filled by IC Trainers.
   <br/>

## PHASE 6: Future Ideas

⁃ Face Recognition Attendance

<br/>

# Fixing Jira Issues with Claude (for non-developers)

If you've been asked to "knock out a few Jira tickets" but you don't write
code day-to-day, this section is for you. Claude Code can pick up a ticket
from our Jira board, write the fix, open a Pull Request for the engineers to
review, and keep the Jira card moving through the columns the whole time —
you mostly just point it at the right ticket.

## What you need before you start

1. **Access to our Jira board.** It's at
   [codefoundry.atlassian.net](https://codefoundry.atlassian.net/jira/software/projects/SYN/boards)
   under the project called **SYN** (FLC Synago). Every ticket has a key
   like `SYN-123`, `SYN-456`, etc. That key is the only thing Claude needs
   from you.
2. **A Claude Code session opened on this repo.** Either the desktop app,
   the web app at [claude.ai/code](https://claude.ai/code), or a cloud agent
   that the team has set up for you.
3. **An idea of which branch you're on.** Don't worry — if you don't know,
   Claude will figure it out or ask. As a rule of thumb, never start work
   while you're sitting on the `deploy` or `main` branch. Ask Claude to
   "make a new branch from `staging` for SYN-123" and it will handle it.

## The full loop, end to end

Here's exactly how a normal ticket gets done. You can copy these prompts.

### Step 1 — Find a ticket on the board

Open the SYN board and pick a ticket that is in the **To Do** column. Read
the title and description so you have a sense of what's being asked. Copy
its key (e.g. `SYN-123`).

### Step 2 — Tell Claude to start on it

Open Claude Code and type something like:

> _"I'm starting on SYN-123. Read the ticket, make a branch off `staging`,
> and fix it."_

Claude will:

1. **Move the Jira ticket to "In Progress"** automatically (this is the
   `jira-move` skill — you don't have to ask for it).
2. Read the ticket from Jira.
3. Read the right knowledge-base files in this repo so it knows our
   conventions.
4. Create a new git branch with the issue key in the name
   (e.g. `SYN-123-fix-bacenta-default-banner`).
5. Implement the fix.
6. Run our reviewers (`code-reviewer`, sometimes `security-reviewer` or
   `cypher-reviewer`).

You don't need to do anything during this stretch — just answer Claude's
questions if it asks for clarification on what the ticket means.

### Step 3 — Open the Pull Request

Once the change looks done, ask Claude:

> _"Open a PR against `staging` and link it to SYN-123."_

Claude will push the branch and open a Pull Request on GitHub. The PR
description will reference the Jira ticket so the engineers reviewing it
have full context.

At this point Claude should **automatically move the Jira ticket to
"Review"**. If it forgets, just say:

> _"Move SYN-123 to review."_

### Step 4 — Wait for engineering review and merge

This is the part where humans take over. **The ticket stays in Review until
the merge actually happens.** Claude will not advance it on its own — Review
is the end of the automatic loop.

One of the engineers will review your PR, leave comments if anything needs
adjusting, and eventually merge it into `staging` (and later into `main`).
If they ask for changes, paste their comments back into Claude and it will
handle the follow-ups.

### Step 5 — Mark the ticket Done (only after the merge is real)

Once the engineer tells you (or you can see in GitHub) that your PR has
been **merged into `staging`** or **`main`**, tell Claude:

> _"SYN-123 is merged into staging — close it out."_

Claude will then **independently verify the merge** (it runs `git log` and
looks for a commit referencing `SYN-123`). Only if it can see that commit
will it move the Jira ticket to **Done**. If Claude can't find the merge,
it will refuse and tell you — paste in the merge commit link or ask the
engineer to confirm.

This rule exists for a reason: when something shows up in the **Done**
column, the people reading the board treat that as a signal that the change
is live and worth spot-checking on staging. Premature "Done" moves break
that trust, so Claude is deliberately strict here.

## Cheat sheet — phrases Claude understands

You don't need to memorise commands. Plain English works. Here are some
phrases that reliably trigger the right behaviour:

| What you want | What to say |
| --- | --- |
| Start a new ticket | "I'm starting on SYN-123" / "Pick up SYN-123" |
| Move a ticket forward without doing other work | "Move SYN-123 to in progress" / "Move SYN-123 to review" |
| Mark something done after merge | "SYN-123 is merged, close it out" / "Move SYN-123 to done" |
| Ask Claude to find the right ticket key | "What ticket am I on?" (it checks your branch name) |
| Force the column explicitly | `/jira-move SYN-123 review` |

## Common mistakes to avoid

- ❌ **Don't move a ticket to "Done" yourself before the PR is merged.** It
  causes confusion in standups. Only mark Done after the engineers merge.
- ❌ **Don't work on multiple tickets in the same branch.** One ticket = one
  branch = one PR. If Claude tries to bundle them, ask it to split.
- ❌ **Don't push to `deploy` or `main`.** Those are protected branches.
  Always target `staging`.
- ❌ **Don't paste secrets, passwords, or member personal info** into the
  Claude chat. If a ticket needs real data, ask an engineer.
- ❌ **Don't skip the human review.** Even if Claude says "all reviewers
  passed," a human engineer must merge the PR. Don't ask Claude to merge.

## When to ask a human

Stop and ping an engineer (in `#engineering` on Slack) if:

- Claude can't find the ticket, or the ticket is in the wrong project
  (anything that doesn't start with `SYN-`).
- The ticket is labelled `infra`, `auth`, `banking`, or `accounts` — these
  touch sensitive areas and need a senior engineer to take the first pass.
- The reviewers come back with errors that mention "security", "Cypher",
  "money", or "JWT". Don't try to solve those alone.
- The PR has been sitting in Review for more than two business days — go
  poke someone to look at it.

## TL;DR for the impatient

```
1. Pick a ticket from the SYN board.
2. Tell Claude "I'm starting on SYN-XXX".
3. Let Claude implement + open a PR.   → ticket lands in Review automatically
4. Wait for engineers to merge to staging/main.
5. Tell Claude "SYN-XXX is merged, close it out".
   → Claude verifies the merge in git log, then moves the ticket to Done.
```

Steps 1–3 are automatic. Step 5 only happens after a real merge — that's
the gate that lets the team trust the **Done** column on the board.

That's the whole vibe.

<br/>

This project is licensed under the Apache License v2.
Copyright (c) 2020 Neo4j, Inc.
