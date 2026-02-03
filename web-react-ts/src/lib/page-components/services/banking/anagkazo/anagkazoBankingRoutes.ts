import { LazyRouteTypes } from 'global-types'
import { lazy } from 'react'

const ConfirmAnagkazoBanking = lazy(() => import('./ConfirmAnagkazoBanking'))
const TellerSelect = lazy(() => import('./TellerSelect'))

export const anagkazoRoutes: LazyRouteTypes[] = [
  {
    path: '/anagkazo/treasurer-select',
    element: TellerSelect,
    roles: ['adminStream'],
    placeholder: false,
  },
  {
    path: '/anagkazo/receive-banking',
    element: ConfirmAnagkazoBanking,
    roles: ['tellerStream'],
    placeholder: false,
  },
]
