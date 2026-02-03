import { LazyRouteTypes } from 'global-types'
import { permitMe } from 'permission-utils'
import { lazy } from 'react'

const CampusDownloadReports = lazy(() => import('./CampusDownloadReports'))
const CouncilDownloadReports = lazy(() => import('./CouncilDownloadReports'))
const CampusFellowshipServicesThisWeek = lazy(
  () => import('./services-this-week/CampusBacentaServicesThisWeek')
)

const DownloadCouncilMembership = lazy(
  () => import('./membership-list/DownloadCouncilMembership')
)

const PurchaseCouncilCredits = lazy(
  () => import('./purchase-credits/CouncilPurchaseCredits')
)
const CouncilPurchaseHistoy = lazy(
  () => import('./purchase-credits/CouncilPurchaseHistory')
)

const CouncilConfirmPaymentDelay = lazy(
  () => import('./purchase-credits/CouncilConfirmPaymentDelay')
)

export const downloadReports: LazyRouteTypes[] = [
  {
    path: '/download-reports/campus',
    element: CampusDownloadReports,
    roles: permitMe('Campus'),
  },
  {
    path: '/download-reports/council',
    element: CouncilDownloadReports,
    roles: permitMe('Council'),
  },
  {
    path: '/dowload-reports/council/membership',
    element: DownloadCouncilMembership,
    roles: permitMe('Council'),
  },
  {
    path: '/download-reports/council/purchase-credits',
    element: PurchaseCouncilCredits,
    roles: permitMe('Council'),
  },
  {
    path: '/download-reports/council/purchase-history',
    element: CouncilPurchaseHistoy,
    roles: permitMe('Council'),
  },
  {
    path: '/campus/download-fellowship-services',
    element: CampusFellowshipServicesThisWeek,
    roles: permitMe('Campus'),
  },
  {
    path: '/download-reports/council/confirm-payment-delay',
    element: CouncilConfirmPaymentDelay,
    roles: permitMe('Bacenta'),
  },
]
