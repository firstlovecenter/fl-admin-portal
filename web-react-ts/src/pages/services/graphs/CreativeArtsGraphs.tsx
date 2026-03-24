import React, { useContext, useState } from 'react'

import { ChurchContext } from '../../../contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'
import ChurchGraph from '../../../components/ChurchGraph/ChurchGraph'
import { CREATIVEARTS_GRAPHS } from './GraphsQueries'
import MembershipCard from './CompMembershipCard'
import StatDisplay from './CompStatDisplay'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import GraphDropdown from './GraphDropdown'
import { MemberContext } from 'contexts/MemberContext'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import { isIncomeGraph } from 'global-utils'

export const CreativeArtsGraphs = () => {
  const { creativeArtsId } = useContext(ChurchContext)
  const [graphs, setGraphs] = useState<GraphTypes>('onStageAttendanceAggregate')
  const { currentUser } = useContext(MemberContext)

  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const { data, loading, error } = useQuery(CREATIVEARTS_GRAPHS, {
    variables: { creativeArtsId: creativeArtsId },
    onCompleted: (data) => {
      if (!setChurchData) return
      setChurchData(getServiceGraphData(data?.creativeArts[0], graphs))
    },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div>
        <LeaderAvatar
          leader={data?.creativeArts[0].leader}
          leaderTitle="Creative Arts Leader"
        />

        <div className="row-cols-2">
          <div>
            <MembershipCard
              link="/creativeArts/members"
              title="Membership"
              count={data?.creativeArts[0].memberCount}
            />
          </div>
          <div>
            <GraphDropdown
              graphs={graphs}
              setGraphs={setGraphs}
              setChurchData={setChurchData}
              data={data?.creativeArts[0]}
            />
          </div>
        </div>
        <div className="mt-3">
          <div>
            <StatDisplay
              title="Avg Weekly Attendance"
              statistic={getMonthlyStatAverage(churchData, 'attendance')}
            />
          </div>
          {isIncomeGraph(graphs, currentUser) && (
            <div>
              <StatDisplay
                title="Avg Weekly Income"
                statistic={getMonthlyStatAverage(churchData, 'income')}
              />
            </div>
          )}
        </div>

        {!currentUser.noIncomeTracking ? (
          <ChurchGraph
            stat1="attendance"
            stat2={!isIncomeGraph(graphs, currentUser) ? null : 'income'}
            churchData={churchData || []}
            church="creativeArts"
            graphType={graphs}
            income={true}
          />
        ) : (
          <ChurchGraph
            stat1="attendance"
            stat2={null}
            churchData={churchData || []}
            church="creativeArts"
            graphType={graphs}
            income={false}
          />
        )}
      </div>
    </ApolloWrapper>
  )
}

export default CreativeArtsGraphs
