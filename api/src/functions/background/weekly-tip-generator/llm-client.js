/* eslint-disable no-console */

/**
 * LLM / embedding client for the weekly-tip-generator Lambda.
 *
 * Duplicates `api/src/scripts/utils/llm-client.js` because Lambda packages
 * are self-contained (see accra-campus-weekly for the same pattern). Kept
 * deliberately small so the two copies stay easy to keep in sync.
 *
 * Error handling never logs full request/response bodies — only `{ status,
 * message }`. That matches the banking-resolver scrubError pattern and
 * keeps API keys / leader names out of CloudWatch.
 */

const OpenAI = require('openai').default || require('openai')
const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk')

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMS = 1536
const EMBEDDING_BATCH_SIZE = 96

const TIP_MODEL = 'claude-haiku-4-5-20251001'
const TIP_FALLBACK_MODEL = 'claude-sonnet-4-6'

const summariseError = (error) => {
  if (!error) return 'unknown error'
  if (typeof error === 'string') return error
  if (error.status && error.message) return `${error.status} ${error.message}`
  if (error.response && error.response.status) {
    return `${error.response.status} ${error.response.statusText || ''}`.trim()
  }
  return error.message || String(error)
}

const buildOpenAI = (secrets) => {
  if (!secrets.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY missing from secret bundle.')
  }
  return new OpenAI({ apiKey: secrets.OPENAI_API_KEY })
}

const buildAnthropic = (secrets) => {
  if (!secrets.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing from secret bundle.')
  }
  return new Anthropic({ apiKey: secrets.ANTHROPIC_API_KEY })
}

const embedSingle = async (openai, text) => {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    throw new Error(`OpenAI embedding failed: ${summariseError(error)}`)
  }
}

/**
 * Extracts the first JSON object from a Claude response. Claude often wraps
 * JSON in prose or fenced code blocks; this strips both. Returns `null` if
 * nothing parseable is found.
 */
const extractJson = (text) => {
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  const candidate = fenced ? fenced[1] : (text.match(/\{[\s\S]*\}/) || [null])[0]
  if (!candidate) return null
  try {
    return JSON.parse(candidate)
  } catch (err) {
    return null
  }
}

/**
 * Calls Claude with the given system + user prompt. Asks for JSON; parses it.
 * Retries once on the fallback (more capable) model if the first response
 * isn't parseable JSON. After two failures, throws — caller logs and skips
 * the leader.
 *
 * Returns `{ raw, parsed, model }` — `model` is the actual model that produced
 * the parsed JSON, so the persisted `tip.model` audit field is accurate on
 * fallback retries.
 */
const generateTipJson = async (anthropic, { system, user }) => {
  const tryModel = async (model) => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    })
    return message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text || '')
      .join('\n')
  }

  let raw
  let parsed
  let modelUsed
  try {
    raw = await tryModel(TIP_MODEL)
    parsed = extractJson(raw)
    if (!parsed) throw new Error('first attempt produced no JSON')
    modelUsed = TIP_MODEL
  } catch (primaryErr) {
    console.warn(
      `Tip generation: primary model failed (${summariseError(
        primaryErr
      )}). Retrying on ${TIP_FALLBACK_MODEL}.`
    )
    raw = await tryModel(TIP_FALLBACK_MODEL)
    parsed = extractJson(raw)
    if (!parsed) {
      throw new Error(
        `Tip generation: both models produced no parseable JSON. Last raw length: ${raw.length}`
      )
    }
    modelUsed = TIP_FALLBACK_MODEL
  }
  return { raw, parsed, model: modelUsed }
}

module.exports = {
  EMBEDDING_MODEL,
  EMBEDDING_DIMS,
  EMBEDDING_BATCH_SIZE,
  TIP_MODEL,
  TIP_FALLBACK_MODEL,
  buildOpenAI,
  buildAnthropic,
  embedSingle,
  generateTipJson,
  summariseError,
}
