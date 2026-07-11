/**
 * Characterization tests for the CORS / OPTIONS-preflight behavior of the
 * Lambda `handler` exported from `graphql.js`.
 *
 * Scope: ONLY the pre-`initializeServer()` CORS path (lines ~142-192). An
 * OPTIONS request returns `{ statusCode: 204, headers: corsHeaders, body: null }`
 * BEFORE any secrets/Neo4j/Apollo work, so these tests never touch the network
 * or the database.
 *
 * `graphql.js` lives in a self-contained Lambda directory; its `./schema/...`
 * and `./resolvers/...` requires are populated at package time and do NOT exist
 * next to the source. They are supplied here as `virtual` jest mocks so the
 * module can be required under Jest. The heavy real deps (`@neo4j/graphql`,
 * `@apollo/server`, `neo4j-driver`) are mocked to keep require() cheap and to
 * avoid ESM parse issues.
 */

// --- Real dependencies: mocked so require() is cheap and offline. ---
jest.mock('@neo4j/graphql', () => ({
  Neo4jGraphQL: jest.fn().mockImplementation(() => ({
    getSchema: jest.fn().mockResolvedValue({}),
  })),
}))

jest.mock('@apollo/server', () => ({
  ApolloServer: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    executeOperation: jest.fn(),
  })),
}))

jest.mock('neo4j-driver', () => ({
  driver: jest.fn(() => ({
    verifyConnectivity: jest.fn().mockResolvedValue(undefined),
    session: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  auth: { basic: jest.fn() },
}))

// --- Package-time siblings: do not exist next to the source, so virtual. ---
jest.mock(
  './schema/graphql-schema',
  () => ({ typeDefs: 'type Query { _empty: String }' }),
  { virtual: true }
)
jest.mock('./resolvers/resolvers', () => ({ default: {} }), { virtual: true })
jest.mock(
  './resolvers/secrets',
  () => ({
    loadSecrets: jest.fn().mockResolvedValue({
      ENVIRONMENT: 'development',
      NEO4J_URI: 'bolt://localhost:7687/',
      NEO4J_USER: 'neo4j',
      NEO4J_PASSWORD: 'password',
      JWT_SECRET: 'test-secret',
    }),
  }),
  { virtual: true }
)
jest.mock(
  './resolvers/utils/verify-jwt',
  () => ({ verifyJwt: jest.fn(() => undefined) }),
  { virtual: true }
)
jest.mock(
  './resolvers/utils/allowed-church-ids',
  () => ({ computeUserAuthority: jest.fn() }),
  { virtual: true }
)
jest.mock(
  './resolvers/utils/require-auth-for-mutations',
  () => ({ requireAuthForMutationsPlugin: {} }),
  { virtual: true }
)
jest.mock(
  './resolvers/utils/depth-limit',
  () => ({ depthLimit: jest.fn(() => ({})) }),
  { virtual: true }
)
jest.mock(
  './resolvers/downloads/downloads-lambda',
  () => ({ isDownloadEvent: jest.fn(() => false), handleDownloadLambdaEvent: jest.fn() }),
  { virtual: true }
)

const optionsEvent = (origin) => ({
  httpMethod: 'OPTIONS',
  headers: origin ? { origin } : {},
})

const makeContext = () => ({ callbackWaitsForEmptyEventLoop: true })

beforeEach(() => {
  // Silence the handler's verbose logging. Set inside beforeEach because the
  // Jest config uses restoreMocks:true (spies are restored before each test).
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('graphql handler — CORS preflight, PRODUCTION branch (SECRETS unloaded)', () => {
  // A fresh require leaves module-level SECRETS undefined, so
  // `SECRETS?.ENVIRONMENT === 'development'` is false and the handler uses the
  // production allow-list. This is the branch reached on a cold-start preflight.
  let handler

  beforeEach(() => {
    jest.resetModules()
    handler = require('./graphql').handler
  })

  it('returns 204 for OPTIONS and echoes ACAO for a production origin', async () => {
    const res = await handler(
      optionsEvent('https://staging-synago.firstlovecenter.com'),
      makeContext()
    )

    expect(res.statusCode).toBe(204)
    expect(res.body).toBeNull()
    expect(res.headers['Access-Control-Allow-Origin']).toBe(
      'https://staging-synago.firstlovecenter.com'
    )
  })

  it('does NOT include ACAO for a local dev origin on the production branch', async () => {
    // localhost:5173 is only allowed on the development branch. On a cold start
    // (SECRETS unloaded) the production list is used, so ACAO is absent.
    const res = await handler(optionsEvent('http://localhost:5173'), makeContext())

    expect(res.statusCode).toBe(204)
    expect(res.headers).not.toHaveProperty('Access-Control-Allow-Origin')
  })

  it('always includes Allow-Methods and Vary: Origin, even without a match', async () => {
    const res = await handler(
      optionsEvent('https://evil.example.com'),
      makeContext()
    )

    expect(res.statusCode).toBe(204)
    expect(res.headers['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS')
    expect(res.headers.Vary).toBe('Origin')
    expect(res.headers).not.toHaveProperty('Access-Control-Allow-Origin')
  })
})

describe('graphql handler — CORS preflight, DEVELOPMENT branch (SECRETS warm)', () => {
  // To reach the development allow-list, module-level SECRETS.ENVIRONMENT must
  // equal 'development'. SECRETS is set only inside initializeServer(), which
  // runs on the first non-OPTIONS invocation. We warm the module with one POST
  // (all init deps mocked) so subsequent OPTIONS calls take the dev branch.
  let handler

  beforeEach(async () => {
    jest.resetModules()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    handler = require('./graphql').handler

    // Warm init: a POST with no body runs initializeServer() (setting
    // SECRETS = { ENVIRONMENT: 'development', ... }) and then throws a
    // SyntaxError for the empty body, which the handler catches and returns as
    // a 500. We only care about the SECRETS side effect here.
    const warm = await handler(
      { httpMethod: 'POST', headers: { origin: 'http://localhost:5173' } },
      makeContext()
    )
    expect(warm.statusCode).toBe(500)
  })

  it.each([
    ['http://127.0.0.1:5173'],
    ['http://localhost:5173'],
    ['http://127.0.0.1:3000'],
    ['http://localhost:3000'],
  ])('returns 204 and echoes ACAO for allowed dev origin %s', async (origin) => {
    const res = await handler(optionsEvent(origin), makeContext())

    expect(res.statusCode).toBe(204)
    expect(res.body).toBeNull()
    expect(res.headers['Access-Control-Allow-Origin']).toBe(origin)
  })

  it('still honours the deployed dev origins on the development branch', async () => {
    const res = await handler(
      optionsEvent('https://dev-synago.firstlovecenter.com'),
      makeContext()
    )

    expect(res.statusCode).toBe(204)
    expect(res.headers['Access-Control-Allow-Origin']).toBe(
      'https://dev-synago.firstlovecenter.com'
    )
  })

  it('returns 204 but NO ACAO for a disallowed origin on the dev branch', async () => {
    const res = await handler(
      optionsEvent('https://evil.example.com'),
      makeContext()
    )

    expect(res.statusCode).toBe(204)
    expect(res.headers).not.toHaveProperty('Access-Control-Allow-Origin')
    expect(res.headers['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS')
    expect(res.headers.Vary).toBe('Origin')
  })

  it('matches the origin from the capitalised `Origin` header too', async () => {
    // requestOrigin = event.headers.origin || event.headers.Origin
    const res = await handler(
      { httpMethod: 'OPTIONS', headers: { Origin: 'http://localhost:3000' } },
      makeContext()
    )

    expect(res.statusCode).toBe(204)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000')
  })

  it('treats API Gateway v2 OPTIONS (requestContext.http.method) as a preflight', async () => {
    const res = await handler(
      {
        requestContext: { http: { method: 'OPTIONS' } },
        headers: { origin: 'http://127.0.0.1:3000' },
      },
      makeContext()
    )

    expect(res.statusCode).toBe(204)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('http://127.0.0.1:3000')
  })
})
