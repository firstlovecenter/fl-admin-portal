/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { PassThrough } from 'stream'
import type { Driver } from 'neo4j-driver'
import {
  buildContentDisposition,
  DownloadError,
  handleMembershipDownload,
  isDownloadLevel,
} from './downloads-handler'
import {
  handleDefaultersDownload,
  isDefaultersDownloadLevel,
} from './defaulters-handler'
import {
  handleArrivalsDownload,
  isArrivalsDownloadLevel,
} from './arrivals-handler'
import { JwtPayload, verifyJwt } from '../utils/verify-jwt'

// API Gateway response body limit (10 MB for REST APIs, 6 MB for the
// Lambda invocation envelope). Base64 inflates payloads ~33%, so we cap
// the raw CSV well below the smaller limit and return an explicit error
// instead of letting the gateway truncate or 502.
const MAX_CSV_BYTES = 4 * 1024 * 1024

// Matches the URL paths the FE builds. API Gateway routes any of these to
// this Lambda (either via a `{proxy+}` integration or per-route paths);
// the regex is the source of truth here so we don't depend on
// `event.pathParameters` being configured upstream.
const MEMBERSHIP_PATH_RE = /^\/downloads\/membership\/([^/]+)\/([^/]+)\.csv$/i
const DEFAULTERS_PATH_RE = /^\/downloads\/defaulters\/([^/]+)\/([^/]+)\.json$/i
const ARRIVALS_PATH_RE = /^\/downloads\/arrivals\/([^/]+)\/([^/]+)\.json$/i

type LambdaEvent = {
  path?: string
  rawPath?: string
  httpMethod?: string
  headers?: Record<string, string | undefined>
  pathParameters?: Record<string, string | undefined>
  queryStringParameters?: Record<string, string | undefined>
  multiValueQueryStringParameters?: Record<string, string[] | undefined>
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

const eventQuery = (event: LambdaEvent, key: string): string | undefined => {
  const direct = event.queryStringParameters?.[key]
  if (typeof direct === 'string' && direct.length > 0) return direct
  const multi = event.multiValueQueryStringParameters?.[key]
  if (Array.isArray(multi) && multi.length > 0) return multi[0]
  return undefined
}

export const isDownloadEvent = (event: LambdaEvent): boolean => {
  const p = eventPath(event)
  return (
    MEMBERSHIP_PATH_RE.test(p) ||
    DEFAULTERS_PATH_RE.test(p) ||
    ARRIVALS_PATH_RE.test(p)
  )
}

const errorResponse = (
  statusCode: number,
  message: string,
  cors: Record<string, string>
): LambdaResponse => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...cors },
  body: JSON.stringify({ error: message }),
})

const mapDownloadError = (
  error: unknown,
  cors: Record<string, string>,
  fallbackMessage = 'Download failed'
): LambdaResponse => {
  if (error instanceof DownloadError) {
    return errorResponse(error.statusCode, error.message, cors)
  }
  const extCode = (error as { extensions?: { code?: string } })?.extensions
    ?.code
  if (extCode === 'FORBIDDEN') {
    return errorResponse(403, (error as Error).message, cors)
  }
  return errorResponse(500, fallbackMessage, cors)
}

const extractRouteParams = (
  event: LambdaEvent,
  re: RegExp
): { level?: string; churchId?: string } => {
  // Prefer event.pathParameters when API Gateway is configured with a
  // path template; fall back to regexing the raw path so this also works
  // with a pass-through `{proxy+}` integration.
  let level = event.pathParameters?.level
  let churchId = event.pathParameters?.churchId
  if (!level || !churchId) {
    const match = eventPath(event).match(re)
    if (match) {
      ;[, level, churchId] = match
    }
  }
  return { level, churchId }
}

const handleMembershipLambda = async (
  event: LambdaEvent,
  driver: Driver,
  corsHeaders: Record<string, string>,
  jwt: JwtPayload
): Promise<LambdaResponse> => {
  const { level, churchId } = extractRouteParams(event, MEMBERSHIP_PATH_RE)
  if (!level || !isDownloadLevel(level)) {
    return errorResponse(400, 'Invalid church level', corsHeaders)
  }
  if (!churchId) {
    return errorResponse(400, 'Missing churchId', corsHeaders)
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
    return mapDownloadError(error, corsHeaders)
  }
}

const handleDefaultersLambda = async (
  event: LambdaEvent,
  driver: Driver,
  corsHeaders: Record<string, string>,
  jwt: JwtPayload
): Promise<LambdaResponse> => {
  const { level, churchId } = extractRouteParams(event, DEFAULTERS_PATH_RE)
  if (!level || !isDefaultersDownloadLevel(level)) {
    return errorResponse(
      400,
      'Invalid church level for defaulters',
      corsHeaders
    )
  }
  if (!churchId) {
    return errorResponse(400, 'Missing churchId', corsHeaders)
  }

  const rawWeekStart = eventQuery(event, 'weekStart')
  const weekStart =
    typeof rawWeekStart === 'string' && rawWeekStart.length > 0
      ? rawWeekStart
      : null

  try {
    const payload = await handleDefaultersDownload({
      driver,
      level,
      churchId,
      weekStart,
      roles: jwt.roles,
      userId: jwt.userId,
    })
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...corsHeaders,
      },
      body: JSON.stringify(payload),
    }
  } catch (error) {
    console.error(
      '[downloads] Defaulters export failed:',
      (error as Error)?.message ?? 'unknown error'
    )
    return mapDownloadError(error, corsHeaders)
  }
}

const handleArrivalsLambda = async (
  event: LambdaEvent,
  driver: Driver,
  corsHeaders: Record<string, string>,
  jwt: JwtPayload
): Promise<LambdaResponse> => {
  const { level, churchId } = extractRouteParams(event, ARRIVALS_PATH_RE)
  if (!level || !isArrivalsDownloadLevel(level)) {
    return errorResponse(400, 'Invalid church level for arrivals', corsHeaders)
  }
  if (!churchId) {
    return errorResponse(400, 'Missing churchId', corsHeaders)
  }

  const arrivalDate = eventQuery(event, 'arrivalDate') ?? ''

  try {
    const payload = await handleArrivalsDownload({
      driver,
      level,
      churchId,
      arrivalDate,
      roles: jwt.roles,
      userId: jwt.userId,
    })
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...corsHeaders,
      },
      body: JSON.stringify(payload),
    }
  } catch (error) {
    console.error(
      '[downloads] Arrivals export failed:',
      (error as Error)?.message ?? 'unknown error'
    )
    return mapDownloadError(error, corsHeaders)
  }
}

export const handleDownloadLambdaEvent = async (
  event: LambdaEvent,
  driver: Driver,
  corsHeaders: Record<string, string>,
  jwtSecret: string | undefined
): Promise<LambdaResponse> => {
  if (eventMethod(event) === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: null }
  }

  const headers = event.headers || {}
  const token = headers.authorization || headers.Authorization
  const jwt = verifyJwt(token, jwtSecret)
  if (!jwt) {
    return errorResponse(401, 'Unauthorized', corsHeaders)
  }

  const path = eventPath(event)
  if (MEMBERSHIP_PATH_RE.test(path)) {
    return handleMembershipLambda(event, driver, corsHeaders, jwt)
  }
  if (DEFAULTERS_PATH_RE.test(path)) {
    return handleDefaultersLambda(event, driver, corsHeaders, jwt)
  }
  if (ARRIVALS_PATH_RE.test(path)) {
    return handleArrivalsLambda(event, driver, corsHeaders, jwt)
  }

  return errorResponse(404, 'Unknown download endpoint', corsHeaders)
}
