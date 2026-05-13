import { lazy } from 'react'
import { LazyRouteTypes, Role } from 'global-types'

// SYN-98 — accounts policy: only these three church-scoped roles, AND
// the user must hold the `fishers` role (server-side enforced in
// accounts-resolvers.ts:assertAccountsAccess). The FE route gate uses
// OR semantics across this array; the AND with `fishers` is enforced
// server-side. A fishers-less user reaching the view will see every
// action fail with the policy error.
//
// Intentionally NOT using permitX helpers — they expand to
// denomination/oversight admins by inheritance, which we don't want
// for accounts. Any addition to this list is a deliberate policy
// change made by a human, never by Claude.
const ACCOUNTS_ROLES: Role[] = [
  'leaderCouncil',
  'leaderCampus',
  'adminCampus',
]

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
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/council/dashboard',
    element: CouncilDashboard,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/campus/dashboard',
    element: CampusDashboard,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/oversight/dashboard',
    element: OversightDashboard,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/request-expense',
    element: ExpenseForm,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/campus/councils-for-deposits',
    element: CampusCouncilListForDeposits,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/council/make-deposit',
    element: MakeDepositForm,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/council/transaction-history',
    element: CouncilTransactionHistory,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/campus/transaction-history',
    element: CampusTransactionHistory,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/transaction-details/',
    element: TransactionDetails,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/campus/council/view-accounts',
    element: CampusCouncilListForAccounts,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/oversight/view-campuses',
    element: OversightCampusListForAccount,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/campus/approvals',
    element: Approvals,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/campus/councils-for-bussing-expense',
    element: CampusCouncilListForBussingExpense,
    roles: ACCOUNTS_ROLES,
  },
  {
    path: '/accounts/campus/bussing-expense-entry',
    element: BussingExpenseEntry,
    roles: ACCOUNTS_ROLES,
  },
]
