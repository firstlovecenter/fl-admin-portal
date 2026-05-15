/* eslint-disable no-console */

/**
 * Shared LLM / embedding client used by the ingestion scripts.
 *
 * - Embeddings: OpenAI `text-embedding-3-small` (1536 dims, cosine).
 * - Generation: Anthropic Claude — not used in ingestion, but exposed
 *   here so future scripts (e.g. evaluation harnesses) can reuse it.
 *
 * Keys come from AWS Secrets Manager via `loadSecrets()` — never from
 * `process.env` directly (see CLAUDE.md mandatory rules).
 *
 * Error handling mirrors `banking-resolver.ts:38-70`: do not log full
 * request/response bodies. External API errors are summarised to
 * `{ status, code, message }` so PII and API keys never reach the log.
 */

const OpenAI = require('openai').default || require('openai')
const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk')

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMS = 1536
const EMBEDDING_BATCH_SIZE = 96 // OpenAI accepts up to ~2048 inputs per call; 96 is a conservative size that keeps each request under ~1 MB for typical chunks.

const TIP_MODEL = 'claude-haiku-4-5-20251001'
const TIP_FALLBACK_MODEL = 'claude-sonnet-4-6'

const summariseError = (error) => {
  if (!error) return 'unknown error'
  if (typeof error === 'string') return error
  // OpenAI / Anthropic SDK errors carry .status + .message + sometimes .error.code
  if (error.status && error.message) {
    return `${error.status} ${error.message}`
  }
  if (error.response && error.response.status) {
    return `${error.response.status} ${error.response.statusText || ''}`.trim()
  }
  return error.message || String(error)
}

/**
 * Build an OpenAI client using the given secret bundle.
 * Throws if OPENAI_API_KEY is missing — fails loud at script start.
 */
const buildOpenAI = (secrets) => {
  if (!secrets.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY missing from AWS Secrets Manager bundle. Add it before running ingestion.'
    )
  }
  return new OpenAI({ apiKey: secrets.OPENAI_API_KEY })
}

const buildAnthropic = (secrets) => {
  if (!secrets.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY missing from AWS Secrets Manager bundle. Add it before running generation.'
    )
  }
  return new Anthropic({ apiKey: secrets.ANTHROPIC_API_KEY })
}

/**
 * Embed an array of strings into 1536-dim vectors.
 * Batches automatically. Returns a Float32 array aligned to `texts`.
 *
 * If a single text exceeds the model's input limit, the OpenAI SDK throws;
 * caller is responsible for chunking before calling.
 */
const embedBatch = async (openai, texts) => {
  if (!texts.length) return []
  const out = new Array(texts.length)
  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE)
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
      })
      response.data.forEach((row, j) => {
        out[i + j] = row.embedding
      })
    } catch (error) {
      throw new Error(`OpenAI embedding failed: ${summariseError(error)}`)
    }
  }
  return out
}

/**
 * Embeds a single string. Convenience wrapper over `embedBatch` for the
 * resolver-side chat path, mirroring the Lambda's `llm-client.js` export.
 */
const embedSingle = async (openai, text) => {
  const [vec] = await embedBatch(openai, [text])
  if (!vec) {
    throw new Error('OpenAI embedding returned no vector')
  }
  return vec
}

module.exports = {
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
}
