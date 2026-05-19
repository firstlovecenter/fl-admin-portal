import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import RoleView from 'auth/RoleView'
import {
  permitAdmin,
  permitArrivals,
  permitLeader,
} from 'permission-utils'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import { Bus, History, Receipt, Wallet } from 'lucide-react'
import { useContext } from 'react'
import { COUNCIL_ACCOUNT_DASHBOARD } from './accountsGQL'
import { CouncilForAccounts } from './accounts-types'
import { ActionRow, BalanceCard } from './components/DashboardCards'

const CouncilDashboard = () => {
  const { councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery<{
    councils: CouncilForAccounts[]
  }>(COUNCIL_ACCOUNT_DASHBOARD, {
    variables: {
      id: councilId,
    },
  })

  const council = data?.councils?.[0]
  const leader = council?.leader
  const leaderInitials =
    `${leader?.firstName?.[0] ?? ''}${leader?.lastName?.[0] ?? ''}` ||
    council?.name?.charAt(0) ||
    '?'

  return (
    <ApolloWrapper data={data} loading={loading} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
          <header className="space-y-3 pl-14 pr-14 md:px-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {council?.name ? (
                <>{council.name} </>
              ) : (
                <Skeleton className="mr-2 inline-block h-7 w-40 align-middle" />
              )}
              <span className="text-banking">Accounts</span>
            </h1>
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage
                  src={leader?.pictureUrl}
                  alt={leader?.fullName ?? 'Council leader'}
                />
                <AvatarFallback className="bg-banking/10 text-xs font-medium text-banking">
                  {leaderInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Council leader</p>
                {leader?.fullName ? (
                  <p className="truncate text-sm font-medium text-foreground">
                    {leader.fullName}
                  </p>
                ) : (
                  <Skeleton className="mt-1 h-4 w-32" />
                )}
              </div>
            </div>
          </header>

          <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Supporting column — balances. First in DOM so it sits on top on mobile. */}
            <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
              <BalanceCard
                label="Weekday Account"
                value={council?.weekdayBalance}
                hint="Available for council expenses"
                icon={Wallet}
                accentBg="bg-banking/10"
                accentText="text-banking"
                loading={loading}
              />
              <BalanceCard
                label="Bussing Society"
                value={council?.bussingSocietyBalance}
                hint="Reserved for Sunday bussing"
                icon={Bus}
                accentBg="bg-arrivals/10"
                accentText="text-arrivals"
                loading={loading}
              />
            </aside>

            {/* Primary column — actions. */}
            <section className="space-y-3 lg:col-start-1 lg:row-start-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </h2>
              <RoleView
                roles={[
                  ...permitLeader('Council'),
                  ...permitAdmin('Campus'),
                  ...permitArrivals('Campus'),
                ]}
              >
                <ActionRow
                  to="/accounts/request-expense"
                  icon={Receipt}
                  iconBg="bg-brand/10"
                  iconText="text-brand"
                  title="Request Expense"
                  description="Submit a new expense request for approval"
                />
              </RoleView>
              <ActionRow
                to="/accounts/council/transaction-history"
                icon={History}
                iconBg="bg-churches/10"
                iconText="text-churches"
                title="Transaction History"
                description="Review past deposits, withdrawals, and approvals"
              />
            </section>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default CouncilDashboard
