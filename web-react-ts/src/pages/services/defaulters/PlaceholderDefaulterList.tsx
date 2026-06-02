import PlaceholderCustom from 'components/Placeholder'
import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from 'components/ui/card'
import './Defaulters.css'

const PlaceholderDefaulterList = () => {
  return (
    <>
      {[1, 2, 3].map((placeholder, i) => (
        <Card key={i} className="mb-3">
          <CardHeader className="font-bold">
            <PlaceholderCustom loading className="font-bold" />
          </CardHeader>
          <CardContent>
            <PlaceholderCustom loading as="div" />
            <PlaceholderCustom loading as="div" />
            <PlaceholderCustom loading as="div" />
            <PlaceholderCustom loading as="div" />
          </CardContent>
          <CardFooter>
            <PlaceholderCustom
              variant="primary"
              loading
              className="btn-call"
              button="true"
            />
            <PlaceholderCustom
              variant="success"
              className="placeholder"
              loading
              button="true"
            />
          </CardFooter>
        </Card>
      ))}
    </>
  )
}

export default PlaceholderDefaulterList
