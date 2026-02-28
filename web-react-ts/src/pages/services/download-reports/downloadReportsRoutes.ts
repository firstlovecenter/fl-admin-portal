import { LazyRouteTypes } from 'global-types'
import { permitMe } from 'permission-utils'
import { lazy } from 'react'

const DownloadFellowshipMembership = lazy(
  () => import('./membership-list/DownloadFellowshipMembership')
)
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
const CampusFellowshipServicesThisWeek = lazy(
  () => import('./services-this-week/CampusBacentaServicesThisWeek')
)

export const downloadReports: LazyRouteTypes[] = [
  {
    path: '/download-reports/fellowship/membership',
    element: DownloadFellowshipMembership,
    roles: permitMe('Bacenta'),
  },
  {
    path: '/download-reports/bacenta/membership',
    element: DownloadBacentaMembership,
    roles: permitMe('Bacenta'),
  },
  {
    path: '/download-reports/governorship/membership',
    element: DownloadGovernorshipMembership,
    roles: permitMe('Governorship'),
  },
  {
    path: '/download-reports/council/membership',
    element: DownloadCouncilMembership,
    roles: permitMe('Council'),
  },
  {
    path: '/download-reports/stream/membership',
    element: DownloadStreamMembership,
    roles: permitMe('Stream'),
  },
  {
    path: '/download-reports/campus/membership',
    element: DownloadCampusMembership,
    roles: permitMe('Campus'),
  },
  {
    path: '/download-reports/oversight/membership',
    element: DownloadOversightMembership,
    roles: permitMe('Oversight'),
  },
  {
    path: '/campus/download-fellowship-services',
    element: CampusFellowshipServicesThisWeek,
    roles: permitMe('Campus'),
  },
]
