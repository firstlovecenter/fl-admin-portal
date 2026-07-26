import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { formatChurchLevel } from 'lib/scope-display'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Phone } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader } from 'components/ui/card'
import { MemberContext } from 'contexts/MemberContext'
import {
  GovernorshipWithDefaulters,
  CouncilWithDefaulters,
} from './defaulters-types'
import './Defaulters.css'

type DefaulterCardProps = {
  defaulter: GovernorshipWithDefaulters | CouncilWithDefaulters
  link?: string
}

const JointServiceDefaulterCard = ({ defaulter, link }: DefaulterCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const serviceDetails =
    defaulter?.aggregateServiceRecordForWeek ??
    (defaulter?.services?.length ? defaulter.services[0] : null)

  const typeLabel = formatChurchLevel(defaulter?.__typename, t)

  return (
    <Card>
      <PlaceholderCustom
        loading={!defaulter?.name}
        className="large-number pb-3 font-bold"
      >
        <CardHeader
          onClick={() => {
            clickCard(defaulter)
            navigate(`/${defaulter?.__typename.toLowerCase()}/displaydetails`)
          }}
          className="cursor-pointer font-bold"
        >
          {`${defaulter?.name} ${typeLabel}`}
          <br />
          {defaulter?.council
            ? `${defaulter?.council?.name} ${formatChurchLevel(
                defaulter?.council?.__typename,
                t
              )}`
            : null}

          {defaulter?.stream
            ? `${defaulter?.stream?.name} ${formatChurchLevel(
                defaulter?.stream?.__typename,
                t
              )}`
            : null}
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div
            role="button"
            tabIndex={0}
            className="cursor-pointer text-sm"
            onClick={() => {
              clickCard(defaulter)
              clickCard(serviceDetails)
              navigate(
                link ||
                  `/${defaulter?.__typename.toLowerCase()}/displaydetails`
              )
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                clickCard(defaulter)
                clickCard(serviceDetails)
                navigate(
                  link ||
                    `/${defaulter?.__typename.toLowerCase()}/displaydetails`
                )
              }
            }}
          >
            {defaulter?.leader?.fullName || t('services.defaulters.noLeader')}
            {serviceDetails?.attendance ? (
              <div>
                <span className="text-muted-foreground">
                  {t('services.defaulters.attendanceColon')}
                </span>
                {serviceDetails.attendance}
              </div>
            ) : null}
            {serviceDetails?.income ? (
              <div>
                <span className="text-muted-foreground">
                  {t('services.defaulters.incomeColon')}
                </span>
                {currentUser.currency} {serviceDetails.income}
              </div>
            ) : null}
            {serviceDetails?.noServiceReason ? (
              <div>
                <span className="text-muted-foreground">
                  {t('services.defaulters.reasonCancelled')}
                </span>
                {serviceDetails.noServiceReason}
              </div>
            ) : null}
          </div>
          {(defaulter?.leader?.phoneNumber ||
            defaulter?.leader?.whatsappNumber) && (
            <div className="flex flex-wrap items-center gap-2">
              {defaulter?.leader?.phoneNumber && (
                <Button asChild className="min-h-11">
                  <a href={`tel:${defaulter.leader.phoneNumber}`}>
                    <Phone className="h-4 w-4" />{' '}
                    {t('services.defaulters.call')}
                  </a>
                </Button>
              )}
              {defaulter?.leader?.whatsappNumber && (
                <Button
                  asChild
                  className="min-h-11 bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                >
                  <a
                    href={`https://wa.me/${defaulter.leader.whatsappNumber}`}
                  >
                    <FaWhatsapp className="h-4 w-4" />{' '}
                    {t('services.defaulters.whatsapp')}
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </PlaceholderCustom>
    </Card>
  )
}

export default JointServiceDefaulterCard
