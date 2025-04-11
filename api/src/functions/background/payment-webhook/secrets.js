const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager')

/**
 * Loads secrets from AWS Secrets Manager
 * This module handles fetching secrets from AWS Secrets Manager for use in the Lambda function
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

    return secretsCache
  } catch (error) {
    console.error('Error loading secrets from AWS Secrets Manager:', error)
    throw new Error('Failed to load required secrets')
  }
}

module.exports = { loadSecrets }
