#!/usr/bin/env node

/**
 * Sets up Neo4j vector indexes + uniqueness constraints for the AI Assistant
 * knowledge base (Phase 1).
 *
 * Indexes (1536 dims, cosine — matches OpenAI `text-embedding-3-small`):
 *   - bookPassageEmbedding  on (:BookPassage).embedding
 *   - verseEmbedding        on (:Verse).embedding
 *
 * Constraints:
 *   - WeeklyTip.id, Book.id, BookChapter.id, BookPassage.id, Verse.id
 *
 * Idempotent — re-running is a no-op.
 *
 * Usage:
 *   node api/src/scripts/setup-vector-indexes.js
 */

const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')
const { buildNeo4jDriver } = require('./utils/neo4j-driver')

const STATEMENTS = [
  `CREATE VECTOR INDEX bookPassageEmbedding IF NOT EXISTS
   FOR (p:BookPassage) ON p.embedding
   OPTIONS { indexConfig: { \`vector.dimensions\`: 1536, \`vector.similarity_function\`: 'cosine' } }`,
  `CREATE VECTOR INDEX verseEmbedding IF NOT EXISTS
   FOR (v:Verse) ON v.embedding
   OPTIONS { indexConfig: { \`vector.dimensions\`: 1536, \`vector.similarity_function\`: 'cosine' } }`,
  `CREATE CONSTRAINT weekly_tip_id IF NOT EXISTS FOR (t:WeeklyTip) REQUIRE t.id IS UNIQUE`,
  `CREATE CONSTRAINT book_id IF NOT EXISTS FOR (b:Book) REQUIRE b.id IS UNIQUE`,
  `CREATE CONSTRAINT book_chapter_id IF NOT EXISTS FOR (c:BookChapter) REQUIRE c.id IS UNIQUE`,
  `CREATE CONSTRAINT book_passage_id IF NOT EXISTS FOR (p:BookPassage) REQUIRE p.id IS UNIQUE`,
  `CREATE CONSTRAINT verse_id IF NOT EXISTS FOR (v:Verse) REQUIRE v.id IS UNIQUE`,
  `CREATE CONSTRAINT chat_session_id IF NOT EXISTS FOR (s:ChatSession) REQUIRE s.id IS UNIQUE`,
  `CREATE CONSTRAINT chat_message_id IF NOT EXISTS FOR (m:ChatMessage) REQUIRE m.id IS UNIQUE`,
]

async function main() {
  const SECRETS = await loadSecrets()
  const driver = buildNeo4jDriver(SECRETS)
  const session = driver.session()

  try {
    console.log(`Connected to Neo4j at ${SECRETS.NEO4J_URI}`)
    for (const stmt of STATEMENTS) {
      const result = await session.run(stmt)
      const summary = result.summary.counters.updates()
      console.log(
        `  ${
          summary.indexesAdded || summary.constraintsAdded ? 'CREATED' : 'EXISTS'
        }  ${stmt.split('\n')[0].trim()}`
      )
    }
    console.log('\nVector indexes + constraints in place.')
  } catch (error) {
    console.error('Failed to set up vector indexes:', error)
    process.exit(1)
  } finally {
    await session.close()
    await driver.close()
  }
}

main()
