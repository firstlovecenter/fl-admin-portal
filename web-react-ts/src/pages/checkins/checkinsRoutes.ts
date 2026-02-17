import { lazy } from 'react'
import { LazyRouteTypes, Role } from 'global-types'
import { permitAdmin } from 'permission-utils'

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
    path: '/checkins/:churchType',
    element: CheckInEventsByChurch,
    placeholder: true,
    roles: [...leaderRoles, ...adminRoles, 'all'],
  },
]
