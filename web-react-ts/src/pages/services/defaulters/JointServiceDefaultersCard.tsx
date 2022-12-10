import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Card, Button } from 'react-bootstrap'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'
import { ConstituencyWithDefaulters } from './defaulters-types'
import './Defaulters.css'

type DefaulterCardProps = {
  defaulter: ConstituencyWithDefaulters
  link?: string
}

const JointServiceDefaulterCard = ({ defaulter, link }: DefaulterCardProps) => {
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)

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
            navigate(`/${defaulter?.__typename.toLowerCase()}/displaydetails`)
          }}
          className="fw-bold"
        >
          {`${defaulter?.name} ${defaulter?.__typename}`}
          <br />
          {`${defaulter?.council.name} ${defaulter?.council.__typename}`}
        </Card.Header>
        <Card.Body>
          <Card.Text
            onClick={() => {
              clickCard(defaulter)
              clickCard(serviceDetails)
              navigate(
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
                GHS {serviceDetails?.income}
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
          </Card.Text>
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
