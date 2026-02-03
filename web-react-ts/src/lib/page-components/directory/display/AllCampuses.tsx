import React, { useContext } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { GET_OVERSIGHT_CAMPUSES } from '@/queries/ListQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
import RoleView from '@/auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllCampuses = () => {
  const { clickCard, oversightId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_OVERSIGHT_CAMPUSES, {
    variables: { id: oversightId },
  })

  const campuses = data?.oversights[0]?.campuses
  const oversight = data?.oversights[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              href="/oversight/displaydetails"
              onClick={() => {
                clickCard(oversight)
              }}
            >
              <h4 className="text-white">{`${oversight?.name} Oversight`}</h4>
            </Link>
            <Link
              href="/member/displaydetails"
              onClick={() => {
                clickCard(oversight?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Oversight Leader: </span>
                {oversight?.leader ? ` ${oversight.leader.fullName}` : null}
              </h6>
            </Link>
            {oversight?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                href="/member/displaydetails"
                onClick={() => {
                  clickCard(oversight?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${oversight?.admin?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Oversight')} directoryLock>
            <Col className="col-auto">
              <Link href="/campus/addcampus" className="btn btn-danger">
                Add Campus
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={campuses}
          memberCount={oversight?.memberCount}
          numberOfChurchesBelow={campuses?.length}
          churchType="Campus"
          route="oversight"
        />
        <ChurchSearch data={campuses} churchType="Campus" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllCampuses
