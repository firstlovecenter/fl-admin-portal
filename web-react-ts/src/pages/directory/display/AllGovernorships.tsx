import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_COUNCIL_GOVERNORSHIPS } from 'queries/ListQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import RoleView from 'auth/RoleView'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllGovernorships = () => {
  const { clickCard, councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_COUNCIL_GOVERNORSHIPS, {
    variables: { id: councilId },
  })

  const governorships = data?.councils[0].governorships
  const council = data?.councils[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <div className="mb-2">
          <div>
            <Link
              to="/council/displaydetails"
              onClick={() => {
                clickCard(governorships?.council)
              }}
            >
              <h2 className="text-white">{`${council?.name} Governorships`}</h2>
            </Link>
            {council?.admin ? (
              <Link
                className="pb-1 text-white text-small d-block"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(council?.admin)
                }}
              >
                <span className="text-muted">Admin: </span>
                {`${council?.admin?.firstName} ${council?.admin?.lastName}`}
              </Link>
            ) : null}
          </div>
          <RoleView roles={permitAdmin('Council')} directoryLock>
            <div className="col-auto">
              <Link
                to="/governorship/addgovernorship"
                className="btn btn-danger"
              >
                Add Governorship
              </Link>
            </div>
          </RoleView>
        </div>

        <AllChurchesSummary
          church={governorships}
          memberCount={council?.memberCount}
          numberOfChurchesBelow={governorships?.length}
          churchType="Governorship"
          route="council"
        />
        <ChurchSearch data={governorships} churchType="Governorship" />
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllGovernorships
