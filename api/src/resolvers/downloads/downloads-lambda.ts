/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { PassThrough } from 'stream'
import type { Driver } from 'neo4j-driver'
import {
  buildContentDisposition,
  DownloadError,
  handleMembershipDownload,
  isDownloadLevel,
} from './downloads-handler'
import { verifyJwt } from '../utils/verify-jwt'

// API Gateway response body limit (10 MB for REST APIs, 6 MB for the
// Lambda invocation envelope). Base64 inflates payloads ~33%, so we cap
// the raw CSV well below the smaller limit and return an explicit error
// instead of letting the gateway truncate or 502.
const MAX_CSV_BYTES = 4 * 1024 * 1024

// Matches the URL path the FE builds and the API Gateway route should
// forward to the Lambda. Captures `level` and `churchId` so we don't have
// to depend on `event.pathParameters` being configured.
const DOWNLOAD_PATH_RE = /^\/downloads\/membership\/([^/]+)\/([^/]+)\.csv$/i

type LambdaEvent = {
  path?: string
  rawPath?: string
  httpMethod?: string
  headers?: Record<string, string | undefined>
  pathParameters?: Record<string, string | undefined>
  requestContext?: {
    http?: { method?: string; path?: string }
  }
}

type LambdaResponse = {
  statusCode: number
  headers: Record<string, string>
  body: string | null
  isBase64Encoded?: boolean
}

const eventPath = (event: LambdaEvent): string =>
  event.path || event.rawPath || event.requestContext?.http?.path || ''

const eventMethod = (event: LambdaEvent): string =>
  event.httpMethod || event.requestContext?.http?.method || 'GET'

export const isDownloadEvent = (event: LambdaEvent): boolean =>
  DOWNLOAD_PATH_RE.test(eventPath(event))

const errorResponse = (
  statusCode: number,
  message: string,
  cors: Record<string, string>
): LambdaResponse => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...cors },
  body: JSON.stringify({ error: message }),
})

export const handleDownloadLambdaEvent = async (
  event: LambdaEvent,
  driver: Driver,
  corsHeaders: Record<string, string>,
  jwtSecret: string | undefined
): Promise<LambdaResponse> => {
  if (eventMethod(event) === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: null }
  }

  // Prefer event.pathParameters when API Gateway is configured with a
  // path template; fall back to regexing the raw path so this also works
  // with a pass-through `{proxy+}` integration.
  let level = event.pathParameters?.level
  let churchId = event.pathParameters?.churchId
  if (!level || !churchId) {
    const match = eventPath(event).match(DOWNLOAD_PATH_RE)
    if (match) {
      ;[, level, churchId] = match
    }
  }

  if (!level || !isDownloadLevel(level)) {
    return errorResponse(400, 'Invalid church level', corsHeaders)
  }
  if (!churchId) {
    return errorResponse(400, 'Missing churchId', corsHeaders)
  }

  const headers = event.headers || {}
  const token = headers.authorization || headers.Authorization
  const jwt = verifyJwt(token, jwtSecret)
  if (!jwt) {
    return errorResponse(401, 'Unauthorized', corsHeaders)
  }

  const chunks: Buffer[] = []
  let totalBytes = 0
  let truncated = false
  const abort = { aborted: false }
  const output = new PassThrough()
  output.on('data', (chunk: Buffer) => {
    if (truncated) return
    totalBytes += chunk.length
    if (totalBytes > MAX_CSV_BYTES) {
      truncated = true
      abort.aborted = true
      return
    }
    chunks.push(chunk)
  })

  let resolvedFilename = ''
  try {
    await handleMembershipDownload({
      driver,
      level,
      churchId,
      roles: jwt.roles,
      output,
      abort,
      hooks: {
        onPrepared: (filename) => {
          resolvedFilename = filename
        },
      },
    })
    output.end()

    if (truncated) {
      return errorResponse(
        413,
        'Export is too large for direct download. Please request a smaller scope (e.g. by Bacenta or Governorship) or contact an administrator.',
        corsHeaders
      )
    }

    const body = Buffer.concat(chunks).toString('base64')
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': buildContentDisposition(resolvedFilename),
        ...corsHeaders,
      },
      isBase64Encoded: true,
      body,
    }
  } catch (error) {
    console.error(
      '[downloads] Membership export failed:',
      (error as Error)?.message ?? 'unknown error'
    )
    output.destroy()

    if (error instanceof DownloadError) {
      return errorResponse(error.statusCode, error.message, corsHeaders)
    }
    const extCode = (error as { extensions?: { code?: string } })?.extensions
      ?.code
    if (extCode === 'FORBIDDEN') {
      return errorResponse(403, (error as Error).message, corsHeaders)
    }
    return errorResponse(500, 'Download failed', corsHeaders)
  }
}
