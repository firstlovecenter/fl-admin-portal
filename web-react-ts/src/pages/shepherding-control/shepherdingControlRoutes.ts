import { LazyRouteTypes } from 'global-types'
import { permitShepherdingControl } from 'permission-utils'
import { lazy } from 'react'

const ShepherdingControl = lazy(
  () => import('pages/shepherding-control/ShepherdingControl')
)

const ShepherdingControlProjector = lazy(
  () => import('pages/shepherding-control/ShepherdingControlProjector')
)

export const shepherdingControl: LazyRouteTypes[] = [
  {
    path: '/shepherding-control',
    element: ShepherdingControl,
    roles: permitShepherdingControl(),
  },
  {
    path: '/shepherding-control/projector',
    element: ShepherdingControlProjector,
    roles: permitShepherdingControl(),
  },
]
