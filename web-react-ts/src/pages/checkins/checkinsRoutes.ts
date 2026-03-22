import { lazy } from 'react'
import { LazyRouteTypes, Role } from 'global-types'
import { permitAdmin, permitLeaderAdmin } from 'permission-utils'

const CheckInsChurchSelect = lazy(
  () => import('pages/checkins/CheckInsChurchSelect')
)
const CheckInEventsByChurch = lazy(
  () => import('pages/checkins/CheckInEventsByChurch')
)
const CreateCheckInEvent = lazy(
  () => import('pages/checkins/CreateCheckInEvent')
)
const CheckInEventDashboard = lazy(
  () => import('pages/checkins/CheckInEventDashboard')
)
const CheckInScopeBreakdown = lazy(
  () => import('pages/checkins/CheckInScopeBreakdown')
)
const CheckedInMembersList = lazy(
  () => import('pages/checkins/CheckedInMembersList')
)
const DefaultedMembersList = lazy(
  () => import('pages/checkins/DefaultedMembersList')
)
const MemberCheckInForm = lazy(() => import('pages/checkins/MemberCheckInForm'))
const CheckInReports = lazy(() => import('pages/checkins/CheckInReports'))
const CheckInFlaggedReview = lazy(
  () => import('pages/checkins/CheckInFlaggedReview')
)
const CheckInEventHistory = lazy(
  () => import('pages/checkins/CheckInEventHistory')
)
const CheckInQRPage = lazy(() => import('pages/checkins/CheckInQRPage'))

// Per-level dashboard pages
const CheckInBacenta = lazy(
  () => import('pages/checkins/dashboards/CheckInBacenta')
)
const CheckInDashboardGovernorship = lazy(
  () => import('pages/checkins/dashboards/CheckInDashboardGovernorship')
)
const CheckInDashboardCouncil = lazy(
  () => import('pages/checkins/dashboards/CheckInDashboardCouncil')
)
const CheckInDashboardStream = lazy(
  () => import('pages/checkins/dashboards/CheckInDashboardStream')
)
const CheckInDashboardCampus = lazy(
  () => import('pages/checkins/dashboards/CheckInDashboardCampus')
)

// Breakdown pages
const CheckInCampusByStream = lazy(
  () => import('pages/checkins/breakdowns/CampusByStream')
)
const CheckInStreamByCouncil = lazy(
  () => import('pages/checkins/breakdowns/StreamByCouncil')
)
const CheckInCouncilByGovernorship = lazy(
  () => import('pages/checkins/breakdowns/CouncilByGovernorship')
)

const leaderRoles: Role[] = [
  'leaderBacenta',
  'leaderGovernorship',
  'leaderCouncil',
  'leaderStream',
  'leaderCampus',
  'leaderOversight',
  'leaderDenomination',
]

const adminRoles = [
  ...permitAdmin('Governorship'),
  ...permitAdmin('Council'),
  ...permitAdmin('Stream'),
  ...permitAdmin('Campus'),
  ...permitAdmin('Oversight'),
  ...permitAdmin('Denomination'),
]

export const checkinsRoutes: LazyRouteTypes[] = [
  {
    path: '/checkins',
    element: CheckInsChurchSelect,
    placeholder: true,
    roles: [...leaderRoles, ...adminRoles, 'all'],
  },
  {
    path: '/checkins/create',
    element: CreateCheckInEvent,
    placeholder: true,
    roles: adminRoles,
  },
  {
    path: '/checkins/event/:eventId',
    element: CheckInEventDashboard,
    placeholder: true,
    roles: [...leaderRoles, ...adminRoles, 'all'],
  },
  {
    path: '/checkins/event/:eventId/scopes',
    element: CheckInScopeBreakdown,
    placeholder: true,
    roles: [...leaderRoles, ...adminRoles, 'all'],
  },
  {
    path: '/checkins/event/:eventId/checked-in',
    element: CheckedInMembersList,
    placeholder: true,
    roles: [...leaderRoles, ...adminRoles, 'all'],
  },
  {
    path: '/checkins/event/:eventId/defaulted',
    element: DefaultedMembersList,
    placeholder: true,
    roles: [...leaderRoles, ...adminRoles, 'all'],
  },
  {
    path: '/checkins/event/:eventId/flagged',
    element: CheckInFlaggedReview,
    placeholder: true,
    roles: adminRoles,
  },
  {
    path: '/checkins/reports',
    element: CheckInReports,
    placeholder: true,
    roles: [...leaderRoles, ...adminRoles],
  },
  {
    path: '/checkins/checkin',
    element: MemberCheckInForm,
    placeholder: true,
    roles: ['all' as Role],
  },
  {
    path: '/checkins/history',
    element: CheckInEventHistory,
    placeholder: true,
    roles: [...leaderRoles, ...adminRoles],
  },
  {
    path: '/checkins/qr',
    element: CheckInQRPage,
    placeholder: true,
    roles: ['all' as Role],
  },

  // Per-level dashboard pages (like arrivals)
  {
    path: '/checkins/bacenta',
    element: CheckInBacenta,
    placeholder: true,
    roles: permitLeaderAdmin('Bacenta'),
  },
  {
    path: '/checkins/governorship',
    element: CheckInDashboardGovernorship,
    placeholder: true,
    roles: permitLeaderAdmin('Governorship'),
  },
  {
    path: '/checkins/council',
    element: CheckInDashboardCouncil,
    placeholder: true,
    roles: permitLeaderAdmin('Council'),
  },
  {
    path: '/checkins/stream',
    element: CheckInDashboardStream,
    placeholder: true,
    roles: permitLeaderAdmin('Stream'),
  },
  {
    path: '/checkins/campus',
    element: CheckInDashboardCampus,
    placeholder: true,
    roles: permitLeaderAdmin('Campus'),
  },

  // Breakdown / drill-down pages
  {
    path: '/checkins/campus-by-stream',
    element: CheckInCampusByStream,
    placeholder: true,
    roles: permitLeaderAdmin('Campus'),
  },
  {
    path: '/checkins/stream-by-council',
    element: CheckInStreamByCouncil,
    placeholder: true,
    roles: permitLeaderAdmin('Stream'),
  },
  {
    path: '/checkins/council-by-governorship',
    element: CheckInCouncilByGovernorship,
    placeholder: true,
    roles: permitLeaderAdmin('Council'),
  },

  {
    path: '/checkins/:churchType',
    element: CheckInEventsByChurch,
    placeholder: true,
    roles: [...leaderRoles, ...adminRoles, 'all'],
  },
]
