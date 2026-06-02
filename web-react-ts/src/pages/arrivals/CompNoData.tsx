import React from 'react'
import { Card, CardContent } from 'components/ui/card'

const NoDataComponent = ({ text }: { text: string }) => {
  return (
    <Card className="mt-2 py-3">
      <CardContent className="p-4">{text}</CardContent>
    </Card>
  )
}

export default NoDataComponent
