#!/usr/bin/env node
/* eslint-disable no-console, no-await-in-loop */

/**
 * Ingests a Bible translation (KJV or WEB — both public domain) into Neo4j
 * as :Verse nodes for the AI Assistant.
 *
 * Expected input file: a JSON array of flat verse records:
 *   [
 *     { "book": "Genesis",     "abbreviation": "GEN", "chapter": 1, "verse": 1, "text": "..." },
 *     { "book": "Genesis",     "abbreviation": "GEN", "chapter": 1, "verse": 2, "text": "..." },
 *     ...
 *   ]
 *
 * Where to get JSON files:
 *   KJV: https://github.com/aruljohn/Bible-kjv (or scrollmapper/bible_databases)
 *   WEB: https://ebible.org/web/ (publishes JSON-friendly XML)
 *
 * Convert the source format to the flat array above with a small jq one-liner,
 * or use the included sample at api/scripts/bible-sources.md.
 *
 * Idempotent: re-running overwrites text + embeddings via MERGE … SET.
 *
 * Usage:
 *   node api/src/scripts/ingest-bible.js --translation KJV --input ./bibles/kjv.json
 */

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')
const {
  buildOpenAI,
  embedBatch,
  EMBEDDING_DIMS,
} = require('../resolvers/utils/llm-client')
const { buildNeo4jDriver } = require('./utils/neo4j-driver')
const { toParatext } = require('./utils/paratext')

const args = process.argv.slice(2)
const getFlag = (name, fallback = undefined) => {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1) return fallback
  return args[idx + 1]
}

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`
Bible ingestion CLI.

Usage:
  node api/src/scripts/ingest-bible.js --translation <code> --input <path>

Required:
  --translation <code>  e.g. KJV or WEB (uppercase by convention)
  --input <path>        Path to a JSON file with [{book, abbreviation, chapter, verse, text}, ...]

Optional:
  --batchSize <n>       How many verses to write per Neo4j transaction (default 500)
  --help, -h            Show this help
`)
  process.exit(0)
}

const translation = getFlag('translation')
const inputPath = getFlag('input')
// Default batch size dropped from 500 → 100 after dev Neo4j hit a critical
// transaction error at 2k commands/batch with 1536-dim embedding payloads.
// 100 verses × ~6KB embedding ≈ 600KB/transaction — comfortably within
// Neo4j's commit limits on a single-instance dev box.
const writeBatchSize = parseInt(getFlag('batchSize', '100'), 10)

if (!translation || !inputPath) {
  console.error('Missing required flag. Run with --help for usage.')
  process.exit(1)
}

const absoluteInputPath = path.resolve(inputPath)
if (!fs.existsSync(absoluteInputPath)) {
  console.error(`Input not found: ${absoluteInputPath}`)
  process.exit(1)
}

const UPSERT_VERSE_BATCH_CYPHER = `
UNWIND $rows AS row
MERGE (v:Verse {id: row.id})
SET v.book = row.book,
    v.abbreviation = row.abbreviation,
    v.chapter = row.chapter,
    v.verse = row.verse,
    v.translation = row.translation,
    v.text = row.text,
    v.embedding = row.embedding
RETURN count(v) AS upserted
`

/**
 * Flattens the scrollmapper / bible_databases nested JSON shape:
 *   [{ name: 'Genesis', chapters: [{ chapter: 1, verses: [{verse: 1, text: '...'}] }] }]
 * into our flat verse-array shape with Paratext 3-letter abbreviations.
 * Verses whose book name doesn't map to a known abbreviation are skipped
 * with a warning (e.g. apocrypha that we don't ingest for Phase 1).
 */
function flattenScrollmapper(books) {
  const out = []
  const skipped = new Set()
  for (const book of books) {
    const abbreviation = toParatext(book.name)
    if (!abbreviation) {
      skipped.add(book.name)
      continue
    }
    for (const chapter of book.chapters || []) {
      for (const verse of chapter.verses || []) {
        out.push({
          book: book.name,
          abbreviation,
          chapter: chapter.chapter,
          verse: verse.verse,
          text: verse.text,
        })
      }
    }
  }
  if (skipped.size) {
    console.warn(
      `  Skipped ${skipped.size} book(s) with no Paratext mapping: ${[...skipped].join(', ')}`
    )
  }
  return out
}

async function main() {
  console.log(`Ingesting Bible: translation=${translation} input=${absoluteInputPath}`)

  const raw = fs.readFileSync(absoluteInputPath, 'utf-8')
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error('Input file is not valid JSON:', err.message)
    process.exit(1)
  }

  // Accept either:
  //   1. Flat array `[{book, abbreviation, chapter, verse, text}, ...]`
  //   2. Scrollmapper nested `{ books: [{ name, chapters: [{ chapter, verses: [{verse, text}] }] }] }`
  //   3. Same but at the top level (some scrollmapper variants).
  let verses
  if (Array.isArray(parsed)) {
    verses = parsed
  } else if (parsed && Array.isArray(parsed.books)) {
    verses = flattenScrollmapper(parsed.books)
  } else if (parsed && Array.isArray(parsed.chapters)) {
    // Single-book form — rare but possible.
    verses = flattenScrollmapper([parsed])
  } else {
    console.error(
      'Unrecognised JSON shape. Expected flat verse array or scrollmapper `{ books: [...] }`.'
    )
    process.exit(1)
  }
  console.log(`  Parsed ${verses.length.toLocaleString()} verse(s).`)

  if (verses.length === 0) {
    console.error('No verses produced from input. Aborting.')
    process.exit(1)
  }

  const SECRETS = await loadSecrets()
  const openai = buildOpenAI(SECRETS)

  // Embed every verse text in batches. ~31k verses × ~25 tokens = ~775k tokens
  // for the whole KJV — about $0.02 at text-embedding-3-small pricing.
  console.log(`  Embedding ${verses.length.toLocaleString()} verse(s)…`)
  const t0 = Date.now()
  const embeddings = await embedBatch(
    openai,
    verses.map((v) => v.text)
  )
  console.log(`  Embedded in ${((Date.now() - t0) / 1000).toFixed(1)}s.`)

  if (embeddings.some((e) => !e || e.length !== EMBEDDING_DIMS)) {
    console.error(
      `Embedding dim mismatch — expected ${EMBEDDING_DIMS}. Aborting before Neo4j write.`
    )
    process.exit(1)
  }

  // Build the rows for batched UNWIND writes.
  const rows = verses.map((v, i) => ({
    id: `${translation}-${v.abbreviation}-${v.chapter}-${v.verse}`,
    book: v.book,
    abbreviation: v.abbreviation,
    chapter: parseInt(v.chapter, 10),
    verse: parseInt(v.verse, 10),
    translation,
    text: v.text,
    embedding: embeddings[i],
  }))

  const driver = buildNeo4jDriver(SECRETS)
  const session = driver.session()
  try {
    let written = 0
    for (let i = 0; i < rows.length; i += writeBatchSize) {
      const slice = rows.slice(i, i + writeBatchSize)
      const result = await session.run(UPSERT_VERSE_BATCH_CYPHER, { rows: slice })
      written += result.records[0].get('upserted').toNumber()
      console.log(`    Wrote ${written.toLocaleString()} / ${rows.length.toLocaleString()} verse(s)`)
    }
    console.log(`\nIngestion complete. Translation: ${translation}`)
  } catch (error) {
    console.error('Neo4j write failed:', error.message)
    process.exit(1)
  } finally {
    await session.close()
    await driver.close()
  }
}

main()
