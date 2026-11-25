import { ApolloServer } from '@apollo/server'
import { Neo4jGraphQL } from '@neo4j/graphql'
import { GraphQLError } from 'graphql'
import {
  createErrorRef,
  errorReferencePlugin,
  formatError,
  logLevelForCode,
  logLevelForError,
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

// Wired like both bootstraps: the real formatError runs before the plugin, and
// `introspection: false` mirrors production (SYN-177).
// `hideSchemaDetailsFromClientErrors` mirrors production too (SYN-280).
const buildServer = (introspection = true, hideSchemaDetails = false) =>
  new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
    plugins: [errorReferencePlugin],
    includeStacktraceInErrorResponses: false,
    introspection,
    hideSchemaDetailsFromClientErrors: hideSchemaDetails,
  })

const run = async (
  query: string,
  contextValue = {},
  introspection = true,
  { operationName = 'Probe' as string | null, hideSchemaDetails = false } = {}
) => {
  const server = buildServer(introspection, hideSchemaDetails)
  const response = await server.executeOperation(
    // null sends no operation name, like the probes in SYN-280.
    { query, operationName: operationName ?? undefined },
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
    [
      'bare email',
      'Lookup failed for ama@example.com today',
      ['ama@example.com'],
    ],
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

describe('logLevelForError (SYN-268)', () => {
  it('logs the introspection refusal at warn', () => {
    expect(
      logLevelForError({
        message: 'GraphQL introspection is not allowed',
        extensions: {
          code: 'GRAPHQL_VALIDATION_FAILED',
          validationErrorCode: 'INTROSPECTION_DISABLED',
        },
      })
    ).toBe('warn')
  })

  it('keeps any other validation failure on a named operation at error', () => {
    expect(
      logLevelForError(
        {
          message: 'Cannot query field "gone" on type "Query".',
          extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
        },
        'getMembers'
      )
    ).toBe('error')
  })

  it.each([undefined, null, ''])(
    'SYN-280: logs a validation failure on an unnamed (%p) operation at warn',
    (operationName) => {
      expect(
        logLevelForError(
          {
            message: 'Cannot query field "gone" on type "Query".',
            extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
          },
          operationName
        )
      ).toBe('warn')
    }
  )

  it('SYN-280: keeps a real failure on an unnamed operation at error', () => {
    expect(
      logLevelForError(
        { message: 'x', extensions: { code: 'INTERNAL_SERVER_ERROR' } },
        undefined
      )
    ).toBe('error')
  })

  it('falls back to the code-based level', () => {
    expect(
      logLevelForError({ message: 'x', extensions: { code: 'FORBIDDEN' } })
    ).toBe('warn')
    expect(logLevelForError({ message: 'x' })).toBe('error')
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

  it('SYN-268: logs a refused introspection query once at warn, not error', async () => {
    const result = await run(
      'query Probe { __schema { queryType { name } } }',
      {},
      false
    )

    expect(result.errors?.[0].extensions?.code).toBe(
      'GRAPHQL_VALIDATION_FAILED'
    )
    expect(errorLog).not.toHaveBeenCalled()
    expect(warnLog).toHaveBeenCalledTimes(1)
    expect(warnLog.mock.calls[0][0]).toContain('code=GRAPHQL_VALIDATION_FAILED')
    expect(warnLog.mock.calls[0][0]).toContain('introspection is not allowed')
  })

  it('SYN-268: keeps a query against a missing field at error', async () => {
    const result = await run('query Probe { gone }', {}, false)

    expect(result.errors?.[0].extensions?.code).toBe(
      'GRAPHQL_VALIDATION_FAILED'
    )
    expect(warnLog).not.toHaveBeenCalled()
    expect(errorLog).toHaveBeenCalledTimes(1)
  })

  // SYN-280 — the ticket's shape: an unnamed operation, sent without a
  // token, asking for a field that does not exist. Not our client (it names
  // every operation), so it must not land on the ERROR line.
  it('SYN-280: logs an unnamed query against a missing field once at warn, not error', async () => {
    const result = await run('{ gone }', {}, false, {
      operationName: null,
    })

    expect(result.errors?.[0].extensions?.code).toBe(
      'GRAPHQL_VALIDATION_FAILED'
    )
    expect(errorLog).not.toHaveBeenCalled()
    expect(warnLog).toHaveBeenCalledTimes(1)
    expect(warnLog.mock.calls[0][0]).toContain(
      'op=<anonymous> user=anonymous code=GRAPHQL_VALIDATION_FAILED'
    )
  })

  it('SYN-280: keeps a real failure in an unnamed query at error', async () => {
    await run('{ crashed }', {}, true, { operationName: null })

    expect(warnLog).not.toHaveBeenCalled()
    expect(errorLog).toHaveBeenCalledTimes(1)
    expect(errorLog.mock.calls[0][0]).toContain('code=INTERNAL_SERVER_ERROR')
  })

  it('SYN-280: production hides the "Did you mean" field suggestions', async () => {
    const shown = await run('{ incom }', {}, false, {
      operationName: null,
    })
    const hidden = await run('{ incom }', {}, false, {
      operationName: null,
      hideSchemaDetails: true,
    })

    expect(shown.errors?.[0].message).toContain('Did you mean')
    expect(hidden.errors?.[0].message).toBe(
      'Cannot query field "incom" on type "Query".'
    )
    expect(hidden.errors?.[0].extensions?.code).toBe(
      'GRAPHQL_VALIDATION_FAILED'
    )
    expect(warnLog.mock.calls.at(-1)?.[0]).not.toContain('Did you mean')
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
    const aliases = Array.from(
      { length: 12 },
      (_, i) => `a${i}: optionalIncome`
    )

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

describe('formatError (SYN-258)', () => {
  // The library's error classes are not exported, so build look-alikes that
  // mirror them: same class names, and the base class keeps the inherited
  // `name === 'GraphQLError'` exactly as the library's does.
  class Neo4jGraphQLError extends GraphQLError {}
  class Neo4jGraphQLAuthenticationError extends Neo4jGraphQLError {}
  class Neo4jGraphQLForbiddenError extends Neo4jGraphQLError {}
  const classes: Record<string, new (message: string) => GraphQLError> = {
    Neo4jGraphQLError,
    Neo4jGraphQLAuthenticationError,
    Neo4jGraphQLForbiddenError,
  }
  const libraryError = (name: string, message: string) =>
    new classes[name](message)

  // How graphql-js hands a resolver's throw to Apollo: located at a path,
  // the library error kept as `originalError`.
  const located = (original: Error) =>
    new GraphQLError(original.message, {
      path: ['streams'],
      originalError: original,
    })

  const formatted = {
    message: 'x',
    extensions: { code: 'INTERNAL_SERVER_ERROR', keep: 1 },
  }

  it.each([
    ['Neo4jGraphQLError', 'Unauthenticated', 'UNAUTHENTICATED'],
    ['Neo4jGraphQLAuthenticationError', 'Unauthenticated', 'UNAUTHENTICATED'],
    ['Neo4jGraphQLForbiddenError', 'Forbidden', 'FORBIDDEN'],
  ])('codes a %s "%s" as %s', (name, message, code) => {
    const result = formatError(formatted, located(libraryError(name, message)))

    expect(result.extensions).toEqual({ code, keep: 1 })
  })

  it.each([
    [
      'another @neo4j/graphql error',
      libraryError('Neo4jGraphQLError', 'Constraint validation failed'),
    ],
    ['our own resolver error with the same text', new Error('Unauthenticated')],
    ['a crash', new Error('Neo4j unavailable')],
    ['a non-error throw', 'boom'],
  ])('leaves %s untouched', (_name, original) => {
    const error = original instanceof Error ? located(original) : original

    expect(formatError(formatted, error)).toBe(formatted)
  })
})

describe('anonymous @authentication query (SYN-258)', () => {
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

  // Reproduces the ticket end to end: the real library refuses the anonymous
  // read while translating it. The stub transaction only answers the
  // library's one-off version probe, so no database is needed.
  it('reports UNAUTHENTICATED and logs at warn, not INTERNAL_SERVER_ERROR at error', async () => {
    const neoSchema = new Neo4jGraphQL({
      typeDefs: `
        type Stream @authentication(operations: [READ]) @node {
          id: ID!
        }
      `,
      features: { authorization: { key: 'test-secret' } },
    })
    const server = new ApolloServer({
      schema: await neoSchema.getSchema(),
      formatError,
      plugins: [errorReferencePlugin],
    })
    const transactionRun = jest
      .fn()
      .mockResolvedValue({ records: [['5.26.0', 'enterprise']] })

    const response = await server.executeOperation(
      {
        query: 'query streamDefaulters { streams { id } }',
        operationName: 'streamDefaulters',
      },
      { contextValue: { executionContext: { run: transactionRun } } }
    )
    await server.stop()

    if (response.body.kind !== 'single') throw new Error('expected single')
    const [error] = response.body.singleResult.errors ?? []
    expect(error.message).toBe('Unauthenticated')
    expect(error.extensions?.code).toBe('UNAUTHENTICATED')
    expect(errorLog).not.toHaveBeenCalled()
    expect(warnLog).toHaveBeenCalledTimes(1)
    expect(warnLog.mock.calls[0][0]).toContain(
      'op=streamDefaulters user=anonymous code=UNAUTHENTICATED'
    )
    // Refused before any data query was sent.
    transactionRun.mock.calls.forEach(([cypher]) =>
      expect(cypher).toContain('dbms.components')
    )
  })
})
