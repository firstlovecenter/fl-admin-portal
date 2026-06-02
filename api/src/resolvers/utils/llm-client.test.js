'use strict'
/**
 * Characterization tests for `llm-client.js`.
 *
 * These tests lock the public surface and behavior of the module BEFORE
 * it is moved from `api/src/scripts/utils/llm-client.js` to
 * `api/src/resolvers/utils/llm-client.js`. They must pass on the current
 * (unmoved) source. After the move the file should be relocated alongside
 * the source — these assertions are not path-sensitive.
 *
 * External SDKs are mocked at require time so the module under test sees
 * controllable constructors and a stub `embeddings.create`. The
 * `'openai'` mock factory exposes the recorded constructor args and the
 * stub via `__getMock` / `__embeddingsCreate`, set at top level so Jest's
 * automatic hoisting of `jest.mock(...)` is safe.
 */

// ---------------------------------------------------------------------------
// SDK mocks (must be at top level so Jest hoists them above the require below)
// ---------------------------------------------------------------------------
jest.mock('openai', () => {
  const embeddingsCreate = jest.fn()
  const ctorArgs = []
  function OpenAI(opts) {
    ctorArgs.push(opts)
    this.embeddings = { create: embeddingsCreate }
  }
  OpenAI.__embeddingsCreate = embeddingsCreate
  OpenAI.__ctorArgs = ctorArgs
  // The module reads `require('openai').default || require('openai')` so
  // setting `.default` is not strictly required, but we expose it for parity
  // with the SDK's CJS-with-default shape.
  OpenAI.default = OpenAI
  return OpenAI
})

jest.mock('@anthropic-ai/sdk', () => {
  const ctorArgs = []
  function Anthropic(opts) {
    ctorArgs.push(opts)
    this._opts = opts
  }
  Anthropic.__ctorArgs = ctorArgs
  Anthropic.default = Anthropic
  return Anthropic
})

const OpenAIMock = require('openai')
const AnthropicMock = require('@anthropic-ai/sdk')
const llm = require('./llm-client')

const {
  EMBEDDING_MODEL,
  EMBEDDING_DIMS,
  EMBEDDING_BATCH_SIZE,
  TIP_MODEL,
  TIP_FALLBACK_MODEL,
  buildOpenAI,
  buildAnthropic,
  embedBatch,
  embedSingle,
  summariseError,
} = llm

// Helper — fabricate a response with `data` rows shaped like the OpenAI SDK
// returns: each row has `.embedding` of arbitrary contents (the production
// code never inspects vector length, just preserves order).
const makeEmbeddingsResponse = (vectors) => ({
  data: vectors.map((v) => ({ embedding: v })),
})

beforeEach(() => {
  // jest.config sets clearMocks: true which clears all jest.fn() calls,
  // but the constructor args arrays are plain arrays — reset them by hand.
  OpenAIMock.__ctorArgs.length = 0
  AnthropicMock.__ctorArgs.length = 0
})

// ===========================================================================
// 1) Exports surface — the most important guard for the file move
// ===========================================================================
describe('llm-client — exports surface', () => {
  it('exports EMBEDDING_MODEL === "text-embedding-3-small"', () => {
    expect(EMBEDDING_MODEL).toBe('text-embedding-3-small')
  })

  it('exports EMBEDDING_DIMS === 1536', () => {
    expect(EMBEDDING_DIMS).toBe(1536)
  })

  it('exports EMBEDDING_BATCH_SIZE === 96', () => {
    expect(EMBEDDING_BATCH_SIZE).toBe(96)
  })

  it('exports TIP_MODEL === "claude-haiku-4-5-20251001"', () => {
    expect(TIP_MODEL).toBe('claude-haiku-4-5-20251001')
  })

  it('exports TIP_FALLBACK_MODEL === "claude-sonnet-4-6"', () => {
    expect(TIP_FALLBACK_MODEL).toBe('claude-sonnet-4-6')
  })

  it('exports buildOpenAI, buildAnthropic, embedBatch, embedSingle, summariseError as functions', () => {
    expect(typeof buildOpenAI).toBe('function')
    expect(typeof buildAnthropic).toBe('function')
    expect(typeof embedBatch).toBe('function')
    expect(typeof embedSingle).toBe('function')
    expect(typeof summariseError).toBe('function')
  })

  it('does not expose unexpected extra keys (locks the export shape)', () => {
    expect(Object.keys(llm).sort()).toEqual(
      [
        'EMBEDDING_BATCH_SIZE',
        'EMBEDDING_DIMS',
        'EMBEDDING_MODEL',
        'TIP_FALLBACK_MODEL',
        'TIP_MODEL',
        'buildAnthropic',
        'buildOpenAI',
        'embedBatch',
        'embedSingle',
        'summariseError',
      ].sort()
    )
  })
})

// ===========================================================================
// 2) buildOpenAI
// ===========================================================================
describe('buildOpenAI', () => {
  it('throws an Error mentioning OPENAI_API_KEY when the key is missing', () => {
    expect(() => buildOpenAI({})).toThrow(/OPENAI_API_KEY/)
  })

  it('throws when secrets.OPENAI_API_KEY is an empty string (falsy)', () => {
    expect(() => buildOpenAI({ OPENAI_API_KEY: '' })).toThrow(/OPENAI_API_KEY/)
  })

  it('constructs the OpenAI SDK with { apiKey } and returns the instance', () => {
    const client = buildOpenAI({ OPENAI_API_KEY: 'sk-test-123' })

    expect(OpenAIMock.__ctorArgs).toHaveLength(1)
    expect(OpenAIMock.__ctorArgs[0]).toEqual({ apiKey: 'sk-test-123' })
    // The returned object is an instance produced by our mocked constructor,
    // so it carries the stub `embeddings.create`.
    expect(client.embeddings.create).toBe(OpenAIMock.__embeddingsCreate)
  })
})

// ===========================================================================
// 3) buildAnthropic
// ===========================================================================
describe('buildAnthropic', () => {
  it('throws an Error mentioning ANTHROPIC_API_KEY when the key is missing', () => {
    expect(() => buildAnthropic({})).toThrow(/ANTHROPIC_API_KEY/)
  })

  it('throws when secrets.ANTHROPIC_API_KEY is an empty string (falsy)', () => {
    expect(() => buildAnthropic({ ANTHROPIC_API_KEY: '' })).toThrow(
      /ANTHROPIC_API_KEY/
    )
  })

  it('constructs the Anthropic SDK with { apiKey } and returns the instance', () => {
    const client = buildAnthropic({ ANTHROPIC_API_KEY: 'anthropic-key-xyz' })

    expect(AnthropicMock.__ctorArgs).toHaveLength(1)
    expect(AnthropicMock.__ctorArgs[0]).toEqual({
      apiKey: 'anthropic-key-xyz',
    })
    expect(client._opts).toEqual({ apiKey: 'anthropic-key-xyz' })
  })
})

// ===========================================================================
// 4) embedBatch
// ===========================================================================
describe('embedBatch', () => {
  it('returns [] for an empty input array without calling the SDK', async () => {
    const openai = { embeddings: { create: jest.fn() } }

    const result = await embedBatch(openai, [])

    expect(result).toEqual([])
    expect(openai.embeddings.create).not.toHaveBeenCalled()
  })

  it('calls openai.embeddings.create exactly once for N <= 96 with { model, input }', async () => {
    const inputs = ['a', 'b', 'c']
    const vectors = [[0.1], [0.2], [0.3]]
    const create = jest.fn().mockResolvedValue(makeEmbeddingsResponse(vectors))
    const openai = { embeddings: { create } }

    const result = await embedBatch(openai, inputs)

    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({
      model: EMBEDDING_MODEL,
      input: inputs,
    })
    expect(result).toEqual(vectors)
  })

  it('passes the exact same array reference contents (slice of 0..N)', async () => {
    // Verifies that for N <= 96 the input passed to the SDK is the slice
    // of the input (not a remapped/mutated copy).
    const inputs = ['x', 'y']
    const create = jest
      .fn()
      .mockResolvedValue(makeEmbeddingsResponse([[1], [2]]))
    const openai = { embeddings: { create } }

    await embedBatch(openai, inputs)

    const passed = create.mock.calls[0][0].input
    expect(passed).toEqual(['x', 'y'])
  })

  it('batches inputs larger than EMBEDDING_BATCH_SIZE (96) into multiple SDK calls', async () => {
    const N = 97
    const inputs = Array.from({ length: N }, (_, i) => `t${i}`)

    const create = jest
      .fn()
      // First call: 96 items -> 96 vectors
      .mockResolvedValueOnce(
        makeEmbeddingsResponse(
          Array.from({ length: 96 }, (_, i) => [i])
        )
      )
      // Second call: 1 item -> 1 vector
      .mockResolvedValueOnce(makeEmbeddingsResponse([[96]]))

    const openai = { embeddings: { create } }

    const result = await embedBatch(openai, inputs)

    expect(create).toHaveBeenCalledTimes(2)
    // First call sees first 96 entries; second call sees the last 1.
    expect(create.mock.calls[0][0].input).toHaveLength(96)
    expect(create.mock.calls[0][0].input[0]).toBe('t0')
    expect(create.mock.calls[0][0].input[95]).toBe('t95')
    expect(create.mock.calls[1][0].input).toEqual(['t96'])

    // Order preserved end-to-end.
    expect(result).toHaveLength(97)
    expect(result[0]).toEqual([0])
    expect(result[95]).toEqual([95])
    expect(result[96]).toEqual([96])
  })

  it('batches a 200-item input into three calls (96 + 96 + 8) preserving order', async () => {
    const N = 200
    const inputs = Array.from({ length: N }, (_, i) => `i${i}`)

    const create = jest
      .fn()
      .mockResolvedValueOnce(
        makeEmbeddingsResponse(Array.from({ length: 96 }, (_, j) => [j]))
      )
      .mockResolvedValueOnce(
        makeEmbeddingsResponse(Array.from({ length: 96 }, (_, j) => [96 + j]))
      )
      .mockResolvedValueOnce(
        makeEmbeddingsResponse(Array.from({ length: 8 }, (_, j) => [192 + j]))
      )

    const openai = { embeddings: { create } }
    const result = await embedBatch(openai, inputs)

    expect(create).toHaveBeenCalledTimes(3)
    expect(create.mock.calls[0][0].input).toHaveLength(96)
    expect(create.mock.calls[1][0].input).toHaveLength(96)
    expect(create.mock.calls[2][0].input).toHaveLength(8)
    expect(result).toHaveLength(200)
    expect(result[0]).toEqual([0])
    expect(result[100]).toEqual([100])
    expect(result[199]).toEqual([199])
  })

  it('uses EMBEDDING_MODEL on every batched call', async () => {
    const N = 100
    const inputs = Array.from({ length: N }, (_, i) => `t${i}`)
    const create = jest
      .fn()
      .mockResolvedValueOnce(
        makeEmbeddingsResponse(Array.from({ length: 96 }, () => [0]))
      )
      .mockResolvedValueOnce(
        makeEmbeddingsResponse(Array.from({ length: 4 }, () => [0]))
      )

    await embedBatch({ embeddings: { create } }, inputs)

    create.mock.calls.forEach((call) => {
      expect(call[0].model).toBe(EMBEDDING_MODEL)
    })
  })

  it('wraps an SDK rejection in an Error prefixed with "OpenAI embedding failed:" and the summarised cause', async () => {
    const sdkError = Object.assign(new Error('Rate limited'), { status: 429 })
    const create = jest.fn().mockRejectedValue(sdkError)
    const openai = { embeddings: { create } }

    await expect(embedBatch(openai, ['x'])).rejects.toThrow(
      /^OpenAI embedding failed: 429 Rate limited$/
    )
  })

  it('wraps an SDK rejection for a string error using summariseError passthrough', async () => {
    const create = jest.fn().mockRejectedValue('network down')
    const openai = { embeddings: { create } }

    await expect(embedBatch(openai, ['x'])).rejects.toThrow(
      'OpenAI embedding failed: network down'
    )
  })
})

// ===========================================================================
// 5) embedSingle
// ===========================================================================
describe('embedSingle', () => {
  it('returns the first vector from embedBatch', async () => {
    const create = jest
      .fn()
      .mockResolvedValue(makeEmbeddingsResponse([[1, 2, 3]]))
    const openai = { embeddings: { create } }

    const vec = await embedSingle(openai, 'hello')

    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({
      model: EMBEDDING_MODEL,
      input: ['hello'],
    })
    expect(vec).toEqual([1, 2, 3])
  })

  it('throws "OpenAI embedding returned no vector" when SDK returns an empty data array', async () => {
    const create = jest.fn().mockResolvedValue({ data: [] })
    const openai = { embeddings: { create } }

    await expect(embedSingle(openai, 'hi')).rejects.toThrow(
      'OpenAI embedding returned no vector'
    )
  })

  // TODO(refactor): embedSingle treats a falsy first vector (e.g. null/0/'')
  // the same as "no vector". A response of [{ embedding: null }] reaches the
  // `if (!vec)` branch and throws "OpenAI embedding returned no vector"
  // rather than surfacing the malformed SDK shape distinctly. Captured here
  // because the move must preserve this behavior; a future refactor may
  // want a more specific error.
  it('TODO(refactor): falsy first vector is also treated as "no vector"', async () => {
    const create = jest
      .fn()
      .mockResolvedValue({ data: [{ embedding: null }] })
    const openai = { embeddings: { create } }

    await expect(embedSingle(openai, 'hi')).rejects.toThrow(
      'OpenAI embedding returned no vector'
    )
  })
})

// ===========================================================================
// 6) summariseError
// ===========================================================================
describe('summariseError', () => {
  it('null → "unknown error"', () => {
    expect(summariseError(null)).toBe('unknown error')
  })

  it('undefined → "unknown error"', () => {
    expect(summariseError(undefined)).toBe('unknown error')
  })

  it('string → returned unchanged', () => {
    expect(summariseError('boom')).toBe('boom')
  })

  it('{ status, message } → "<status> <message>"', () => {
    expect(summariseError({ status: 429, message: 'Rate limited' })).toBe(
      '429 Rate limited'
    )
  })

  it('{ response: { status, statusText } } → "<status> <statusText>"', () => {
    expect(
      summariseError({ response: { status: 503, statusText: 'Bad Gateway' } })
    ).toBe('503 Bad Gateway')
  })

  it('{ response: { status } } with no statusText → trimmed "<status>" (trailing space stripped)', () => {
    expect(summariseError({ response: { status: 500 } })).toBe('500')
  })

  it('{ message } only → returns the message', () => {
    expect(summariseError({ message: 'just a message' })).toBe(
      'just a message'
    )
  })

  it('plain Error instance → returns its message', () => {
    expect(summariseError(new Error('oops'))).toBe('oops')
  })

  // TODO(refactor): a `{ status, message }` SDK error is matched ONLY when
  // BOTH `status` and `message` are truthy (the guard is `error.status &&
  // error.message`). An error with `status: 0` or `message: ''` falls
  // through to the `error.response.status` branch and then to
  // `error.message || String(error)`. Captured to lock current behavior; the
  // refactor may want explicit `hasOwnProperty` checks.
  it('TODO(refactor): { status: 0, message: "x" } falls through (status is falsy)', () => {
    // status 0 is falsy → `error.status && error.message` is false →
    // no response.status → returns `error.message` ("x").
    expect(summariseError({ status: 0, message: 'x' })).toBe('x')
  })

  // TODO(refactor): when none of the branches match, summariseError falls
  // back to `error.message || String(error)`. For a bare object like {}
  // String(error) is "[object Object]" — this is the current contract.
  it('TODO(refactor): bare object {} → "[object Object]" (String(error) fallback)', () => {
    expect(summariseError({})).toBe('[object Object]')
  })
})
