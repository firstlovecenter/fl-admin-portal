// Reads the current week's WeeklyTip for the requested church. The resolver
// verifies the caller has $churchId in their allowedChurchIds before this
// query runs, so the Cypher only checks (year, week).
//
// Keying convention mirrors ADR-014 aggregate nodes: `<churchId>-<year>-<week>`.
// We filter on (year, week) rather than reconstructing the id so the resolver
// stays robust if the id format ever changes.
//
// The optional matches on scripture / quotedPassage / recommendedBook return
// `null` when the Lambda chose not to attach that edge — the SDL declares each
// of these as nullable singletons so the FE renders the available sections.
const READ_WEEKLY_TIP_FOR_CHURCH_CYPHER = `
MATCH (church {id: $churchId})-[:HAS_WEEKLY_TIP]->(tip:WeeklyTip)
WHERE tip.year = $year AND tip.week = $week
WITH tip
OPTIONAL MATCH (tip)-[:CITES_SCRIPTURE]->(scripture:Verse)
OPTIONAL MATCH (tip)-[:QUOTES_PASSAGE]->(quotedPassage:BookPassage)
OPTIONAL MATCH (tip)-[:RECOMMENDS_BOOK]->(recommendedBook:Book)
RETURN tip {
  .id,
  .churchId,
  .week,
  .year,
  .body,
  scriptureSnippet: tip.scriptureSnippet,
  passageSnippet: tip.passageSnippet,
  prayerPrompt: tip.prayerPrompt,
  generatedAt: tip.generatedAt,
  scripture: scripture { .id, .book, .chapter, .verse, .translation, .text },
  quotedPassage: quotedPassage { .id, .text, .citationLabel, .order },
  recommendedBook: recommendedBook { .id, .title, .author, .subtitle, .publishedYear }
} AS tip
LIMIT 1
`

// Vector retrieval used by the chat resolver. Same indexes as the Lambda's
// retrieval but inlined here because the resolver package shouldn't reach
// into a Lambda's folder for shared Cypher.
export const RETRIEVE_PASSAGES_FOR_CHAT_CYPHER = `
CALL db.index.vector.queryNodes('bookPassageEmbedding', $k, $vec)
YIELD node, score
WHERE score > 0.30
MATCH (book:Book)-[:HAS_CHAPTER]->(:BookChapter)-[:HAS_PASSAGE]->(node)
RETURN
  node.id AS id,
  node.text AS text,
  node.citationLabel AS citationLabel,
  book.title AS bookTitle,
  book.author AS bookAuthor,
  score
ORDER BY score DESC
`

export const RETRIEVE_VERSES_FOR_CHAT_CYPHER = `
CALL db.index.vector.queryNodes('verseEmbedding', $k, $vec)
YIELD node, score
WHERE score > 0.30
RETURN
  node.id AS id,
  node.book AS book,
  node.chapter AS chapter,
  node.verse AS verse,
  node.translation AS translation,
  node.text AS text,
  score
ORDER BY score DESC
`

// ---------------------------------------------------------------------------
// Chat persistence
// ---------------------------------------------------------------------------

// List sessions for the caller at a given church. Sessions belong to one
// leader + one church via `leaderId` + `churchId` denormalised on the node
// itself; the relationship to `:Member` is also kept for traversal but the
// flat properties keep this query simple.
export const LIST_CHAT_SESSIONS_CYPHER = `
MATCH (s:ChatSession {leaderId: $leaderId, churchId: $churchId})
OPTIONAL MATCH (s)-[:HAS_MESSAGE]->(m:ChatMessage {role: 'assistant'})
WITH s, m
ORDER BY m.createdAt DESC
WITH s, head(collect(m)) AS lastAssistant
RETURN s.id AS id,
       s.title AS title,
       s.churchId AS churchId,
       s.updatedAt AS updatedAt,
       coalesce(substring(lastAssistant.text, 0, 80), '') AS preview
ORDER BY s.updatedAt DESC
LIMIT $limit
`

// Fetch a session + its full message history. The resolver verifies the
// caller's leaderId and the church scope before returning.
export const GET_CHAT_SESSION_CYPHER = `
MATCH (s:ChatSession {id: $sessionId, leaderId: $leaderId})
OPTIONAL MATCH (s)-[:HAS_MESSAGE]->(m:ChatMessage)
WITH s, m ORDER BY m.createdAt ASC
WITH s, collect(m) AS msgs
RETURN s.id AS id,
       s.title AS title,
       s.churchId AS churchId,
       s.createdAt AS createdAt,
       s.updatedAt AS updatedAt,
       [m IN msgs | {
         id: m.id,
         role: m.role,
         text: m.text,
         createdAt: m.createdAt,
         citations: coalesce(m.citations, [])
       }] AS messages
`

// Count messages currently on a session — used to detect "first turn" so
// we know when to trigger the title-summary side call.
export const COUNT_SESSION_MESSAGES_CYPHER = `
MATCH (s:ChatSession {id: $sessionId, leaderId: $leaderId})
OPTIONAL MATCH (s)-[:HAS_MESSAGE]->(m:ChatMessage)
RETURN count(m) AS messageCount
`

// SYN-177 — atomically bump the caller's daily assistant-usage counter and
// return the new value. Used to enforce a per-user daily cap on
// `sendChatMessage` BEFORE the expensive OpenAI embedding + Claude completion
// run — a cost-abuse / DoS guard against any authenticated leader.
//
// The counter is a day-stamped property on the caller's OWN Member node (unique
// by `id`). It must be a TRUE atomic read-modify-write: Neo4j is read-committed
// and takes the node write lock only at `SET`, so reading the counter before
// the SET would leave a lost-update window (two concurrent turns both read the
// same value, both write the same +1). We close that by writing
// `lastAssistantAt` FIRST — that leading SET forces the write lock before the
// counter is read below, so concurrent turns from the same leader serialise on
// the node lock and each reads the previous turn's committed value. (The
// leading write doubles as a genuine last-active stamp.) Different leaders
// touch different nodes → no cross-user contention. Persisting in Neo4j also
// keeps the cap correct across warm Lambda instances (in-memory counters would
// not).
//
// `assistantUsageDay` auto-resets the counter on the first call of a new UTC
// day (Ghana is UTC+0, so this aligns with the local day). It counts attempts,
// not just successes — the correct signal for a spend guard, since every
// attempt costs an embedding + a completion. No new node label or uniqueness
// constraint is required.
export const INCREMENT_ASSISTANT_USAGE_CYPHER = `
MATCH (leader:Member {id: $leaderId})
SET leader.lastAssistantAt = datetime()
WITH leader, toString(date(datetime({timezone: 'UTC'}))) AS today
WITH leader, today,
     CASE WHEN leader.assistantUsageDay = today
          THEN coalesce(leader.assistantUsageCount, 0) + 1
          ELSE 1 END AS newCount
SET leader.assistantUsageCount = newCount,
    leader.assistantUsageDay = today
RETURN newCount AS usedToday
`

// Read the assistant-visible message history (oldest first) so the resolver
// can hand it to Claude as `messages: [{role,content}, ...]`.
export const READ_SESSION_HISTORY_CYPHER = `
MATCH (s:ChatSession {id: $sessionId, leaderId: $leaderId})
OPTIONAL MATCH (s)-[:HAS_MESSAGE]->(m:ChatMessage)
WITH m ORDER BY m.createdAt ASC
RETURN collect({role: m.role, text: m.text}) AS history
`

// Create a new session. Returns the newly-MERGEd node so the caller has its
// id, createdAt, updatedAt. The :LEADER_OF_SESSION edge ties it to the
// Member for future history queries and cleanup.
export const CREATE_CHAT_SESSION_CYPHER = `
MATCH (leader:Member {id: $leaderId})
CREATE (s:ChatSession {
  id: $sessionId,
  churchId: $churchId,
  leaderId: $leaderId,
  title: $title,
  createdAt: datetime(),
  updatedAt: datetime()
})
CREATE (leader)-[:HAS_CHAT_SESSION]->(s)
WITH s, leader
OPTIONAL MATCH (church {id: $churchId})
WHERE any(l IN labels(church) WHERE l IN [
  'Bacenta','Governorship','Council','Stream','Campus','Oversight','Denomination'
])
FOREACH (c IN CASE WHEN church IS NULL THEN [] ELSE [church] END |
  MERGE (c)-[:HAS_CHAT_SESSION]->(s)
)
RETURN s.id AS id, s.title AS title
`

// Append one message to a session AND bump updatedAt.
export const APPEND_CHAT_MESSAGE_CYPHER = `
MATCH (s:ChatSession {id: $sessionId, leaderId: $leaderId})
CREATE (m:ChatMessage {
  id: $messageId,
  role: $role,
  text: $text,
  createdAt: datetime(),
  citations: $citations
})
CREATE (s)-[:HAS_MESSAGE]->(m)
SET s.updatedAt = datetime()
RETURN m.id AS id, m.role AS role, m.text AS text, m.createdAt AS createdAt, m.citations AS citations
`

// Update only the title (post-summariser). Leaves messages untouched.
export const UPDATE_CHAT_SESSION_TITLE_CYPHER = `
MATCH (s:ChatSession {id: $sessionId, leaderId: $leaderId})
SET s.title = $title
RETURN s.id AS id
`

// DETACH DELETE the session and every message attached to it. Idempotent —
// returns 0 deleted if the session does not exist or is owned by another leader.
export const DELETE_CHAT_SESSION_CYPHER = `
MATCH (s:ChatSession {id: $sessionId, leaderId: $leaderId})
OPTIONAL MATCH (s)-[:HAS_MESSAGE]->(m:ChatMessage)
DETACH DELETE m, s
RETURN count(s) AS deleted
`

export default READ_WEEKLY_TIP_FOR_CHURCH_CYPHER
