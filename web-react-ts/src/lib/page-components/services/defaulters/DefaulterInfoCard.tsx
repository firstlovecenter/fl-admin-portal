import PlaceholderCustom from 'components/Placeholder'
import React from 'react'
import { Card } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  return (
    <Card className="text-center" onClick={() => router.push(defaulter.link)}>
      <Card.Header>
        <div className="text-nowrap text-truncate">{defaulter.title}</div>
      </Card.Header>
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
