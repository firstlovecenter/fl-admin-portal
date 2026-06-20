#!/usr/bin/env bash
# UserPromptSubmit hook.
# If the user's TYPED prompt references SYN-<n>, record the key(s) for this
# session and inject a directive telling Claude to run the jira-move skill.
# Reads only `.prompt` — the injected CLAUDE.md/memory context (full of SYN
# keys) never flows through here, so there are no false positives from it.
set -uo pipefail

input=$(cat)
prompt=$(printf '%s' "$input" | jq -r '.prompt // ""')
session=$(printf '%s' "$input" | jq -r '.session_id // "nosession"')

keys=$(printf '%s' "$prompt" | grep -oE 'SYN-[0-9]+' | sort -u || true)
[ -z "$keys" ] && exit 0

dir="${TMPDIR:-/tmp}/claude-jira"
mkdir -p "$dir"
state="$dir/$session.keys"
printf '%s\n' "$keys" >> "$state"
sort -u "$state" -o "$state"

list=$(printf '%s' "$keys" | tr '\n' ' ' | sed 's/ $//; s/ /, /g')
ctx="The prompt references Jira issue(s): ${list}. Before other work, you MUST invoke the jira-move skill to move each referenced SYN issue to the correct board column (In Progress when starting work, Review when finished). This is a hard project rule (ADR / CLAUDE.md) — do not skip it."

jq -nc --arg c "$ctx" \
  '{hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:$c}}'
