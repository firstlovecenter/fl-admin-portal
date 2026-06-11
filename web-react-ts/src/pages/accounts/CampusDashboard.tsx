import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import RoleView from 'auth/RoleView'
import { permitArrivals, permitLeaderAdmin } from 'permission-utils'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import { ArrowDownUp, Bus, CheckCircle2, History, LayoutList, Wallet } from 'lucide-react'
import { useContext } from 'react'
import { CAMPUS_ACCOUNT_DASHBOARD } from './accountsGQL'
import { CampusDashboardItem } from './accounts-types'
import { ActionRow, BalanceCard } from './components/DashboardCards'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'

const CampusDashboard = () => {
  const { campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery<{
    campuses: CampusDashboardItem[]
  }>(CAMPUS_ACCOUNT_DASHBOARD, {
    variables: { id: campusId },
  })

  const campus = data?.campuses?.[0]
  const leader = campus?.leader
  const leaderInitials =
    `${leader?.firstName?.[0] ?? ''}${leader?.lastName?.[0] ?? ''}` ||
    campus?.name?.charAt(0) ||
    '?'

  return (
    <ApolloWrapper data={data} loading={loading} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {campus?.name ? (
                <>{campus.name} </>
              ) : (
                <Skeleton className="mr-2 inline-block h-7 w-40 align-middle" />
              )}
              <span className="text-banking">Accounts</span>
            </h1>
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage
                  src={leader?.pictureUrl}
                  alt={leader?.fullName ?? 'Campus leader'}
                />
                <AvatarFallback className="bg-banking/10 text-xs font-medium text-banking">
                  {leaderInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Campus leader</p>
                {leader?.fullName ? (
                  <p className="truncate text-sm font-medium text-foreground">
                    {leader.fullName}
                  </p>
                ) : (
                  <Skeleton className="mt-1 h-4 w-32" />
                )}
              </div>
            </div>
          </div>
        </StickyPageHeader>
        <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
          <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Supporting column — first in DOM so it floats above actions on mobile */}
            <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
              <BalanceCard
                label="Weekday Account"
                value={campus?.weekdayBalance}
                hint="Available for council expenses"
                icon={Wallet}
                accentBg="bg-banking/10"
                accentText="text-banking"
                loading={loading}
              />
              <BalanceCard
                label="Bussing Society"
                value={campus?.bussingSocietyBalance}
                hint="Reserved for Sunday bussing"
                icon={Bus}
                accentBg="bg-arrivals/10"
                accentText="text-arrivals"
                loading={loading}
              />
            </aside>

            {/* Primary column — actions */}
            <section className="space-y-3 lg:col-start-1 lg:row-start-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </h2>
              <ActionRow
                to="/accounts/campus/councils-for-deposits"
                icon={ArrowDownUp}
                iconBg="bg-banking/10"
                iconText="text-banking"
                title="Update Balances"
                description="Deposit or adjust council account balances"
              />
              <ActionRow
                to="/accounts/campus/council/view-accounts"
                icon={LayoutList}
                iconBg="bg-churches/10"
                iconText="text-churches"
                title="View Council Balances"
                description="See current balance for each council"
              />
              <RoleView roles={permitLeaderAdmin('Campus')}>
                <ActionRow
                  to="/accounts/campus/approvals"
                  icon={CheckCircle2}
                  iconBg="bg-banking/10"
                  iconText="text-banking"
                  title="Approvals"
                  description="Review and approve pending expense requests"
                />
              </RoleView>
              <RoleView roles={[...permitArrivals('Campus')]}>
                <ActionRow
                  to="/accounts/campus/councils-for-bussing-expense"
                  icon={Bus}
                  iconBg="bg-arrivals/10"
                  iconText="text-arrivals"
                  title="Weekend Bussing Expense Entry"
                  description="Record bussing costs for the weekend"
                />
              </RoleView>
              <RoleView roles={permitLeaderAdmin('Campus')}>
                <ActionRow
                  to="/accounts/campus/transaction-history"
                  icon={History}
                  iconBg="bg-churches/10"
                  iconText="text-churches"
                  title="Transaction History"
                  description="Review past deposits, withdrawals, and approvals"
                />
              </RoleView>
            </section>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default CampusDashboard
