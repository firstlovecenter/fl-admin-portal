import { ApolloServer } from '@apollo/server'
import { GraphQLError } from 'graphql'
import {
  createErrorRef,
  errorReferencePlugin,
  logLevelForCode,
  sanitiseForLog,
} from './error-reference'

const typeDefs = `
  type Query {
    ok: Boolean!
    income: Float!
    optionalIncome: Float
    forbidden: Boolean!
    refused: Boolean!
    unauthenticated: Boolean!
    crashed: Boolean!
  }
`

const resolvers = {
  Query: {
    ok: () => true,
    income: () => Infinity,
    optionalIncome: () => Infinity,
    forbidden: () => {
      throw new GraphQLError('You are not permitted to run this mutation', {
        extensions: { code: 'FORBIDDEN' },
      })
    },
    refused: () => {
      throw new GraphQLError('Please transfer all members and try again.', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    },
    unauthenticated: () => {
      throw new GraphQLError('Unauthenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      })
    },
    // A plain Error is what Apollo reports as INTERNAL_SERVER_ERROR.
    crashed: () => {
      throw new Error('Neo4j unavailable')
    },
  },
}

const buildServer = () =>
  new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [errorReferencePlugin],
    includeStacktraceInErrorResponses: false,
  })

const run = async (query: string, contextValue = {}) => {
  const server = buildServer()
  const response = await server.executeOperation(
    { query, operationName: 'Probe' },
    { contextValue }
  )
  await server.stop()
  if (response.body.kind !== 'single') throw new Error('expected single')
  return response.body.singleResult
}

describe('sanitiseForLog', () => {
  it.each([
    [
      'CreateMember email duplicate',
      'There is a member with this email "ama@example.com" called Ama Boateng',
      ['ama@example.com', 'Ama', 'Boateng'],
    ],
    [
      'CreateMember whatsapp duplicate',
      'There is a member with this whatsapp number "+233241234567" called Kojo Mensah',
      ['+233241234567', 'Kojo', 'Mensah'],
    ],
    [
      'contact collision',
      'This WhatsApp number already belongs to Ama Boateng of Ring Road',
      ['Ama', 'Boateng', 'Ring Road'],
    ],
    [
      'variable coercion',
      'Variable "$whatsappNumber" got invalid value "+233241234567"; Int cannot represent non-integer value: "+233241234567"',
      ['+233241234567'],
    ],
    ['bare email', 'Lookup failed for ama@example.com today', ['ama@example.com']],
    ['bare phone', 'Lookup failed for 0241234567 today', ['0241234567']],
  ])('removes member data from a %s message', (_name, message, secrets) => {
    const sanitised = sanitiseForLog(message)

    secrets.forEach((secret) => expect(sanitised).not.toContain(secret))
  })

  it('keeps the diagnostic text of an internal error', () => {
    expect(
      sanitiseForLog('Float cannot represent non numeric value: Infinity')
    ).toBe('Float cannot represent non numeric value: Infinity')
  })

  it('cannot be used to forge a second log line', () => {
    expect(sanitiseForLog('op\n[GraphQL] forged')).toBe('op [GraphQL] forged')
  })

  it('truncates long messages', () => {
    expect(sanitiseForLog('x'.repeat(1000))).toHaveLength(300)
  })
})

describe('logLevelForCode (SYN-253)', () => {
  it.each(['BAD_USER_INPUT', 'FORBIDDEN', 'UNAUTHENTICATED'])(
    'logs the user-facing refusal code %s at warn',
    (code) => {
      expect(logLevelForCode(code)).toBe('warn')
    }
  )

  it.each([
    'INTERNAL_SERVER_ERROR',
    'UNKNOWN',
    'GRAPHQL_VALIDATION_FAILED',
    undefined,
    null,
    42,
  ])('keeps %s at error', (code) => {
    expect(logLevelForCode(code)).toBe('error')
  })
})

describe('errorReferencePlugin', () => {
  let errorLog: jest.SpyInstance
  let warnLog: jest.SpyInstance

  beforeEach(() => {
    errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    warnLog = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    errorLog.mockRestore()
    warnLog.mockRestore()
  })

  it.each([
    ['refused', 'BAD_USER_INPUT'],
    ['forbidden', 'FORBIDDEN'],
    ['unauthenticated', 'UNAUTHENTICATED'],
  ])(
    'SYN-253: logs a %s refusal once at warn, not error',
    async (field, code) => {
      const result = await run(`query Probe { ${field} }`)

      expect(result.errors?.[0].extensions?.code).toBe(code)
      expect(errorLog).not.toHaveBeenCalled()
      expect(warnLog).toHaveBeenCalledTimes(1)
      expect(warnLog.mock.calls[0][0]).toContain(`code=${code}`)
    }
  )

  it('SYN-253: keeps a real failure at error, once', async () => {
    const result = await run('query Probe { crashed }')

    expect(result.errors?.[0].extensions?.code).toBe('INTERNAL_SERVER_ERROR')
    expect(warnLog).not.toHaveBeenCalled()
    expect(errorLog).toHaveBeenCalledTimes(1)
    expect(errorLog.mock.calls[0][0]).toContain('code=INTERNAL_SERVER_ERROR')
    expect(errorLog.mock.calls[0][0]).toContain('Neo4j unavailable')
  })

  it('creates an 8 character uppercase hex reference', () => {
    expect(createErrorRef()).toMatch(/^[0-9A-F]{8}$/)
  })

  it('returns the reference and logs it beside the real message', async () => {
    const result = await run('query Probe { income }', {
      jwt: { userId: 'user-1' },
    })

    const errorRef = result.errors?.[0].extensions?.errorRef as string
    expect(errorRef).toMatch(/^[0-9A-F]{8}$/)

    const logged = errorLog.mock.calls[0][0] as string
    expect(logged).toContain(`ref=${errorRef}`)
    expect(logged).toContain('op=Probe')
    expect(logged).toContain('user=user-1')
    expect(logged).toContain('path=income')
    expect(logged).toContain('Float cannot represent non numeric value')
  })

  it('keeps existing extensions such as the error code', async () => {
    const result = await run('query Probe { forbidden }')

    expect(result.errors?.[0].extensions?.code).toBe('FORBIDDEN')
    expect(result.errors?.[0].extensions?.errorRef).toBeDefined()
  })

  it('logs anonymous callers without a jwt', async () => {
    await run('query Probe { forbidden }')

    // FORBIDDEN is a refusal, so it lands on the warn line (SYN-253).
    expect(warnLog.mock.calls[0][0]).toContain('user=anonymous')
  })

  it('references every error but caps the log lines per request', async () => {
    const aliases = Array.from({ length: 12 }, (_, i) => `a${i}: optionalIncome`)

    const result = await run(`query Probe { ${aliases.join(' ')} }`)

    expect(result.errors?.[0].extensions?.errorRef).toBeDefined()
    expect(errorLog).toHaveBeenCalledTimes(10)
  })

  it('stays silent on a successful operation', async () => {
    const result = await run('query Probe { ok }')

    expect(result.errors).toBeUndefined()
    expect(errorLog).not.toHaveBeenCalled()
  })
})
