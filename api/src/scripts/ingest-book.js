#!/usr/bin/env node
/* eslint-disable no-console, no-await-in-loop */

/**
 * Ingests a single book (PDF or EPUB) into Neo4j as the AI Assistant's
 * knowledge base (Phase 1).
 *
 * Pipeline:
 *   1. Read file (PDF via pdf-parse, EPUB via epub2).
 *   2. Detect chapters via a heading regex; fall back to "Full Text".
 *   3. Split each chapter into ~500-token passages with ~50-token overlap.
 *   4. Embed all passages via OpenAI `text-embedding-3-small` (batched).
 *   5. MERGE :Book / :BookChapter / :BookPassage nodes with embeddings + edges.
 *
 * Idempotent: re-running with the same --title overwrites passage text and
 * embedding via SET; passage ids are deterministic so no orphans accumulate
 * if the chunking strategy stays stable.
 *
 * Usage:
 *   node api/src/scripts/ingest-book.js --file ./books/foo.pdf --title "Foo" --author "Bishop Dag"
 *   node api/src/scripts/ingest-book.js --file ./books/foo.epub --title "Foo" --author "Bishop Dag" --subtitle "..." --publishedYear 2018
 */

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const pdfParse = require('pdf-parse')
const { EPub } = require('epub2')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')
const {
  buildOpenAI,
  embedBatch,
  EMBEDDING_DIMS,
} = require('./utils/llm-client')
const { buildNeo4jDriver } = require('./utils/neo4j-driver')

const args = process.argv.slice(2)

const getFlag = (name, fallback = undefined) => {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1) return fallback
  return args[idx + 1]
}

const showHelp = () => {
  console.log(`
Book ingestion CLI — adds a book to the Neo4j AI Assistant knowledge base.

Usage:
  node api/src/scripts/ingest-book.js --file <path> --title <title> --author <author> [options]

Required:
  --file <path>             Absolute or relative path to a .pdf or .epub file
  --title <title>           Book title (used to derive the stable book id)
  --author <author>         Author full name

Optional:
  --subtitle <text>         Subtitle
  --publishedYear <year>    4-digit year
  --help, -h                Show this help

Examples:
  node api/src/scripts/ingest-book.js --file ./books/loyalty.pdf --title "Loyalty And Disloyalty" --author "Dag Heward-Mills"
`)
}

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  showHelp()
  process.exit(0)
}

const filePath = getFlag('file')
const title = getFlag('title')
const author = getFlag('author')
const subtitle = getFlag('subtitle')
const publishedYear = getFlag('publishedYear')

if (!filePath || !title || !author) {
  console.error('Missing required flag. Run with --help for usage.')
  process.exit(1)
}

const absoluteFilePath = path.resolve(filePath)
if (!fs.existsSync(absoluteFilePath)) {
  console.error(`File not found: ${absoluteFilePath}`)
  process.exit(1)
}

// Stable, human-readable ids. Slugify the title so re-runs target the same nodes.
const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const bookId = slugify(title)

// Character-based token estimate (1 token ≈ 4 chars for English prose).
// Avoids pulling in tiktoken native bindings; close enough for chunking.
const estimateTokens = (text) => Math.ceil(text.length / 4)
const TARGET_TOKENS_PER_PASSAGE = 500
const OVERLAP_TOKENS = 50
const TARGET_CHARS = TARGET_TOKENS_PER_PASSAGE * 4
const OVERLAP_CHARS = OVERLAP_TOKENS * 4

const readPdf = async (file) => {
  const buffer = fs.readFileSync(file)
  const data = await pdfParse(buffer)
  return data.text
}

// Decode the common HTML entities EPUB content leaves behind after tag
// stripping (&nbsp;, &amp;, &quot;, &#39;, &apos;, &lt;, &gt;). Without
// this step passages end up with literal "&nbsp;" sprinkled through the
// text, which the assistant happily quotes back at the leader.
const decodeHtmlEntities = (text) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))

// EPUB readers give us pre-split chapter files via `epub.flow`. We use those
// directly instead of trying to re-split a concatenated string with a regex —
// HTML-stripped EPUB text has no internal newlines, which breaks
// chapter-heading detection. Returns an array of {title, body} chapters.
const readEpubChapters = (file) =>
  new Promise((resolve, reject) => {
    const epub = new EPub(file)
    epub.on('error', reject)
    epub.on('end', async () => {
      try {
        const chapters = []
        let order = 1
        for (const chap of epub.flow) {
          const html = await new Promise((res, rej) => {
            epub.getChapter(chap.id, (err, text) =>
              err ? rej(err) : res(text)
            )
          })
          const body = decodeHtmlEntities(
            html.replace(/<[^>]+>/g, ' ')
          )
            .replace(/\s+/g, ' ')
            .trim()
          if (!body) continue
          const title = (chap.title || chap.id || `Chapter ${order}`)
            .toString()
            .trim()
            .slice(0, 120)
          chapters.push({ title, order, body })
          order += 1
        }
        resolve(chapters)
      } catch (err) {
        reject(err)
      }
    })
    epub.parse()
  })

// PDF/plain-text path. Cap heading match length so we don't swallow the rest
// of a chapter that's been collapsed onto one line. Falls back to "Full Text"
// when no headings are found.
const splitIntoChapters = (text) => {
  const headingRegex =
    /^\s*(CHAPTER|Chapter|chapter)\s+([A-Z0-9IVXLC]+|\d+)\b[^\n]{0,80}/gm
  const matches = []
  let m
  while ((m = headingRegex.exec(text)) !== null) {
    matches.push({ index: m.index, heading: m[0].trim() })
  }
  if (matches.length === 0) {
    return [{ title: 'Full Text', order: 1, body: text.trim() }]
  }
  const chapters = []
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length
    const headingLine = matches[i].heading
    const body = text.slice(start + headingLine.length, end).trim()
    chapters.push({ title: headingLine, order: i + 1, body })
  }
  return chapters
}

// Slice an over-long paragraph by characters with OVERLAP_CHARS overlap.
// Used when a single paragraph (e.g. an EPUB chapter whose HTML stripped to a
// single string of text) exceeds TARGET_CHARS — without this the greedy
// concat below produces one chunk per chapter instead of dozens.
const sliceLongParagraph = (text) => {
  const out = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + TARGET_CHARS, text.length)
    out.push(text.slice(start, end))
    if (end >= text.length) break
    start = end - OVERLAP_CHARS
  }
  return out
}

// Greedy paragraph-aware chunking with a sliding overlap. Paragraphs are
// concatenated until adding the next would exceed TARGET_CHARS; the last
// OVERLAP_CHARS of the previous chunk seeds the next so context isn't cut
// mid-sentence. Paragraphs longer than TARGET_CHARS are pre-sliced.
const chunkChapter = (body) => {
  if (!body.trim()) return []
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .flatMap((p) => (p.length > TARGET_CHARS ? sliceLongParagraph(p) : [p]))

  const chunks = []
  let buffer = ''
  for (const para of paragraphs) {
    if ((buffer + ' ' + para).length > TARGET_CHARS && buffer.length > 0) {
      chunks.push(buffer.trim())
      buffer = buffer.slice(-OVERLAP_CHARS) + ' ' + para
    } else {
      buffer = buffer ? buffer + ' ' + para : para
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim())
  return chunks
}

const UPSERT_BOOK_CYPHER = `
MERGE (b:Book {id: $bookId})
SET b.title = $title,
    b.author = $author,
    b.subtitle = $subtitle,
    b.publishedYear = $publishedYear,
    b.sourceFilename = $sourceFilename,
    b.ingestedAt = datetime()
RETURN b.id AS id
`

// MERGE on the chapter id, link to book, then bulk-upsert passages via UNWIND.
// NEXT_PASSAGE edges are written in a second pass per chapter so passage ids
// already exist when the edge is created.
const UPSERT_CHAPTER_CYPHER = `
MATCH (b:Book {id: $bookId})
MERGE (c:BookChapter {id: $chapterId})
SET c.title = $title, c.order = $order
MERGE (b)-[:HAS_CHAPTER]->(c)
WITH c
UNWIND $passages AS p
  MERGE (passage:BookPassage {id: p.id})
  SET passage.text = p.text,
      passage.citationLabel = p.citationLabel,
      passage.order = p.order,
      passage.embedding = p.embedding,
      passage.tokenCount = p.tokenCount
  MERGE (c)-[:HAS_PASSAGE]->(passage)
RETURN count(*) AS upserted
`

const LINK_PASSAGE_NEIGHBOURS_CYPHER = `
UNWIND $pairs AS pair
MATCH (a:BookPassage {id: pair.from})
MATCH (b:BookPassage {id: pair.to})
MERGE (a)-[:NEXT_PASSAGE]->(b)
RETURN count(*) AS linked
`

async function main() {
  console.log(`Ingesting book: "${title}" by ${author}`)
  console.log(`  File: ${absoluteFilePath}`)

  const ext = path.extname(absoluteFilePath).toLowerCase()
  let chapters
  if (ext === '.pdf') {
    const raw = await readPdf(absoluteFilePath)
    console.log(`  Extracted ${raw.length.toLocaleString()} chars of text.`)
    chapters = splitIntoChapters(raw)
  } else if (ext === '.epub') {
    // EPUB structure already gives us per-chapter HTML files — use those.
    chapters = await readEpubChapters(absoluteFilePath)
    const totalChars = chapters.reduce((acc, c) => acc + c.body.length, 0)
    console.log(`  Extracted ${totalChars.toLocaleString()} chars of text.`)
  } else {
    console.error(`Unsupported file extension: ${ext}. Use .pdf or .epub.`)
    process.exit(1)
  }
  console.log(`  Detected ${chapters.length} chapter(s).`)

  // Build all passages flat so we can embed in one (batched) call before writing.
  const passageRecords = []
  for (const chapter of chapters) {
    const chunks = chunkChapter(chapter.body)
    chunks.forEach((text, idx) => {
      const passageId = `${bookId}-c${chapter.order}-p${idx + 1}`
      passageRecords.push({
        chapterOrder: chapter.order,
        chapterTitle: chapter.title,
        id: passageId,
        order: idx + 1,
        text,
        citationLabel: `${chapter.title}, passage ${idx + 1}`,
        tokenCount: estimateTokens(text),
      })
    })
  }
  console.log(
    `  Built ${passageRecords.length} passage(s); ~${passageRecords
      .reduce((sum, p) => sum + p.tokenCount, 0)
      .toLocaleString()} tokens total.`
  )

  if (passageRecords.length === 0) {
    console.error('No passages produced. Aborting before LLM calls.')
    process.exit(1)
  }

  const SECRETS = await loadSecrets()
  const openai = buildOpenAI(SECRETS)

  console.log(`  Embedding ${passageRecords.length} passage(s)…`)
  const t0 = Date.now()
  const embeddings = await embedBatch(
    openai,
    passageRecords.map((p) => p.text)
  )
  console.log(`  Embedded in ${((Date.now() - t0) / 1000).toFixed(1)}s.`)

  if (embeddings.some((e) => !e || e.length !== EMBEDDING_DIMS)) {
    console.error(
      `Embedding dim mismatch — expected ${EMBEDDING_DIMS}, got mixed sizes. Aborting before Neo4j write.`
    )
    process.exit(1)
  }
  passageRecords.forEach((p, i) => {
    p.embedding = embeddings[i]
  })

  const driver = buildNeo4jDriver(SECRETS)
  const session = driver.session()
  try {
    await session.run(UPSERT_BOOK_CYPHER, {
      bookId,
      title,
      author,
      subtitle: subtitle || null,
      publishedYear: publishedYear ? parseInt(publishedYear, 10) : null,
      sourceFilename: path.basename(absoluteFilePath),
    })

    for (const chapter of chapters) {
      const chapterId = `${bookId}-c${chapter.order}`
      const passagesForChapter = passageRecords
        .filter((p) => p.chapterOrder === chapter.order)
        .map((p) => ({
          id: p.id,
          text: p.text,
          citationLabel: p.citationLabel,
          order: p.order,
          embedding: p.embedding,
          tokenCount: p.tokenCount,
        }))

      await session.run(UPSERT_CHAPTER_CYPHER, {
        bookId,
        chapterId,
        title: chapter.title,
        order: chapter.order,
        passages: passagesForChapter,
      })

      // Link sequential passages within this chapter for context expansion at query time.
      if (passagesForChapter.length > 1) {
        const pairs = []
        for (let i = 0; i < passagesForChapter.length - 1; i += 1) {
          pairs.push({
            from: passagesForChapter[i].id,
            to: passagesForChapter[i + 1].id,
          })
        }
        await session.run(LINK_PASSAGE_NEIGHBOURS_CYPHER, { pairs })
      }
      console.log(
        `  Chapter ${chapter.order} (${chapter.title}): wrote ${passagesForChapter.length} passage(s).`
      )
    }

    console.log(`\nIngestion complete. Book id: ${bookId}`)
  } catch (error) {
    console.error('Neo4j write failed:', error.message)
    process.exit(1)
  } finally {
    await session.close()
    await driver.close()
  }
}

main()
