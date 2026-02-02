import { useContext } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import DisplayChurchList from 'components/DisplayChurchList'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { GET_MINISTRY_HUBCOUNCILS } from 'queries/ListQueries'
import { HubCouncil, Ministry } from 'global-types'

const DisplayAllHubCouncils = () => {
  const { clickCard, ministryId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_MINISTRY_HUBCOUNCILS, {
    variables: { id: ministryId },
  })

  const ministry: Ministry = data?.ministries[0]
  const hubCouncils: HubCouncil[] = []

  ministry?.councils.map((council) =>
    council?.hubCouncilsFromMinistry?.map((hubCouncil) =>
      hubCouncils.push(hubCouncil)
    )
  )

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              href="/ministry/displaydetails"
              onClick={() => {
                clickCard(ministry)
              }}
            >
              <h4 className="text-white">{`${ministry?.name} HubCouncils`}</h4>
            </Link>
            <Link
              href="/member/displaydetails"
              onClick={() => {
                clickCard(ministry?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Leader: </span>
                {ministry?.leader ? ` ${ministry.leader.fullName}` : null}
              </h6>
            </Link>
            {ministry?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                href="/member/displaydetails"
                onClick={() => {
                  clickCard(ministry?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${ministry?.admin?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Ministry')} directoryLock>
            <Col className="col-auto">
              <Link href="/hubcouncil/addhubcouncil" className="btn btn-danger">
                Add HubCouncil
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={{ ...ministry, lowerChurch: hubCouncils }}
          memberCount={ministry?.memberCount}
          numberOfChurchesBelow={ministry?.councils.reduce(
            (acc: any, council: any) =>
              acc + council.hubCouncilsFromMinistry.length,
            0
          )}
          churchType="HubCouncil"
          route="ministry"
        />

        {ministry?.councils.map((council: any) => {
          return (
            <>
              <Container>
                <p className="mb-0 fw-bold fs-5">
                  {council.name} Council:{' '}
                  {council.hubCouncilsFromMinistry.length} HubCouncils
                </p>
                {council.hubCouncilsFromMinistry.length === 0 && (
                  <NoDataComponent text="This Council has no hubcouncils" />
                )}
              </Container>
              <DisplayChurchList
                data={council.hubCouncilsFromMinistry}
                churchType="Ministry"
              />
            </>
          )
        })}
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllHubCouncils
