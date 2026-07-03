const { Neo4jGraphQL } = require('@neo4j/graphql')
const { ApolloServer } = require('@apollo/server')
// Removed startServerAndCreateLambdaHandler import
const neo4j = require('neo4j-driver')
const { typeDefs } = require('./schema/graphql-schema')
const { loadSecrets } = require('./resolvers/secrets')
const resolvers = require('./resolvers/resolvers').default
const { verifyJwt } = require('./resolvers/utils/verify-jwt')
const { computeUserAuthority } = require('./resolvers/utils/allowed-church-ids')
const {
  requireAuthForMutationsPlugin,
} = require('./resolvers/utils/require-auth-for-mutations')
const { depthLimit } = require('./resolvers/utils/depth-limit')
const {
  isDownloadEvent,
  handleDownloadLambdaEvent,
} = require('./resolvers/downloads/downloads-lambda')

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
    // SYN-177 — disable introspection outside development. Apollo enables it by
    // default; anything that is not explicitly the dev environment is treated
    // as production (secure default) so a mis-set ENVIRONMENT never exposes the
    // schema on the public endpoint.
    const isDevelopment = SECRETS?.ENVIRONMENT === 'development'
    server = new ApolloServer({
      schema,
      introspection: isDevelopment,
      status400ForVariableCoercionErrors: true,
      // SYN-177 — fail closed on the same ENVIRONMENT signal as introspection
      // (not process.env.NODE_ENV, which may be unset in the Lambda) so raw
      // stack traces / Neo4j error text never reach clients in production.
      includeStacktraceInErrorResponses: isDevelopment,
      // SYN-177 — depth guard on the auto-generated schema; blocks pathological
      // deep-traversal queries before execution in every environment.
      validationRules: [depthLimit()],
      plugins: [requireAuthForMutationsPlugin],
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

  // Compute CORS + handle OPTIONS preflight BEFORE initializeServer().
  // Cold-start cost (secrets load, Neo4j verifyConnectivity, schema
  // generation) can run several seconds or throw; if any of that lands
  // on a preflight, API Gateway returns a non-2xx and the browser
  // surfaces it as a CORS failure even though origins are valid.
  // SECRETS may be unloaded here — optional chaining falls through to
  // the production list, which also contains staging-synago, so the
  // preflight resolves correctly on the first invocation.
  const allowedOrigins =
    SECRETS?.ENVIRONMENT === 'development'
      ? [
          'https://dev-synago.firstlovecenter.com',
          'https://staging-synago.firstlovecenter.com',
        ]
      : [
          'https://admin.firstlovecenter.com',
          'https://synago.firstlovecenter.com',
          'https://staging-synago.firstlovecenter.com',
        ]

  const requestOrigin = event.headers?.origin || event.headers?.Origin || null
  const matchedOrigin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : null

  console.log('[CORS Debug] Matched origin:', matchedOrigin)

  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
    ...(matchedOrigin && { 'Access-Control-Allow-Origin': matchedOrigin }),
  }

  if (
    event.httpMethod === 'OPTIONS' ||
    event.requestContext?.http?.method === 'OPTIONS'
  ) {
    return {
      statusCode: 204,
      headers: { ...corsHeaders },
      body: null,
    }
  }

  // Initialize on cold start to ensure SECRETS are loaded
  await initializeServer()

  // Membership CSV downloads share this Lambda but do not go through Apollo
  // — they stream Cypher rows into a base64-encoded CSV body. Dispatched
  // here before the body-parsing path because GET requests have no body.
  if (isDownloadEvent(event)) {
    return handleDownloadLambdaEvent(
      event,
      driver,
      corsHeaders,
      SECRETS?.JWT_SECRET,
      {
        expectedIss: SECRETS?.JWT_ISSUER,
        expectedAud: SECRETS?.JWT_AUDIENCE,
      }
    )
  }

  try {
    // Log only the event's top-level shape for debugging. SYN-177: the previous
    // `JSON.stringify(safeEvent)` dumped the entire request body on every
    // invocation — and the body carries the GraphQL `variables`, i.e. momo
    // numbers + member PII on banking/arrivals mutations and the leader's
    // free-text pastoral question on `sendChatMessage`. Authorization headers
    // were redacted but the body was not, so all of it landed in CloudWatch.
    // Log keys + header names only; never the body or variables.
    console.log('[Event Debug] Event keys:', Object.keys(event))
    console.log('[Event Debug] Header names:', Object.keys(event.headers || {}))

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

    const token = headers.authorization || headers.Authorization
    // Leave `context.jwt` undefined on a verifier-rejected or absent
    // token. `@neo4j/graphql`'s `getAuthorizationContext` does
    // `if (context.jwt)` — a truthy sentinel like `{}` makes the library
    // treat the request as authenticated and silently bypasses
    // schema-level `@authentication` (the 2026-05-26 incident).
    // Resolvers read claims with `context.jwt?.roles` / `context.jwt?.userId`;
    // `isAuth(...)` already returns FORBIDDEN on undefined roles.
    const verifiedJwt = verifyJwt(token, SECRETS?.JWT_SECRET, {
      expectedIss: SECRETS?.JWT_ISSUER,
      expectedAud: SECRETS?.JWT_AUDIENCE,
    })

    // Enrich the JWT with the caller's authority graph (servantTrees +
    // allowedChurchIds), computed from their Neo4j servant edges. Without
    // this enrichment in the Lambda path:
    //   - `@churchScoped`/`@churchScopedVia` read filters return [] (the
    //     filter is `id IN null` which evaluates false in Cypher).
    //   - `assertCan` on mutations sees no servantTrees and FORBIDs every
    //     action — banking + servant mutations stop working in prod.
    //   - `myAuthority` returns empty arrays, so every breadcrumb on the
    //     FE renders as non-clickable text.
    // Mirrors `api/src/index.js`'s Apollo context builder; both must stay
    // in sync. The cache inside `computeUserAuthority` is module-level so
    // a warm Lambda instance reuses it across invocations.
    let servantTrees = []
    let allowedChurchIds = []
    if (verifiedJwt?.userId) {
      const authority = await computeUserAuthority(
        driver,
        verifiedJwt.userId,
        verifiedJwt.iat,
        verifiedJwt.exp
      )
      servantTrees = authority.servantTrees
      allowedChurchIds = authority.allowedChurchIds
    }

    const jwt = verifiedJwt
      ? { ...verifiedJwt, servantTrees, allowedChurchIds }
      : undefined

    const contextValue = {
      req: event,
      executionContext: driver,
      jwt,
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
