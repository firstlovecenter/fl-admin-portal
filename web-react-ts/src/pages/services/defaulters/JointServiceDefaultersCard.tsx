import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Card, Button } from 'react-bootstrap'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import { useRouter } from 'next/navigation'
import {
  GovernorshipWithDefaulters,
  CouncilWithDefaulters,
} from './defaulters-types'
import './Defaulters.css'
import { MemberContext } from 'contexts/MemberContext'

type DefaulterCardProps = {
  defaulter: GovernorshipWithDefaulters | CouncilWithDefaulters
  link?: string
}

const JointServiceDefaulterCard = ({ defaulter, link }: DefaulterCardProps) => {
  const router = useRouter()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const serviceDetails = defaulter?.services?.length
    ? defaulter?.services[0]
    : null

  return (
    <Card>
      <PlaceholderCustom
        loading={!defaulter?.name}
        className={`fw-bold large-number pb-3`}
      >
        <Card.Header
          onClick={() => {
            clickCard(defaulter)
            router.push(
              `/${defaulter?.__typename.toLowerCase()}/displaydetails`
            )
          }}
          className="fw-bold"
        >
          {`${defaulter?.name} ${defaulter?.__typename}`}
          <br />
          {defaulter?.council
            ? `${defaulter?.council?.name} ${defaulter?.council?.__typename}`
            : null}

          {defaulter?.stream
            ? `${defaulter?.stream?.name} ${defaulter?.stream?.__typename}`
            : null}
        </Card.Header>
        <Card.Body>
          <div
            className="card-text"
            onClick={() => {
              clickCard(defaulter)
              clickCard(serviceDetails)
              router.push(
                link || `/${defaulter?.__typename.toLowerCase()}/displaydetails`
              )
            }}
          >
            {defaulter?.leader?.fullName || 'No Leader'}
            {serviceDetails?.attendance && (
              <div>
                <span className="text-muted">Attendance: </span>
                {serviceDetails?.attendance}
              </div>
            )}
            {serviceDetails?.income && (
              <div>
                <span className="text-muted">Income: </span>
                {currentUser.currency} {serviceDetails?.income}
              </div>
            )}
            {serviceDetails?.noServiceReason && (
              <div>
                <span className="text-muted">
                  Reason for Cancelled Service:{' '}
                </span>
                {serviceDetails?.noServiceReason}
              </div>
            )}
          </div>
          <a href={`tel:${defaulter?.leader?.phoneNumber}`}>
            <Button variant="primary">
              <TelephoneFill /> Call
            </Button>
          </a>
          <a
            href={`https://wa.me/${defaulter?.leader?.whatsappNumber}`}
            className="ms-3"
          >
            <Button variant="success">
              <Whatsapp /> WhatsApp
            </Button>
          </a>
        </Card.Body>
      </PlaceholderCustom>
    </Card>
  )
}

export default JointServiceDefaulterCard
