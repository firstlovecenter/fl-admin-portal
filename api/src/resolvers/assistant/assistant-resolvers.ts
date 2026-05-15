import { GraphQLError } from 'graphql'
import { randomUUID } from 'crypto'
import neo4j from 'neo4j-driver'
import { permitLeaderAdmin } from '../permissions'
import { Context } from '../utils/neo4j-types'
import { isAuth, throwToSentry } from '../utils/utils'
import { getIsoWeek } from '../utils/iso-week'
import { loadSecrets } from '../secrets'
import READ_WEEKLY_TIP_FOR_CHURCH_CYPHER, {
  RETRIEVE_PASSAGES_FOR_CHAT_CYPHER,
  RETRIEVE_VERSES_FOR_CHAT_CYPHER,
  LIST_CHAT_SESSIONS_CYPHER,
  GET_CHAT_SESSION_CYPHER,
  COUNT_SESSION_MESSAGES_CYPHER,
  READ_SESSION_HISTORY_CYPHER,
  CREATE_CHAT_SESSION_CYPHER,
  APPEND_CHAT_MESSAGE_CYPHER,
  UPDATE_CHAT_SESSION_TITLE_CYPHER,
  DELETE_CHAT_SESSION_CYPHER,
} from './assistant-cypher'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const llm = require('../../scripts/utils/llm-client')

const RETRIEVAL_K_PASSAGES = 6
const RETRIEVAL_K_VERSES = 4
const CHAT_HISTORY_TURNS_CAP = 20 // most recent N turns sent to Claude
const CHAT_MODEL = 'claude-haiku-4-5-20251001'
const TITLE_MODEL = 'claude-haiku-4-5-20251001'

// ---------------------------------------------------------------------------
// myWeeklyTip equivalent — `weeklyTipForChurch` (Query)
// ---------------------------------------------------------------------------

type WeeklyTipArgs = {
  churchId: string
}

const ensureChurchAccess = (context: Context, churchId: string) => {
  const allowed = context.jwt.allowedChurchIds ?? []
  if (!allowed.includes(churchId)) {
    throw new GraphQLError(
      'You are not permitted to access this church.',
      { extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' } }
    )
  }
}

const weeklyTipForChurch = async (
  _source: unknown,
  args: WeeklyTipArgs,
  context: Context
) => {
  isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)
  ensureChurchAccess(context, args.churchId)

  const now = new Date()
  const year = now.getFullYear()
  const week = getIsoWeek(now)

  const session = context.executionContext.session()
  try {
    const result = await session.executeRead((tx) =>
      tx.run(READ_WEEKLY_TIP_FOR_CHURCH_CYPHER, {
        churchId: args.churchId,
        year,
        week,
      })
    )
    return result.records[0]?.get('tip') ?? null
  } catch (error) {
    return throwToSentry('Error fetching weekly tip for church', error)
  } finally {
    await session.close()
  }
}

// ---------------------------------------------------------------------------
// LLM clients — cached at module level so repeat chat turns don't re-fetch
// AWS Secrets on every call.
// ---------------------------------------------------------------------------

let clientCachePromise:
  | Promise<{ openai: unknown; anthropic: unknown }>
  | null = null

const getClients = async () => {
  if (!clientCachePromise) {
    clientCachePromise = (async () => {
      const SECRETS = await loadSecrets()
      return {
        openai: llm.buildOpenAI(SECRETS),
        anthropic: llm.buildAnthropic(SECRETS),
      }
    })()
  }
  return clientCachePromise
}

// ---------------------------------------------------------------------------
// Prompt — Prophet/Daddy persona + succinct + clarifying-question discipline.
// ---------------------------------------------------------------------------

// Role framing by level. Book mentions are SOFT recommendations — vector
// retrieval has already filtered the supplied passages to relevant material;
// never push toward a book that isn't in the retrieval block.
const chatLevelGuidance = (churchLevel: string | null): string => {
  switch (churchLevel) {
    case 'Bacenta':
      return `The leader is a BACENTA LEADER — they shepherd members directly in a small group. Speak to them as a shepherd of sheep: direct, day-to-day pastoral care of their members. Bacenta leaders are often helped by "What it Means to Become a Shepherd" and "The Mega Church" — but only if those surface in the supplied passages.`
    case 'Governorship':
      return `The leader is a GOVERNOR — they lead Bacenta leaders (under-shepherds) within their Governorship. They are a shepherd of shepherds. FRAME advice as something they should TEACH their Bacenta leaders to do, not just apply themselves. Governors are often helped by "What it Means to Become a Shepherd" and "The Mega Church" — but only if those surface in the supplied passages.`
    case 'Council':
      return `The leader is a COUNCIL Bishop — they lead Governors who lead Bacenta leaders. Frame advice as strategic, big-picture moves. Where useful, suggest content they can pass DOWN as teaching for the Governors and Bacenta leaders under them. Bishops are often helped by "Church Growth" and "The Mega Church" — but only if those surface in the supplied passages.`
    default:
      return `The leader is a ${churchLevel ?? 'higher-level'} leader, operating at a level above Council. Frame advice as strategic, oversight-level guidance. Where useful, suggest content they can equip the leaders under them with. Common touchstones at this level include "Church Growth", "The Mega Church" and "Many Are Called" — but only when they surface in the retrieval.`
  }
}

const buildChatSystemPrompt = (churchLevel: string | null): string => `You are a pastoral assistant for First Love Center, a Pentecostal church in Accra, Ghana, helping church leaders.

${chatLevelGuidance(churchLevel)}

The founder of the church is Bishop Dag Heward-Mills. The leaders affectionately call him "Prophet" or "Daddy". ALWAYS refer to him as Prophet or Daddy in your replies — NEVER as "the founder", "the author", "Bishop", or his full name in the body of the reply (the book recommendation card displays his name separately). For example: "Daddy writes in *Loyalty And Disloyalty*…" or "Prophet teaches in *Church Growth* that…".

Tone & shape (HARD constraints):
- Open with ONE short sentence of warm pastoral acknowledgement.
- Then 1–2 short paragraphs of advice. Lean PRIMARILY on Prophet's books — when a supplied passage contains a sentence or short snippet that directly addresses the leader's question, QUOTE IT VERBATIM inside double quotes followed by the citation in markdown italics, e.g. > "Loyalty is the soil in which trust grows." *(Daddy, Loyalty And Disloyalty)*. Quotes should be at most ~25 words. Paraphrase otherwise — and ALWAYS cite. Scripture is supporting evidence, used sparingly (one short reference at most).
- ALWAYS finish with a short prayer prompt — one sentence inviting the leader to pray about the specific issue (e.g. "Take a moment today to pray that the Lord would steady your heart in this season…"). Prayer is not optional; every problem ends with an encouragement to pray.
- When you cite a passage, suggest the leader read further in the SAME book the quote came from — one short sentence, e.g. "Read more in chapter 4 of *Loyalty And Disloyalty*." Use the book/chapter info from the supplied retrieval block; don't invent chapter numbers.
- Hard cap: ~140 words total. Be conversational, not academic. No bullet-point essays, no numbered five-step plans.
- If the leader asked something BROAD (e.g. "how do I grow my bacenta?"), give a SHORT direct answer pointing at one or two specific Prophet passages, then end with ONE focused clarifying question — placed AFTER the prayer prompt — that would let you give better next-turn advice. Be specific in the clarifying question — not "tell me more"; rather "is the issue attendance, retention, or new visitors right now?".
- If the conversation already contains your earlier clarifying questions, DO NOT repeat them. Build on what the leader has already told you.

Use markdown formatting in your reply (bold for emphasis, italics for citations, headings only if absolutely necessary). The frontend renders markdown.

Never:
- Refer to the leader by name (you don't have it).
- Invent quotes, page numbers, or scripture references.
- Cite a passage or verse that wasn't in the supplied retrieval block.
- Repeat the numeric trend brief verbatim.
- Skip the prayer prompt or the "read further" suggestion — both are mandatory.`

const buildChatContext = (
  passages: Passage[],
  verses: Verse[]
): string => {
  const passageBlock = passages.length
    ? passages
        .map(
          (p) =>
            `[${p.bookTitle} | ${p.citationLabel}]\n${p.text}`
        )
        .join('\n\n---\n\n')
    : '(no passages retrieved for this question — be honest if asked something the supplied passages do not cover)'
  const verseBlock = verses.length
    ? verses
        .map(
          (v) =>
            `[${v.book} ${v.chapter}:${v.verse} (${v.translation})]\n${v.text}`
        )
        .join('\n\n---\n\n')
    : '(no verses retrieved)'
  return `Available Prophet (Dag Heward-Mills) passages:\n\n${passageBlock}\n\nAvailable Bible verses:\n\n${verseBlock}`
}

// ---------------------------------------------------------------------------
// Title summariser — a single tiny Claude call after the first user turn.
// ---------------------------------------------------------------------------

const TITLE_SYSTEM_PROMPT = `Summarise the user's question into a 4–7 word chat thread title. Output ONLY the title text, no quotes, no punctuation at the end.

Rules:
- Title case the first letter of each significant word.
- Be specific: "Planting a New Bacenta" not "Church Growth".
- No emoji. No question marks at the end.
- If the question is gibberish or empty, return "New conversation".`

const summariseTitle = async (
  anthropic: unknown,
  userText: string
): Promise<string> => {
  try {
    const response = await (
      anthropic as {
        messages: {
          create: (req: unknown) => Promise<{
            content: Array<{ type: string; text?: string }>
          }>
        }
      }
    ).messages.create({
      model: TITLE_MODEL,
      max_tokens: 60,
      system: TITLE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userText.slice(0, 400) }],
    })
    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text || '')
      .join(' ')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!raw) return 'New conversation'
    return raw.slice(0, 80)
  } catch (error) {
    // Title is nice-to-have; don't fail the chat turn if the summariser breaks.
    console.warn(
      'Title summariser failed; falling back to default title:',
      llm.summariseError(error)
    )
    return 'New conversation'
  }
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type Passage = {
  id: string
  text: string
  citationLabel: string
  bookTitle: string
  bookAuthor: string
}

type Verse = {
  id: string
  book: string
  chapter: number
  verse: number
  translation: string
  text: string
}

const toJSNumber = (v: unknown): number => {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'object' && v !== null && 'toNumber' in v) {
    return (v as { toNumber: () => number }).toNumber()
  }
  return Number(v)
}

// ---------------------------------------------------------------------------
// Query — myChatSessions (sidebar list)
// ---------------------------------------------------------------------------

type MyChatSessionsArgs = {
  churchId: string
  limit?: number
}

const myChatSessions = async (
  _source: unknown,
  args: MyChatSessionsArgs,
  context: Context
) => {
  isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)
  ensureChurchAccess(context, args.churchId)

  if (!context.jwt.userId) {
    throw new GraphQLError('Authenticated user required.', {
      extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' },
    })
  }

  const session = context.executionContext.session()
  try {
    const result = await session.executeRead((tx) =>
      tx.run(LIST_CHAT_SESSIONS_CYPHER, {
        leaderId: context.jwt.userId,
        churchId: args.churchId,
        limit: neo4j.int(Math.max(1, Math.min(args.limit ?? 30, 100))),
      })
    )
    return result.records.map((r) => ({
      id: r.get('id'),
      title: r.get('title'),
      churchId: r.get('churchId'),
      updatedAt: r.get('updatedAt'),
      preview: r.get('preview'),
    }))
  } catch (error) {
    return throwToSentry('Error listing chat sessions', error)
  } finally {
    await session.close()
  }
}

// ---------------------------------------------------------------------------
// Query — chatSessionById (load full history when a thread is selected)
// ---------------------------------------------------------------------------

type ChatSessionByIdArgs = {
  sessionId: string
}

const chatSessionById = async (
  _source: unknown,
  args: ChatSessionByIdArgs,
  context: Context
) => {
  isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)

  if (!context.jwt.userId) {
    throw new GraphQLError('Authenticated user required.', {
      extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' },
    })
  }

  const session = context.executionContext.session()
  try {
    const result = await session.executeRead((tx) =>
      tx.run(GET_CHAT_SESSION_CYPHER, {
        sessionId: args.sessionId,
        leaderId: context.jwt.userId,
      })
    )
    const record = result.records[0]
    if (!record) return null
    const churchId = record.get('churchId')
    ensureChurchAccess(context, churchId)
    return {
      id: record.get('id'),
      title: record.get('title'),
      churchId,
      createdAt: record.get('createdAt'),
      updatedAt: record.get('updatedAt'),
      messages: record.get('messages'),
    }
  } catch (error) {
    return throwToSentry('Error fetching chat session', error)
  } finally {
    await session.close()
  }
}

// ---------------------------------------------------------------------------
// Mutation — sendChatMessage
// ---------------------------------------------------------------------------

type SendChatMessageInput = {
  sessionId?: string | null
  churchId: string
  text: string
}

const sendChatMessage = async (
  _source: unknown,
  { input }: { input: SendChatMessageInput },
  context: Context
) => {
  isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)
  ensureChurchAccess(context, input.churchId)

  if (!context.jwt.userId) {
    throw new GraphQLError('Authenticated user required.', {
      extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' },
    })
  }

  const userText = (input.text || '').trim()
  if (!userText) {
    throw new GraphQLError('Message text is required.', {
      extensions: { code: 'BAD_USER_INPUT', severity: 'USER_ERROR' },
    })
  }

  const { openai, anthropic } = await getClients()

  const session = context.executionContext.session()
  try {
    // ── Resolve the church level so we can branch the prompt by role ────
    const churchLevelResult = await session.executeRead((tx) =>
      tx.run(
        `MATCH (church {id: $churchId})
         WHERE any(l IN labels(church) WHERE l IN [
           'Bacenta','Governorship','Council','Stream','Campus','Oversight','Denomination'
         ])
         RETURN [l IN labels(church) WHERE l IN [
           'Bacenta','Governorship','Council','Stream','Campus','Oversight','Denomination'
         ]][0] AS churchLevel`,
        { churchId: input.churchId }
      )
    )
    const churchLevel: string | null =
      churchLevelResult.records[0]?.get('churchLevel') ?? null

    // ── Resolve or create the session ────────────────────────────────────
    let sessionId = input.sessionId ?? null
    let priorMessageCount = 0

    if (sessionId) {
      const countRes = await session.executeRead((tx) =>
        tx.run(COUNT_SESSION_MESSAGES_CYPHER, {
          sessionId,
          leaderId: context.jwt.userId,
        })
      )
      if (countRes.records.length === 0) {
        throw new GraphQLError('Chat session not found.', {
          extensions: { code: 'BAD_USER_INPUT', severity: 'USER_ERROR' },
        })
      }
      priorMessageCount = toJSNumber(countRes.records[0].get('messageCount'))
    } else {
      sessionId = randomUUID()
      await session.executeWrite((tx) =>
        tx.run(CREATE_CHAT_SESSION_CYPHER, {
          sessionId,
          churchId: input.churchId,
          leaderId: context.jwt.userId,
          title: 'New conversation',
        })
      )
    }

    // ── Persist the user turn first so it's safe in the graph even if the
    //    LLM call fails downstream ───────────────────────────────────────
    await session.executeWrite((tx) =>
      tx.run(APPEND_CHAT_MESSAGE_CYPHER, {
        sessionId,
        leaderId: context.jwt.userId,
        messageId: randomUUID(),
        role: 'user',
        text: userText,
        citations: [],
      })
    )

    // ── First-turn title summariser ─────────────────────────────────────
    // Runs in parallel with the rest of this turn, but writes through ITS OWN
    // session — Neo4j sessions can't host two transactions concurrently, and
    // the resolver's `session` may also be closed by the time the summariser
    // resolves.
    const isFirstTurn = priorMessageCount === 0
    const titlePromise: Promise<string | null> = isFirstTurn
      ? summariseTitle(anthropic, userText).then(async (title) => {
          const titleSession = context.executionContext.session()
          try {
            await titleSession.executeWrite((tx) =>
              tx.run(UPDATE_CHAT_SESSION_TITLE_CYPHER, {
                sessionId,
                leaderId: context.jwt.userId,
                title,
              })
            )
            return title
          } finally {
            await titleSession.close()
          }
        })
      : Promise.resolve(null)

    // ── Embed + retrieve passages & verses (serial — one Neo4j session
    //    can't host parallel transactions) ────────────────────────────────
    const vec = await llm.embedSingle(openai, userText)
    const passageResult = await session.executeRead((tx) =>
      tx.run(RETRIEVE_PASSAGES_FOR_CHAT_CYPHER, {
        k: neo4j.int(RETRIEVAL_K_PASSAGES),
        vec,
      })
    )
    const verseResult = await session.executeRead((tx) =>
      tx.run(RETRIEVE_VERSES_FOR_CHAT_CYPHER, {
        k: neo4j.int(RETRIEVAL_K_VERSES),
        vec,
      })
    )
    const historyResult = await session.executeRead((tx) =>
      tx.run(READ_SESSION_HISTORY_CYPHER, {
        sessionId,
        leaderId: context.jwt.userId,
      })
    )

    const passages: Passage[] = passageResult.records.map((r) => ({
      id: r.get('id'),
      text: r.get('text'),
      citationLabel: r.get('citationLabel'),
      bookTitle: r.get('bookTitle'),
      bookAuthor: r.get('bookAuthor'),
    }))
    const verses: Verse[] = verseResult.records.map((r) => ({
      id: r.get('id'),
      book: r.get('book'),
      chapter: toJSNumber(r.get('chapter')),
      verse: toJSNumber(r.get('verse')),
      translation: r.get('translation'),
      text: r.get('text'),
    }))

    // Trim history to the most recent N turns so the prompt stays manageable.
    const rawHistory: { role: string; text: string }[] =
      historyResult.records[0]?.get('history') ?? []
    const trimmedHistory = rawHistory.slice(-CHAT_HISTORY_TURNS_CAP)

    // ── Build Claude conversation. The latest user message is already in
    //    history (we persisted it before retrieval) — don't duplicate. ──
    const claudeMessages = trimmedHistory
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      }))

    // ── Call Claude ─────────────────────────────────────────────────────
    let assistantText = ''
    try {
      const response = await (
        anthropic as {
          messages: {
            create: (req: unknown) => Promise<{
              content: Array<{ type: string; text?: string }>
            }>
          }
        }
      ).messages.create({
        model: CHAT_MODEL,
        max_tokens: 600,
        system: `${buildChatSystemPrompt(churchLevel)}\n\n${buildChatContext(passages, verses)}`,
        messages: claudeMessages,
      })
      assistantText = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text || '')
        .join('\n')
        .trim()
    } catch (error) {
      throwToSentry('Anthropic chat call failed', error)
    }

    if (!assistantText) {
      assistantText =
        "I couldn't draft a reply just now. Try rephrasing the question, or check back in a moment."
    }

    // ── Citation labels used to ground the reply ──────────────────────
    const citationLabels = [
      ...passages.map(
        (p) => `${p.bookTitle} — ${p.citationLabel}`
      ),
      ...verses.map(
        (v) => `${v.book} ${v.chapter}:${v.verse} (${v.translation})`
      ),
    ]

    // ── Persist assistant turn ───────────────────────────────────────
    const assistantMessageId = randomUUID()
    const persistResult = await session.executeWrite((tx) =>
      tx.run(APPEND_CHAT_MESSAGE_CYPHER, {
        sessionId,
        leaderId: context.jwt.userId,
        messageId: assistantMessageId,
        role: 'assistant',
        text: assistantText,
        citations: citationLabels,
      })
    )
    const persisted = persistResult.records[0]
    const finalTitle = (await titlePromise) ?? null

    return {
      sessionId,
      title: finalTitle ?? 'New conversation',
      message: {
        id: persisted.get('id'),
        role: persisted.get('role'),
        text: persisted.get('text'),
        createdAt: persisted.get('createdAt'),
        citations: persisted.get('citations') ?? [],
      },
    }
  } catch (error) {
    return throwToSentry('Error in sendChatMessage', error)
  } finally {
    await session.close()
  }
}

// ---------------------------------------------------------------------------
// Mutation — deleteChatSession
// ---------------------------------------------------------------------------

type DeleteChatSessionArgs = {
  sessionId: string
}

const deleteChatSession = async (
  _source: unknown,
  args: DeleteChatSessionArgs,
  context: Context
) => {
  isAuth(permitLeaderAdmin('Bacenta'), context.jwt.roles)
  if (!context.jwt.userId) {
    throw new GraphQLError('Authenticated user required.', {
      extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' },
    })
  }
  const session = context.executionContext.session()
  try {
    const result = await session.executeWrite((tx) =>
      tx.run(DELETE_CHAT_SESSION_CYPHER, {
        sessionId: args.sessionId,
        leaderId: context.jwt.userId,
      })
    )
    return toJSNumber(result.records[0]?.get('deleted')) > 0
  } catch (error) {
    return throwToSentry('Error deleting chat session', error)
  } finally {
    await session.close()
  }
}

const assistantResolvers = {
  Query: {
    weeklyTipForChurch,
    myChatSessions,
    chatSessionById,
  },
  Mutation: {
    sendChatMessage,
    deleteChatSession,
  },
}

export default assistantResolvers
