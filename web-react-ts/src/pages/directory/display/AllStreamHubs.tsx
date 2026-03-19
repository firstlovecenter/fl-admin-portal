import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_STREAM_HUBS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllStreamHubs = () => {
  const { clickCard, streamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_STREAM_HUBS, {
    variables: { id: streamId },
  })

  const hubs = data?.streams[0]?.hubs
  const stream = data?.streams[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              to="/stream/displaydetails"
              onClick={() => {
                clickCard(stream)
              }}
            >
              <h4 className="text-white">{`${stream?.name} Hubs`}</h4>
            </Link>
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(stream?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Leader: </span>
                {stream?.leader ? ` ${stream.leader.fullName}` : null}
              </h6>
            </Link>
            {stream?.admins?.[0] ? (
              <Link
                className="pb-4 text-white text-small"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(stream?.admins?.[0])
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${stream?.admins?.[0]?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Campus')} directoryLock>
            <Col className="col-auto">
              <Link to="/hub/addhub" className="btn btn-danger">
                Add Hub
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={hubs}
          memberCount={stream?.memberCount}
          numberOfChurchesBelow={hubs?.length}
          churchType="Hub"
          route="stream"
        />
        <ChurchSearch data={hubs} churchType="Hub" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllStreamHubs
