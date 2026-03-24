import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_MINISTRY_HUBCOUNCILS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllMinistryHubs = () => {
  const { clickCard, ministryId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_MINISTRY_HUBCOUNCILS, {
    variables: { id: ministryId },
  })

  const hubCouncils = data?.ministries[0]?.hubCouncils
  const ministry = data?.ministries[0]

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
              <h4 className="text-white">{`${ministry?.name} Hubs`}</h4>
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
          <RoleView roles={permitAdmin('Campus')} directoryLock>
            <div className="col-auto">
              <Link to="/hub/addhub" className="btn btn-danger">
                Add Hub
              </Link>
            </div>
          </RoleView>
        </div>

        <AllChurchesSummary
          church={hubCouncils}
          memberCount={ministry?.memberCount}
          numberOfChurchesBelow={hubCouncils?.length}
          churchType="HubCouncil"
          route="ministry"
        />
        <ChurchSearch data={hubCouncils} churchType="HubCouncil" />
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllMinistryHubs
