import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
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
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  // Defaulter cards show the combined unbanked total (own joint service +
  // sub-church records) via `aggregateServiceRecordForWeek`; banked cards
  // fall back to the latest joint `ServiceRecord`. Both expose attendance /
  // income, which is all this card renders.
  const serviceDetails =
    defaulter?.aggregateServiceRecordForWeek ??
    (defaulter?.services?.length ? defaulter.services[0] : null)

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
          {`${defaulter?.name} ${defaulter?.__typename}`}
          <br />
          {defaulter?.council
            ? `${defaulter?.council?.name} ${defaulter?.council?.__typename}`
            : null}

          {defaulter?.stream
            ? `${defaulter?.stream?.name} ${defaulter?.stream?.__typename}`
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
            {defaulter?.leader?.fullName || 'No Leader'}
            {serviceDetails?.attendance && (
              <div>
                <span className="text-muted-foreground">Attendance: </span>
                {serviceDetails?.attendance}
              </div>
            )}
            {serviceDetails?.income && (
              <div>
                <span className="text-muted-foreground">Income: </span>
                {currentUser.currency} {serviceDetails?.income}
              </div>
            )}
            {serviceDetails?.noServiceReason && (
              <div>
                <span className="text-muted-foreground">
                  Reason for Cancelled Service:{' '}
                </span>
                {serviceDetails?.noServiceReason}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <a href={`tel:${defaulter?.leader?.phoneNumber}`}>
                <Phone className="h-4 w-4" /> Call
              </a>
            </Button>
            <Button
              asChild
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
            >
              <a href={`https://wa.me/${defaulter?.leader?.whatsappNumber}`}>
                <FaWhatsapp className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </PlaceholderCustom>
    </Card>
  )
}

export default JointServiceDefaulterCard
