const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager')

let secretsCache = null

/**
 * Loads secrets from AWS Secrets Manager. Mirrors the accra-campus-weekly
 * Lambda's pattern (Lambda containers reuse this client across invocations,
 * so the cache cuts cold-start latency on warm runs).
 *
 * Falls back to env vars for local development; the CLI runner sets these
 * from a parent .env so you don't need real secrets to test the path.
 */
const loadSecrets = async () => {
  if (secretsCache) return secretsCache

  try {
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    })
    const secretName = process.env.AWS_SECRET_NAME || 'fl-synago-secrets'
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    )
    secretsCache = JSON.parse(response.SecretString)
    console.log('Loaded secrets from AWS Secrets Manager')
    return secretsCache
  } catch (error) {
    // In Lambda we MUST come from Secrets Manager — silently falling back to
    // process.env masks a missing IAM role and may pick up stale local env
    // vars. Only allow the env fallback when running as a CLI / dev process.
    const inLambda =
      !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NODE_ENV === 'production'
    if (inLambda) {
      console.error(
        'Failed to load secrets from AWS Secrets Manager and env fallback is disabled in Lambda:',
        error.message
      )
      throw error
    }
    console.warn(
      'Failed to load secrets from AWS Secrets Manager:',
      error.message
    )
    console.warn('Falling back to environment variables (non-Lambda only)')
    return {
      NEO4J_URI: process.env.NEO4J_URI,
      NEO4J_USER: process.env.NEO4J_USER,
      NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
      NEO4J_ENCRYPTED: process.env.NEO4J_ENCRYPTED || 'false',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    }
  }
}

module.exports = { loadSecrets }
