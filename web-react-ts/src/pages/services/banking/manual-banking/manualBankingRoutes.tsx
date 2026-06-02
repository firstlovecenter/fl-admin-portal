import { LazyRouteTypes } from 'global-types'
import { lazy } from 'react'
import { Navigate } from 'react-router'

const ConfirmManualBanking = lazy(() => import('./ConfirmManualBanking'))
const TellerSelect = lazy(() => import('./TellerSelect'))

// Legacy /anagkazo/* URLs are kept as permanent redirects for one or two
// releases so existing bookmarks (and any teller's muscle memory) survive
// the rename. They re-render as <Navigate replace /> components that fire
// once on mount and rewrite the address bar. Wrapped in lazy() to satisfy
// the LazyRouteTypes contract used by the router config.
const RedirectAnagkazoTellerSelect = lazy(async () => ({
  default: () => <Navigate replace to="/manual-banking/teller-select" />,
}))
const RedirectAnagkazoReceiveBanking = lazy(async () => ({
  default: () => <Navigate replace to="/manual-banking/receive-banking" />,
}))

export const manualBankingRoutes: LazyRouteTypes[] = [
  {
    path: '/manual-banking/teller-select',
    element: TellerSelect,
    roles: ['adminStream'],
    placeholder: false,
  },
  {
    path: '/manual-banking/receive-banking',
    element: ConfirmManualBanking,
    roles: ['tellerStream'],
    placeholder: false,
  },
  {
    path: '/anagkazo/treasurer-select',
    element: RedirectAnagkazoTellerSelect,
    roles: ['adminStream'],
    placeholder: false,
  },
  {
    path: '/anagkazo/receive-banking',
    element: RedirectAnagkazoReceiveBanking,
    roles: ['tellerStream'],
    placeholder: false,
  },
]
