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
const neo4j = require('neo4j-driver')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')
const {
  buildOpenAI,
  embedBatch,
  EMBEDDING_DIMS,
} = require('./utils/llm-client')

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
const writeBatchSize = parseInt(getFlag('batchSize', '500'), 10)

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

async function main() {
  console.log(`Ingesting Bible: translation=${translation} input=${absoluteInputPath}`)

  const raw = fs.readFileSync(absoluteInputPath, 'utf-8')
  let verses
  try {
    verses = JSON.parse(raw)
  } catch (err) {
    console.error('Input file is not valid JSON:', err.message)
    process.exit(1)
  }
  if (!Array.isArray(verses)) {
    console.error('Input JSON must be a flat array of verse objects.')
    process.exit(1)
  }
  console.log(`  Parsed ${verses.length.toLocaleString()} verse(s).`)

  // Validate shape on a single record to fail before LLM calls.
  const first = verses[0]
  for (const key of ['book', 'abbreviation', 'chapter', 'verse', 'text']) {
    if (first[key] === undefined) {
      console.error(`First record missing required key: ${key}. Got: ${JSON.stringify(first)}`)
      process.exit(1)
    }
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

  const uri =
    SECRETS.NEO4J_ENCRYPTED === 'true'
      ? SECRETS.NEO4J_URI?.replace('bolt://', 'neo4j+s://')
      : SECRETS.NEO4J_URI || 'bolt://localhost:7687'

  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(SECRETS.NEO4J_USER || 'neo4j', SECRETS.NEO4J_PASSWORD || 'neo4j')
  )
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
