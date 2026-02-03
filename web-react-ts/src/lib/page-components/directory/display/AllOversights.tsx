import React, { useContext } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { GET_DENOMINATION_OVERSIGHTS } from '@/queries/ListQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
import RoleView from '@/auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllOversights = () => {
  const { clickCard, denominationId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_DENOMINATION_OVERSIGHTS, {
    variables: { id: denominationId },
  })

  const oversights = data?.denominations[0]?.oversights
  const denomination = data?.denominations[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              href="/oversight/displaydetails"
              onClick={() => {
                clickCard(denomination)
              }}
            >
              <h4 className="text-white">{`${denomination?.name} Denomination`}</h4>
            </Link>
            <Link
              href="/member/displaydetails"
              onClick={() => {
                clickCard(denomination?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Oversight Leader: </span>
                {denomination?.leader
                  ? ` ${denomination.leader.fullName}`
                  : null}
              </h6>
            </Link>
            {denomination?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                href="/member/displaydetails"
                onClick={() => {
                  clickCard(denomination?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${denomination?.admin?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Denomination')} directoryLock>
            <Col className="col-auto">
              <Link href="/oversight/addoversight" className="btn btn-danger">
                Add Oversight
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={oversights}
          memberCount={denomination?.memberCount}
          numberOfChurchesBelow={oversights?.length}
          churchType="Oversight"
          route="denomination"
        />
        <ChurchSearch data={oversights} churchType="Oversight" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllOversights
