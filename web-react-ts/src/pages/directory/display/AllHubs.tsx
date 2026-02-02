import { useContext } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { GET_HUBCOUNCIL_HUBS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import NoDataComponent from 'pages/arrivals/CompNoData'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllHubs = () => {
  const { clickCard, hubCouncilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_HUBCOUNCIL_HUBS, {
    variables: { id: hubCouncilId },
  })

  const hubs = data?.hubCouncils[0]?.hubs

  const hubCouncil = data?.hubCouncils[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              href="/hubCouncil/displaydetails"
              onClick={() => {
                clickCard(hubCouncil)
              }}
            >
              <h4 className="text-white">{`${hubCouncil?.name} Hubs`}</h4>
            </Link>
            <Link
              href="/member/displaydetails"
              onClick={() => {
                clickCard(hubCouncil?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Leader: </span>
                {hubCouncil?.leader ? ` ${hubCouncil?.leader.fullName}` : null}
              </h6>
            </Link>
            {hubCouncil?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                href="/member/displaydetails"
                onClick={() => {
                  clickCard(hubCouncil?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${hubCouncil?.admin?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Ministry')} directoryLock>
            <Col className="col-auto">
              <Link href="/hub/addhub" className="btn btn-danger">
                Add Hub
              </Link>
            </Col>
          </RoleView>
        </Row>
        <AllChurchesSummary
          church={hubs}
          memberCount={hubCouncil?.memberCount}
          numberOfChurchesBelow={hubs?.length}
          churchType="Hub"
          route="hubCouncil"
        />

        {hubs?.length === 0 && (
          <NoDataComponent text="This Council has no hubs" />
        )}
        <ChurchSearch data={hubs} churchType="Hub" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllHubs
