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
    console.log('Falling back to environment variables from .env')
    return {}
  }
}

export const loadSecrets = async (): Promise<Record<string, string>> => {
  const secrets = await fetchAwsSecret()

  // Environment variables from .env override AWS secrets as fallback
  const envFallback: Record<string, string> = {
    JWT_SECRET:
      process.env.JWT_SECRET || process.env.JWT_SECRET_HS256 || '',
    NEO4J_URI: process.env.NEO4J_URI || 'bolt://localhost:7687',
    NEO4J_USER: process.env.NEO4J_USER || 'neo4j',
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || 'password',
    GRAPHQL_SERVER_PORT: process.env.PORT || '4001',
    GRAPHQL_SERVER_PATH: process.env.GRAPHQL_SERVER_PATH || '/graphql',
    GRAPHQL_SERVER_HOST: process.env.GRAPHQL_SERVER_HOST || '0.0.0.0',
  }

  return { ...envFallback, ...secrets }
}

module.exports = { loadSecrets }

export default loadSecrets
