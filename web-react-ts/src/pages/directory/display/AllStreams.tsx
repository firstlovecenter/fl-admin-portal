import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_CAMPUS_STREAMS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllStreams = () => {
  const { clickCard, campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_CAMPUS_STREAMS, {
    variables: { id: campusId },
  })

  const streams = data?.campuses[0]?.streams
  const campus = data?.campuses[0]

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
              <h4 className="text-white">{`${campus?.name} Streams`}</h4>
            </Link>
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(campus?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Overseer: </span>
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
              <Link to="/stream/addstream" className="btn btn-danger">
                Add Stream
              </Link>
            </div>
          </RoleView>
        </div>

        <AllChurchesSummary
          church={streams}
          memberCount={campus?.memberCount}
          numberOfChurchesBelow={streams?.length}
          churchType="Stream"
          route="campus"
        />
        <ChurchSearch data={streams} churchType="Stream" />
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllStreams
