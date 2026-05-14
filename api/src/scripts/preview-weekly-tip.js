#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Offline tip-preview tool. Runs the full RAG pipeline (trend brief → embed →
 * retrieve → Claude) for ONE church and prints the prompt + Claude response.
 *
 * Use this to iterate on prompts, retrieval thresholds, and tip content
 * without running the full Lambda batch. By default it does NOT write to
 * Neo4j — pass `--write` to persist the result.
 *
 * Usage:
 *   # Preview the tip for a specific church (no Neo4j write):
 *   node api/src/scripts/preview-weekly-tip.js --church <Church.id>
 *
 *   # Preview AND persist (overwriting this week's WeeklyTip for that church):
 *   node api/src/scripts/preview-weekly-tip.js --church <Church.id> --write
 *
 *   # Test prompt-shaping with synthetic trend data (no real church needed):
 *   node api/src/scripts/preview-weekly-tip.js --syntheticTrend "Attendance up 18% over 4 weeks; bussing flat at 30; no income drop."
 *
 *   # Override the church level when using synthetic data:
 *   node api/src/scripts/preview-weekly-tip.js --syntheticTrend "..." --level Bacenta --churchName "Test Bacenta"
 *
 * Verifies retrieval is working when the knowledge base is empty — the
 * script will refuse to call Claude if no passages or verses come back, and
 * tells you why.
 */

const path = require('path')
const dotenv = require('dotenv')
const neo4j = require('neo4j-driver')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')

const {
  buildOpenAI,
  buildAnthropic,
  embedBatch,
} = require('./utils/llm-client')

const {
  BACENTA_SERVICE_TREND_CYPHER,
  BACENTA_BUSSING_TREND_CYPHER,
  HIGHER_LEVEL_SERVICE_TREND_CYPHER,
  HIGHER_LEVEL_BUSSING_TREND_CYPHER,
  RETRIEVE_PASSAGES_CYPHER,
  RETRIEVE_VERSES_CYPHER,
  UPSERT_WEEKLY_TIP_CYPHER,
} = require('../functions/background/weekly-tip-generator/weekly-tip-cypher')

const args = process.argv.slice(2)
const getFlag = (name, fallback = undefined) => {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1) return fallback
  return args[idx + 1]
}

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`
Weekly tip preview (offline / single-church).

Modes:
  Real church mode:
    --church <Church.id>      Fetch trend data from Neo4j and generate a tip
    [--write]                 Also persist the tip to Neo4j (default: print only)

  Synthetic mode:
    --syntheticTrend "<text>" Use this brief instead of querying Neo4j
    [--level <Level>]         Bacenta | Governorship | ... (default: Bacenta)
    [--churchId <id>]         Synthetic church id for the tip id (default: synthetic)
    [--churchName <name>]     Display name (default: "Synthetic Test Church")
    [--write]                 Persist (rare; useful for end-to-end e2e tests)

Other:
  --help, -h                 Show this help
`)
  process.exit(0)
}

const TIP_MODEL = 'claude-haiku-4-5-20251001'

// ---------------------------------------------------------------------------
// ISO week (duplicated locally so the preview script is standalone)
// ---------------------------------------------------------------------------
const getIsoWeek = (date = new Date()) => {
  const t = new Date(date.getTime())
  t.setHours(0, 0, 0, 0)
  const dayNum = t.getDay() || 7
  t.setDate(t.getDate() + 4 - dayNum)
  const yearStart = new Date(t.getFullYear(), 0, 1)
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

const toNumber = (n) => {
  if (n === null || n === undefined) return null
  if (typeof n === 'number') return n
  if (typeof n.toNumber === 'function') return n.toNumber()
  return n
}

// ---------------------------------------------------------------------------
// Trend-brief builders (mirror the Lambda)
// ---------------------------------------------------------------------------
const buildBacentaTrendBrief = (services, bussing) => {
  if (!services.length && !bussing.length) {
    return 'No service or bussing records in the last 12 weeks. The Bacenta has been quiet — encouragement and a gentle nudge toward re-engagement is appropriate.'
  }
  const lines = []
  if (services.length) {
    const att = services.map((s) => toNumber(s.attendance))
    const recent = att.slice(-4)
    const prior = att.slice(0, -4)
    const recentAvg = recent.length
      ? recent.reduce((acc, n) => acc + n, 0) / recent.length
      : 0
    const priorAvg = prior.length
      ? prior.reduce((acc, n) => acc + n, 0) / prior.length
      : 0
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
    const recentAvg = recent.length
      ? recent.reduce((acc, n) => acc + n, 0) / recent.length
      : 0
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
  const avgAtt = att.reduce((acc, n) => acc + n, 0) / att.length
  const avgInc = inc.reduce((acc, n) => acc + n, 0) / inc.length
  const bussingTotal = bussing.reduce(
    (acc, b) => acc + (toNumber(b.attendance) || 0),
    0
  )
  return `${churchLevel} leader. 12-week service attendance avg ${avgAtt.toFixed(
    0
  )} per week; income avg GHS ${avgInc.toFixed(0)} per week. Total bussing attendance over the window: ${bussingTotal}.`
}

const SYSTEM_PROMPT = `You are a pastoral assistant for First Love Center, a Pentecostal church based in Accra, Ghana. You write short, encouraging weekly tips for church leaders.

Your tips are grounded in:
1. The church's recent ministry trends (attendance, bussing, income) — provided as a brief numeric summary.
2. Retrieved passages from the founder's books — provided with citation labels.
3. Retrieved Bible verses — provided with book/chapter/verse and translation.

Constraints:
- Tips must be 80–150 words, warm, practical, and specific to the church's situation.
- Always quote one Bible verse and one founder's passage.
- Recommend one book the leader could read next from the supplied passages' source books.
- Output STRICT JSON only, no prose around it.
- Never mention the leader's name (you don't have it).
- Never repeat the numeric trend brief verbatim — interpret it.

Output JSON shape:
{
  "body": "plain-text tip suitable for a card UI",
  "verseId": "id of the chosen verse from the verses list",
  "passageId": "id of the chosen passage from the passages list",
  "bookId": "id of the recommended book — must match the chosen passage's bookId",
  "rationale": "one sentence on why this advice fits — internal-only, will not be shown"
}`

const buildUserPrompt = ({
  churchLevel,
  churchName,
  trendBrief,
  passages,
  verses,
}) => {
  const passageBlock = passages
    .map(
      (p) =>
        `[passageId: ${p.id} | bookId: ${p.bookId} | book: ${JSON.stringify(
          p.bookTitle
        )} by ${p.bookAuthor} | citation: ${p.citationLabel}]\n${p.text}`
    )
    .join('\n\n---\n\n')
  const verseBlock = verses
    .map(
      (v) =>
        `[verseId: ${v.id} | ${v.book} ${v.chapter}:${v.verse} (${v.translation})]\n${v.text}`
    )
    .join('\n\n---\n\n')
  return `Church level: ${churchLevel}\nChurch name: ${churchName}\n\nRecent trend brief:\n${trendBrief}\n\nRetrieved founder passages:\n\n${passageBlock}\n\nRetrieved Bible verses:\n\n${verseBlock}\n\nWrite the weekly tip now. Output JSON only.`
}

const extractJson = (text) => {
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  const candidate = fenced
    ? fenced[1]
    : (text.match(/\{[\s\S]*\}/) || [null])[0]
  if (!candidate) return null
  try {
    return JSON.parse(candidate)
  } catch (err) {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const churchIdArg = getFlag('church', null)
  const syntheticTrend = getFlag('syntheticTrend', null)
  const shouldWrite = args.includes('--write')
  const levelOverride = getFlag('level', 'Bacenta')
  const churchNameOverride = getFlag('churchName', 'Synthetic Test Church')
  const syntheticChurchId = getFlag('churchId', 'synthetic')

  if (!churchIdArg && !syntheticTrend) {
    console.error('Missing --church or --syntheticTrend. Run with --help.')
    process.exit(1)
  }

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
    )
  )

  const session = driver.session()
  try {
    let churchId
    let churchName
    let churchLevel
    let trendBrief

    if (syntheticTrend) {
      churchId = syntheticChurchId
      churchName = churchNameOverride
      churchLevel = levelOverride
      trendBrief = syntheticTrend
      console.log(
        `\nSynthetic mode — churchId=${churchId} level=${churchLevel}`
      )
    } else {
      // Resolve the real church.
      const churchResult = await session.run(
        `
        MATCH (church {id: $churchId})
        WHERE any(l IN labels(church) WHERE l IN [
          'Bacenta','Governorship','Council','Stream','Campus','Oversight','Denomination'
        ])
        RETURN
          church.id AS churchId,
          church.name AS churchName,
          [l IN labels(church) WHERE l IN [
            'Bacenta','Governorship','Council','Stream','Campus','Oversight','Denomination'
          ]][0] AS churchLevel
        `,
        { churchId: churchIdArg }
      )
      const record = churchResult.records[0]
      if (!record) {
        console.error(
          `Church not found or not a spine church: ${churchIdArg}`
        )
        process.exit(1)
      }
      churchId = record.get('churchId')
      churchName = record.get('churchName')
      churchLevel = record.get('churchLevel')
      console.log(
        `\nReal church mode — churchId=${churchId} name="${churchName}" level=${churchLevel}`
      )

      // Pull trend data with the same Cypher the Lambda uses.
      const now = new Date()
      const year = now.getFullYear()
      const week = getIsoWeek(now)
      let startYear = year
      let startWeek = week - 12
      if (startWeek < 1) {
        startYear -= 1
        startWeek += 52
      }

      let services = []
      let bussing = []
      if (churchLevel === 'Bacenta') {
        const sr = await session.run(BACENTA_SERVICE_TREND_CYPHER, {
          churchId,
        })
        services = sr.records[0]?.get('trend') || []
        const br = await session.run(BACENTA_BUSSING_TREND_CYPHER, {
          churchId,
        })
        bussing = br.records[0]?.get('trend') || []
      } else {
        const sr = await session.run(HIGHER_LEVEL_SERVICE_TREND_CYPHER, {
          churchId,
          startYear: neo4j.int(startYear),
          startWeek: neo4j.int(startWeek),
        })
        services = sr.records[0]?.get('trend') || []
        const br = await session.run(HIGHER_LEVEL_BUSSING_TREND_CYPHER, {
          churchId,
          startYear: neo4j.int(startYear),
          startWeek: neo4j.int(startWeek),
        })
        bussing = br.records[0]?.get('trend') || []
      }

      trendBrief =
        churchLevel === 'Bacenta'
          ? buildBacentaTrendBrief(services, bussing)
          : buildHigherLevelTrendBrief(services, bussing, churchLevel)
    }

    console.log('\n--- Trend brief ---')
    console.log(trendBrief)

    const openai = buildOpenAI(SECRETS)
    const anthropic = buildAnthropic(SECRETS)

    // Embed the trend brief, retrieve passages + verses.
    const [vec] = await embedBatch(openai, [trendBrief])
    if (!vec) {
      console.error('Embedding failed — no vector returned.')
      process.exit(1)
    }

    const passagesResult = await session.run(RETRIEVE_PASSAGES_CYPHER, {
      k: neo4j.int(8),
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
      k: neo4j.int(5),
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

    console.log(
      `\n--- Retrieval ---\n  ${passages.length} passages, ${verses.length} verses returned.`
    )
    passages.forEach((p) =>
      console.log(
        `  passage ${p.id} (score ${Number(p.score).toFixed(3)}): "${p.text.slice(0, 80)}…"`
      )
    )
    verses.forEach((v) =>
      console.log(
        `  verse ${v.id} (score ${Number(v.score).toFixed(3)}): "${v.text.slice(0, 80)}…"`
      )
    )

    if (passages.length === 0 || verses.length === 0) {
      console.error(
        '\nKnowledge base is empty or under-populated. Aborting before Claude call.\nRun ingest-bible.js and ingest-book.js first.'
      )
      process.exit(1)
    }

    // Call Claude.
    const userPrompt = buildUserPrompt({
      churchLevel,
      churchName,
      trendBrief,
      passages,
      verses,
    })
    console.log('\n--- User prompt (truncated) ---')
    console.log(userPrompt.slice(0, 1200))
    if (userPrompt.length > 1200) console.log(`  …(${userPrompt.length - 1200} more chars)`)

    const message = await anthropic.messages.create({
      model: TIP_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const raw = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text || '')
      .join('\n')
    const parsed = extractJson(raw)

    console.log('\n--- Claude raw response ---')
    console.log(raw)
    console.log('\n--- Parsed JSON ---')
    console.log(JSON.stringify(parsed, null, 2))

    if (!shouldWrite) {
      console.log('\nNot writing (omit --write to keep this preview-only).')
      return
    }
    if (!parsed) {
      console.error('Cannot persist — Claude returned no parseable JSON.')
      process.exit(1)
    }

    const verseId =
      verses.find((v) => v.id === parsed.verseId)?.id || verses[0].id
    const passage =
      passages.find((p) => p.id === parsed.passageId) || passages[0]
    const bookId =
      parsed.bookId === passage.bookId ? parsed.bookId : passage.bookId

    const now = new Date()
    const year = now.getFullYear()
    const week = getIsoWeek(now)
    const tipId = `${churchId}-${year}-${week}`

    await session.run(UPSERT_WEEKLY_TIP_CYPHER, {
      churchId,
      tipId,
      week: neo4j.int(week),
      year: neo4j.int(year),
      body: parsed.body,
      model: TIP_MODEL,
      inputHash: 'preview-script',
      verseId,
      passageId: passage.id,
      bookId,
    })

    console.log(`\nPersisted: tip id ${tipId}`)
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch((error) => {
  console.error('Preview failed:', error)
  process.exit(1)
})
