import { LazyRouteTypes } from 'global-types'
import {
  permitLeaderAdmin,
  permitLeaderAdminArrivals,
  permitMe,
} from 'permission-utils'
import { lazy } from 'react'

const ReportsPage = lazy(() => import('./ReportsPage'))
const DirectoryReportPage = lazy(
  () => import('./directory/DirectoryReportPage')
)
const BussingReportPage = lazy(() => import('./bussing/BussingReportPage'))
const BussingSubChurchesReportPage = lazy(
  () => import('./bussing/BussingSubChurchesReportPage')
)
const WeekdayReportPage = lazy(() => import('./weekday/WeekdayReportPage'))
const WeekdaySubChurchesReportPage = lazy(
  () => import('./weekday/WeekdaySubChurchesReportPage')
)
const BacentaServiceRecordsReportPage = lazy(
  () => import('./weekday/BacentaServiceRecordsReportPage')
)
const DefaultersReportPage = lazy(
  () => import('./defaulters/DefaultersReportPage')
)
const DefaultersSubChurchesReportPage = lazy(
  () => import('./defaulters/DefaultersSubChurchesReportPage')
)
const ArrivalsReportPage = lazy(
  () => import('./arrivals/ArrivalsReportPage')
)
const ArrivalsSubChurchesReportPage = lazy(
  () => import('./arrivals/ArrivalsSubChurchesReportPage')
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
    path: '/reports/bussing',
    element: BussingReportPage,
    roles: permitMe('Bacenta'),
  },
  {
    path: '/reports/bussing/sub-churches',
    element: BussingSubChurchesReportPage,
    roles: permitMe('Bacenta'),
  },
  {
    path: '/reports/weekday',
    element: WeekdayReportPage,
    roles: permitLeaderAdmin('Bacenta'),
  },
  {
    path: '/reports/weekday/services',
    element: BacentaServiceRecordsReportPage,
    roles: permitLeaderAdmin('Bacenta'),
  },
  {
    path: '/reports/weekday/sub-churches',
    element: WeekdaySubChurchesReportPage,
    roles: permitLeaderAdmin('Bacenta'),
  },
  {
    path: '/reports/defaulters',
    element: DefaultersReportPage,
    roles: permitLeaderAdmin('Governorship'),
  },
  {
    path: '/reports/defaulters/sub-churches',
    element: DefaultersSubChurchesReportPage,
    roles: permitLeaderAdmin('Governorship'),
  },
  {
    path: '/reports/arrivals',
    element: ArrivalsReportPage,
    roles: permitLeaderAdminArrivals('Governorship'),
  },
  {
    path: '/reports/arrivals/sub-churches',
    element: ArrivalsSubChurchesReportPage,
    roles: permitLeaderAdminArrivals('Governorship'),
  },
]
