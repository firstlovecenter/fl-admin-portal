import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_CAMPUS_CREATIVEARTS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'
import { Campus } from 'global-types'

const DisplayAllCampusCreativeArts = () => {
  const { clickCard, campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_CAMPUS_CREATIVEARTS, {
    variables: { id: campusId },
  })

  const campus: Campus = data?.campuses[0]
  const creativeArts = campus?.creativeArts ?? []

  const memberCount = creativeArts?.reduce(
    (acc, curr) => acc + curr?.memberCount,
    0
  )

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <div className="mb-2">
          <div>
            <Link
              to="/campus/displaydetails"
              onClick={() => {
                clickCard(campus)
              }}
            >
              <h4 className="text-white">{`${campus?.name} Creative Arts`}</h4>
            </Link>
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(campus?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Leader: </span>
                {campus?.leader ? ` ${campus.leader.fullName}` : null}
              </h6>
            </Link>
            {campus?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(campus?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${campus?.admin?.fullName}`}
              </Link>
            ) : null}
          </div>
          <RoleView roles={permitAdmin('Campus')} directoryLock>
            <div className="col-auto">
              <Link
                to="/creativearts/addcreativearts"
                className="btn btn-danger"
              >
                Add Creative Arts
              </Link>
            </div>
          </RoleView>
        </div>

        <AllChurchesSummary
          church={creativeArts && creativeArts[0]}
          memberCount={memberCount ?? 0}
          numberOfChurchesBelow={creativeArts?.length ?? 0}
          churchType="CreativeArts"
          route="campus"
        />
        <ChurchSearch data={creativeArts} churchType="CreativeArts" />
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllCampusCreativeArts
