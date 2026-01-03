import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Col, Row } from 'react-bootstrap'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import '../../../../components/card/DetailsCard.css'

export interface EquipmentDefaulterProps {
  id: string
  name: string
  leader: Leader
}

type Leader = {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  whatsappNumber: string
  __typename: string
}

type DefaultersCardProps = {
  defaulter: EquipmentDefaulterProps
}

const DefaultersCard = (props: DefaultersCardProps) => {
  const { theme } = useContext(MemberContext)
  const { name, leader } = props.defaulter

  return (
    <Col sm={6} lg={4}>
      <div className={`${theme} detail-card bg-card`}>
        <Row className="mx-2">
          <Col xs={9}>
            <div>
              <span className={`text-secondary card-heading ${theme}`}>
                {name}
              </span>
              <div className="mt-2">
                <h6>{`${leader.firstName} ${leader.lastName}`}</h6>
              </div>
            </div>
          </Col>
          <Col className="my-auto d-flex justify-content-end" xs={3}>
            <a href={`tel:${leader?.phoneNumber}`}>
              <TelephoneFill size={24} />
            </a>
            <a
              href={`https://wa.me/${leader?.whatsappNumber}`}
              className="ms-3"
            >
              <Whatsapp size={24} color={'green'} />
            </a>
          </Col>
        </Row>
      </div>
    </Col>
  )
}

export default DefaultersCard
