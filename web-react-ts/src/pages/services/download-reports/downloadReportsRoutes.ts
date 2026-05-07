import { LazyRouteTypes } from 'global-types'
import { permitLeaderAdmin, permitMe } from 'permission-utils'
import { lazy } from 'react'

const DownloadBacentaMembership = lazy(
  () => import('./membership-list/DownloadBacentaMembership')
)
const DownloadGovernorshipMembership = lazy(
  () => import('./membership-list/DownloadGovernorshipMembership')
)
const DownloadCouncilMembership = lazy(
  () => import('./membership-list/DownloadCouncilMembership')
)
const DownloadStreamMembership = lazy(
  () => import('./membership-list/DownloadStreamMembership')
)
const DownloadCampusMembership = lazy(
  () => import('./membership-list/DownloadCampusMembership')
)
const DownloadOversightMembership = lazy(
  () => import('./membership-list/DownloadOversightMembership')
)
const CampusBacentaServicesThisWeek = lazy(
  () => import('./services-this-week/CampusBacentaServicesThisWeek')
)

export const downloadReports: LazyRouteTypes[] = [
  {
    path: '/download-reports/bacenta/membership',
    element: DownloadBacentaMembership,
    roles: permitLeaderAdmin('Bacenta'),
  },
  {
    path: '/download-reports/governorship/membership',
    element: DownloadGovernorshipMembership,
    roles: permitLeaderAdmin('Governorship'),
  },
  {
    path: '/download-reports/council/membership',
    element: DownloadCouncilMembership,
    roles: permitLeaderAdmin('Council'),
  },
  {
    path: '/download-reports/stream/membership',
    element: DownloadStreamMembership,
    roles: permitLeaderAdmin('Stream'),
  },
  {
    path: '/download-reports/campus/membership',
    element: DownloadCampusMembership,
    roles: permitLeaderAdmin('Campus'),
  },
  {
    path: '/download-reports/oversight/membership',
    element: DownloadOversightMembership,
    roles: permitLeaderAdmin('Oversight'),
  },
  {
    path: '/campus/download-fellowship-services',
    element: CampusBacentaServicesThisWeek,
    roles: permitMe('Campus'),
  },
]
