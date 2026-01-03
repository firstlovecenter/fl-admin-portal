import { ChurchContext } from 'contexts/ChurchContext'
import { EquipmentRecord } from 'global-types'
import React, { useContext } from 'react'
import { Card, Button } from 'react-bootstrap'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'

type Admin = {
  firstName: string
  lastName: string
  whatsappNumber: string
  phoneNumber: string
}

export type EquipmentDefaulters = {
  governorshipCount: number
  governorshipEquipmentFilledCount: number
  governorshipEquipmentNotFilledCount: number
  fellowshipCount: number
  fellowshipEquipmentFilledCount: number
  fellowshipEquipmentNotFilledCount: number
  id: string
  name: string
  admin: Admin
  equipmentRecord: EquipmentRecord
  __typename: string
}

type DefaulterDetailsCardProps = {
  church: EquipmentDefaulters
  route: string
}

function DefaulterDetailsCard(props: DefaulterDetailsCardProps) {
  const church = props?.church
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  return (
    <Card className="mt-2">
      <Card.Header className="fw-bold">{`${church?.name} ${church?.__typename}`}</Card.Header>
      <Card.Body
        onClick={() => {
          clickCard(church)
          props.route === 'governorship/fellowship'
            ? navigate('/campaigns/governorship/equipment/defaulters')
            : navigate(`/campaigns/${props.route}/equipment/defaulters`)
        }}
      >
        <div className="fw-bold">
          Fellowship Count: {church?.fellowshipCount}
        </div>
        {props.route === 'governorship/fellowship' ? null : (
          <div className="fw-bold">
            Governorship Count: {church?.governorshipCount}
          </div>
        )}

        <div
          className={
            church?.fellowshipEquipmentFilledCount !== 0 &&
            church?.fellowshipCount === church?.fellowshipEquipmentFilledCount
              ? 'good'
              : church?.fellowshipEquipmentFilledCount > 0
              ? 'text-warning'
              : 'bad'
          }
        >
          Fellowship Filled Count: {church?.fellowshipEquipmentFilledCount}
        </div>
        {props.route === 'governorship/fellowship' ? (
          <div
            className={church.equipmentRecord.pulpits === null ? 'bad' : 'good'}
          >
            Governorship Filled:{' '}
            {church.equipmentRecord.pulpits === null ? 'No' : 'Yes'}
          </div>
        ) : (
          <div
            className={
              church?.governorshipEquipmentFilledCount !== 0 &&
              church?.governorshipCount ===
                church?.governorshipEquipmentFilledCount
                ? 'good'
                : church?.governorshipEquipmentFilledCount > 0
                ? 'text-warning'
                : 'bad'
            }
          >
            Governorship Filled Count:{' '}
            {church?.governorshipEquipmentFilledCount}
          </div>
        )}
        <div
          className={
            church?.fellowshipEquipmentNotFilledCount === 0 ? 'good' : 'bad'
          }
        >
          Fellowship Not Filled Count:{' '}
          {church?.fellowshipEquipmentNotFilledCount}
        </div>
        {props.route === 'governorship/fellowship' ? null : (
          <div
            className={
              church?.governorshipEquipmentNotFilledCount === 0 ? 'good' : 'bad'
            }
          >
            Governorship Not Filled Count:{' '}
            {church?.governorshipEquipmentNotFilledCount}
          </div>
        )}
      </Card.Body>
      {church?.admin?.firstName === undefined &&
      church?.admin?.firstName === undefined ? null : (
        <Card.Footer>
          <div className="mb-2">
            Contact Admin:{' '}
            {`${church?.admin?.firstName} ${church?.admin?.lastName}`}{' '}
          </div>
          <a href={`tel:${church?.admin?.phoneNumber}`}>
            <Button variant="primary">
              <TelephoneFill /> Call
            </Button>
          </a>
          <a
            href={`https://wa.me/${church?.admin?.whatsappNumber}`}
            className="ms-3"
          >
            <Button variant="success">
              <Whatsapp /> WhatsApp
            </Button>
          </a>
        </Card.Footer>
      )}
    </Card>
  )
}

export default DefaulterDetailsCard
