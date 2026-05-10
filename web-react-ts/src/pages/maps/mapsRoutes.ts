import { LazyRouteTypes } from 'global-types'
import { permitMe } from 'permission-utils'
import { lazy } from 'react'

const MapView = lazy(() => import('pages/maps/MapView'))

export const maps: LazyRouteTypes[] = [
  {
    path: '/maps/*',
    element: MapView,
    placeholder: false,
    roles: permitMe('Bacenta'),
  },
]
