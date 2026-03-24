import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_GOVERNORSHIP_ICBACENTAS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitArrivals } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import 'components/AllChurchesSummary.css'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllReds = () => {
  const { governorshipId, setGovernorshipId, clickCard } =
    useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_GOVERNORSHIP_ICBACENTAS, {
    variables: { id: governorshipId },
  })

  const governorship = data?.governorships[0]

  return (
    <ApolloWrapper loading={loading} data={data} error={error}>
      <div>
        <div className="mb-2">
          <div>
            <Link
              to={`/governorship/displaydetails`}
              onClick={() => {
                setGovernorshipId(governorshipId)
              }}
            >
              {' '}
              <h2 className="text-white">{`${governorship?.name} Governorship`}</h2>
            </Link>
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(governorship?.leader)
              }}
            >
              <h6 className="text-white d-block text-small">
                <span className="text-muted">CO:</span>
                {governorship?.leader && ` ${governorship?.leader.fullName}`}
              </h6>
            </Link>
            {governorship?.admin ? (
              <Link
                className="pb-4"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(governorship?.admin)
                }}
              >
                {`Admin: ${governorship?.admin?.fullName}`}
              </Link>
            ) : null}
          </div>
          <RoleView roles={permitArrivals('Stream')} directoryLock>
            <div className="col-auto">
              <Link
                to="/bacenta/addbacenta"
                className="btn btn-danger text-nowrap"
              >
                Add Bacenta
              </Link>
            </div>
          </RoleView>
        </div>
        <AllChurchesSummary
          church={governorship}
          memberCount={governorship?.memberCount}
          numberOfChurchesBelow={governorship?.icBacentas?.length}
          churchType="IC Bacenta"
          route="governorship"
        />

        <ChurchSearch data={governorship?.icBacentas} churchType="Bacenta" />
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllReds
