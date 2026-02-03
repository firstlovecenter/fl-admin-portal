import React from 'react'
import { Card } from 'react-bootstrap'

const NoDataComponent = ({ text }: { text: string }) => {
  return (
    <Card className="mt-2 py-3">
      <Card.Body>{text}</Card.Body>
    </Card>
  )
}

export default NoDataComponent
