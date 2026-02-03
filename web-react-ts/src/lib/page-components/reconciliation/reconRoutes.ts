import { LazyRouteTypes } from 'global-types'
import { lazy } from 'react'

const Reconciliation = lazy(() => import('pages/reconciliation/Reconciliation'))

export const reconciliation: LazyRouteTypes[] = [
  {
    path: '/recon',
    element: Reconciliation,
    placeholder: true,
    roles: ['all'],
  },
]
