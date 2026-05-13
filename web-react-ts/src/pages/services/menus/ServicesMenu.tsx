import { ReactNode, useContext, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  PencilLine,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import RoleView from 'auth/RoleView'
import {
  permitAdmin,
  permitLeaderAdmin,
  permitTellerStream,
} from 'permission-utils'
import { ChurchIdAndName, ChurchLevel } from 'global-types'
import { cn } from 'components/lib/utils'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Skeleton } from 'components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
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
  Bacenta: '/bacenta/record-service',
  Stream: '/stream/record-service',
  Governorship: '/governorship/record-service',
  Council: '/council/record-service',
  Campus: '/campus/record-service',
}

const BACENTA_NO_SERVICE_PATH = '/services/bacenta/no-service'

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
  const location = useLocation()
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)

  const rawState = location.state as Record<string, unknown> | null
  const rawOverride = rawState?.overrideChurch as ChurchIdAndName | undefined
  const navOverride: ChurchIdAndName | null =
    rawOverride &&
    typeof rawOverride.id === 'string' &&
    typeof rawOverride.__typename === 'string'
      ? rawOverride
      : null

  const churchType = (
    navOverride?.__typename ??
    selectedScope?.churchType ??
    currentUser?.currentChurch?.__typename
  ) as ChurchLevel | undefined
  const churchId: string | undefined =
    navOverride?.id ?? selectedScope?.churchId ?? currentUser?.currentChurch?.id
  const churchName: string | undefined =
    navOverride?.name ??
    selectedScope?.churchName ??
    currentUser?.currentChurch?.name
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
  const isCongregationLevel =
    churchType === 'Bacenta' || churchType === 'Stream'
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

  const showBankingSlips =
    !!churchType &&
    ['Stream', 'Council', 'Governorship', 'Bacenta'].includes(churchType) &&
    !isManualBanking
  const showSelfBanking =
    !!churchType &&
    ['Stream', 'Council', 'Governorship', 'Bacenta'].includes(churchType) &&
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
    if (churchId && churchType)
      clickCard({ id: churchId, name: churchName, __typename: churchType })
    if (churchType === 'Bacenta') {
      setRecordDialogOpen(true)
      return
    }
    navigate(RECORD_SERVICE_PATHS[churchType])
  }

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-4xl px-4 py-5 lg:px-6 lg:py-8">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {churchName ?? ''}{' '}
            <span className="text-churches">Services</span>
          </h1>
          {churchType && (
            <p className="text-sm text-muted-foreground">
              {formatChurchLevel(churchType)}
            </p>
          )}
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
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
                title={
                  isCongregationLevel ? 'Record Service' : 'Record Joint Service'
                }
                description={
                  isCongregationLevel
                    ? `Fill this week's ${formatChurchLevel(churchType)} service`
                    : `Optional — fill if a joint ${formatChurchLevel(
                        churchType
                      )} service was held this week`
                }
                onClick={handleRecordService}
              />
            ))}

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

          {/* Right column — intentional negative space on desktop */}
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </main>

      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record this week&apos;s service</DialogTitle>
            <DialogDescription>
              Did the service take place this week?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setRecordDialogOpen(false)
                navigate(RECORD_SERVICE_PATHS.Bacenta)
              }}
              className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent active:scale-[0.99] min-h-[64px]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-members/10 text-members">
                <PencilLine className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Record Service
                </p>
                <p className="text-xs text-muted-foreground">
                  We met this week — fill the service form
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setRecordDialogOpen(false)
                navigate(BACENTA_NO_SERVICE_PATH)
              }}
              className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent active:scale-[0.99] min-h-[64px]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  I Cancelled My Service
                </p>
                <p className="text-xs text-muted-foreground">
                  No service this week — give a reason
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
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
