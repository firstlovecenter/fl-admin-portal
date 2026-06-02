/* eslint-disable no-console */

/**
 * Builds a Neo4j driver from a loaded secrets bundle. Mirrors the
 * connection logic in `api/src/index.js:23-50` — uses the URI as-is and
 * toggles encryption config based on whether the URI already carries a
 * secure scheme. The previous `.replace('bolt://', 'neo4j+s://')` shortcut
 * forced routing mode which fails against single-instance Neo4j with
 * "No routing servers available".
 */

const neo4j = require('neo4j-driver')

const buildNeo4jDriver = (SECRETS) => {
  const uri = SECRETS.NEO4J_URI || 'bolt://localhost:7687/'
  const hasEncryptionInUri =
    uri.includes('neo4j+s://') || uri.includes('neo4j+ssc://')

  const driverConfig = { connectionTimeout: 30000 }
  if (!hasEncryptionInUri) {
    driverConfig.encrypted = 'ENCRYPTION_ON'
    driverConfig.trust = 'TRUST_ALL_CERTIFICATES'
  }

  return neo4j.driver(
    uri,
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    ),
    driverConfig
  )
}

module.exports = { buildNeo4jDriver }
