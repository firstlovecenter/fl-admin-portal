const path = require('path')
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager')

// Load .env first so AWS_REGION / AWS_SECRET_NAME overrides are available.
require('dotenv').config({ path: path.join(__dirname, '.env') })

// Runs once before workers are spawned. env vars set here are inherited by
// all Jest worker processes, so tests can read process.env.NEO4J_* normally.
module.exports = async function globalSetup() {
  // If NEO4J_PASSWORD is already set (e.g. explicit CLI export), trust it.
  if (process.env.NEO4J_PASSWORD) return

  const secretId =
    process.env.AWS_SECRET_NAME || 'dev/fl-admin-portal'
  const region = process.env.AWS_REGION || 'eu-west-2'

  try {
    const client = new SecretsManagerClient({ region })
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretId })
    )
    const secrets = JSON.parse(response.SecretString || '{}')

    if (secrets.NEO4J_URI) process.env.NEO4J_URI = secrets.NEO4J_URI
    if (secrets.NEO4J_USER) process.env.NEO4J_USER = secrets.NEO4J_USER
    if (secrets.NEO4J_PASSWORD)
      process.env.NEO4J_PASSWORD = secrets.NEO4J_PASSWORD

    console.log(
      `[integration setup] Neo4j credentials loaded from AWS (${secretId})`
    )
  } catch (err) {
    console.warn(
      `[integration setup] Could not load secrets from AWS (${secretId}): ${err.message}`
    )
    console.warn(
      '[integration setup] Falling back to process.env / .env values'
    )
  }
}
