import { ReactNode, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, ChevronRight, Download, Sparkles } from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { MemberContext } from 'contexts/MemberContext'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'
import { cn } from 'components/lib/utils'

type FocusChurch = {
  id: string
  name: string
  __typename: string
}

const GRAPHS_TYPES = new Set<string>([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'Denomination',
  'Hub',
  'HubCouncil',
  'Ministry',
  'CreativeArts',
])

const QUICK_FACTS_TYPES = new Set<string>([
  'Bacenta',
  'Governorship',
  'Stream',
  'Council',
  'Campus',
])

const DOWNLOAD_MEMBERSHIP_TYPES = new Set<string>([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
])

const formatChurchLevel = (churchType?: string) =>
  churchType ? churchType.replace(/([a-z])([A-Z])/g, '$1 $2') : ''

const TrendsMenu = () => {
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const { selectedScope } = useChurchRoleScope()

  const fallbackChurch = currentUser?.currentChurch
  const focusChurch: FocusChurch | null = selectedScope
    ? {
        id: selectedScope.churchId,
        name: selectedScope.churchName,
        __typename: selectedScope.churchType,
      }
    : fallbackChurch?.id && fallbackChurch?.__typename
    ? {
        id: fallbackChurch.id,
        name: fallbackChurch.name,
        __typename: fallbackChurch.__typename,
      }
    : null

  const churchType = focusChurch?.__typename
  const routeSlug = churchType?.toLowerCase()

  const handleNavigate = (path: string) => {
    if (!focusChurch) return
    clickCard(focusChurch)
    navigate(path)
  }

  const showGraphs = !!churchType && GRAPHS_TYPES.has(churchType)
  const showQuickFacts = !!churchType && QUICK_FACTS_TYPES.has(churchType)
  const showDownload = !!churchType && DOWNLOAD_MEMBERSHIP_TYPES.has(churchType)

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        <header className="space-y-1">
          {focusChurch ? (
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {focusChurch.name}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {formatChurchLevel(churchType)}
              </span>
            </h1>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Trends
            </h1>
          )}
          <p className="text-sm text-muted-foreground">
            Trends for the church currently in focus.
          </p>
        </header>

        {!focusChurch ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No church in focus. Pick one from the Church in Focus selector to
            view trends.
          </div>
        ) : (
          <div className="space-y-3">
            {showGraphs && (
              <MenuCard
                icon={<BarChart3 className="h-5 w-5" />}
                accent="bg-churches/10 text-churches"
                title="Last 4 Weeks"
                description="Income and attendance graphs"
                onClick={() => handleNavigate(`/${routeSlug}/graphs`)}
              />
            )}

            {showQuickFacts && (
              <MenuCard
                icon={<Sparkles className="h-5 w-5" />}
                accent="bg-campaigns/10 text-campaigns"
                title="Quick Facts"
                description="Quick facts about your church"
                onClick={() =>
                  handleNavigate(`/quick-facts/this-month/${routeSlug}`)
                }
              />
            )}

            {showDownload && (
              <RoleView roles={permitLeaderAdmin('Bacenta')}>
                <MenuCard
                  icon={<Download className="h-5 w-5" />}
                  accent="bg-banking/10 text-banking"
                  title="Download Membership"
                  description="Download membership list as CSV"
                  onClick={() =>
                    handleNavigate(`/download-reports/${routeSlug}/membership`)
                  }
                />
              </RoleView>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

type MenuCardProps = {
  icon: ReactNode
  accent: string
  title: string
  description: string
  onClick: () => void
}

const MenuCard = ({
  icon,
  accent,
  title,
  description,
  onClick,
}: MenuCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent active:scale-[0.99] min-h-[64px]"
  >
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        accent
      )}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground truncate">{description}</p>
    </div>
    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
  </button>
)

export default TrendsMenu
