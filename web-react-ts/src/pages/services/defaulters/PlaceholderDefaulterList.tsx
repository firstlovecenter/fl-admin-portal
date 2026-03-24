import PlaceholderCustom from 'components/Placeholder'
import React from 'react'
import './Defaulters.css'
import { Card, CardContent, CardHeader, CardFooter } from 'components/ui/card'

const PlaceholderDefaulterList = () => {
  return (
    <>
      {[1, 2, 3].map((placeholder, i) => (
        <div key={i} xs={12} className="mb-3">
          <Card>
            <CardHeader className="fw-bold">
              <PlaceholderCustom
                loading={true}
                className="fw-bold"
              ></PlaceholderCustom>
            </CardHeader>
            <CardContent>
              <PlaceholderCustom loading={true} as="div" />
              <PlaceholderCustom loading={true} as="div" />
              <PlaceholderCustom loading={true} as="div" />
              <PlaceholderCustom loading={true} as="div" />
            </CardContent>
            <CardFooter>
              <PlaceholderCustom
                variant="default"
                loading={true}
                className="btn-call"
                button="true"
              />
              <PlaceholderCustom
                variant="success"
                className="placeholder"
                loading={true}
                button="true"
              />
            </CardFooter>
          </Card>
        </div>
      ))}
    </>
  )
}

export default PlaceholderDefaulterList
