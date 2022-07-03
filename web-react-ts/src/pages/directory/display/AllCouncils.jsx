import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_STREAM_COUNCILS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import BaseComponent from 'components/base-component/BaseComponent'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllCouncils = () => {
  const { clickCard, streamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_STREAM_COUNCILS, {
    variables: { id: streamId },
  })

  const councils = data?.streams[0].councils
  const stream = data?.streams[0]

  return (
    <BaseComponent data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              to="/stream/displaydetails"
              onClick={() => {
                clickCard(stream)
              }}
            >
              <h2 className="text-white">{`${stream?.name} Councils`}</h2>
            </Link>
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(stream?.leader)
              }}
            >
              <h6 className="text-white d-block text-small">
                <span className="text-muted">Overseer:</span>

                {stream?.leader ? ` ${stream.leader.fullName}` : null}
              </h6>
            </Link>
            {stream?.admin ? (
              <Link
                className="pb-1 text-white d-block text-small"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(stream?.admin)
                }}
              >
                <span className="text-muted">Admin:</span>
                {` ${stream?.admin?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Stream')}>
            <Col className="col-auto">
              <Link to="/council/addcouncil" className="btn btn-danger">
                Add Council
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={councils}
          memberCount={stream?.memberCount}
          numberOfChurchesBelow={councils?.length}
          churchType="Council"
          route="stream"
        />

        <ChurchSearch data={councils} churchType="Council" />
      </Container>
    </BaseComponent>
  )
}

export default DisplayAllCouncils
