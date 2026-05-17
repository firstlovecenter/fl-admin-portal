import { permitLeaderAdmin } from '../permissions'
import { Context } from '../utils/neo4j-types'
import { ChurchLevel } from '../utils/types'
import { isAuth, throwToSentry } from '../utils/utils'
import {
  bacentaDirectoryReport,
  governorshipDirectoryReport,
  councilDirectoryReport,
  streamDirectoryReport,
  campusDirectoryReport,
  oversightDirectoryReport,
} from './directory-cypher'
import {
  bacentaWeeklyReport,
  governorshipWeeklyReport,
  councilWeeklyReport,
  streamWeeklyReport,
  campusWeeklyReport,
  oversightWeeklyReport,
  bacentaSubChurchesReport,
  governorshipSubChurchesReport,
  councilSubChurchesReport,
  streamSubChurchesReport,
  campusSubChurchesReport,
  oversightSubChurchesReport,
  SUB_CHURCHES_AT_LEVEL,
  SubChurchesScope,
  SubChurchesTarget,
} from './weekly-report-cypher'
import { bacentaServiceRecordsReport } from './service-records-cypher'

type WeekRangeArgs = {
  startWeekKey: number
  endWeekKey: number
}

type SubChurchesAtLevelArgs = WeekRangeArgs & {
  targetLevel: string
}

const VALID_SUB_CHURCH_TARGETS: ReadonlySet<string> = new Set([
  'Campus',
  'Stream',
  'Council',
  'Governorship',
])

const isSubChurchTarget = (value: string): value is SubChurchesTarget =>
  VALID_SUB_CHURCH_TARGETS.has(value)

const createDirectoryResolver =
  (cypherQuery: string, permissionLevel: ChurchLevel) =>
  async (object: { id: string }, _args: unknown, context: Context) => {
    isAuth(permitLeaderAdmin(permissionLevel), context.jwt.roles)
    const session = context.executionContext.session()

    try {
      const result = await session.executeRead((tx) =>
        tx.run(cypherQuery, { id: object.id })
      )

      return result.records[0]?.get('entries') ?? []
    } catch (error) {
      throwToSentry(`Error getting ${permissionLevel} directory report`, error)
    } finally {
      await session.close()
    }

    return []
  }

const createWeeklyReportResolver =
  (cypherQuery: string, permissionLevel: ChurchLevel, reportName: string) =>
  async (object: { id: string }, args: WeekRangeArgs, context: Context) => {
    isAuth(permitLeaderAdmin(permissionLevel), context.jwt.roles)
    const session = context.executionContext.session()

    try {
      const result = await session.executeRead((tx) =>
        tx.run(cypherQuery, {
          id: object.id,
          startWeekKey: args.startWeekKey,
          endWeekKey: args.endWeekKey,
        })
      )

      return result.records[0]?.get('entries') ?? []
    } catch (error) {
      throwToSentry(
        `Error getting ${permissionLevel} ${reportName} report`,
        error
      )
    } finally {
      await session.close()
    }

    return []
  }

const createSubChurchesAtLevelResolver =
  (scope: SubChurchesScope) =>
  async (
    object: { id: string },
    args: SubChurchesAtLevelArgs,
    context: Context
  ) => {
    isAuth(permitLeaderAdmin(scope), context.jwt.roles)

    // Validate targetLevel against the whitelist before reaching Cypher.
    // A bogus level either trips this guard or surfaces as a 0-row return
    // from the cypher map — we prefer the guard so callers get a useful
    // error.
    if (!isSubChurchTarget(args.targetLevel)) {
      throw new Error(`Unknown targetLevel: ${args.targetLevel}`)
    }
    const cypher = SUB_CHURCHES_AT_LEVEL[scope]?.[args.targetLevel]
    if (!cypher) {
      // Should be unreachable given the SDL targets are a subset of
      // SUB_CHURCHES_AT_LEVEL keys per scope, but guard so a future SDL
      // edit doesn't silently break this resolver.
      throw new Error(
        `Sub-church target ${args.targetLevel} is not valid from scope ${scope}`
      )
    }

    const session = context.executionContext.session()
    try {
      const result = await session.executeRead((tx) =>
        tx.run(cypher, {
          id: object.id,
          startWeekKey: args.startWeekKey,
          endWeekKey: args.endWeekKey,
        })
      )
      return result.records[0]?.get('entries') ?? []
    } catch (error) {
      throwToSentry(
        `Error getting ${scope} sub-churches @ ${args.targetLevel}`,
        error
      )
    } finally {
      await session.close()
    }

    return []
  }

export const reportsResolvers = {
  Bacenta: {
    directoryReport: createDirectoryResolver(bacentaDirectoryReport, 'Bacenta'),
    servicesHeldReport: createWeeklyReportResolver(
      bacentaWeeklyReport,
      'Bacenta',
      'services held'
    ),
    weekdayIncomeBussingReport: createWeeklyReportResolver(
      bacentaWeeklyReport,
      'Bacenta',
      'weekday income & bussing'
    ),
    weekdayServiceRecordsReport: createWeeklyReportResolver(
      bacentaServiceRecordsReport,
      'Bacenta',
      'weekday service records'
    ),
    subChurchesReport: createWeeklyReportResolver(
      bacentaSubChurchesReport,
      'Bacenta',
      'sub-churches'
    ),
  },
  Governorship: {
    directoryReport: createDirectoryResolver(
      governorshipDirectoryReport,
      'Governorship'
    ),
    servicesHeldReport: createWeeklyReportResolver(
      governorshipWeeklyReport,
      'Governorship',
      'services held'
    ),
    weekdayIncomeBussingReport: createWeeklyReportResolver(
      governorshipWeeklyReport,
      'Governorship',
      'weekday income & bussing'
    ),
    subChurchesReport: createWeeklyReportResolver(
      governorshipSubChurchesReport,
      'Governorship',
      'sub-churches'
    ),
  },
  Council: {
    directoryReport: createDirectoryResolver(councilDirectoryReport, 'Council'),
    servicesHeldReport: createWeeklyReportResolver(
      councilWeeklyReport,
      'Council',
      'services held'
    ),
    weekdayIncomeBussingReport: createWeeklyReportResolver(
      councilWeeklyReport,
      'Council',
      'weekday income & bussing'
    ),
    subChurchesReport: createWeeklyReportResolver(
      councilSubChurchesReport,
      'Council',
      'sub-churches'
    ),
    subChurchesReportAtLevel: createSubChurchesAtLevelResolver('Council'),
  },
  Stream: {
    directoryReport: createDirectoryResolver(streamDirectoryReport, 'Stream'),
    servicesHeldReport: createWeeklyReportResolver(
      streamWeeklyReport,
      'Stream',
      'services held'
    ),
    weekdayIncomeBussingReport: createWeeklyReportResolver(
      streamWeeklyReport,
      'Stream',
      'weekday income & bussing'
    ),
    subChurchesReport: createWeeklyReportResolver(
      streamSubChurchesReport,
      'Stream',
      'sub-churches'
    ),
    subChurchesReportAtLevel: createSubChurchesAtLevelResolver('Stream'),
  },
  Campus: {
    directoryReport: createDirectoryResolver(campusDirectoryReport, 'Campus'),
    servicesHeldReport: createWeeklyReportResolver(
      campusWeeklyReport,
      'Campus',
      'services held'
    ),
    weekdayIncomeBussingReport: createWeeklyReportResolver(
      campusWeeklyReport,
      'Campus',
      'weekday income & bussing'
    ),
    subChurchesReport: createWeeklyReportResolver(
      campusSubChurchesReport,
      'Campus',
      'sub-churches'
    ),
    subChurchesReportAtLevel: createSubChurchesAtLevelResolver('Campus'),
  },
  Oversight: {
    directoryReport: createDirectoryResolver(
      oversightDirectoryReport,
      'Oversight'
    ),
    servicesHeldReport: createWeeklyReportResolver(
      oversightWeeklyReport,
      'Oversight',
      'services held'
    ),
    weekdayIncomeBussingReport: createWeeklyReportResolver(
      oversightWeeklyReport,
      'Oversight',
      'weekday income & bussing'
    ),
    subChurchesReport: createWeeklyReportResolver(
      oversightSubChurchesReport,
      'Oversight',
      'sub-churches'
    ),
    subChurchesReportAtLevel: createSubChurchesAtLevelResolver('Oversight'),
  },
}
