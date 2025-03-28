import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_GOVERNORSHIP_HUBS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'
import { Governorship } from 'global-types'

const DisplayAllGovernorshipHubs = () => {
  const { clickCard, governorshipId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_GOVERNORSHIP_HUBS, {
    variables: { id: governorshipId },
  })

  const governorship: Governorship = data?.governorships[0]
  const hubs = governorship?.hubs ?? []

  const memberCount = hubs?.reduce((acc, curr) => acc + curr?.memberCount, 0)

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              to="/governorship/displaydetails"
              onClick={() => {
                clickCard(governorship)
              }}
            >
              <h4 className="text-white">{`${governorship?.name} Hubs`}</h4>
            </Link>
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(governorship?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Leader: </span>
                {governorship?.leader
                  ? ` ${governorship.leader.fullName}`
                  : null}
              </h6>
            </Link>
            {governorship?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(governorship?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${governorship?.admin?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Campus')} directoryLock>
            <Col className="col-auto">
              <Link to="/hub/addhub" className="btn btn-danger">
                Add Hub Governorship
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={hubs && hubs[0]}
          memberCount={memberCount ?? 0}
          numberOfChurchesBelow={hubs?.length ?? 0}
          churchType="Hub"
          route="governorship"
        />
        <ChurchSearch data={hubs} churchType="Hub" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllGovernorshipHubs
