import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_STREAM_MINISTRIES } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'
import { Stream } from 'global-types'

const DisplayAllStreamMinistries = () => {
  const { clickCard, streamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_STREAM_MINISTRIES, {
    variables: { id: streamId },
  })

  const stream: Stream = data?.streams[0]
  const ministries = stream?.ministries ?? []

  const memberCount = ministries?.reduce(
    (acc, curr) => acc + curr?.memberCount,
    0
  )

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
              <h4 className="text-white">{`${stream?.name} Ministries`}</h4>
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
              <Link to="/ministry/addministry" className="btn btn-danger">
                Add Ministry
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={ministries && ministries[0]}
          memberCount={memberCount}
          numberOfChurchesBelow={ministries?.length}
          churchType="Ministry"
          route="stream"
        />
        <ChurchSearch data={ministries} churchType="Ministry" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllStreamMinistries
