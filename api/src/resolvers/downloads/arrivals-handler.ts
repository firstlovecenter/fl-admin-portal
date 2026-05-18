/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { Driver, Record as Neo4jRecord } from 'neo4j-driver'

import { Role } from '../utils/types'
import { permitLeaderAdmin } from '../permissions'
import { isAuth } from '../utils/utils'
import { assertChurchScope } from '../utils/scope-utils'
import {
  ARRIVALS_DETAIL_BY_LEVEL,
  ARRIVALS_NAME_QUERY_BY_LEVEL,
  ARRIVALS_SUMMARY_AT_LEVEL,
  ARRIVALS_SUMMARY_BY_LEVEL,
  ARRIVALS_VEHICLE_BY_LEVEL,
  ArrivalsDownloadLevel,
  ArrivalsScopeLevel,
  ArrivalsTargetLevel,
  isArrivalsScopeLevel,
  isArrivalsTargetLevel,
} from './arrivals-cypher'
import { DownloadError } from './downloads-handler'

const ARRIVALS_LEVELS: ReadonlyArray<ArrivalsDownloadLevel> = [
  'Governorship',
  'Council',
  'Stream',
  'Campus',
]

export const isArrivalsDownloadLevel = (
  value: unknown
): value is ArrivalsDownloadLevel =>
  typeof value === 'string' &&
  (ARRIVALS_LEVELS as readonly string[]).includes(value)

// Coerce Neo4j Integer wrappers to plain JS numbers so the JSON response
// is spreadsheet-ready. Money fields arrive as Cypher floats and pass
// through unchanged.
const unwrap = (value: unknown): unknown => {
  if (value && typeof value === 'object') {
    const maybe = value as {
      toNumber?: () => number
      low?: number
      high?: number
    }
    if (typeof maybe.toNumber === 'function') {
      return maybe.toNumber()
    }
  }
  return value
}

const recordToObject = (record: Neo4jRecord): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const key of record.keys) {
    out[key as string] = unwrap(record.get(key))
  }
  return out
}

// `arrivalDate` arrives as a YYYY-MM-DD string. Reject obviously invalid
// dates (e.g. `9999-13-40`) before they reach the driver and surface as a
// generic 500.
const isValidIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime())
}

export type ArrivalsExportPayload = {
  level: ArrivalsDownloadLevel
  churchId: string
  churchName: string
  arrivalDate: string
  detail: Array<Record<string, unknown>>
  vehicles: Array<Record<string, unknown>>
  // `null` for Governorship — the bacenta is the leaf.
  summary: Array<Record<string, unknown>> | null
  // Picker-shaped rollup; mirrors DefaultersExportPayload. See
  // defaulters-handler.ts for the full writeup.
  summaryAtLevel?: Array<Record<string, unknown>>
  targetLevel?: ArrivalsTargetLevel
}

export type HandleArrivalsDownloadParams = {
  driver: Driver
  level: ArrivalsDownloadLevel
  churchId: string
  arrivalDate: string
  targetLevel: ArrivalsTargetLevel | null
  roles: Role[] | undefined
  userId: string | undefined
}

export async function handleArrivalsDownload(
  params: HandleArrivalsDownloadParams
): Promise<ArrivalsExportPayload> {
  const { driver, level, churchId, arrivalDate, targetLevel, roles, userId } =
    params

  // PII + finance gate: leader phone numbers, vehicle top-ups, masked momo
  // numbers, transaction status. Same gate as membership and defaulters
  // exports.
  isAuth(permitLeaderAdmin(level), roles)

  if (!churchId) throw new DownloadError(400, 'Missing churchId')
  if (!arrivalDate) throw new DownloadError(400, 'Missing arrivalDate')
  if (!isValidIsoDate(arrivalDate)) {
    throw new DownloadError(400, `Invalid arrivalDate: ${arrivalDate}`)
  }

  // Close the IDOR: `isAuth` only checks role membership (e.g. a Council
  // leader has `leaderCouncil`), not whether the user actually leads /
  // admins THIS specific church. Without the scope check, Council A's
  // leader could fetch Council B's full vehicle list by URL.
  await assertChurchScope(
    {
      executionContext: { session: () => driver.session() },
      jwt: { userId },
    },
    churchId
  )

  const session = driver.session({ defaultAccessMode: 'READ' })
  try {
    const nameResult = await session.executeRead((tx) =>
      tx.run(ARRIVALS_NAME_QUERY_BY_LEVEL[level], { id: churchId })
    )
    const churchName: string = nameResult.records[0]?.get('name') ?? ''
    if (!churchName) {
      throw new DownloadError(404, `${level} ${churchId} not found`)
    }

    const detailResult = await session.executeRead((tx) =>
      tx.run(ARRIVALS_DETAIL_BY_LEVEL[level], { id: churchId, arrivalDate })
    )
    const detail = detailResult.records.map(recordToObject)

    const vehicleResult = await session.executeRead((tx) =>
      tx.run(ARRIVALS_VEHICLE_BY_LEVEL[level], { id: churchId, arrivalDate })
    )
    const vehicles = vehicleResult.records.map(recordToObject)

    const summaryQuery = ARRIVALS_SUMMARY_BY_LEVEL[level]
    let summary: Array<Record<string, unknown>> | null = null
    if (summaryQuery) {
      const summaryResult = await session.executeRead((tx) =>
        tx.run(summaryQuery, { id: churchId, arrivalDate })
      )
      summary = summaryResult.records.map(recordToObject)
    }

    let summaryAtLevel: Array<Record<string, unknown>> | undefined
    let echoedTarget: ArrivalsTargetLevel | undefined
    if (
      targetLevel &&
      isArrivalsTargetLevel(targetLevel) &&
      isArrivalsScopeLevel(level)
    ) {
      const scopedMap = ARRIVALS_SUMMARY_AT_LEVEL[level as ArrivalsScopeLevel]
      const atLevelQuery = scopedMap?.[targetLevel]
      if (atLevelQuery) {
        const atLevelResult = await session.executeRead((tx) =>
          tx.run(atLevelQuery, { id: churchId, arrivalDate })
        )
        summaryAtLevel = atLevelResult.records.map(recordToObject)
        echoedTarget = targetLevel
      }
    }

    return {
      level,
      churchId,
      churchName,
      arrivalDate,
      detail,
      vehicles,
      summary,
      summaryAtLevel,
      targetLevel: echoedTarget,
    }
  } finally {
    await session.close()
  }
}
