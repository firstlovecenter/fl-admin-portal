#!/usr/bin/env node
/**
 * SYN-105 Migration Script — RANGE INDEX on AccountTransaction(lastModified)
 *
 * The @cypher transactions(limit, offset) blocks on
 * Council/Stream/Campus/Oversight do
 *   ORDER BY transaction.lastModified DESC, transaction.id
 * over potentially every AccountTransaction in the church spine. Without
 * an index on lastModified the planner falls back to a full match plus
 * an in-memory sort. Fine at 47 transactions in dev today; not at
 * thousands per council.
 *
 * Adds a RANGE INDEX so the planner can do an index-backed sort.
 *
 * Usage:
 *   node migrate-account-transaction-lastmodified-index.js [--dry-run]
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const DRY_RUN = process.argv.includes('--dry-run')

const indexQuery = `
CREATE RANGE INDEX account_transaction_last_modified IF NOT EXISTS
FOR (t:AccountTransaction) ON (t.lastModified)
`

const indexStatusQuery = `
SHOW INDEXES YIELD name, state, labelsOrTypes, properties
WHERE name = 'account_transaction_last_modified'
RETURN name, state, labelsOrTypes, properties
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
    if (DRY_RUN) {
      console.log(
        '--dry-run: would CREATE RANGE INDEX account_transaction_last_modified'
      )
      return
    }

    await session.run(indexQuery)
    console.log(
      'Index account_transaction_last_modified created (or already existed)'
    )

    const statusResult = await session.run(indexStatusQuery)
    if (statusResult.records.length > 0) {
      const record = statusResult.records[0]
      console.log(
        `Index status: name=${record.get('name')} state=${record.get(
          'state'
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
