import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_COUNCIL_GOVERNORSHIPS } from 'queries/ListQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import RoleView from 'auth/RoleView'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllGovernorships = () => {
  const { clickCard, councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_COUNCIL_GOVERNORSHIPS, {
    variables: { id: councilId },
  })

  const governorships = data?.councils[0].governorships
  const council = data?.councils[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              to="/council/displaydetails"
              onClick={() => {
                clickCard(governorships?.council)
              }}
            >
              <h2 className="text-white">{`${council?.name} Governorships`}</h2>
            </Link>
            {council?.admins && council.admins.length > 0 ? (
              <Link
                className="pb-1 text-white text-small d-block"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(council?.admins[0])
                }}
              >
                <span className="text-muted">Admin{council.admins.length > 1 ? 's' : ''}: </span>
                {council.admins.length === 1
                  ? `${council.admins[0]?.firstName} ${council.admins[0]?.lastName}`
                  : `${council.admins[0]?.firstName} ${council.admins[0]?.lastName} (+${council.admins.length - 1} more)`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Council')} directoryLock>
            <Col className="col-auto">
              <Link
                to="/governorship/addgovernorship"
                className="btn btn-danger"
              >
                Add Governorship
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={governorships}
          memberCount={council?.memberCount}
          numberOfChurchesBelow={governorships?.length}
          churchType="Governorship"
          route="council"
        />
        <ChurchSearch data={governorships} churchType="Governorship" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllGovernorships
