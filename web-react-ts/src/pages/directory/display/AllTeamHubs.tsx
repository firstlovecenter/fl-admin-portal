import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_TEAM_HUBS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'
import { Team } from 'global-types'

const DisplayAllTeamHubs = () => {
  const { clickCard, teamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_TEAM_HUBS, {
    variables: { id: teamId },
  })

  const team: Team = data?.teams[0]
  const hubs = team?.hubs ?? []

  const memberCount = hubs?.reduce((acc, curr) => acc + curr?.memberCount, 0)

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              to="/team/displaydetails"
              onClick={() => {
                clickCard(team)
              }}
            >
              <h4 className="text-white">{`${team?.name} Hubs`}</h4>
            </Link>
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(team?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Leader: </span>
                {team?.leader ? ` ${team.leader.fullName}` : null}
              </h6>
            </Link>
            {team?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(team?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${team?.admin?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Campus')} directoryLock>
            <Col className="col-auto">
              <Link to="/hub/addhub" className="btn btn-danger">
                Add Hub Team
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={hubs && hubs[0]}
          memberCount={memberCount ?? 0}
          numberOfChurchesBelow={hubs?.length ?? 0}
          churchType="Hub"
          route="team"
        />
        <ChurchSearch data={hubs} churchType="Hub" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllTeamHubs