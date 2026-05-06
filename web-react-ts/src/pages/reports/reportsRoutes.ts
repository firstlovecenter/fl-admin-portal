import { LazyRouteTypes } from 'global-types'
import { permitMe } from 'permission-utils'
import { lazy } from 'react'

const ReportsPage = lazy(() => import('./ReportsPage'))

export const reportsRoutes: LazyRouteTypes[] = [
  {
    path: '/reports',
    element: ReportsPage,
    roles: permitMe('Bacenta'),
  },
]
