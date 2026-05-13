import { LazyRouteTypes } from 'global-types'
import { permitShepherdingControl } from 'permission-utils'
import { lazy } from 'react'

const ShepherdingControl = lazy(
  () => import('pages/shepherding-control/ShepherdingControl')
)

const ShepherdingControlProjector = lazy(
  () => import('pages/shepherding-control/ShepherdingControlProjector')
)

const ShepherdingControlPrint = lazy(
  () => import('pages/shepherding-control/ShepherdingControlPrint')
)

// Controller — mounts inside the regular ShellLayout (sidebar + nav).
export const shepherdingControl: LazyRouteTypes[] = [
  {
    path: '/shepherding-control',
    element: ShepherdingControl,
    roles: permitShepherdingControl(),
  },
]

// Projector and print — mount OUTSIDE ShellLayout (full-bleed windows).
// Wired separately in AppWithContext.tsx.
export const shepherdingControlProjector: LazyRouteTypes[] = [
  {
    path: '/shepherding-control/projector',
    element: ShepherdingControlProjector,
    roles: permitShepherdingControl(),
  },
  {
    path: '/shepherding-control/print',
    element: ShepherdingControlPrint,
    roles: permitShepherdingControl(),
  },
]
