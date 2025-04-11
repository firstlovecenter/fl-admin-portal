const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager')

/**
 * Loads secrets from AWS Secrets Manager
 * Falls back to environment variables if AWS Secrets Manager is not configured
 * @returns {Promise<Object>} Object containing all secrets
 */
const loadSecrets = async () => {
  try {
    // Try to load from AWS Secrets Manager first
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'eu-west-2',
    })

    const command = new GetSecretValueCommand({
      SecretId: process.env.AWS_SECRET_NAME || 'secrets',
    })

    const response = await client.send(command)
    const secretString = response.SecretString

    if (secretString) {
      console.log('Loaded secrets from AWS Secrets Manager')
      return JSON.parse(secretString)
    }
  } catch (error) {
    console.warn(
      'Failed to load secrets from AWS Secrets Manager:',
      error.message
    )
    console.warn('Falling back to environment variables')
  }

  // Fallback to environment variables
  return {
    NEO4J_URI: process.env.NEO4J_URI,
    NEO4J_USER: process.env.NEO4J_USER,
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
    NEO4J_ENCRYPTED: process.env.NEO4J_ENCRYPTED || 'false',
    JWT_SECRET: process.env.JWT_SECRET,
  }
}

module.exports = { loadSecrets }
