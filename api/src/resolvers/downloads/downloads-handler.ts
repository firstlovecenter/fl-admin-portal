/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import * as crypto from 'crypto'
import { Driver, Record as Neo4jRecord, Result } from 'neo4j-driver'
import { Writable } from 'stream'
import { Role } from '../utils/types'
import { permitMe } from '../permissions'
import { isAuth } from '../utils/utils'
import {
  DownloadLevel,
  ROWS_BY_LEVEL,
  NAME_QUERY_BY_LEVEL,
} from './downloads-cypher'

// Hand-rolled HS256 verification: matches `@neo4j/graphql`'s
// `features.authorization.key` flow used at `api/src/index.js`. The custom
// resolver / non-Apollo paths historically relied on `jwtDecode`, which
// ONLY decodes — it does not validate the signature — so any client
// could forge a JWT with arbitrary `roles`. This verifier closes that
// gap for the membership CSV endpoint. Locked to HS256 to defeat the
// classic `alg: none` and `alg: RS256→HS256` confusion attacks.
type JwtPayload = { roles?: Role[]; exp?: number; [key: string]: unknown }

const base64UrlDecode = (input: string): Buffer =>
  Buffer.from(
    input.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (input.length % 4)) % 4),
    'base64'
  )

export const verifyJwt = (
  token: string | undefined,
  secret: string | undefined
): JwtPayload | null => {
  if (!token || !secret) return null
  const parts = token.replace(/^Bearer\s+/i, '').split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, signatureB64] = parts
  let header: { alg?: string; typ?: string }
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'))
  } catch {
    return null
  }
  if (header.alg !== 'HS256') return null

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest()
  const actual = base64UrlDecode(signatureB64)
  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    return null
  }

  let payload: JwtPayload
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'))
  } catch {
    return null
  }
  if (typeof payload.exp === 'number' && Date.now() / 1000 >= payload.exp) {
    return null
  }
  return payload
}

const DOWNLOAD_LEVELS: ReadonlyArray<DownloadLevel> = [
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
]

export const isDownloadLevel = (value: unknown): value is DownloadLevel =>
  typeof value === 'string' &&
  (DOWNLOAD_LEVELS as readonly string[]).includes(value)

// Column order must match `ROW_RETURN` in downloads-cypher.ts.
const CSV_COLUMNS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'governorship', label: 'Governorship' },
  { key: 'governorshipLeader', label: 'Governorship Leader' },
  { key: 'bacenta', label: 'Bacenta' },
  { key: 'bacentaLeader', label: 'Bacenta Leader' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'whatsappNumber', label: 'Whatsapp Number' },
  { key: 'email', label: 'Email' },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'gender', label: 'Gender' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'visitationArea', label: 'Visitation Area' },
  { key: 'basonta', label: 'Basonta' },
]

const CSV_HEADER = `${CSV_COLUMNS.map((c) => escapeCsv(c.label)).join(',')}\r\n`

const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// Mirrors `formatBirthday` in DownloadMembershipList.tsx — birthdays are
// rendered as day + month only (no year). Cypher returns the date as
// `YYYY-MM-DD` via `toString(dob.date)`.
function formatBirthday(iso: unknown): string {
  if (typeof iso !== 'string' || !iso) return ''
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function formatRow(record: Record<string, unknown>): string {
  return `${CSV_COLUMNS.map(({ key }) => {
    const raw = record[key]
    if (key === 'dateOfBirth') return escapeCsv(formatBirthday(raw))
    return escapeCsv(raw)
  }).join(',')}\r\n`
}

export function buildFilename(
  churchName: string,
  level: DownloadLevel
): string {
  const today = new Date().toISOString().slice(0, 10)
  const safeName = (churchName || level).replace(ILLEGAL_FILENAME_CHARS, '-')
  return `${safeName} ${level} Membership - ${today}.csv`
}

// Builds the `Content-Disposition` value with both the legacy
// quoted form (for ASCII-only browsers / parsers) and the RFC 5987
// `filename*=UTF-8''…` form so non-ASCII church names survive transit.
export function buildContentDisposition(filename: string): string {
  const safeAscii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '')
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(
    filename
  )}`
}

export class DownloadError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

type DownloadHooks = {
  // Called once auth + church lookup pass, before the first byte is written.
  // Express implementations use this to set Content-Disposition.
  onPrepared: (filename: string) => void
}

export type HandleMembershipDownloadParams = {
  driver: Driver
  level: DownloadLevel
  churchId: string
  roles: Role[] | undefined
  output: Writable
  hooks: DownloadHooks
  // Set to true by the caller (e.g. on HTTP `req.close`) to abort the
  // streaming loop early. The Cypher result is consumed via async iterator,
  // so checking this flag between rows lets us release the session promptly
  // when the client disconnects mid-export.
  abort?: { aborted: boolean }
}

export async function handleMembershipDownload(
  params: HandleMembershipDownloadParams
): Promise<{ rowCount: number; filename: string }> {
  const { driver, level, churchId, roles, output, hooks, abort } = params

  // Throws a `FORBIDDEN` Error if the user lacks the role for this level.
  // Caller maps that to HTTP 403.
  isAuth(permitMe(level), roles)

  if (!churchId) throw new DownloadError(400, 'Missing churchId')

  // READ mode lets a clustered Neo4j route us to a follower / read replica
  // and skip the leader, which keeps bulk exports off the write path.
  const session = driver.session({ defaultAccessMode: 'READ' })
  try {
    // 1. Look up the church name first — also serves as a 404 probe and
    //    feeds the Content-Disposition filename before any rows are written.
    const nameResult = await session.executeRead((tx) =>
      tx.run(NAME_QUERY_BY_LEVEL[level], { id: churchId })
    )
    const churchName: string = nameResult.records[0]?.get('name') ?? ''
    if (!churchName) {
      throw new DownloadError(404, `${level} ${churchId} not found`)
    }

    const filename = buildFilename(churchName, level)
    hooks.onPrepared(filename)

    // 2. Header row.
    output.write(CSV_HEADER)

    // 3. Stream member rows via the driver's async-iterator API. `for await`
    //    pauses Cypher consumption naturally between rows, so awaiting the
    //    Writable's `'drain'` event when `output.write` returns false gives
    //    us real backpressure (the older `subscribe` callback API does not
    //    expose pause/resume on `Result`).
    //
    //    Note: once the header is on the wire we cannot change HTTP status
    //    mid-stream. An error here truncates the CSV; callers must surface
    //    that through the connection's natural EOF.
    const result: Result = session.run(ROWS_BY_LEVEL[level], { id: churchId })
    let rowCount = 0
    for await (const record of result as AsyncIterable<Neo4jRecord>) {
      if (abort?.aborted) break

      const row: Record<string, unknown> = {}
      for (const key of record.keys) {
        row[key as string] = record.get(key)
      }
      if (!output.write(formatRow(row))) {
        await new Promise<void>((resolve) => {
          output.once('drain', resolve)
        })
      }
      rowCount += 1
    }

    return { rowCount, filename }
  } finally {
    await session.close()
  }
}
