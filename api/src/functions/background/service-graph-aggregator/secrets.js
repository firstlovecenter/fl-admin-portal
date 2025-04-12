const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager')

/**
 * Loads secrets from AWS Secrets Manager
 * This module handles fetching secrets from AWS Secrets Manager for use in the Lambda function
 * With fallback to environment variables for Netlify Functions compatibility
 */

// Cache the secrets to avoid unnecessary API calls on subsequent invocations
let secretsCache = null

/**
 * Load secrets from AWS Secrets Manager
 * @returns {Object} - Object containing all required secrets
 */
const loadSecrets = async () => {
  // Return cached secrets if available (useful for Lambda container reuse)
  if (secretsCache) {
    return secretsCache
  }

  try {
    // Create a Secrets Manager client
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    })

    // Retrieve secrets from AWS Secrets Manager
    const secretName = process.env.AWS_SECRET_NAME || 'fl-synago-secrets'
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    })

    const response = await client.send(command)

    // Parse the secret string into a JSON object
    secretsCache = JSON.parse(response.SecretString)
    console.log('Loaded secrets from AWS Secrets Manager')

    return secretsCache
  } catch (error) {
    console.warn(
      'Failed to load secrets from AWS Secrets Manager:',
      error.message
    )
    console.warn('Falling back to environment variables')

    // Fallback to environment variables for Netlify Functions
    return {
      NEO4J_URI: process.env.NEO4J_URI,
      NEO4J_USER: process.env.NEO4J_USER,
      NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
      NEO4J_ENCRYPTED: process.env.NEO4J_ENCRYPTED || 'false',
      JWT_SECRET: process.env.JWT_SECRET,
    }
  }
}

module.exports = { loadSecrets }
