import { LazyRouteTypes } from 'global-types'
import { permitShepherdingControl } from 'permission-utils'
import { lazy } from 'react'

const ShepherdingControl = lazy(
  () => import('pages/shepherding-control/ShepherdingControl')
)

const ShepherdingControlProjector = lazy(
  () => import('pages/shepherding-control/ShepherdingControlProjector')
)

// Controller — mounts inside the regular ShellLayout (sidebar + nav).
export const shepherdingControl: LazyRouteTypes[] = [
  {
    path: '/shepherding-control',
    element: ShepherdingControl,
    roles: permitShepherdingControl(),
  },
]

// Projector — mounts OUTSIDE ShellLayout so the external monitor shows
// only the slide. Wired separately in AppWithContext.tsx.
export const shepherdingControlProjector: LazyRouteTypes[] = [
  {
    path: '/shepherding-control/projector',
    element: ShepherdingControlProjector,
    roles: permitShepherdingControl(),
  },
]
