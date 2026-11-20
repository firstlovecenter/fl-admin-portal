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
  './resolvers/utils/error-reference',
  () => ({ errorReferencePlugin: {}, formatError: jest.fn() }),
  { virtual: true }
)
jest.mock(
  './resolvers/downloads/downloads-lambda',
  () => ({
    isDownloadEvent: jest.fn(() => false),
    handleDownloadLambdaEvent: jest.fn(),
  }),
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
  jest.spyOn(console, 'warn').mockImplementation(() => {})
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
    const res = await handler(
      optionsEvent('http://localhost:5173'),
      makeContext()
    )

    expect(res.statusCode).toBe(204)
    expect(res.headers).not.toHaveProperty('Access-Control-Allow-Origin')
  })

  it('always includes Allow-Methods and Vary: Origin, even without a match', async () => {
    const res = await handler(
      optionsEvent('https://evil.example.com'),
      makeContext()
    )

    expect(res.statusCode).toBe(204)
    expect(res.headers['Access-Control-Allow-Methods']).toBe(
      'GET, POST, OPTIONS'
    )
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
    // SECRETS = { ENVIRONMENT: 'development', ... }) and is then rejected as a
    // malformed request with a 400 (SYN-254). We only care about the SECRETS
    // side effect here.
    const warm = await handler(
      { httpMethod: 'POST', headers: { origin: 'http://localhost:5173' } },
      makeContext()
    )
    expect(warm.statusCode).toBe(400)
  })

  it('registers the error reference plugin on the Lambda server', () => {
    const { ApolloServer } = require('@apollo/server')
    const {
      errorReferencePlugin,
    } = require('./resolvers/utils/error-reference')

    const [config] = ApolloServer.mock.calls[ApolloServer.mock.calls.length - 1]

    expect(config.plugins).toContain(errorReferencePlugin)
  })

  it('registers the shared formatError so @neo4j/graphql auth errors get a code (SYN-258)', () => {
    const { ApolloServer } = require('@apollo/server')
    const { formatError } = require('./resolvers/utils/error-reference')

    const [config] = ApolloServer.mock.calls[ApolloServer.mock.calls.length - 1]

    expect(config.formatError).toBe(formatError)
  })

  it('does not pass the v5-deprecated status400ForVariableCoercionErrors option (SYN-223)', () => {
    // Apollo Server v5 warns on cold start whenever this key is present in the
    // config — even set to `true`, which is now the default.
    const { ApolloServer } = require('@apollo/server')

    const [config] = ApolloServer.mock.calls[ApolloServer.mock.calls.length - 1]

    expect(config).not.toHaveProperty('status400ForVariableCoercionErrors')
  })

  it('the real Apollo Server v5 logs no WARN for the Lambda server config (SYN-223)', () => {
    const { ApolloServer } = require('@apollo/server')
    const RealApolloServer = jest.requireActual('@apollo/server').ApolloServer
    const { buildSchema } = jest.requireActual('graphql')

    const [config] = ApolloServer.mock.calls[ApolloServer.mock.calls.length - 1]
    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    // Real constructor, the handler's own config (the mocked schema/plugins
    // are swapped for real stand-ins). Option validation and its deprecation
    // warnings run synchronously in the constructor. Covers top-level config
    // options only, not the stubbed rules/plugins.
    // eslint-disable-next-line no-new
    new RealApolloServer({
      ...config,
      schema: buildSchema('type Query { _empty: String }'),
      validationRules: [],
      plugins: [],
      logger,
    })

    expect(logger.warn).not.toHaveBeenCalled()
  })

  it.each([
    ['http://127.0.0.1:5173'],
    ['http://localhost:5173'],
    ['http://127.0.0.1:3000'],
    ['http://localhost:3000'],
  ])(
    'returns 204 and echoes ACAO for allowed dev origin %s',
    async (origin) => {
      const res = await handler(optionsEvent(origin), makeContext())

      expect(res.statusCode).toBe(204)
      expect(res.body).toBeNull()
      expect(res.headers['Access-Control-Allow-Origin']).toBe(origin)
    }
  )

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
    expect(res.headers['Access-Control-Allow-Methods']).toBe(
      'GET, POST, OPTIONS'
    )
    expect(res.headers.Vary).toBe('Origin')
  })

  it('matches the origin from the capitalised `Origin` header too', async () => {
    // requestOrigin = event.headers.origin || event.headers.Origin
    const res = await handler(
      { httpMethod: 'OPTIONS', headers: { Origin: 'http://localhost:3000' } },
      makeContext()
    )

    expect(res.statusCode).toBe(204)
    expect(res.headers['Access-Control-Allow-Origin']).toBe(
      'http://localhost:3000'
    )
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
    expect(res.headers['Access-Control-Allow-Origin']).toBe(
      'http://127.0.0.1:3000'
    )
  })
})

describe('graphql handler — malformed request body (SYN-254)', () => {
  // A non-OPTIONS request with no body (e.g. a browser or probe hitting
  // `GET /graphql`) used to throw a SyntaxError into the catch-all, which
  // logged `[Request] Processing failed` via console.error and answered 500.
  // It is a client error: answer 400 and do not log it as a server failure.
  let handler

  beforeEach(() => {
    jest.resetModules()
    handler = require('./graphql').handler
  })

  it.each([
    ['GET with no body (API Gateway v1)', { httpMethod: 'GET', headers: {} }],
    [
      'GET with no body (API Gateway v2)',
      { requestContext: { http: { method: 'GET' } }, headers: {} },
    ],
    [
      'POST with an empty-string body',
      { httpMethod: 'POST', headers: {}, body: '' },
    ],
    ['event with no headers and no body', { httpMethod: 'POST' }],
  ])(
    'returns 400 BAD_REQUEST for %s without console.error',
    async (_, event) => {
      const res = await handler(event, makeContext())

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body)).toEqual({
        errors: [
          {
            message: 'Request body is undefined or empty',
            extensions: { code: 'BAD_REQUEST' },
          },
        ],
      })
      expect(console.error).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Request body is undefined or empty')
      )
    }
  )

  it('returns 400 for a non-JSON body and never logs the body', async () => {
    const res = await handler(
      { httpMethod: 'POST', headers: {}, body: 'not-json secret-value' },
      makeContext()
    )

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).errors[0]).toEqual({
      message: 'Invalid JSON in request body',
      extensions: { code: 'BAD_REQUEST' },
    })
    expect(console.error).not.toHaveBeenCalled()
    const logged = [...console.warn.mock.calls, ...console.log.mock.calls]
      .flat()
      .map(String)
      .join(' ')
    expect(logged).not.toContain('secret-value')
  })

  it.each([['null'], ['"a string"'], ['42'], ['[{"query":"{ ok }"}]']])(
    'returns 400 for a JSON body that is not an object (%s)',
    async (body) => {
      const res = await handler(
        { httpMethod: 'POST', headers: {}, body },
        makeContext()
      )

      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).errors[0]).toEqual({
        message: 'Request body must be a JSON object',
        extensions: { code: 'BAD_REQUEST' },
      })
      expect(console.error).not.toHaveBeenCalled()
    }
  )

  it('keeps CORS headers on the 400 so the browser can read the error', async () => {
    // Fresh module → SECRETS loads during this call, then the dev allow-list
    // is NOT yet in effect for this request (computed before init), so use a
    // production origin which is always allowed.
    const res = await handler(
      {
        httpMethod: 'GET',
        headers: { origin: 'https://staging-synago.firstlovecenter.com' },
      },
      makeContext()
    )

    expect(res.statusCode).toBe(400)
    expect(res.headers['Content-Type']).toBe('application/json')
    expect(res.headers['Access-Control-Allow-Origin']).toBe(
      'https://staging-synago.firstlovecenter.com'
    )
  })

  it('still executes a well-formed POST through Apollo', async () => {
    const { ApolloServer } = require('@apollo/server')
    const res0 = await handler(
      { httpMethod: 'GET', headers: {} },
      makeContext()
    )
    expect(res0.statusCode).toBe(400)

    const server =
      ApolloServer.mock.results[ApolloServer.mock.results.length - 1].value
    server.executeOperation.mockResolvedValue({
      body: { singleResult: { data: { ok: true }, errors: undefined } },
    })

    const res = await handler(
      {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({ query: '{ ok }' }),
      },
      makeContext()
    )

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ data: { ok: true } })
    expect(server.executeOperation).toHaveBeenCalledWith(
      expect.objectContaining({ query: '{ ok }', variables: {} }),
      expect.anything()
    )
  })
})
