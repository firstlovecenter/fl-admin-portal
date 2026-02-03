import { LazyRouteTypes } from 'global-types'
import { permitLeaderAdminArrivals } from 'permission-utils'
import { lazy } from 'react'

const StreamServicesThisWeek = lazy(() => import('./StreamServicesThisWeek'))
const StreamFormDefaultersThisWeek = lazy(
  () => import('./StreamFormDefaultersThisWeek')
)
const StreamBankedThisWeek = lazy(() => import('./StreamBankedThisWeek'))
const StreamBankingDefaultersThisWeek = lazy(
  () => import('./StreamBankingDefaultersThisWeek')
)
const StreamCancelledServicesThisWeek = lazy(
  () => import('./StreamCancelledServicesThisWeek')
)

export const streamServicesRoutes: LazyRouteTypes[] = [
  {
    path: '/stream-services/filled-services',
    element: StreamServicesThisWeek,
    roles: permitLeaderAdminArrivals('Stream'),
  },
  {
    path: '/stream-services/form-defaulters',
    element: StreamFormDefaultersThisWeek,
    roles: permitLeaderAdminArrivals('Stream'),
  },
  {
    path: '/stream-services/banked-services',
    element: StreamBankedThisWeek,
    roles: permitLeaderAdminArrivals('Stream'),
  },
  {
    path: '/stream-services/banking-defaulters',
    element: StreamBankingDefaultersThisWeek,
    roles: permitLeaderAdminArrivals('Stream'),
  },
  {
    path: '/stream-services/cancelled-services',
    element: StreamCancelledServicesThisWeek,
    roles: permitLeaderAdminArrivals('Stream'),
  },
]
