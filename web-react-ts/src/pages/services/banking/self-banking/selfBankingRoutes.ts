import { LazyRouteTypes } from 'global-types'
import { permitMe } from 'permission-utils'
import { lazy } from 'react'

const ConfirmPayment = lazy(() => import('./ConfirmPayment'))
const StreamSelfBanking = lazy(() => import('./StreamSelfBanking'))
const CouncilSelfBanking = lazy(() => import('./CouncilSelfBanking'))
const GovernorshipSelfBanking = lazy(() => import('./GovernorshipSelfBanking'))
const BacentaSelfBanking = lazy(() => import('./BacentaSelfBanking'))
const HubSelfBanking = lazy(() => import('./HubSelfBanking'))
const PayStreamOffering = lazy(() => import('./PayStreamOffering'))
const PayCouncilOffering = lazy(() => import('./PayCouncilOffering'))
const PayGovernorshipOffering = lazy(() => import('./PayGovernorshipOffering'))
const PayBacentaOffering = lazy(() => import('./PayBacentaOffering'))
const PayHubOffering = lazy(() => import('./PayHubOffering'))
const ReceiptPage = lazy(() => import('./ReceiptPage'))

export const banking: LazyRouteTypes[] = [
  //Self Banking Options
  {
    path: '/services/bacenta/self-banking',
    element: BacentaSelfBanking,
    roles: ['leaderBacenta'],
    placeholder: true,
  },
  {
    path: '/services/governorship/self-banking',
    element: GovernorshipSelfBanking,
    roles: ['leaderGovernorship', 'adminGovernorship'],
    placeholder: true,
  },
  {
    path: '/services/council/self-banking',
    element: CouncilSelfBanking,
    roles: ['leaderCouncil', 'adminCouncil'],
    placeholder: true,
  },
  {
    path: '/services/stream/self-banking',
    element: StreamSelfBanking,
    roles: ['leaderStream', 'adminStream'],
    placeholder: true,
  },
  {
    path: '/services/bacenta/self-banking/pay',
    element: PayBacentaOffering,
    roles: ['leaderBacenta'],
  },
  {
    path: '/rehearsals/hub/self-banking/pay',
    element: PayHubOffering,
    roles: ['leaderHub'],
  },
  {
    path: '/services/governorship/self-banking/pay',
    element: PayGovernorshipOffering,
    roles: ['leaderGovernorship', 'adminGovernorship'],
  },
  {
    path: '/services/council/self-banking/pay',
    element: PayCouncilOffering,
    roles: ['leaderCouncil', 'adminCouncil'],
  },
  {
    path: '/services/stream/self-banking/pay',
    element: PayStreamOffering,
    roles: ['leaderStream', 'adminStream'],
  },
  {
    path: '/self-banking/confirm-payment',
    element: ConfirmPayment,
    roles: [...permitMe('Governorship'), 'leaderBacenta'],
  },
  {
    path: '/self-banking/receipt',
    element: ReceiptPage,
    roles: [...permitMe('Governorship'), 'leaderBacenta'],
  },

  {
    path: '/services/hub/self-banking',
    element: HubSelfBanking,
    roles: ['leaderHub'],
    placeholder: true,
  },
]
