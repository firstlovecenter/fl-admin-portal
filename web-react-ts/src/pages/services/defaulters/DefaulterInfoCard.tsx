import PlaceholderCustom from 'components/Placeholder'
import React from 'react'
import { useNavigate } from 'react-router'
import './Defaulters.css'
import { Card, CardContent, CardHeader } from 'components/ui/card'

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
      <CardHeader>
        <div className="text-nowrap text-truncate">{defaulter.title}</div>
      </CardHeader>
      <PlaceholderCustom
        loading={defaulter.data === undefined || defaulter.data === null}
        className={`fw-bold large-number pb-3 ${defaulter.color}`}
      >
        <CardContent className={`fw-bold large-number ${defaulter.color}`}>
          {defaulter.data}
        </CardContent>
      </PlaceholderCustom>
    </Card>
  )
}

export default DefaulterInfoCard
