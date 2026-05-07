import { LazyRouteTypes } from 'global-types'
import { permitAdmin } from 'permission-utils'
import { lazy } from 'react'

const ShepherdingControl = lazy(
  () => import('pages/shepherding-control/ShepherdingControl')
)

export const shepherdingControl: LazyRouteTypes[] = [
  {
    path: '/shepherding-control',
    element: ShepherdingControl,
    roles: permitAdmin('Bacenta'),
  },
]
