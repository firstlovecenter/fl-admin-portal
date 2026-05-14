/* eslint-disable no-console, no-await-in-loop */

const neo4j = require('neo4j-driver')
const crypto = require('crypto')

const { loadSecrets } = require('./secrets')
const {
  buildOpenAI,
  buildAnthropic,
  embedSingle,
  generateTipJson,
  summariseError,
} = require('./llm-client')
const {
  LIST_CHURCHES_CYPHER,
  BACENTA_SERVICE_TREND_CYPHER,
  BACENTA_BUSSING_TREND_CYPHER,
  HIGHER_LEVEL_SERVICE_TREND_CYPHER,
  HIGHER_LEVEL_BUSSING_TREND_CYPHER,
  RETRIEVE_PASSAGES_CYPHER,
  RETRIEVE_VERSES_CYPHER,
  UPSERT_WEEKLY_TIP_CYPHER,
} = require('./weekly-tip-cypher')

const RETRIEVAL_K_PASSAGES = 8
const RETRIEVAL_K_VERSES = 5

// ISO week number — Thursday-anchored, same as accra-campus-weekly. The tip id
// is keyed (churchId, year, week) per ADR-014.
const getIsoWeek = (date = new Date()) => {
  const t = new Date(date.getTime())
  t.setHours(0, 0, 0, 0)
  const dayNum = t.getDay() || 7
  t.setDate(t.getDate() + 4 - dayNum)
  const yearStart = new Date(t.getFullYear(), 0, 1)
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// Neo4j ints arrive as `{ low, high }` — convert to JS number when small enough.
const toNumber = (n) => {
  if (n === null || n === undefined) return null
  if (typeof n === 'number') return n
  if (typeof n.toNumber === 'function') return n.toNumber()
  return n
}

const buildBacentaTrendBrief = (services, bussing) => {
  if (!services.length && !bussing.length) {
    return 'No service or bussing records in the last 12 weeks. The Bacenta has been quiet — encouragement and a gentle nudge toward re-engagement is appropriate.'
  }
  const lines = []
  if (services.length) {
    const att = services.map((s) => toNumber(s.attendance))
    const recent = att.slice(-4)
    const prior = att.slice(0, -4)
    const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
    const priorAvg = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : 0
    const delta = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0
    lines.push(
      `Service attendance: ${services.length} weeks of data. Recent 4-week avg ${recentAvg.toFixed(
        1
      )}; prior 8-week avg ${priorAvg.toFixed(1)} (${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%).`
    )
  } else {
    lines.push('Service attendance: no records in the last 12 weeks.')
  }
  if (bussing.length) {
    const att = bussing.map((b) => toNumber(b.attendance) || 0)
    const recent = att.slice(-4)
    const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
    lines.push(
      `Bussing attendance: ${bussing.length} weeks of data, recent 4-week avg ${recentAvg.toFixed(1)}.`
    )
  } else {
    lines.push('Bussing: no records in the last 12 weeks.')
  }
  return lines.join(' ')
}

const buildHigherLevelTrendBrief = (services, bussing, churchLevel) => {
  if (!services.length) {
    return `${churchLevel} leader. No aggregate data in the last 12 weeks — the aggregator may be lagging, or oversight time is the right focus.`
  }
  const att = services.map((s) => toNumber(s.attendance) || 0)
  const inc = services.map((s) => toNumber(s.income) || 0)
  const avgAtt = att.reduce((a, b) => a + b, 0) / att.length
  const avgInc = inc.reduce((a, b) => a + b, 0) / inc.length
  const bussingTotal = bussing.reduce((sum, b) => sum + (toNumber(b.attendance) || 0), 0)
  return `${churchLevel} leader. 12-week service attendance avg ${avgAtt.toFixed(
    0
  )} per week; income avg GHS ${avgInc.toFixed(0)} per week. Total bussing attendance over the window: ${bussingTotal}.`
}

const SYSTEM_PROMPT = `You are a pastoral assistant for First Love Center, a Pentecostal church based in Accra, Ghana. You write short, encouraging weekly tips for church leaders.

Your tips are grounded in:
1. The leader's recent ministry trends (attendance, bussing, income) — provided as a brief numeric summary.
2. Retrieved passages from the founder's books — provided with citation labels.
3. Retrieved Bible verses — provided with book/chapter/verse and translation.

Constraints:
- Tips must be 80–150 words, warm, practical, and specific to the leader's situation.
- Always quote one Bible verse and one founder's passage.
- Recommend one book the leader could read next from the supplied passages' source books.
- Output STRICT JSON only, no prose around it.
- Never mention the leader's name (you don't have it).
- Never repeat the numeric trend brief verbatim — interpret it.

Output JSON shape:
{
  "body": "plain-text tip suitable for a card UI",
  "bodyMarkdown": "same tip with simple markdown (italics for scripture, bold for the book recommendation)",
  "verseId": "id of the chosen verse from the verses list",
  "passageId": "id of the chosen passage from the passages list",
  "bookId": "id of the recommended book — must match the chosen passage's bookId",
  "rationale": "one sentence on why this advice fits — internal-only, will not be shown"
}`

const buildUserPrompt = ({ churchLevel, churchName, trendBrief, passages, verses }) => {
  const passageBlock = passages
    .map(
      (p) =>
        `[passageId: ${p.id} | bookId: ${p.bookId} | book: "${p.bookTitle}" by ${p.bookAuthor} | citation: ${p.citationLabel}]\n${p.text}`
    )
    .join('\n\n---\n\n')
  const verseBlock = verses
    .map(
      (v) =>
        `[verseId: ${v.id} | ${v.book} ${v.chapter}:${v.verse} (${v.translation})]\n${v.text}`
    )
    .join('\n\n---\n\n')
  return `Church level: ${churchLevel}\nChurch name: ${churchName}\n\nLeader's recent trend brief:\n${trendBrief}\n\nRetrieved founder passages:\n\n${passageBlock}\n\nRetrieved Bible verses:\n\n${verseBlock}\n\nWrite the weekly tip now. Output JSON only.`
}

// Stable hash of the inputs so re-runs can skip leaders whose situation hasn't
// changed since last week (cuts cost on idle leaders). Only the inputs that
// shape the model's response are included — not timestamps.
const computeInputHash = ({ trendBrief, passageIds, verseIds }) => {
  const payload = JSON.stringify({ trendBrief, passageIds, verseIds })
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16)
}

const processChurch = async ({
  driver,
  openai,
  anthropic,
  church,
  year,
  week,
  startYear,
  startWeek,
  dryRun,
}) => {
  const tipId = `${church.churchId}-${year}-${week}`
  // One session per church so a failed query on one cannot poison the
  // shared transactional bookmarks for the rest of the run.
  const session = driver.session()
  try {
    return await processChurchInner({
      session,
      openai,
      anthropic,
      church,
      year,
      week,
      startYear,
      startWeek,
      dryRun,
      tipId,
    })
  } finally {
    await session.close()
  }
}

const processChurchInner = async ({
  session,
  openai,
  anthropic,
  church,
  year,
  week,
  startYear,
  startWeek,
  dryRun,
  tipId,
}) => {
  let services = []
  let bussing = []
  if (church.churchLevel === 'Bacenta') {
    const sr = await session.run(BACENTA_SERVICE_TREND_CYPHER, {
      churchId: church.churchId,
    })
    services = sr.records[0]?.get('trend') || []
    const br = await session.run(BACENTA_BUSSING_TREND_CYPHER, {
      churchId: church.churchId,
    })
    bussing = br.records[0]?.get('trend') || []
  } else {
    const sr = await session.run(HIGHER_LEVEL_SERVICE_TREND_CYPHER, {
      churchId: church.churchId,
      startYear: neo4j.int(startYear),
      startWeek: neo4j.int(startWeek),
    })
    services = sr.records[0]?.get('trend') || []
    const br = await session.run(HIGHER_LEVEL_BUSSING_TREND_CYPHER, {
      churchId: church.churchId,
      startYear: neo4j.int(startYear),
      startWeek: neo4j.int(startWeek),
    })
    bussing = br.records[0]?.get('trend') || []
  }

  const trendBrief =
    church.churchLevel === 'Bacenta'
      ? buildBacentaTrendBrief(services, bussing)
      : buildHigherLevelTrendBrief(services, bussing, church.churchLevel)

  // Embed the trend brief and retrieve passages + verses.
  const vec = await embedSingle(openai, trendBrief)
  const passagesResult = await session.run(RETRIEVE_PASSAGES_CYPHER, {
    k: neo4j.int(RETRIEVAL_K_PASSAGES),
    vec,
  })
  const passages = passagesResult.records.map((r) => ({
    id: r.get('id'),
    text: r.get('text'),
    citationLabel: r.get('citationLabel'),
    bookId: r.get('bookId'),
    bookTitle: r.get('bookTitle'),
    bookAuthor: r.get('bookAuthor'),
    score: r.get('score'),
  }))

  const versesResult = await session.run(RETRIEVE_VERSES_CYPHER, {
    k: neo4j.int(RETRIEVAL_K_VERSES),
    vec,
  })
  const verses = versesResult.records.map((r) => ({
    id: r.get('id'),
    book: r.get('book'),
    chapter: toNumber(r.get('chapter')),
    verse: toNumber(r.get('verse')),
    translation: r.get('translation'),
    text: r.get('text'),
    score: r.get('score'),
  }))

  if (passages.length === 0 || verses.length === 0) {
    return {
      churchId: church.churchId,
      status: 'skipped',
      reason: `Retrieval returned ${passages.length} passages and ${verses.length} verses — knowledge base may be empty.`,
    }
  }

  const inputHash = computeInputHash({
    trendBrief,
    passageIds: passages.map((p) => p.id),
    verseIds: verses.map((v) => v.id),
  })

  if (dryRun) {
    return {
      churchId: church.churchId,
      status: 'dryRun',
      tipId,
      inputHash,
      passageCount: passages.length,
      verseCount: verses.length,
    }
  }

  // Generate the tip.
  const { parsed, model } = await generateTipJson(anthropic, {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt({
      churchLevel: church.churchLevel,
      churchName: church.churchName,
      trendBrief,
      passages,
      verses,
    }),
  })

  // Defensive: ensure the model picked ids that actually exist in our supplied
  // lists. Fall back to the top-scoring item if it hallucinated.
  const verseId = verses.find((v) => v.id === parsed.verseId)?.id || verses[0].id
  const passage = passages.find((p) => p.id === parsed.passageId) || passages[0]
  const bookId = parsed.bookId === passage.bookId ? parsed.bookId : passage.bookId

  await session.run(UPSERT_WEEKLY_TIP_CYPHER, {
    churchId: church.churchId,
    tipId,
    week: neo4j.int(week),
    year: neo4j.int(year),
    body: parsed.body,
    model,
    inputHash,
    verseId,
    passageId: passage.id,
    bookId,
  })

  return {
    churchId: church.churchId,
    status: 'written',
    tipId,
    inputHash,
    model,
  }
}

const handler = async (event = {}) => {
  const dryRun = event.dryRun === true
  const onlyChurchId = event.onlyChurchId || null
  // Don't log the raw event — a future caller might pass church ids or
  // anything else. Log shape only.
  console.log('Weekly tip generator invoked', {
    dryRun,
    onlyChurch: onlyChurchId ? 'set' : 'none',
  })
  const startedAt = Date.now()

  const SECRETS = await loadSecrets()
  const uri =
    SECRETS.NEO4J_ENCRYPTED === 'true'
      ? SECRETS.NEO4J_URI?.replace('bolt://', 'neo4j+s://')
      : SECRETS.NEO4J_URI || 'bolt://localhost:7687'

  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    ),
    { maxConnectionPoolSize: 10, connectionTimeout: 30000 }
  )
  await driver.verifyConnectivity()

  const openai = buildOpenAI(SECRETS)
  const anthropic = buildAnthropic(SECRETS)

  const now = new Date()
  const year = now.getFullYear()
  const week = getIsoWeek(now)
  // 12-week trend window. We pass (startYear, startWeek) as separate ints so
  // the Cypher predicate can index-seek instead of computing year*100+week.
  const windowWeeks = 12
  let startYear = year
  let startWeek = week - windowWeeks
  if (startWeek < 1) {
    startYear -= 1
    startWeek += 52
  }

  const counters = { processed: 0, written: 0, skipped: 0, errors: 0, dryRun: 0 }

  try {
    // Fetch the church list once via its own short-lived session.
    const listSession = driver.session()
    let churches
    try {
      const churchesResult = await listSession.run(LIST_CHURCHES_CYPHER, {
        onlyChurchId,
      })
      churches = churchesResult.records.map((r) => ({
        churchId: r.get('churchId'),
        churchName: r.get('churchName'),
        churchLevel: r.get('churchLevel'),
      }))
    } finally {
      await listSession.close()
    }
    console.log(`Processing ${churches.length} church(es) for ${year} W${week}.`)

    for (const church of churches) {
      counters.processed += 1
      try {
        // processChurch opens its own session so a failure on one church
        // cannot poison the rest of the run.
        const result = await processChurch({
          driver,
          openai,
          anthropic,
          church,
          year,
          week,
          startYear,
          startWeek,
          dryRun,
        })
        if (result.status === 'written') counters.written += 1
        else if (result.status === 'skipped') counters.skipped += 1
        else if (result.status === 'dryRun') counters.dryRun += 1
        if (counters.processed % 25 === 0) {
          console.log(`  Progress: ${counters.processed}/${churches.length}`)
        }
      } catch (error) {
        counters.errors += 1
        console.error(
          `  Church ${church.churchId} (${church.churchLevel}) failed: ${summariseError(error)}`
        )
      }
    }
  } finally {
    await driver.close()
  }

  const durationMs = Date.now() - startedAt
  console.log('Weekly tip generator complete', { ...counters, durationMs })

  return {
    statusCode: 200,
    body: JSON.stringify({ ...counters, durationMs, week, year }),
  }
}

module.exports = { handler }
exports.handler = handler
