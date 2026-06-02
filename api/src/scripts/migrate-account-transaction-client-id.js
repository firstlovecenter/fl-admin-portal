#!/usr/bin/env node
/**
 * SYN-97 Migration Script — clientTransactionId backfill + RANGE INDEX
 *
 * ADR-005 idempotency: every money-mutation cypher now uses
 *   MERGE (transaction:AccountTransaction {clientTransactionId: $clientTransactionId})
 * so an Apollo retry / double-tap returns the original transaction without
 * re-firing the balance increment.
 *
 * Existing AccountTransaction nodes (created before this PR) lack the
 * clientTransactionId property. Backfill each one with a fresh randomUUID()
 * so the new RANGE INDEX can come online without conflict, then create the
 * index. The backfill is idempotent — running it twice is a no-op for any
 * row that already has a clientTransactionId.
 *
 * Usage:
 *   node migrate-account-transaction-client-id.js [--dry-run]
 *
 * Options:
 *   --dry-run   Print planned changes without writing anything
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const DRY_RUN = process.argv.includes('--dry-run')

const auditQuery = `
MATCH (t:AccountTransaction)
WHERE t.clientTransactionId IS NULL
RETURN count(t) AS rowsToBackfill
`

// Batched backfill — IN TRANSACTIONS keeps the transaction log bounded
// for prod-scale tables. Idempotent (the WHERE skips already-backfilled
// rows on a second run).
const backfillQuery = `
MATCH (t:AccountTransaction)
WHERE t.clientTransactionId IS NULL
CALL (t) {
  SET t.clientTransactionId = randomUUID()
} IN TRANSACTIONS OF 1000 ROWS
RETURN count(t) AS backfilled
`

// UNIQUENESS CONSTRAINT (not just an index) — MERGE on a non-unique
// property is NOT concurrency-safe per the Neo4j 5 manual: two
// concurrent MERGEs on the same key can both pass through the CREATE
// branch under load. The constraint blocks duplicates AND auto-creates
// the backing range index for the index-seek lookup.
const constraintQuery = `
CREATE CONSTRAINT account_transaction_client_id IF NOT EXISTS
FOR (t:AccountTransaction) REQUIRE t.clientTransactionId IS UNIQUE
`

const indexStatusQuery = `
SHOW CONSTRAINTS YIELD name, type, labelsOrTypes, properties
WHERE name = 'account_transaction_client_id'
RETURN name, type, labelsOrTypes, properties
`

async function main() {
  const uri = process.env.NEO4J_URI
  const user = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !user || !password) {
    console.error(
      'Missing NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD in environment.'
    )
    process.exit(1)
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  const session = driver.session()

  try {
    const auditResult = await session.run(auditQuery)
    const rowsToBackfill = auditResult.records[0].get('rowsToBackfill').toInt()
    console.log(
      `AccountTransaction rows missing clientTransactionId: ${rowsToBackfill}`
    )

    if (DRY_RUN) {
      console.log('--dry-run: skipping backfill + index creation')
      return
    }

    if (rowsToBackfill > 0) {
      const backfillResult = await session.run(backfillQuery)
      const backfilled = backfillResult.records[0].get('backfilled').toInt()
      console.log(
        `Backfilled ${backfilled} rows with random clientTransactionId`
      )
    }

    await session.run(constraintQuery)
    console.log(
      'Constraint account_transaction_client_id created (or already existed)'
    )

    const statusResult = await session.run(indexStatusQuery)
    if (statusResult.records.length > 0) {
      const record = statusResult.records[0]
      console.log(
        `Constraint status: name=${record.get('name')} type=${record.get(
          'type'
        )} labels=${record.get('labelsOrTypes')} properties=${record.get(
          'properties'
        )}`
      )
    }
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
