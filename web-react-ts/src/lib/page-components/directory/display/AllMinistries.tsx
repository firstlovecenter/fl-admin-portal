import React, { useContext } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { GET_FEDERALMINISTRY_MINISTRIES } from '@/queries/ListQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
import RoleView from '@/auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllMinistries = () => {
  const { clickCard, creativeArtsId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_FEDERALMINISTRY_MINISTRIES, {
    variables: { id: creativeArtsId },
  })

  const ministries = data?.creativeArts[0]?.ministries
  const creativeArts = data?.creativeArts[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              href="/ministry/displaydetails"
              onClick={() => {
                clickCard(creativeArts)
              }}
            >
              <h4 className="text-white">{`${creativeArts?.name} Ministries`}</h4>
            </Link>
            <Link
              href="/member/displaydetails"
              onClick={() => {
                clickCard(creativeArts?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Leader: </span>
                {creativeArts?.leader
                  ? ` ${creativeArts.leader.fullName}`
                  : null}
              </h6>
            </Link>
            {creativeArts?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                href="/member/displaydetails"
                onClick={() => {
                  clickCard(creativeArts?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${creativeArts?.admin?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('CreativeArts')} directoryLock>
            <Col className="col-auto">
              <Link href="/ministry/addministry" className="btn btn-danger">
                Add Ministry
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={ministries}
          memberCount={creativeArts?.memberCount}
          numberOfChurchesBelow={ministries?.length}
          churchType="Ministry"
          route="creativearts"
        />
        <ChurchSearch data={ministries} churchType="Ministry" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllMinistries
