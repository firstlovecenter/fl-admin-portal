import PlaceholderCustom from 'components/Placeholder'
import React from 'react'
import { Card, Col } from 'react-bootstrap'
import './Defaulters.css'

const PlaceholderDefaulterList = () => {
  return (
    <>
      {[1, 2, 3].map((placeholder, i) => (
        <Col key={i} xs={12} className="mb-3">
          <Card>
            <Card.Header className="fw-bold">
              <PlaceholderCustom loading className="fw-bold" />
            </Card.Header>
            <Card.Body>
              <PlaceholderCustom loading as="div" />
              <PlaceholderCustom loading as="div" />
              <PlaceholderCustom loading as="div" />
              <PlaceholderCustom loading as="div" />
            </Card.Body>
            <Card.Footer>
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
            </Card.Footer>
          </Card>
        </Col>
      ))}
    </>
  )
}

export default PlaceholderDefaulterList
