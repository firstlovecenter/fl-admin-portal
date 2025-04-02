// // This module can be used to serve the GraphQL endpoint
// // as a lambda function
const { Neo4jGraphQL } = require('@neo4j/graphql')
const { ApolloServer } = require('@apollo/server')
const {
  startServerAndCreateLambdaHandler,
} = require('@as-integrations/aws-lambda')
const neo4j = require('neo4j-driver')
const Sentry = require('@sentry/node')
const { jwtDecode } = require('jwt-decode')
const { typeDefs } = require('./schema/graphql-schema')
const { loadSecrets } = require('./resolvers/secrets')
const resolvers = require('./resolvers/resolvers').default

// Initialize Sentry
Sentry.init({
  dsn: 'https://cd02d9dbb24041f88bfa297993779123@o1423098.ingest.sentry.io/6770464',
  tracesSampleRate: 1.0,
})

// Constants
const DEFAULT_NEO4J_CONFIG = {
  maxConnectionPoolSize: 50,
  connectionTimeout: 30000,
  logging: {
    level: 'info',
    logger: (level, message) => console.log(`[Neo4j ${level}] ${message}`),
  },
}

// Server state
let isInitialized = false
let driver
let server
let schema
let SECRETS

const initializeServer = async () => {
  if (isInitialized) return

  console.log('[Initialization] Starting server initialization')

  try {
    // Load secrets
    SECRETS = await loadSecrets()

    // Configure encrypted connection if required
    const uri =
      SECRETS.NEO4J_ENCRYPTED === 'true'
        ? SECRETS.NEO4J_URI.replace('bolt://', 'neo4j+s://')
        : SECRETS.NEO4J_URI

    console.log(
      `[Neo4j] Connecting to ${uri.replace(/:\/\/.*@/, '://[REDACTED]@')}`
    )

    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(SECRETS.NEO4J_USER, SECRETS.NEO4J_PASSWORD),
      DEFAULT_NEO4J_CONFIG
    )

    // Verify connection
    await driver.verifyConnectivity()
    console.log('[Neo4j] Connection established successfully')

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

    console.log('[Schema] Generating GraphQL schema')
    schema = await neoSchema.getSchema().catch((error) => {
      console.error('\x1b[31m[Schema] ######## 🚨SCHEMA ERROR🚨 #######\x1b[0m')
      console.error(`${JSON.stringify(error, null, 2)}`)
      console.log(
        '\x1b[31m[Schema] ########## 🚨END OF SCHEMA ERROR🚨 ##################\x1b[0m'
      )
      throw error
    })

    server = new ApolloServer({
      schema,
      status400ForVariableCoercionErrors: true,
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
      formatResponse: (response) => {
        console.log('[Response] Formatting GraphQL response')
        return {
          data: response.data || null,
          errors: response.errors || null,
          extensions: response.extensions || null,
        }
      },
    })

    await server.start()
    isInitialized = true
    console.log('[Apollo] Server initialized successfully')
  } catch (error) {
    console.error('[Initialization] Server initialization failed:', error)
    Sentry.captureException(error)
    throw error
  }
}

// Lambda handler function
exports.handler = startServerAndCreateLambdaHandler(
  async () => {
    await initializeServer()
    return server
  },
  {
    context: async ({ event }) => {
      console.log('[Request] Incoming request:', {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: Object.keys(event.headers),
      })

      const token = event.headers.authorization || event.headers.Authorization
      let jwt = null

      if (token) {
        try {
          const cleanToken = token.replace(/^Bearer\s+/i, '')
          console.log('[Auth] Decoding JWT token')
          jwt = jwtDecode(cleanToken)
          console.log('[Auth] JWT decoded successfully', {
            roles: jwt?.['https://flcadmin.netlify.app/roles'],
          })
        } catch (error) {
          console.error('[Auth] Invalid token:', error)
          Sentry.captureException(error)
        }
      }

      return {
        req: event,
        executionContext: driver,
        jwt: {
          ...jwt,
          roles: jwt?.['https://flcadmin.netlify.app/roles'],
        },
      }
    },
  }
)
