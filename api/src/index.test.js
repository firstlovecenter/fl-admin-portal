/**
 * Bootstrap wiring tests for the local Express + Apollo server (`index.js`).
 * The module starts the server on require, so every I/O dependency (secrets,
 * Neo4j, the schema build, Apollo, Express, the HTTP listener) is mocked and
 * the test only reads the config handed to `new ApolloServer(...)`.
 */

jest.mock('@apollo/server', () => ({
  ApolloServer: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
  })),
}))
jest.mock('@as-integrations/express4', () => ({
  expressMiddleware: jest.fn(() => (req, res, next) => next()),
}))
jest.mock('@apollo/server/plugin/drainHttpServer', () => ({
  ApolloServerPluginDrainHttpServer: jest.fn(() => ({})),
}))
jest.mock('express', () => jest.fn(() => ({ use: jest.fn(), get: jest.fn() })))
jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((options, callback) => callback()),
  })),
}))
jest.mock('neo4j-driver', () => ({
  driver: jest.fn(() => ({
    verifyConnectivity: jest.fn().mockResolvedValue(undefined),
  })),
  auth: { basic: jest.fn() },
}))
jest.mock('@neo4j/graphql', () => ({
  Neo4jGraphQL: jest.fn().mockImplementation(() => ({
    getSchema: jest.fn().mockResolvedValue({}),
  })),
}))
jest.mock('./schema/graphql-schema', () => ({ typeDefs: '' }))
jest.mock('./resolvers/resolvers', () => ({ __esModule: true, default: {} }))
jest.mock('./resolvers/secrets', () => ({
  loadSecrets: jest.fn().mockResolvedValue({
    ENVIRONMENT: 'development',
    JWT_SECRET: 'test-secret',
  }),
}))
jest.mock('./resolvers/utils/verify-jwt', () => ({ verifyJwt: jest.fn() }))
jest.mock('./resolvers/utils/allowed-church-ids', () => ({
  computeUserAuthority: jest.fn(),
}))
jest.mock('./resolvers/downloads/downloads-express', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const flushStartup = () => new Promise((resolve) => setImmediate(resolve))

describe('local server bootstrap', () => {
  let config

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    require('./index')
    await flushStartup()
    const { ApolloServer } = require('@apollo/server')
    ;[[config]] = ApolloServer.mock.calls
  })

  it('registers the shared formatError so @neo4j/graphql auth errors get a code (SYN-258)', () => {
    const { formatError } = jest.requireActual(
      './resolvers/utils/error-reference'
    )

    expect(config.formatError).toBe(formatError)
  })

  it('keeps schema suggestions in development (SYN-280)', () => {
    // Mocked secrets say development: suggestions stay on for local work.
    expect(config.introspection).toBe(true)
    expect(config.hideSchemaDetailsFromClientErrors).toBe(false)
  })

  it('registers the error reference plugin', () => {
    const { errorReferencePlugin } = jest.requireActual(
      './resolvers/utils/error-reference'
    )

    expect(config.plugins).toContain(errorReferencePlugin)
  })
})

describe('local server bootstrap outside development (SYN-177, SYN-280)', () => {
  it('disables introspection and hides schema suggestions', async () => {
    jest.resetModules()
    require('./resolvers/secrets').loadSecrets.mockResolvedValueOnce({
      ENVIRONMENT: 'production',
      JWT_SECRET: 'test-secret',
    })
    require('./index')
    await flushStartup()
    const { ApolloServer } = require('@apollo/server')
    const [[config]] = ApolloServer.mock.calls

    expect(config.introspection).toBe(false)
    expect(config.hideSchemaDetailsFromClientErrors).toBe(true)
  })
})
