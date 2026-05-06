import { ReactNode, useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  Coins,
  FileUp,
  Frown,
  HandCoins,
  UserPlus,
} from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import RoleView from 'auth/RoleView'
import {
  permitAdmin,
  permitLeaderAdmin,
  permitTellerStream,
} from 'permission-utils'
import { ChurchLevel } from 'global-types'
import { cn } from 'components/lib/utils'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Skeleton } from 'components/ui/skeleton'
import {
  LATEST_SERVICE_FOR_BACENTA,
  LATEST_SERVICE_FOR_CAMPUS,
  LATEST_SERVICE_FOR_COUNCIL,
  LATEST_SERVICE_FOR_GOVERNORSHIP,
  LATEST_SERVICE_FOR_STREAM,
} from 'pages/services/ServicesQueries'

const formatChurchLevel = (churchType?: string) =>
  churchType ? churchType.replace(/([a-z])([A-Z])/g, '$1 $2') : ''

const SERVICE_LEVELS = ['Bacenta', 'Stream', 'Governorship', 'Council', 'Campus'] as const
type ServiceLevel = (typeof SERVICE_LEVELS)[number]

const isServiceLevel = (t?: string): t is ServiceLevel =>
  !!t && (SERVICE_LEVELS as readonly string[]).includes(t)

const RECORD_SERVICE_PATHS: Record<ServiceLevel, string> = {
  Bacenta: '/services/bacenta',
  Stream: '/stream/record-service',
  Governorship: '/governorship/record-service',
  Council: '/council/record-service',
  Campus: '/campus/record-service',
}

const QUERY_BY_LEVEL: Record<
  ServiceLevel,
  { query: typeof LATEST_SERVICE_FOR_BACENTA; idKey: string; collectionKey: string }
> = {
  Bacenta: {
    query: LATEST_SERVICE_FOR_BACENTA,
    idKey: 'bacentaId',
    collectionKey: 'bacentas',
  },
  Stream: {
    query: LATEST_SERVICE_FOR_STREAM,
    idKey: 'streamId',
    collectionKey: 'streams',
  },
  Governorship: {
    query: LATEST_SERVICE_FOR_GOVERNORSHIP,
    idKey: 'governorshipId',
    collectionKey: 'governorships',
  },
  Council: {
    query: LATEST_SERVICE_FOR_COUNCIL,
    idKey: 'councilId',
    collectionKey: 'councils',
  },
  Campus: {
    query: LATEST_SERVICE_FOR_CAMPUS,
    idKey: 'campusId',
    collectionKey: 'campuses',
  },
}

// Returns Monday 00:00:00.000 UTC of the ISO week containing `date`.
const getISOWeekStart = (date: Date) => {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const dayOfWeek = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - dayOfWeek + 1)
  return d
}

const isInCurrentISOWeek = (dateString?: string | null) => {
  if (!dateString) return false
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return false
  const weekStart = getISOWeekStart(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)
  return parsed >= weekStart && parsed < weekEnd
}

const ServicesMenu = () => {
  const { currentUser, userJobs } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const { selectedScope } = useChurchRoleScope()
  const navigate = useNavigate()

  // Prefer the church-in-focus selector (populated at login via ChurchRoleScopeProvider).
  // Fall back to currentUser.currentChurch (populated after visiting church details).
  const churchType = (
    selectedScope?.churchType ?? currentUser?.currentChurch?.__typename
  ) as ChurchLevel | undefined
  const churchId: string | undefined =
    selectedScope?.churchId ?? currentUser?.currentChurch?.id
  const churchName: string | undefined =
    selectedScope?.churchName ?? currentUser?.currentChurch?.name
  const routeSlug = churchType?.toLowerCase()

  // Resolve isManualBanking and vacationStatus from userJobs (populated from
  // GET_LOGGED_IN_USER's leads* fields on every login — no extra query needed).
  const churchDetails = useMemo(() => {
    if (churchId && userJobs) {
      for (const job of userJobs as any[]) {
        const found = (job.church as any[])?.find((c: any) => c?.id === churchId)
        if (found) return found
      }
    }
    return currentUser?.currentChurch ?? null
  }, [churchId, userJobs, currentUser?.currentChurch])

  const isManualBanking = !!churchDetails?.isManualBanking
  const isVacationActive = churchDetails?.vacationStatus === 'Active'

  const isServiceLevelChurch = isServiceLevel(churchType)
  const showServiceToggle =
    isServiceLevelChurch &&
    !!churchId &&
    (churchType !== 'Bacenta' || isVacationActive)

  const queryConfig =
    isServiceLevelChurch ? QUERY_BY_LEVEL[churchType] : null

  const { data: latestServiceData, loading: latestServiceLoading } = useQuery(
    queryConfig?.query ?? LATEST_SERVICE_FOR_BACENTA,
    {
      variables: queryConfig ? { [queryConfig.idKey]: churchId } : undefined,
      skip: !showServiceToggle || !queryConfig,
    }
  )

  const latestService =
    queryConfig && latestServiceData?.[queryConfig.collectionKey]?.[0]?.services?.[0]
  const hasServiceThisWeek =
    !!latestService && isInCurrentISOWeek(latestService.serviceDate?.date)

  const showHubOrMinistryForms =
    !!churchType && ['Hub', 'Ministry'].includes(churchType) && isVacationActive
  const showBankingSlips =
    !!churchType &&
    ['Stream', 'Council', 'Governorship', 'Bacenta'].includes(churchType) &&
    !isManualBanking
  const showSelfBanking =
    !!churchType &&
    ['Stream', 'Council', 'Governorship', 'Bacenta', 'Hub'].includes(
      churchType
    ) &&
    !isManualBanking
  const showStreamManualBanking = isManualBanking && churchType === 'Stream'
  const showDefaulters = !!churchType && churchType !== 'Bacenta'

  const handleServiceThisWeek = () => {
    if (!latestService || !routeSlug) return
    clickCard({ __typename: 'ServiceRecord', id: latestService.id })
    navigate(`/${routeSlug}/service-details`)
  }

  const handleRecordService = () => {
    if (!isServiceLevelChurch) return
    navigate(RECORD_SERVICE_PATHS[churchType])
  }

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {churchName}
            {churchType && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {formatChurchLevel(churchType)}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Services</p>
        </header>

        <div className="space-y-3">
          {showServiceToggle &&
            (latestServiceLoading ? (
              <Skeleton className="h-[64px] w-full rounded-xl" />
            ) : hasServiceThisWeek ? (
              <MenuCard
                icon={<CalendarCheck className="h-5 w-5" />}
                accent="bg-members/10 text-members"
                title="Service This Week"
                description="View the service you filled this week"
                onClick={handleServiceThisWeek}
              />
            ) : (
              <MenuCard
                icon={<BookOpen className="h-5 w-5" />}
                accent="bg-members/10 text-members"
                title="Record Service"
                description={`Fill this week's ${formatChurchLevel(churchType)} service`}
                onClick={handleRecordService}
              />
            ))}

          {showHubOrMinistryForms && (
            <MenuCard
              icon={<BookOpen className="h-5 w-5" />}
              accent="bg-members/10 text-members"
              title="Fill Forms"
              description={`Submit this week's ${formatChurchLevel(churchType)} forms`}
              onClick={() => navigate(`/services/${routeSlug}`)}
            />
          )}

          <MenuCard
            icon={<BarChart3 className="h-5 w-5" />}
            accent="bg-members/10 text-members"
            title="Trends"
            description="Attendance and income trends"
            onClick={() => {
              if (churchId && churchType)
                clickCard({ id: churchId, name: churchName, __typename: churchType })
              navigate('/trends')
            }}
          />

          {showBankingSlips && (
            <MenuCard
              icon={<FileUp className="h-5 w-5" />}
              accent="bg-banking/10 text-banking"
              title="Banking Slips"
              description="Upload and review banking slips"
              onClick={() => {
                if (churchId && churchType)
                  clickCard({ id: churchId, name: churchName, __typename: churchType })
                navigate(`/services/${routeSlug}/banking-slips`)
              }}
            />
          )}

          {showSelfBanking && (
            <MenuCard
              icon={<Coins className="h-5 w-5" />}
              accent="bg-banking/10 text-banking"
              title="Self Banking"
              description="Bank service offerings yourself"
              onClick={() => navigate(`/services/${routeSlug}/self-banking`)}
            />
          )}

          {showStreamManualBanking && (
            <>
              <RoleView roles={permitAdmin('Stream')}>
                <MenuCard
                  icon={<UserPlus className="h-5 w-5" />}
                  accent="bg-banking/10 text-banking"
                  title="Add Stream Tellers"
                  description="Assign tellers for midweek offerings"
                  onClick={() => navigate('/anagkazo/treasurer-select')}
                />
              </RoleView>
              <RoleView roles={permitTellerStream()}>
                <MenuCard
                  icon={<HandCoins className="h-5 w-5" />}
                  accent="bg-banking/10 text-banking"
                  title="Receive Midweek Offering"
                  description="Record offerings handed in by Bacentas"
                  onClick={() => navigate('/anagkazo/receive-banking')}
                />
              </RoleView>
            </>
          )}

          {showDefaulters && (
            <RoleView
              roles={[
                ...permitLeaderAdmin('Governorship'),
                ...permitLeaderAdmin('Hub'),
              ]}
            >
              <MenuCard
                icon={<Frown className="h-5 w-5" />}
                accent="bg-defaulters/10 text-defaulters"
                title="Defaulters"
                description="Churches missing services or banking this week"
                onClick={() => navigate('/services/defaulters/dashboard')}
              />
            </RoleView>
          )}
        </div>
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

export default ServicesMenu
