const { Neo4jGraphQL } = require('@neo4j/graphql')
const { ApolloServer } = require('@apollo/server')
// Removed startServerAndCreateLambdaHandler import
const neo4j = require('neo4j-driver')
const { jwtDecode } = require('jwt-decode')
const { typeDefs } = require('./schema/graphql-schema')
const { loadSecrets } = require('./resolvers/secrets')
const resolvers = require('./resolvers/resolvers').default

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

const initializeServer = async () => {
  if (isInitialized) return

  console.log('[Initialization] Starting server initialization')

  try {
    // Load secrets
    const SECRETS = await loadSecrets()

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
    throw error
  }
}

// Lambda handler function
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false

  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://admin.firstlovecenter.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    // Handle OPTIONS preflight request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          ...corsHeaders,
        },
        body: null,
      }
    }

    // Initialize on cold start
    await initializeServer()

    // Parse and validate request
    const { body, headers, httpMethod } = event

    if (!body) {
      throw new SyntaxError('Request body is undefined or empty')
    }

    let parsedBody
    try {
      parsedBody = JSON.parse(body)
    } catch (error) {
      throw new SyntaxError('Invalid JSON in request body')
    }

    const { query, variables = {}, operationName } = parsedBody

    // Log request info
    console.log('[Request] Incoming request:', {
      path: event.path,
      httpMethod: event.httpMethod,
      headers: Object.keys(headers),
    })

    // Handle JWT authentication
    const token = headers.authorization || headers.Authorization
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
      }
    }

    // Build context for GraphQL operation
    const contextValue = {
      req: event,
      executionContext: driver,
      jwt: {
        ...jwt,
        roles: jwt?.['https://flcadmin.netlify.app/roles'],
      },
    }

    // Execute GraphQL operation
    const result = await server.executeOperation(
      {
        query,
        variables,
        operationName,
        http: { method: httpMethod, headers: new Headers(headers) },
      },
      {
        contextValue,
      }
    )

    // Format response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify({
        data: result.body.singleResult.data,
        errors: result.body.singleResult.errors,
      }),
    }
  } catch (error) {
    console.error('[Request] Processing failed:', error)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify({
        errors: [
          {
            message: error.message || 'Internal server error',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          },
        ],
      }),
    }
  }
}
