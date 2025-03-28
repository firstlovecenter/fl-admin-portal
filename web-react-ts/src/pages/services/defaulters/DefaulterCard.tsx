import { useMutation } from '@apollo/client'
import RoleView from 'auth/RoleView'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { alertMsg } from 'global-utils'
import { permitLeaderAdmin } from 'permission-utils'
import { useContext } from 'react'
import { Card, Button } from 'react-bootstrap'
import {
  ArrowCounterclockwise,
  TelephoneFill,
  Whatsapp,
} from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'
import { UNDO_CANCELLED_SERVICE } from '../record-service/RecordServiceMutations'
import {
  BacentaWithDefaulters,
  HubWithDefaulters,
  StreamWithDefaulters,
} from './defaulters-types'
import './Defaulters.css'
import { MemberContext } from 'contexts/MemberContext'

type DefaulterCardProps = {
  defaulter: BacentaWithDefaulters | StreamWithDefaulters | HubWithDefaulters
  link?: string
}

const DefaulterCard = ({ defaulter, link }: DefaulterCardProps) => {
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const [UndoCancelledService] = useMutation(UNDO_CANCELLED_SERVICE)

  let serviceDetails: any

  if ('services' in defaulter && defaulter.services?.length) {
    serviceDetails = defaulter.services[0]
  } else if ('rehearsals' in defaulter && defaulter.rehearsals?.length) {
    serviceDetails = defaulter.rehearsals[0]
  }

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

          {defaulter?.__typename === 'Bacenta' &&
            defaulter?.governorship?.name && (
              <span className="text-secondary">
                {`${defaulter?.governorship?.name} ${defaulter?.governorship?.__typename}`}
              </span>
            )}

          {defaulter?.__typename === 'Stream' && defaulter?.campus && (
            <>
              <span className="text-secondary">
                {`${defaulter?.campus?.name} ${defaulter?.campus?.__typename}`}
              </span>
            </>
          )}
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
          {serviceDetails?.noServiceReason && (
            <RoleView roles={permitLeaderAdmin('Governorship')}>
              <Button
                className="ms-3"
                variant="warning"
                onClick={() => {
                  const confirmBox = window.confirm(
                    'Do you want to undo the cancellation of this service?'
                  )

                  if (confirmBox === true) {
                    UndoCancelledService({
                      variables: { serviceRecordId: serviceDetails.id },
                    }).then(() => {
                      alertMsg('Leader can now fill the form again. Thank you!')
                      clickCard(defaulter)
                      navigate(
                        `/${defaulter?.__typename.toLowerCase()}/displaydetails`
                      )
                    })
                  }
                }}
              >
                <ArrowCounterclockwise /> Undo
              </Button>
            </RoleView>
          )}
        </Card.Body>
        <Card.Footer className="text-muted">{`Meeting Day: ${defaulter?.meetingDay?.day}`}</Card.Footer>
      </PlaceholderCustom>
    </Card>
  )
}

export default DefaulterCard
