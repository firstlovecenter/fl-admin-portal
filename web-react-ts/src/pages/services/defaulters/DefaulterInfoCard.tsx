import PlaceholderCustom from 'components/Placeholder'
import React from 'react'
import { Card } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import './Defaulters.css'

const DefaulterInfoCard = ({
  defaulter,
}: {
  defaulter: {
    title: string
    link: string
    data?: number | string
    color?: string
  }
}) => {
  const navigate = useNavigate()
  return (
    <Card className="text-center" onClick={() => navigate(defaulter.link)}>
      <Card.Header>{defaulter.title}</Card.Header>
      <PlaceholderCustom
        loading={defaulter.data === undefined || defaulter.data === null}
        className={`fw-bold large-number pb-3 ${defaulter.color}`}
      >
        <Card.Body className={`fw-bold large-number ${defaulter.color}`}>
          {defaulter.data}
        </Card.Body>
      </PlaceholderCustom>
    </Card>
  )
}

export default DefaulterInfoCard
