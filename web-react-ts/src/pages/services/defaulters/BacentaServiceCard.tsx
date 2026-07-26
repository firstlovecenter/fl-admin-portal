import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  CalendarDays,
  ChevronRight,
  MessageCircle,
  Phone,
  RotateCcw,
  Users,
} from 'lucide-react'

import RoleView from 'auth/RoleView'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Separator } from 'components/ui/separator'
import { Skeleton } from 'components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { alertMsg, alertSuccess } from 'global-utils'
import { formatChurchLevel } from 'lib/scope-display'
import { permitLeaderAdmin } from 'permission-utils'
import { UNDO_CANCELLED_SERVICE } from '../record-service/RecordServiceMutations'
import {
  BacentaWithDefaulters,
  StreamWithDefaulters,
} from './defaulters-types'

type BacentaServiceCardProps = {
  defaulter: BacentaWithDefaulters | StreamWithDefaulters
  link?: string
  showCancellationControls?: boolean
}

const initials = (name?: string) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '—'

const parentLabel = (
  defaulter: BacentaWithDefaulters | StreamWithDefaulters,
  t: TFunction
): string | null => {
  if (defaulter.__typename === 'Bacenta' && defaulter.governorship?.name) {
    return `${defaulter.governorship.name} ${formatChurchLevel(
      defaulter.governorship.__typename,
      t
    )}`
  }
  if (defaulter.__typename === 'Stream' && defaulter.campus?.name) {
    return `${defaulter.campus.name} ${formatChurchLevel(
      defaulter.campus.__typename,
      t
    )}`
  }
  return null
}

type UndoCancellationButtonProps = {
  defaulter: BacentaWithDefaulters | StreamWithDefaulters
  serviceRecordId: string
}

const UndoCancellationButton = ({
  defaulter,
  serviceRecordId,
}: UndoCancellationButtonProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clickCard } = useContext(ChurchContext) as any
  const [undoCancelledService, { loading: undoLoading }] = useMutation(
    UNDO_CANCELLED_SERVICE,
    {
      refetchQueries: [
        'governorshipFormDefaulters',
        'councilFormDefaulters',
        'streamFormDefaulters',
        'gatheringFormDefaulters',
        'governorshipCancelledServicesThisWeek',
        'councilCancelledServicesThisWeek',
        'streamCancelledServicesThisWeek',
        'gatheringCancelledServicesThisWeek',
      ],
    }
  )
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <RoleView roles={permitLeaderAdmin('Governorship')}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={undoLoading}
        onClick={() => setConfirmOpen(true)}
        className="min-h-11 w-full gap-2 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
      >
        <RotateCcw className="size-4" />
        {t('services.defaulters.undoCancellation')}
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('services.defaulters.undoCancellationTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('services.defaulters.undoCancellationBody', {
                name: defaulter.name,
                type: formatChurchLevel(defaulter.__typename, t),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('shared.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={undoLoading}
              onClick={async (event) => {
                event.preventDefault()
                try {
                  await undoCancelledService({
                    variables: { serviceRecordId },
                  })
                  setConfirmOpen(false)
                  alertSuccess(t('services.defaulters.undoSuccess'))
                  clickCard(defaulter)
                  navigate(
                    `/${defaulter.__typename.toLowerCase()}/displaydetails`
                  )
                } catch {
                  setConfirmOpen(false)
                  alertMsg(t('services.defaulters.undoError'))
                }
              }}
            >
              {t('services.defaulters.yesUndo')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleView>
  )
}

const BacentaServiceCard = ({
  defaulter,
  link,
  showCancellationControls = false,
}: BacentaServiceCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clickCard } = useContext(ChurchContext) as any
  const { currentUser } = useContext(MemberContext)

  // Prefer the per-week record (driven by `weekStart`) so card numbers
  // match the selected week. Fall back to the legacy `services[0]` shape
  // for any caller that hasn't been migrated yet.
  const serviceDetails =
    ('serviceRecordForWeek' in defaulter && defaulter.serviceRecordForWeek) ||
    ('services' in defaulter && defaulter.services?.length
      ? defaulter.services[0]
      : undefined)
  const cancellationReason = serviceDetails?.noServiceReason
  const showUndo = Boolean(
    showCancellationControls && cancellationReason && serviceDetails?.id
  )

  const leaderName =
    defaulter?.leader?.fullName ?? t('services.defaulters.noLeader')
  const phone = defaulter?.leader?.phoneNumber
  const whatsapp = defaulter?.leader?.whatsappNumber
  const parent = parentLabel(defaulter, t)
  const meetingDay = defaulter?.meetingDay?.day
  // `serviceDate.date` is a YYYY-MM-DD string from the TimeGraph.date field.
  // Anchored to UTC noon to avoid the `new Date('YYYY-MM-DD')` UTC-midnight
  // back-shift that would render Apr 22 as "Apr 21" for negative-offset
  // browsers.
  const serviceDateRaw =
    serviceDetails && 'serviceDate' in serviceDetails
      ? (serviceDetails as { serviceDate?: { date?: string } | null })
          .serviceDate?.date
      : undefined
  const serviceDateLabel = serviceDateRaw
    ? new Date(`${serviceDateRaw}T12:00:00Z`).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null

  const openDetails = () => {
    clickCard(defaulter)
    if (serviceDetails) clickCard(serviceDetails)
    navigate(link ?? `/${defaulter.__typename.toLowerCase()}/displaydetails`)
  }

  const typeLabel = formatChurchLevel(defaulter.__typename, t)

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={openDetails}
        aria-label={t('services.defaulters.viewDetailsAria', {
          name: defaulter.name,
          type: typeLabel,
        })}
        className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 active:bg-muted focus-visible:bg-muted/50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">
            {defaulter.name} {typeLabel}
          </p>
          {parent && (
            <p className="truncate text-xs text-muted-foreground">{parent}</p>
          )}
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Separator />

      <CardContent className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0">
            {defaulter?.leader?.pictureUrl && (
              <AvatarImage
                src={defaulter.leader.pictureUrl}
                alt={defaulter.leader.fullName ?? ''}
              />
            )}
            <AvatarFallback className="bg-muted text-xs font-medium">
              {initials(defaulter?.leader?.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {leaderName}
            </p>
            {meetingDay && (
              <p className="text-xs text-muted-foreground">
                {t('services.defaulters.meetingDay', { day: meetingDay })}
              </p>
            )}
          </div>
        </div>

        {(serviceDateLabel ||
          serviceDetails?.attendance != null ||
          serviceDetails?.income != null) && (
          <div className="flex flex-wrap gap-2">
            {serviceDateLabel && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                <CalendarDays className="size-3.5 text-muted-foreground" />
                <span className="tabular-nums">{serviceDateLabel}</span>
              </div>
            )}
            {serviceDetails?.attendance != null && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-members/10 px-2.5 py-1 text-xs font-medium text-members">
                <Users className="size-3.5" />
                <span className="tabular-nums">
                  {serviceDetails.attendance}
                </span>
                <span className="text-members/80">
                  {t('services.defaulters.attendance')}
                </span>
              </div>
            )}
            {serviceDetails?.income != null && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-banking/10 px-2.5 py-1 text-xs font-medium text-banking tabular-nums">
                {currentUser?.currency ? `${currentUser.currency} ` : ''}
                {Number(serviceDetails.income).toLocaleString('en-GH')}
              </div>
            )}
          </div>
        )}

        {showCancellationControls && cancellationReason && (
          <div className="rounded-md border border-defaulters/30 bg-defaulters/10 px-3 py-2 text-xs">
            <p className="font-semibold uppercase tracking-wider text-defaulters">
              {t('services.defaulters.cancelledServiceBanner')}
            </p>
            <p className="mt-1 text-foreground">{cancellationReason}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {phone ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-11 flex-1 gap-2"
            >
              <a href={`tel:${phone}`}>
                <Phone className="size-4" />
                {t('services.defaulters.call')}
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="min-h-11 flex-1 gap-2"
            >
              <Phone className="size-4" />
              {t('services.defaulters.call')}
            </Button>
          )}
          {whatsapp ? (
            <Button
              asChild
              size="sm"
              className="min-h-11 flex-1 gap-2 bg-success text-white hover:bg-success/90"
            >
              <a href={`whatsapp://send?phone=${whatsapp}`}>
                <MessageCircle className="size-4" />
                {t('services.defaulters.whatsapp')}
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="min-h-11 flex-1 gap-2"
            >
              <MessageCircle className="size-4" />
              {t('services.defaulters.whatsapp')}
            </Button>
          )}
        </div>

        {showUndo && serviceDetails?.id && (
          <UndoCancellationButton
            defaulter={defaulter}
            serviceRecordId={serviceDetails.id}
          />
        )}
      </CardContent>
    </Card>
  )
}

export const BacentaServiceCardSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="size-4 rounded" />
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-11 flex-1 rounded-md" />
      <Skeleton className="h-11 flex-1 rounded-md" />
    </div>
  </div>
)

export default BacentaServiceCard
