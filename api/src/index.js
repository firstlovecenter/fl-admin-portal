import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { json } from 'body-parser'
import neo4j from 'neo4j-driver'
import { Neo4jGraphQL } from '@neo4j/graphql'
import { jwtDecode } from 'jwt-decode'
import { typeDefs } from './schema/graphql-schema'
import resolvers from './resolvers/resolvers'
import { loadSecrets } from './resolvers/secrets'
import { startAutoCheckoutScheduler } from './resolvers/checkins/checkins-scheduler'

const startServer = async () => {
  const SECRETS = await loadSecrets()

  const app = express()
  const httpServer = http.createServer(app)

  const uri = SECRETS.NEO4J_URI || 'bolt://localhost:7687/'
  const hasEncryptionInUri =
    uri.includes('neo4j+s://') || uri.includes('neo4j+ssc://')
  const isLocalUri =
    uri.includes('localhost') || uri.includes('127.0.0.1')
  const driverConfig = {
    connectionTimeout: 30000,
  }

  // Only add encryption config if not using secure URI scheme and not local
  if (!hasEncryptionInUri && !isLocalUri) {
    driverConfig.encrypted = 'ENCRYPTION_ON'
    driverConfig.trust = 'TRUST_ALL_CERTIFICATES'
  }

  console.log(
    '[Neo4j] Connecting to:',
    uri.replace(/::\/\/.*@/, '://[REDACTED]@')
  )
  console.log('[Neo4j] URI encryption scheme detected:', hasEncryptionInUri)
  console.log('[Neo4j] Driver config:', driverConfig)

  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'letmein'
    ),
    driverConfig
  )

  // Add connection verification
  try {
    await driver.verifyConnectivity()
    console.log('✅ Neo4j connection verified successfully')
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }

  const neoSchema = new Neo4jGraphQL({
    typeDefs,
    resolvers,
    driver,
    features: {
      authorization: {
        key: SECRETS.JWT_SECRET,
      },
      config: {
        debug: true,
      },
      excludeDeprecatedFields: {
        bookmark: true,
        negationFilters: true,
        arrayFilters: true,
        stringAggregation: true,
        aggregationFilters: true,
      },
    },
  })

  const schema = await neoSchema.getSchema().catch((error) => {
    console.error('\x1b[31m######## 🚨SCHEMA ERROR🚨 #######\x1b[0m')
    console.error(`${JSON.stringify(error, null, 2)}`)
    console.log(
      '\x1b[31m########## 🚨END OF SCHEMA ERROR🚨 ##################\x1b[0m'
    )
    process.exit(1)
  })

  const server = new ApolloServer({
    context: async ({ req }) => {
      const token = req.headers.authorization
      let jwt = null

      if (token) {
        try {
          jwt = jwtDecode(token.replace(/^Bearer\s+/i, ''))
          console.log('🚀 ~ index.js:98 ~ jwt:', jwt)
        } catch (error) {
          console.error('Invalid token:', error)
        }
      }

      return {
        req,
        executionContext: driver,
        jwt: {
          ...jwt,
        },
      }
    },
    introspection: true,
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await server.start()

  app.use(
    SECRETS.GRAPHQL_SERVER_PATH || '/graphql',
    cors(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization
        let jwt = null

        if (token) {
          try {
            jwt = jwtDecode(token.replace(/^Bearer\s+/i, ''))
          } catch (error) {
            console.error('Invalid token:', error)
          }
        }

        return {
          req,
          executionContext: driver,
          jwt,
        }
      },
    })
  )

  await new Promise((resolve) =>
    httpServer.listen({ port: SECRETS.GRAPHQL_SERVER_PORT || 4001 }, resolve)
  )
  startAutoCheckoutScheduler()

  console.log(
    `🚀 GraphQL Server ready at http://${
      SECRETS.GRAPHQL_SERVER_HOST || '0.0.0.0'
    }:${SECRETS.GRAPHQL_SERVER_PORT || 4001}${
      SECRETS.GRAPHQL_SERVER_PATH || '/graphql'
    }`
  )
}

startServer()
