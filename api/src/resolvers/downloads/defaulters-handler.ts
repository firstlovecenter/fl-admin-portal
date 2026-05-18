/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { Driver, Record as Neo4jRecord } from 'neo4j-driver'

import { Role } from '../utils/types'
import { permitLeaderAdmin } from '../permissions'
import { isAuth } from '../utils/utils'
import { assertChurchScope } from '../utils/scope-utils'
import {
  DEFAULTERS_DETAIL_BY_LEVEL,
  DEFAULTERS_NAME_QUERY_BY_LEVEL,
  DEFAULTERS_SUMMARY_AT_LEVEL,
  DEFAULTERS_SUMMARY_BY_LEVEL,
  DefaultersDownloadLevel,
  DefaultersScopeLevel,
  DefaultersTargetLevel,
  isDefaultersScopeLevel,
  isDefaultersTargetLevel,
} from './defaulters-cypher'
import { DownloadError } from './downloads-handler'

const DEFAULTERS_LEVELS: ReadonlyArray<DefaultersDownloadLevel> = [
  'Governorship',
  'Council',
  'Stream',
  'Campus',
]

export const isDefaultersDownloadLevel = (
  value: unknown
): value is DefaultersDownloadLevel =>
  typeof value === 'string' &&
  (DEFAULTERS_LEVELS as readonly string[]).includes(value)

// Coerce Neo4j numeric integer wrappers to plain JS numbers. The driver
// returns `Integer` objects for any Cypher Int (including aggregate counts),
// which serialise to `{ low, high }` over JSON. Anything money-shaped stays
// untouched — incomes are returned as Cypher floats and the spreadsheet
// renderer wants the raw number.
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

export type DefaultersExportPayload = {
  level: DefaultersDownloadLevel
  churchId: string
  churchName: string
  weekStart: string | null
  detail: Array<Record<string, unknown>>
  // `null` for Governorship — it has no children to roll up.
  summary: Array<Record<string, unknown>> | null
  // Populated only when the caller passes `targetLevel`. Ancestor-
  // decorated rows where each row lives at the chosen target level
  // (Stream / Council / Governorship). Lets the picker UI render the
  // same dataset at any depth without a separate endpoint.
  summaryAtLevel?: Array<Record<string, unknown>>
  // Echo back the target level so callers don't have to track it in
  // their own state.
  targetLevel?: DefaultersTargetLevel
}

export type HandleDefaultersDownloadParams = {
  driver: Driver
  level: DefaultersDownloadLevel
  churchId: string
  weekStart: string | null
  // Optional. When provided AND `level` is one of Council / Stream /
  // Campus, the handler ALSO queries the (scope, target) cypher and
  // returns `summaryAtLevel`. The legacy `summary` field stays untouched
  // so DownloadDefaultersButton (the multi-sheet xlsx flow) doesn't have
  // to change.
  targetLevel: DefaultersTargetLevel | null
  roles: Role[] | undefined
  userId: string | undefined
}

// Reject `9999-13-40`-style strings the regex on its own would let through.
const isValidIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime())
}

export async function handleDefaultersDownload(
  params: HandleDefaultersDownloadParams
): Promise<DefaultersExportPayload> {
  const { driver, level, churchId, weekStart, targetLevel, roles, userId } =
    params

  // Same auth gate as membership exports — these contain leader phone numbers
  // and per-Bacenta financial data, so the broader "any servant in the
  // building" gate is too permissive.
  isAuth(permitLeaderAdmin(level), roles)

  if (!churchId) throw new DownloadError(400, 'Missing churchId')

  // `isAuth` only checks role membership (e.g. `leaderCouncil`) — it does
  // NOT verify this user actually leads / admins THIS specific church.
  // Without this scope check, a leader of Council A could fetch Council B's
  // entire defaulters dataset via a crafted URL. Mirrors the IDOR closure
  // pattern from commit e642ed90 on the mutation side.
  await assertChurchScope(
    {
      executionContext: { session: () => driver.session() },
      jwt: { userId },
    },
    churchId
  )

  if (weekStart && !isValidIsoDate(weekStart)) {
    throw new DownloadError(400, `Invalid weekStart: ${weekStart}`)
  }

  // READ session for the same reasons as the membership export — keeps bulk
  // reads off the leader.
  const session = driver.session({ defaultAccessMode: 'READ' })
  try {
    const nameResult = await session.executeRead((tx) =>
      tx.run(DEFAULTERS_NAME_QUERY_BY_LEVEL[level], { id: churchId })
    )
    const churchName: string = nameResult.records[0]?.get('name') ?? ''
    if (!churchName) {
      throw new DownloadError(404, `${level} ${churchId} not found`)
    }

    const detailResult = await session.executeRead((tx) =>
      tx.run(DEFAULTERS_DETAIL_BY_LEVEL[level], {
        id: churchId,
        weekStart: weekStart || null,
      })
    )
    const detail = detailResult.records.map(recordToObject)

    const summaryQuery = DEFAULTERS_SUMMARY_BY_LEVEL[level]
    let summary: Array<Record<string, unknown>> | null = null
    if (summaryQuery) {
      const summaryResult = await session.executeRead((tx) =>
        tx.run(summaryQuery, { id: churchId, weekStart: weekStart || null })
      )
      summary = summaryResult.records.map(recordToObject)
    }

    // Picker-shaped per-target rollup. Only fires when (a) the caller
    // asked for it and (b) the scope/target pair is actually wired in
    // DEFAULTERS_SUMMARY_AT_LEVEL. Anything else falls back silently to
    // `summary === legacy` — the legacy multi-sheet xlsx flow expects
    // that shape so we don't replace it.
    let summaryAtLevel: Array<Record<string, unknown>> | undefined
    let echoedTarget: DefaultersTargetLevel | undefined
    if (
      targetLevel &&
      isDefaultersTargetLevel(targetLevel) &&
      isDefaultersScopeLevel(level)
    ) {
      const scopedMap =
        DEFAULTERS_SUMMARY_AT_LEVEL[level as DefaultersScopeLevel]
      const atLevelQuery = scopedMap?.[targetLevel]
      if (atLevelQuery) {
        const atLevelResult = await session.executeRead((tx) =>
          tx.run(atLevelQuery, {
            id: churchId,
            weekStart: weekStart || null,
          })
        )
        summaryAtLevel = atLevelResult.records.map(recordToObject)
        echoedTarget = targetLevel
      }
    }

    return {
      level,
      churchId,
      churchName,
      weekStart: weekStart || null,
      detail,
      summary,
      summaryAtLevel,
      targetLevel: echoedTarget,
    }
  } finally {
    await session.close()
  }
}
