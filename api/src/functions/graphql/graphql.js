const { Neo4jGraphQL } = require('@neo4j/graphql')
const { ApolloServer } = require('@apollo/server')
// Removed startServerAndCreateLambdaHandler import
const neo4j = require('neo4j-driver')
const { jwtDecode } = require('jwt-decode')
const { typeDefs } = require('./schema/graphql-schema')
const { loadSecrets } = require('./resolvers/secrets')
const resolvers = require('./resolvers/resolvers').default

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

    const uri = SECRETS.NEO4J_URI || 'bolt://localhost:7687/'
    const hasEncryptionInUri =
      uri.includes('neo4j+s://') || uri.includes('neo4j+ssc://')
    const driverConfig = {
      connectionTimeout: 30000,
    }

    // Only add encryption config if not using secure URI scheme
    if (!hasEncryptionInUri) {
      driverConfig.encrypted = 'ENCRYPTION_ON'
      driverConfig.trust = 'TRUST_ALL_CERTIFICATES'
    }

    console.log(
      `[Neo4j] Connecting to ${uri.replace(/:\/\/.*@/, '://[REDACTED]@')}`
    )
    console.log('[Neo4j] URI encryption scheme detected:', hasEncryptionInUri)
    console.log('[Neo4j] Driver config:', driverConfig)

    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(SECRETS.NEO4J_USER, SECRETS.NEO4J_PASSWORD),
      driverConfig
    )

    // Verify connection
    await driver.verifyConnectivity()
    console.log('[Neo4j] Connection established successfully!')

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
    try {
      schema = await neoSchema.getSchema()
      console.log('[Schema] ✅ Schema generated successfully')
    } catch (error) {
      console.error('\x1b[31m[Schema] ######## 🚨SCHEMA ERROR🚨 #######\x1b[0m')
      console.error('[Schema] Error details:', error)
      console.error('[Schema] Error message:', error.message)
      console.error('[Schema] Error stack:', error.stack)
      console.log(
        '\x1b[31m[Schema] ########## 🚨END OF SCHEMA ERROR🚨 ##################\x1b[0m'
      )
      throw error
    }

    console.log('[Apollo] Creating Apollo Server instance')
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

    console.log('[Apollo] Starting Apollo Server')
    await server.start()
    isInitialized = true
    console.log('[Apollo] ✅ Server initialized successfully')
  } catch (error) {
    console.error('[Initialization] Server initialization failed:', error)
    throw error
  }
}

// Lambda handler function
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false

  // Initialize on cold start to ensure SECRETS are loaded
  await initializeServer()

  // Determine CORS origin based on environment
  const allowedOrigin =
    SECRETS?.ENVIRONMENT === 'development'
      ? 'https://dev-synago.firstlovecenter.com'
      : 'https://admin.firstlovecenter.com'

  console.log('[CORS Debug] Allowed origin:', allowedOrigin)

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    // Log event structure for debugging
    console.log('[Event Debug] Event keys:', Object.keys(event))
    console.log('[Event Debug] Event:', JSON.stringify(event, null, 2))

    // Handle OPTIONS preflight request
    if (
      event.httpMethod === 'OPTIONS' ||
      event.requestContext?.http?.method === 'OPTIONS'
    ) {
      return {
        statusCode: 204,
        headers: {
          ...corsHeaders,
        },
        body: null,
      }
    }

    // Parse and validate request (handle both API Gateway v1 and v2 formats)
    const body = event.body || event.rawBody || event.requestBody
    const headers = event.headers || {}
    const httpMethod =
      event.httpMethod || event.requestContext?.http?.method || 'POST'

    console.log('[Request Debug] Body exists:', !!body)
    console.log('[Request Debug] Body type:', typeof body)
    console.log('[Request Debug] HTTP Method:', httpMethod)

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

    // Handle JWT authentication properly
    const token = headers.authorization || headers.Authorization
    let jwt = null

    if (token) {
      try {
        const cleanToken = token.replace(/^Bearer\s+/i, '')
        console.log('[Auth] Decoding JWT token')
        jwt = jwtDecode(cleanToken)
        console.log('[Auth] JWT decoded successfully', {
          roles: jwt?.roles,
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
