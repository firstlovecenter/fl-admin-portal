import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_COUNCIL_HUBCOUNCILS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'
import { Council } from 'global-types'

const DisplayAllCouncilHubs = () => {
  const { clickCard, councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_COUNCIL_HUBCOUNCILS, {
    variables: { id: councilId },
  })

  const council: Council = data?.councils[0]
  const hubs = council?.hubCouncils ?? []

  const memberCount = hubs?.reduce((acc, curr) => acc + curr?.memberCount, 0)

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <div className="mb-2">
          <div>
            <Link
              to="/council/displaydetails"
              onClick={() => {
                clickCard(council)
              }}
            >
              <h4 className="text-white">{`${council?.name} Hubs`}</h4>
            </Link>
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(council?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Leader: </span>
                {council?.leader ? ` ${council.leader.fullName}` : null}
              </h6>
            </Link>
            {council?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(council?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${council?.admin?.fullName}`}
              </Link>
            ) : null}
          </div>
          <RoleView roles={permitAdmin('Campus')} directoryLock>
            <div className="col-auto">
              <Link to="/hubcouncil/addhubcouncil" className="btn btn-danger">
                Add Hub Council
              </Link>
            </div>
          </RoleView>
        </div>

        <AllChurchesSummary
          church={hubs && hubs[0]}
          memberCount={memberCount ?? 0}
          numberOfChurchesBelow={hubs?.length ?? 0}
          churchType="HubCouncil"
          route="council"
        />
        <ChurchSearch data={hubs} churchType="HubCouncil" />
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllCouncilHubs
