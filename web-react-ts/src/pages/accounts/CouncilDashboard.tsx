import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import RoleView from 'auth/RoleView'
import {
  permitAdmin,
  permitArrivals,
  permitLeader,
} from 'permission-utils'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import {
  Bus,
  ChevronRight,
  History,
  Receipt,
  Wallet,
} from 'lucide-react'
import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { COUNCIL_ACCOUNT_DASHBOARD } from './accountsGQL'
import { CouncilForAccounts } from './accounts-types'

const formatCurrency = (value: number | null | undefined) => {
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 0,
    }).format(value ?? 0)
  } catch {
    return `GHS ${(value ?? 0).toLocaleString('en-GH', {
      maximumFractionDigits: 0,
    })}`
  }
}

type BalanceCardProps = {
  label: string
  value: number | null | undefined
  hint: string
  icon: React.ComponentType<{ className?: string }>
  accentBg: string
  accentText: string
  loading: boolean
}

const BalanceCard = ({
  label,
  value,
  hint,
  icon: Icon,
  accentBg,
  accentText,
  loading,
}: BalanceCardProps) => (
  <Card className="overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-10 items-center justify-center rounded-lg ${accentBg}`}
        >
          <Icon className={`size-5 ${accentText}`} />
        </span>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-32" />
        ) : (
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatCurrency(value)}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </CardContent>
  </Card>
)

type ActionRowProps = {
  to: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconText: string
  title: string
  description: string
}

const ActionRow = ({
  to,
  icon: Icon,
  iconBg,
  iconText,
  title,
  description,
}: ActionRowProps) => (
  <Link
    to={to}
    aria-label={title}
    className="group block rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 active:bg-muted"
  >
    <div className="flex min-h-[88px] items-center gap-3 p-4">
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className={`size-5 ${iconText}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">
          {title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  </Link>
)

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
          <header className="space-y-3 pr-14 md:pr-0">
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
