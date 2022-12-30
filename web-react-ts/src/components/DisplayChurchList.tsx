import { ChurchLevel, HigherChurch } from 'global-types'
import { capitalise } from 'global-utils'
import React, { useContext } from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { ChurchContext } from '../contexts/ChurchContext'
import CloudinaryImage from './CloudinaryImage'

const DisplayChurchList = (props: {
  data: HigherChurch[]
  churchType: ChurchLevel
}) => {
  const { data, churchType } = props
  const { clickCard } = useContext(ChurchContext)

  return (
    <Container className="mt-3">
      <Row>
        {data?.map((church, index: number) => {
          return (
            <Col key={index} sm={6} lg={4}>
              <Link to={`/${church.__typename.toLowerCase()}/displaydetails`}>
                <Card
                  className="mb-2"
                  onClick={() => {
                    clickCard(church)
                  }}
                >
                  <Card.Body>
                    <Row>
                      <Col
                        xs={3}
                        className="d-flex justify-content-center align-items-center"
                      >
                        <div className="flex-shrink-0">
                          <CloudinaryImage
                            className="rounded-circle img-search"
                            src={church?.leader?.pictureUrl}
                          />
                        </div>
                      </Col>
                      <Col>
                        <Card.Title className="mt-0 church-title">
                          {church.name}
                        </Card.Title>
                        <Card.Body className="pt-1 text-small card-padding">
                          <Row className="d-block text-title border-bottom border-secondary">
                            {church.leader
                              ? `${church.leader.firstName} ${church.leader.lastName}`
                              : null}
                            <span className="text-white">
                              {church.admin &&
                                `| Admin: ${church.admin.firstName} ${church.admin.lastName}`}
                            </span>
                          </Row>
                          <Row className="text-muted d-block">
                            {church.fellowshipCount
                              ? `${church?.fellowshipCount} Fellowships`
                              : null}{' '}
                            {church.bacentaCount
                              ? `${church?.bacentaCount} Bacentas`
                              : null}{' '}
                            {church.constituencyCount
                              ? `${church?.constituencyCount} Constituencies`
                              : null}{' '}
                            {church.councilCount
                              ? `${church?.councilCount} Councils`
                              : null}{' '}
                            {church.streamCount
                              ? `${church?.streamCount} Streams`
                              : null}{' '}
                            {church.memberCount
                              ? `| ${church?.memberCount} Members`
                              : null}{' '}
                            {church?.target
                              ? `|Target: ${church.target}`
                              : null}
                            {church?.vacationStatus === 'Vacation' ? (
                              <span className="text-danger">{`| ${church?.vacationStatus}`}</span>
                            ) : church.vacationStatus ? (
                              `| ${church?.vacationStatus}`
                            ) : null}{' '}
                            {churchType === 'GatheringService'
                              ? `${capitalise(church?.stream_name)}`
                              : null}
                          </Row>
                        </Card.Body>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          )
        })}
      </Row>
    </Container>
  )
}

export default DisplayChurchList
