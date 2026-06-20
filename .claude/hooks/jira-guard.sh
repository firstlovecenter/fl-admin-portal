#!/usr/bin/env bash
# Stop hook.
# Blocks the turn end if a SYN key was recorded for this session by
# jira-detect.sh but no Jira transition (mcp__atlassian__transitionJiraIssue)
# referencing that key appears in the transcript. Has a 3-attempt safety valve
# so the user is never permanently trapped.
set -uo pipefail

input=$(cat)
session=$(printf '%s' "$input" | jq -r '.session_id // "nosession"')
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // ""')

dir="${TMPDIR:-/tmp}/claude-jira"
state="$dir/$session.keys"
[ -s "$state" ] || exit 0   # no SYN key was typed this session — nothing to enforce

# Collect recorded keys that have NOT yet been transitioned.
unresolved=""
while IFS= read -r key; do
  [ -z "$key" ] && continue
  if [ -n "$transcript" ] && [ -f "$transcript" ] \
     && grep -F "$key" "$transcript" 2>/dev/null | grep -q "transitionJiraIssue"; then
    continue   # a transitionJiraIssue call referencing this key exists
  fi
  unresolved="$unresolved $key"
done < "$state"

# Trim/dedupe.
unresolved=$(printf '%s' "$unresolved" | tr ' ' '\n' | grep -E 'SYN-[0-9]+' | sort -u | tr '\n' ' ' | sed 's/ $//' || true)
[ -z "$unresolved" ] && { rm -f "$state" "$dir/$session.attempts" 2>/dev/null; exit 0; }

# Safety valve: stop nagging after 3 blocks so a stuck turn is never trapped.
attempts="$dir/$session.attempts"
n=$(cat "$attempts" 2>/dev/null || echo 0)
n=$((n + 1))
printf '%s' "$n" > "$attempts"
if [ "$n" -gt 3 ]; then
  printf '{"systemMessage":"Jira reminder: %s still not transitioned after 3 nudges — letting the turn end. Update the board with /jira-move if needed."}\n' "$unresolved"
  exit 0
fi

echo "You worked on Jira issue(s): ${unresolved}, but no board transition (transitionJiraIssue) was made this session. Invoke the jira-move skill NOW to move each one to its correct column (In Progress while working, Review when the change is ready for human review). Do not end the turn until the board reflects the state of the work." >&2
exit 2
