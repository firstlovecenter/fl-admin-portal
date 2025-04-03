/* eslint-disable  */
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'
import * as dotenv from 'dotenv'

// import dotenv from "dotenv";
dotenv.config()
// Load environment variables from .env file

// Use default value if environment variable is not set
const secret_name = process.env.AWS_SECRET_NAME || 'secret'
console.log('Using AWS Secret Name:', secret_name)

const client = new SecretsManagerClient({
  region: 'eu-west-2',
})

const fetchAwsSecret = async () => {
  try {
    console.log('Attempting to fetch AWS Secret...')
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: 'AWSCURRENT',
      })
    )

    if (response.SecretString) {
      console.log('Secret successfully retrieved')
      return JSON.parse(response.SecretString)
    }

    throw new Error('Secret string is empty')
  } catch (error) {
    console.error('Error fetching secrets from AWS:', error)
    // Fallback to default values if AWS secret fetch fails
    console.log('Using fallback secrets')
    return {
      JWT_SECRET: 'fallback_secret_key_for_development',
      NEO4J_URI: 'bolt://localhost:7687',
      NEO4J_USER: 'neo4j',
      NEO4J_PASSWORD: 'password',
    }
  }
}

export const loadSecrets = async (): Promise<Record<string, string>> => {
  const secrets = await fetchAwsSecret()
  return secrets
}

module.exports = { loadSecrets }

export default loadSecrets
