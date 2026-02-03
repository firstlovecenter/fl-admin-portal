'use client'

import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Badge, Card, Col, Row } from 'react-bootstrap'
import './DetailsCard.css'

type DetailsCardPropsType = {
  subtitle?: string
  avatar?: string
  heading?: string
  loading?: boolean
  detail?: string
  onClick?: () => void
  bgNone?: boolean
  img?: string
  creativearts?: boolean
  vacationCount?: string
  vacationIcBacentaCount?: string
  leading?: JSX.Element
  trailing?: JSX.Element
}

const DetailsCard = (props: DetailsCardPropsType) => {
  const { currentUser } = useContext(MemberContext)
  const { leading, trailing, detail, heading, onClick, creativearts } = props
  const loading = !heading || props.loading || !currentUser.id || !detail

  return (
    <Card
      className={`p-2 m-1 pointer ${creativearts && 'creativearts'}`}
      onClick={onClick}
    >
      <Row>
        <Col>
          <PlaceholderCustom loading={loading} as="span" xs={12}>
            <span className="text-secondary">{heading}</span>
          </PlaceholderCustom>
          <PlaceholderCustom loading={loading} as="h2" xs={12}>
            <div className="d-flex justify-content-between align-items-center">
              {!!leading && <>{leading}</>}
              <h3 className="card-detail text-truncate">
                {detail?.replace(currentUser.currency, '')}{' '}
                <small>{detail?.match(currentUser.currency)}</small>
              </h3>
              {!!trailing && <>{trailing}</>}
              {heading === 'Reds' && props?.vacationIcBacentaCount !== '0' && (
                <div>
                  <Badge bg="danger" className="badge-vacation mt-auto">
                    <span className="font-danger">{`+ `}</span>
                    {`${props?.vacationIcBacentaCount} on Vacation`}
                  </Badge>
                </div>
              )}
              {parseFloat(props?.vacationCount?.toString() || '0') !== 0.0 && (
                <div>
                  <Badge bg="danger" className="badge-vacation mt-auto">
                    <span className="font-danger">{`+ `}</span>
                    {`${props?.vacationCount} on Vacation`}
                  </Badge>
                </div>
              )}
            </div>
          </PlaceholderCustom>
        </Col>
      </Row>
    </Card>
  )
}

export default DetailsCard
