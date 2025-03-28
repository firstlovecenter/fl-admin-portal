import { lazy } from 'react'
import { LazyRouteTypes } from 'global-types'
import {
  permitAdmin,
  permitArrivals,
  permitLeader,
  permitLeaderAdmin,
} from 'permission-utils'

const LandingPage = lazy(() => import('pages/accounts/LandingPage'))
const CouncilDashboard = lazy(() => import('pages/accounts/CouncilDashboard'))
const CampusDashboard = lazy(() => import('pages/accounts/CampusDashboard'))
const OversightDashboard = lazy(
  () => import('pages/accounts/OversightDashboard')
)
const ExpenseForm = lazy(
  () => import('pages/accounts/request-expense/ExpenseForm')
)
const MakeDepositForm = lazy(
  () => import('pages/accounts/council-deposit/MakeDepositForm')
)
const CouncilTransactionHistory = lazy(
  () => import('pages/accounts/transaction-history/CouncilTransactionHistory')
)
const CampusTransactionHistory = lazy(
  () => import('pages/accounts/transaction-history/CampusTransactionHistory')
)
const TransactionDetails = lazy(
  () => import('pages/accounts/transaction-history/TransactionDetails')
)
const CampusCouncilListForDeposits = lazy(
  () => import('pages/accounts/council-deposit/CampusCouncilListForDeposits')
)
const CampusCouncilListForAccounts = lazy(
  () => import('pages/accounts/CampusCouncilListForViewingAccounts')
)
const OversightCampusListForAccount = lazy(
  () => import('pages/accounts/OversightCampusListForViewingAccounts')
)
const Approvals = lazy(() => import('pages/accounts/approvals/Approvals'))
const CampusCouncilListForBussingExpense = lazy(
  () =>
    import('pages/accounts/bussing-expense/CampusCouncilListForBussingExpense')
)
const BussingExpenseEntry = lazy(
  () => import('pages/accounts/bussing-expense/BussingExpenseEntry')
)

export const accountsRoutes: LazyRouteTypes[] = [
  {
    path: '/accounts',
    element: LandingPage,
    roles: [
      ...permitLeader('Council'),
      ...permitAdmin('Campus'),
      ...permitArrivals('Campus'),
    ],
  },
  {
    path: '/accounts/council/dashboard',
    element: CouncilDashboard,
    roles: [
      ...permitLeader('Council'),
      ...permitAdmin('Campus'),
      ...permitArrivals('Campus'),
    ],
  },
  {
    path: '/accounts/campus/dashboard',
    element: CampusDashboard,
    roles: [
      ...permitLeader('Campus'),
      ...permitAdmin('Campus'),
      ...permitArrivals('Campus'),
    ],
  },
  {
    path: '/accounts/oversight/dashboard',
    element: OversightDashboard,
    roles: [...permitAdmin('Oversight')],
  },
  {
    path: '/accounts/request-expense',
    element: ExpenseForm,
    roles: [
      ...permitLeader('Council'),
      ...permitAdmin('Campus'),
      ...permitArrivals('Campus'),
    ],
  },
  {
    path: '/accounts/campus/councils-for-deposits',
    element: CampusCouncilListForDeposits,
    roles: [...permitAdmin('Campus'), ...permitArrivals('Campus')],
  },
  {
    path: '/accounts/council/make-deposit',
    element: MakeDepositForm,
    roles: [...permitAdmin('Campus'), ...permitArrivals('Campus')],
  },
  {
    path: '/accounts/council/transaction-history',
    element: CouncilTransactionHistory,
    roles: [
      ...permitLeader('Council'),
      ...permitAdmin('Campus'),
      ...permitArrivals('Campus'),
    ],
  },
  {
    path: '/accounts/campus/transaction-history',
    element: CampusTransactionHistory,
    roles: [...permitLeader('Campus'), ...permitAdmin('Campus')],
  },
  {
    path: '/accounts/transaction-details/',
    element: TransactionDetails,
    roles: [
      ...permitLeader('Council'),
      ...permitAdmin('Campus'),
      ...permitArrivals('Campus'),
    ],
  },
  {
    path: '/accounts/campus/council/view-accounts',
    element: CampusCouncilListForAccounts,
    roles: [
      ...permitLeader('Council'),
      ...permitAdmin('Campus'),
      ...permitArrivals('Campus'),
    ],
  },
  {
    path: '/accounts/oversight/view-campuses',
    element: OversightCampusListForAccount,
    roles: [...permitAdmin('Oversight')],
  },
  {
    path: '/accounts/campus/approvals',
    element: Approvals,
    roles: permitLeaderAdmin('Campus'),
  },
  {
    path: '/accounts/campus/councils-for-bussing-expense',
    element: CampusCouncilListForBussingExpense,
    roles: [...permitAdmin('Campus'), ...permitArrivals('Campus')],
  },
  {
    path: '/accounts/campus/bussing-expense-entry',
    element: BussingExpenseEntry,
    roles: [...permitAdmin('Campus'), ...permitArrivals('Campus')],
  },
]
