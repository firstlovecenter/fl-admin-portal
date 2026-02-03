import { lazy } from 'react'
import { permitLeaderAdmin, permitMe } from 'permission-utils'
import { LazyRouteTypes } from 'global-types'

const HubFormMenu = lazy(() => import('./menus/HubFormMenu'))
const HubCouncilFormMenu = lazy(() => import('./menus/HubCouncilFormMenu'))
const MinistryFormMenu = lazy(() => import('./menus/MinistryFormMenu'))
const HubRehearsalCancelled = lazy(
  () =>
    import('pages/services/record-service/creative-arts/HubRehearsalCancelled')
)
const HubRehearsalService = lazy(
  () =>
    import('pages/services/record-service/creative-arts/HubRehearsalService')
)
const HubCouncilRehearsalService = lazy(
  () =>
    import(
      'pages/services/record-service/creative-arts//HubCouncilRehearsalService'
    )
)
const MinistryRehearsalService = lazy(
  () =>
    import(
      'pages/services/record-service/creative-arts/MinistryRehearsalService'
    )
)
const HubSundayMeeting = lazy(
  () => import('pages/services/ministry-meeting/HubCouncilSundayMeeting')
)
const HubRehearsalServiceDetails = lazy(
  () =>
    import(
      'pages/services/record-service/creative-arts/HubRehearsalServiceDetails'
    )
)
const HubCouncilRehearsalServiceDetails = lazy(
  () =>
    import(
      'pages/services/record-service/creative-arts/HubCouncilRehearsalServiceDetails'
    )
)
const MinistryRehearsalServiceDetails = lazy(
  () =>
    import(
      'pages/services/record-service/creative-arts/MinistryRehearsalServiceDetails'
    )
)
const HubSundayMeetingDetails = lazy(
  () => import('pages/services/ministry-meeting/HubCouncilSundayMeetingDetails')
)

export const rehearsalRoutes: LazyRouteTypes[] = [
  {
    path: '/services/hub',
    element: HubFormMenu,
    roles: ['all'],
    placeholder: true,
  },
  {
    path: '/services/hubcouncil',
    element: HubCouncilFormMenu,
    roles: permitMe('HubCouncil'),
    placeholder: true,
  },
  {
    path: '/services/ministry',
    element: MinistryFormMenu,
    roles: permitMe('Ministry'),
  },
  //Hub Service Details
  {
    path: '/hub/record-rehearsal',
    element: HubRehearsalService,
    roles: permitLeaderAdmin('Hub'),
    placeholder: false,
  },
  {
    path: '/hubcouncil/record-rehearsal',
    element: HubCouncilRehearsalService,
    roles: permitLeaderAdmin('HubCouncil'),
  },
  {
    path: '/ministry/record-rehearsal',
    element: MinistryRehearsalService,
    roles: permitLeaderAdmin('Ministry'),
  },
  {
    path: '/hub/cancel-rehearsal',
    element: HubRehearsalCancelled,
    roles: permitLeaderAdmin('Hub'),
    placeholder: true,
  },
  {
    path: '/hub/record-sundayservice',
    element: HubSundayMeeting,
    roles: permitLeaderAdmin('Hub'),
    placeholder: false,
  },
  {
    path: '/hub/service-details',
    element: HubRehearsalServiceDetails,
    roles: permitLeaderAdmin('Hub'),
    placeholder: false,
  },
  {
    path: '/hubcouncil/service-details',
    element: HubCouncilRehearsalServiceDetails,
    roles: permitLeaderAdmin('HubCouncil'),
    placeholder: false,
  },
  {
    path: '/ministry/service-details',
    element: MinistryRehearsalServiceDetails,
    roles: permitLeaderAdmin('Ministry'),
    placeholder: false,
  },
  {
    path: '/hub/sunday-meeting-details',
    element: HubSundayMeetingDetails,
    roles: permitLeaderAdmin('Hub'),
    placeholder: false,
  },
]
