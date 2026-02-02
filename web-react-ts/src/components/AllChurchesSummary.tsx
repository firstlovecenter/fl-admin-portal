'use client'

import { Church, ChurchLevel } from 'global-types'
import { plural } from 'global-utils'
import React from 'react'
import { Container, Card, Row, Col } from 'react-bootstrap'
import Link from 'next/link'
import './AllChurchesSummary.css'

type AllChurchesSummaryProps = {
  church?: Church
  churchType: ChurchLevel | 'IC Bacenta'
  numberOfChurchesBelow: number
  route: string
  memberCount: number
}

const AllChurchesSummary = (props: AllChurchesSummaryProps) => {
  const { church, churchType, numberOfChurchesBelow, route } = props

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card className="mb-2 card-border">
            <Card.Body className="summary-padding">
              <Row className="text-muted text-small">{plural(churchType)}</Row>
              <Row className="number">{numberOfChurchesBelow}</Row>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="mb-2 card-border">
            <Link href={`/${route}/members`}>
              <Card.Body className="summary-padding">
                <Row className="text-muted text-small">Members</Row>
                <Row className="number">{props?.memberCount}</Row>
              </Card.Body>
            </Link>
          </Card>
        </Col>
        {churchType === 'Bacenta' || churchType === 'IC Bacenta' ? (
          <Col>
            <Card className="mb-2 card-border">
              <Link href="/hub/displayall">
                <Card.Body className="summary-padding">
                  <Row className="text-muted text-small">Hubs</Row>
                  <Row className="number">{church?.hubs?.length}</Row>
                </Card.Body>
              </Link>
            </Card>
          </Col>
        ) : null}
      </Row>
    </Container>
  )
}

export default AllChurchesSummary
