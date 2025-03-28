import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_CAMPUS_GOVERNORSHIPS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'
import { ChurchLevel } from 'global-types'

const AllCampusGovernorships = () => {
  const { clickCard, campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_CAMPUS_GOVERNORSHIPS, {
    variables: { id: campusId },
  })

  const governorships = data?.campuses[0].governorships
  const campus = data?.campuses[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <div className="mb-4">
          <Row className="mb-2">
            <Col>
              <Link
                to="/campus/displaydetails"
                onClick={() => {
                  clickCard(campus)
                }}
              >
                <h4 className="text-white">{`${campus?.name}'s Governorships`}</h4>
              </Link>
              <Link
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(campus?.leader)
                }}
              >
                <h6 className="text-white text-small d-block ">
                  <span className="text-muted">Lead Pastor: </span>

                  {campus?.leader ? ` ${campus.leader.fullName}` : null}
                </h6>
              </Link>
              {campus?.admin ? (
                <Link
                  className="pb-4 text-white text-small"
                  to="/member/displaydetails"
                  onClick={() => {
                    clickCard(campus?.admin)
                  }}
                >
                  <span className="text-muted">Admin:</span>{' '}
                  {`${campus?.admin?.fullName}`}
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
        </div>
        <AllChurchesSummary
          church={governorships}
          memberCount={campus?.memberCount}
          numberOfChurchesBelow={governorships?.length}
          churchType="Governorship"
          route="campus"
        />
        <ChurchSearch
          data={governorships}
          churchType={'bishop' as unknown as ChurchLevel}
        />
      </Container>
    </ApolloWrapper>
  )
}

export default AllCampusGovernorships
