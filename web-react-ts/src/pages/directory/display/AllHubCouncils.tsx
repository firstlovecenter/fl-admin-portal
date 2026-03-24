import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
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
      <div>
        <div className="mb-2">
          <div>
            <Link
              to="/ministry/displaydetails"
              onClick={() => {
                clickCard(ministry)
              }}
            >
              <h4 className="text-white">{`${ministry?.name} HubCouncils`}</h4>
            </Link>
            <Link
              to="/member/displaydetails"
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
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(ministry?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${ministry?.admin?.fullName}`}
              </Link>
            ) : null}
          </div>
          <RoleView roles={permitAdmin('Ministry')} directoryLock>
            <div className="col-auto">
              <Link to="/hubcouncil/addhubcouncil" className="btn btn-danger">
                Add HubCouncil
              </Link>
            </div>
          </RoleView>
        </div>

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
              <div>
                <p className="mb-0 fw-bold fs-5">
                  {council.name} Council:{' '}
                  {council.hubCouncilsFromMinistry.length} HubCouncils
                </p>
                {council.hubCouncilsFromMinistry.length === 0 && (
                  <NoDataComponent text="This Council has no hubcouncils" />
                )}
              </div>
              <DisplayChurchList
                data={council.hubCouncilsFromMinistry}
                churchType="Ministry"
              />
            </>
          )
        })}
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllHubCouncils
