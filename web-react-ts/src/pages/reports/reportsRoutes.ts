import { LazyRouteTypes } from 'global-types'
import { permitMe } from 'permission-utils'
import { lazy } from 'react'

const ReportsPage = lazy(() => import('./ReportsPage'))
const DirectoryReportPage = lazy(
  () => import('./directory/DirectoryReportPage')
)
const ServicesHeldReportPage = lazy(
  () => import('./services-held/ServicesHeldReportPage')
)
const WeekdayIncomeBussingReportPage = lazy(
  () => import('./weekday-income/WeekdayIncomeBussingReportPage')
)
const SubChurchesReportPage = lazy(
  () => import('./sub-churches/SubChurchesReportPage')
)

export const reportsRoutes: LazyRouteTypes[] = [
  {
    path: '/reports',
    element: ReportsPage,
    roles: permitMe('Bacenta'),
  },
  {
    path: '/reports/directory',
    element: DirectoryReportPage,
    roles: permitMe('Bacenta'),
  },
  {
    path: '/reports/services-held',
    element: ServicesHeldReportPage,
    roles: permitMe('Bacenta'),
  },
  {
    path: '/reports/weekday-income-bussing',
    element: WeekdayIncomeBussingReportPage,
    roles: permitMe('Bacenta'),
  },
  {
    path: '/reports/sub-churches',
    element: SubChurchesReportPage,
    roles: permitMe('Bacenta'),
  },
]
