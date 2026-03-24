import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_OVERSIGHT_CAMPUSES } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
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
      <div>
        <div className="mb-2">
          <div>
            <Link
              to="/oversight/displaydetails"
              onClick={() => {
                clickCard(oversight)
              }}
            >
              <h4 className="text-white">{`${oversight?.name} Oversight`}</h4>
            </Link>
            <Link
              to="/member/displaydetails"
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
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(oversight?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${oversight?.admin?.fullName}`}
              </Link>
            ) : null}
          </div>
          <RoleView roles={permitAdmin('Oversight')} directoryLock>
            <div className="col-auto">
              <Link to="/campus/addcampus" className="btn btn-danger">
                Add Campus
              </Link>
            </div>
          </RoleView>
        </div>

        <AllChurchesSummary
          church={campuses}
          memberCount={oversight?.memberCount}
          numberOfChurchesBelow={campuses?.length}
          churchType="Campus"
          route="oversight"
        />
        <ChurchSearch data={campuses} churchType="Campus" />
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllCampuses
