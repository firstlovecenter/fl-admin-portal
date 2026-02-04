import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { json } from 'body-parser'
import neo4j from 'neo4j-driver'
import { Neo4jGraphQL } from '@neo4j/graphql'
import { typeDefs } from './schema/graphql-schema'
import resolvers from './resolvers/resolvers'
import { loadSecrets } from './resolvers/secrets'
import { getUserFromToken, decodeToken } from './resolvers/custom-auth'

/**
 * Get user roles from Neo4j database
 */
const getUserRoles = async (driver, userId) => {
  const session = driver.session()
  try {
    const result = await session.run(
      `
      MATCH (m:Member {id: $userId})
      RETURN m.roles as roles
      `,
      { userId }
    )

    if (result.records.length > 0) {
      return result.records[0].get('roles') || []
    }

    return []
  } catch (error) {
    console.error('Error fetching user roles:', error)
    return []
  } finally {
    await session.close()
  }
}

/**
 * Create context with verified user and roles
 */
const createContext = async (req, driver) => {
  const token = req.headers.authorization

  if (!token) {
    return {
      req,
      executionContext: driver,
      jwt: null,
    }
  }

  try {
    // Verify token with auth service
    const verifiedUser = await getUserFromToken(token)

    if (!verifiedUser) {
      console.error('Token verification failed')
      return {
        req,
        executionContext: driver,
        jwt: null,
      }
    }

    // Decode token to get all claims
    const decodedToken = decodeToken(token.replace('Bearer ', ''))

    // Get user roles from Neo4j
    const roles = await getUserRoles(driver, verifiedUser.userId)

    return {
      req,
      executionContext: driver,
      jwt: {
        userId: verifiedUser.userId,
        email: verifiedUser.email,
        roles,
        'https://flcadmin.netlify.app/roles': roles, // Keep for backward compatibility
        ...decodedToken,
      },
    }
  } catch (error) {
    console.error('Error creating context:', error)
    return {
      req,
      executionContext: driver,
      jwt: null,
    }
  }
}

const startServer = async () => {
  const SECRETS = await loadSecrets()

  const app = express()
  const httpServer = http.createServer(app)

  // Configure driver options based on encryption setting
  const driverConfig =
    SECRETS.NEO4J_ENCRYPTED === 'true'
      ? {
          encrypted: 'ENCRYPTION_ON',

          trust: 'TRUST_ALL_CERTIFICATES',
          connectionTimeout: 30000,
        }
      : {
          connectionTimeout: 30000,
        }

  const driver = neo4j.driver(
    SECRETS.NEO4J_URI || 'bolt://localhost:7687/',
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

    // Test a simple query
    const session = driver.session()
    const result = await session.run('RETURN 1 as test')
    console.log('✅ Test query successful:', result.records[0].get('test'))
    await session.close()
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
    context: async ({ req }) => createContext(req, driver),
    introspection: true,
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await server.start()

  // Configure CORS to allow localhost:3000 for dev, and production domain in production
  const corsOptions = {
    origin(origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ]

      // For development, allow requests without origin (like mobile apps or desktop clients)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        // In production, you might want to be stricter
        callback(null, true)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }

  app.use(
    SECRETS.GRAPHQL_SERVER_PATH || '/graphql',
    cors(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req, driver),
    })
  )

  await new Promise((resolve) =>
    httpServer.listen({ port: SECRETS.GRAPHQL_SERVER_PORT || 4001 }, resolve)
  )
  console.log(
    `🚀 GraphQL Server ready at http://${
      SECRETS.GRAPHQL_SERVER_HOST || '0.0.0.0'
    }:${SECRETS.GRAPHQL_SERVER_PORT || 4001}${
      SECRETS.GRAPHQL_SERVER_PATH || '/graphql'
    }`
  )
}

startServer()
