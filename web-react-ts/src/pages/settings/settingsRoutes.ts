import { LazyRouteTypes } from 'global-types'
import { lazy } from 'react'

const Settings = lazy(() => import('pages/settings/Settings'))

export const settings: LazyRouteTypes[] = [
  {
    path: '/settings',
    element: Settings,
    roles: ['all'],
  },
]
