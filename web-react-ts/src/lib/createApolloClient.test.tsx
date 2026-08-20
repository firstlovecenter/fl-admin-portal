/**
 * createApolloClient.test.tsx — SYN-79
 *
 * Locks in the Apollo Client link-chain behaviour: auth header, retry
 * policy (5xx retried, 4xx not retried), error-link surface (one toast
 * per query — error link sits outside the retry boundary), and
 * errorPolicy: 'all'. These tests guard against silent regressions in
 * src/lib/createApolloClient.tsx during future link-config changes.
 *
 * Stack: Vitest + MSW (per ADR-013). MSW intercepts fetch and lets us
 * return deterministic 5xx / 4xx / partial-success responses without a
 * real Apollo server.
 *
 * Notes:
 *   - The production app surfaces errors via sonner (`toast.error`).
 *     errorLink sits outside the retry boundary so the user sees one
 *     toast per failed query — not one per retry attempt.
 *   - The auth token source in production is AuthContext, which itself
 *     reads localStorage. Tests pass a synchronous resolver directly to
 *     the factory — the link only cares that it gets a string back.
 *   - Token timeout (8s) is not exercised here; it has its own tested
 *     path in AuthContext.test.tsx.
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest'
import { gql } from '@apollo/client'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import {
  CALLER_HANDLES_ERRORS_CONTEXT,
  createApolloClient,
  RETRY_LINK_MAX_ATTEMPTS,
} from 'lib/createApolloClient'

// Mock sonner so the error link's toast.error calls land on a spy. vi.mock
// is hoisted by Vitest above all imports, so the order of import statements
// above doesn't matter — the mock is in place before `toast` is resolved.
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRAPHQL_URL = 'http://localhost:4001/graphql'

const PING_QUERY = gql`
  query Ping {
    ping
  }
`

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CapturedRequest {
  authorization: string | null
}

/**
 * Install a handler that captures the Authorization header of every incoming
 * POST and returns a successful empty response. Returns the array that will
 * be populated as requests fly in.
 */
function installCapturingHandler(): CapturedRequest[] {
  const captured: CapturedRequest[] = []
  server.use(
    http.post(GRAPHQL_URL, async ({ request }) => {
      captured.push({
        authorization: request.headers.get('authorization'),
      })
      return HttpResponse.json({ data: { ping: 'pong' } })
    })
  )
  return captured
}

/**
 * Install a handler that returns the given HTTP status for every call,
 * counting attempts. The body is a minimal JSON payload so Apollo's
 * httpLink doesn't choke on parsing.
 */
function installStatusHandler(status: number): { calls: number } {
  const counter = { calls: 0 }
  server.use(
    http.post(GRAPHQL_URL, async () => {
      counter.calls += 1
      return HttpResponse.json(
        { errors: [{ message: `HTTP ${status}` }] },
        { status }
      )
    })
  )
  return counter
}

const tokenResolver = (token: string | null) => async (): Promise<string> => {
  if (token === null) throw new Error('No token')
  return token
}

// ---------------------------------------------------------------------------
// Auth header
// ---------------------------------------------------------------------------

describe('createApolloClient — auth header', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  it('attaches Authorization: Bearer <token> when the resolver returns a token', async () => {
    const captured = installCapturingHandler()
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok-abc'),
      uri: GRAPHQL_URL,
    })

    const result = await client.query({
      query: PING_QUERY,
      fetchPolicy: 'no-cache',
    })

    expect(result.data).toEqual({ ping: 'pong' })
    expect(captured).toHaveLength(1)
    expect(captured[0].authorization).toBe('Bearer tok-abc')
  })

  it('omits the Authorization header when the resolver rejects (post-logout)', async () => {
    const captured = installCapturingHandler()
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver(null),
      uri: GRAPHQL_URL,
    })

    await client.query({ query: PING_QUERY, fetchPolicy: 'no-cache' })

    expect(captured).toHaveLength(1)
    expect(captured[0].authorization).toBeNull()
  })

  it('reads the token per-request, so rotation is reflected on the next call', async () => {
    const captured = installCapturingHandler()
    let current = 'tok-first'
    const client = createApolloClient({
      getAccessTokenSilently: async () => current,
      uri: GRAPHQL_URL,
    })

    await client.query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
    current = 'tok-second'
    await client.query({ query: PING_QUERY, fetchPolicy: 'no-cache' })

    expect(captured.map((c) => c.authorization)).toEqual([
      'Bearer tok-first',
      'Bearer tok-second',
    ])
  })
})

// ---------------------------------------------------------------------------
// Retry link
// ---------------------------------------------------------------------------

describe('createApolloClient — retry link', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  it('exposes the documented max attempts constant', () => {
    expect(RETRY_LINK_MAX_ATTEMPTS).toBe(5)
  })

  it('retries a 5xx exactly RETRY_LINK_MAX_ATTEMPTS times (initial + retries)', async () => {
    const counter = installStatusHandler(500)
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    // The query will reject after retries exhaust. Catch so the test can
    // assert on the call count.
    await expect(
      client.query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
    ).rejects.toBeDefined()

    // RetryLink's `attempts.max` is the TOTAL number of attempts, including
    // the first. This is the contract we are locking in. If a future change
    // moves to "initial + N retries" semantics, this test will catch it.
    expect(counter.calls).toBe(RETRY_LINK_MAX_ATTEMPTS)
  }, 20000)

  it('does NOT retry a 401 — auth errors must not loop', async () => {
    const counter = installStatusHandler(401)
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await expect(
      client.query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
    ).rejects.toBeDefined()

    expect(counter.calls).toBe(1)
  })

  it('does NOT retry a 403 — permission errors must not loop', async () => {
    const counter = installStatusHandler(403)
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await expect(
      client.query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
    ).rejects.toBeDefined()

    expect(counter.calls).toBe(1)
  })

  it('does NOT retry a 404 — missing resource is not transient', async () => {
    const counter = installStatusHandler(404)
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await expect(
      client.query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
    ).rejects.toBeDefined()

    expect(counter.calls).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Error link — snackbar surface
// ---------------------------------------------------------------------------

describe('createApolloClient — error link', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  it('surfaces a toast for a graphQLErrors payload', async () => {
    server.use(
      http.post(GRAPHQL_URL, async () =>
        HttpResponse.json({
          data: null,
          errors: [{ message: 'boom', path: ['ping'] }],
        })
      )
    )
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await client
      .query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
      .catch(() => undefined)

    expect(toast.error).toHaveBeenCalledTimes(1)
   // SYN-178 — the user-facing toast title is generic; the raw GraphQL
    // message ('boom') must NOT leak into it. It survives only inside the
    // stable dedupe `id` (an internal seam, never rendered) and the dev
    // console. Asserting the generic title + description pins that contract.
    expect(toast.error).toHaveBeenCalledWith(
      'Something went wrong',
      expect.objectContaining({
        id: 'gql:boom:ping',
        description:
          'Please try again. If this keeps happening, contact support.',
      })
    )
  })

  it('skips the toast for "Unauthenticated" errors (handled by the auth gate)', async () => {
    server.use(
      http.post(GRAPHQL_URL, async () =>
        HttpResponse.json({
          data: null,
          errors: [{ message: 'Unauthenticated', path: ['ping'] }],
        })
      )
    )
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await client
      .query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
      .catch(() => undefined)

    expect(toast.error).not.toHaveBeenCalled()
  })

  it('fires exactly once on a 5xx that retries to exhaustion (no snackbar storm)', async () => {
    // errorLink sits OUTSIDE the retry boundary, so the user sees exactly
    // ONE error toast per query — not one per retry attempt. Locking in
    // this contract: if anyone ever reorders the link chain (or moves the
    // error link inside retryLink), this test fails immediately.
    //
    // The handler returns a plain-text 500 (no parseable `errors` body)
    // so the surface is purely a networkError — the realistic shape of a
    // crashed origin, gateway timeout, or load-balancer 5xx.
    const counter = { calls: 0 }
    server.use(
      http.post(GRAPHQL_URL, async () => {
        counter.calls += 1
        return new HttpResponse('Internal Server Error', { status: 500 })
      })
    )
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await client
      .query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
      .catch(() => undefined)

    // RetryLink burned all attempts under the hood.
    expect(counter.calls).toBe(RETRY_LINK_MAX_ATTEMPTS)
    // But the error link only fired ONCE — exactly once per query.
    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(
      'Network Error',
      expect.objectContaining({ id: expect.stringMatching(/^network:/) })
    )
  }, 20000)

  it('every toast.error call includes a stable `id` for sonner dedupe', async () => {
    // Second line of defence — even if the link order ever regressed and
    // the error link fired per attempt, sonner would still dedupe to a
    // single user-visible toast as long as `id` is stable. This test
    // pins the dedupe seam itself.
    server.use(
      http.post(GRAPHQL_URL, async () =>
        HttpResponse.json({
          data: null,
          errors: [{ message: 'boom', path: ['ping'] }],
        })
      )
    )
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await client
      .query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
      .catch(() => undefined)

    const calls = vi.mocked(toast.error).mock.calls
    for (const [, opts] of calls) {
      expect((opts as { id?: string } | undefined)?.id).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// Error link — caller-handled errors (SYN-208)
// ---------------------------------------------------------------------------

/**
 * The collision error UpdateMember.tsx renders as <MemberCollisionDialog>.
 * Shape mirrors api/src/resolvers/utils/utils.ts → memberContactCollisionError.
 */
const collisionError = {
  message: 'This email already belongs to Ama Mensah',
  path: ['ping'],
  extensions: {
    code: 'BAD_USER_INPUT',
    severity: 'USER_ERROR',
    collision: {
      field: 'email',
      status: 'inactive',
      memberId: 'member-1',
      firstName: 'Ama',
      lastName: 'Mensah',
      bacentaName: null,
    },
  },
}

const respondWithErrors = (errors: unknown[]) =>
  server.use(
    http.post(GRAPHQL_URL, async () =>
      HttpResponse.json({ data: null, errors })
    )
  )

describe('createApolloClient — error link, caller-handled errors', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  it('does NOT toast when the caller opted out — it renders its own UI', async () => {
    // SYN-208 — the generic "Something went wrong" toast used to stack on top
    // of the friendly collision dialog, contradicting it. A caller that passes
    // CALLER_HANDLES_ERRORS_CONTEXT owns the surface; the link stays quiet.
    respondWithErrors([collisionError])
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await client
      .query({
        query: PING_QUERY,
        fetchPolicy: 'no-cache',
        context: CALLER_HANDLES_ERRORS_CONTEXT,
      })
      .catch(() => undefined)

    expect(toast.error).not.toHaveBeenCalled()
  })

  it('still logs the suppressed error to the dev console', async () => {
    // The suppression must not cost debuggability: the early return sits after
    // the DEV console.error, never before it.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    respondWithErrors([collisionError])
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await client
      .query({
        query: PING_QUERY,
        fetchPolicy: 'no-cache',
        context: CALLER_HANDLES_ERRORS_CONTEXT,
      })
      .catch(() => undefined)

    expect(consoleError).toHaveBeenCalledWith(
      `[GraphQL error]: ${collisionError.message}`,
      expect.anything()
    )
    consoleError.mockRestore()
  })

  it('still toasts the SAME error for a caller that did not opt out', async () => {
    // The guard against over-suppression: EditPage.tsx awaits this same
    // mutation with no error handling at all, so keying off the error payload
    // instead of the caller would turn its failed write into a silent no-op.
    respondWithErrors([collisionError])
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await client
      .query({ query: PING_QUERY, fetchPolicy: 'no-cache' })
      .catch(() => undefined)

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(
      'Something went wrong',
      expect.objectContaining({ id: `gql:${collisionError.message}:ping` })
    )
  })

  it('suppresses every GraphQL error on an opted-out operation', async () => {
    // Opting out is a claim about the CALLER, not about one error shape —
    // UpdateMember routes non-collision errors through displayError, which
    // toasts a specific message of its own.
    respondWithErrors([collisionError, { message: 'boom', path: ['ping'] }])
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await client
      .query({
        query: PING_QUERY,
        fetchPolicy: 'no-cache',
        context: CALLER_HANDLES_ERRORS_CONTEXT,
      })
      .catch(() => undefined)

    expect(toast.error).not.toHaveBeenCalled()
  })

  it('still toasts a network error on an opted-out operation', async () => {
    // A dropped connection is not something a caller's dialog can explain, so
    // the opt-out covers the GraphQL branch only.
    server.use(
      http.post(GRAPHQL_URL, async () =>
        HttpResponse.json({ message: 'nope' }, { status: 503 })
      )
    )
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    await client
      .query({
        query: PING_QUERY,
        fetchPolicy: 'no-cache',
        context: CALLER_HANDLES_ERRORS_CONTEXT,
      })
      .catch(() => undefined)

    expect(toast.error).toHaveBeenCalledWith(
      'Network Error',
      expect.objectContaining({ id: expect.stringMatching(/^network:/) })
    )
  }, 20000)
})

// ---------------------------------------------------------------------------
// errorPolicy: 'all'
// ---------------------------------------------------------------------------

describe('createApolloClient — errorPolicy: all', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  it('resolves data on a partial-success response (does not throw)', async () => {
    server.use(
      http.post(GRAPHQL_URL, async () =>
        HttpResponse.json({
          data: { ping: 'pong' },
          errors: [{ message: 'partial failure', path: ['somethingElse'] }],
        })
      )
    )
    const client = createApolloClient({
      getAccessTokenSilently: tokenResolver('tok'),
      uri: GRAPHQL_URL,
    })

    const result = await client.query({
      query: PING_QUERY,
      fetchPolicy: 'no-cache',
    })

    expect(result.data).toEqual({ ping: 'pong' })
    expect(result.errors).toBeDefined()
    expect(result.errors?.[0]?.message).toBe('partial failure')
  })
})
