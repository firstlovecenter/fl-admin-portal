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
} from './weekly-report-cypher'

type WeekRangeArgs = {
  startWeekKey: number
  endWeekKey: number
}

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
  },
}
