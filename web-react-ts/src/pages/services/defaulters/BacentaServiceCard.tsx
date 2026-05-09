import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, MessageCircle, Phone, Users } from 'lucide-react'

import { Avatar, AvatarFallback } from 'components/ui/avatar'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Separator } from 'components/ui/separator'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import {
  BacentaWithDefaulters,
  StreamWithDefaulters,
} from './defaulters-types'

type BacentaServiceCardProps = {
  defaulter: BacentaWithDefaulters | StreamWithDefaulters
  link?: string
}

const initials = (name?: string) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '—'

const parentLabel = (
  defaulter: BacentaWithDefaulters | StreamWithDefaulters
): string | null => {
  if (defaulter.__typename === 'Bacenta' && defaulter.governorship?.name) {
    return `${defaulter.governorship.name} ${defaulter.governorship.__typename}`
  }
  if (defaulter.__typename === 'Stream' && defaulter.campus?.name) {
    return `${defaulter.campus.name} ${defaulter.campus.__typename}`
  }
  return null
}

const BacentaServiceCard = ({ defaulter, link }: BacentaServiceCardProps) => {
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clickCard } = useContext(ChurchContext) as any
  const { currentUser } = useContext(MemberContext)

  const serviceDetails =
    'services' in defaulter && defaulter.services?.length
      ? defaulter.services[0]
      : undefined

  const leaderName = defaulter?.leader?.fullName ?? 'No Leader'
  const phone = defaulter?.leader?.phoneNumber
  const whatsapp = defaulter?.leader?.whatsappNumber
  const parent = parentLabel(defaulter)
  const meetingDay = defaulter?.meetingDay?.day

  const openDetails = () => {
    clickCard(defaulter)
    if (serviceDetails) clickCard(serviceDetails)
    navigate(link ?? `/${defaulter.__typename.toLowerCase()}/displaydetails`)
  }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={openDetails}
        aria-label={`View ${defaulter.name} ${defaulter.__typename} details`}
        className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 active:bg-muted focus-visible:bg-muted/50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">
            {defaulter.name} {defaulter.__typename}
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
                Meeting day · {meetingDay}
              </p>
            )}
          </div>
        </div>

        {(serviceDetails?.attendance != null ||
          serviceDetails?.income != null) && (
          <div className="flex flex-wrap gap-2">
            {serviceDetails?.attendance != null && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-members/10 px-2.5 py-1 text-xs font-medium text-members">
                <Users className="size-3.5" />
                <span className="tabular-nums">
                  {serviceDetails.attendance}
                </span>
                <span className="text-members/80">attendance</span>
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
                Call
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
              Call
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
                WhatsApp
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
              WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default BacentaServiceCard
