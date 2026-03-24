import React, { useContext, useState } from 'react'

import { ChurchContext } from '../../../contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'
import ChurchGraph from '../../../components/ChurchGraph/ChurchGraph'
import { HUB_GRAPHS } from './GraphsQueries'
import MembershipCard from './CompMembershipCard'
import StatDisplay from './CompStatDisplay'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import GraphDropdown from './GraphDropdown'
import { MemberContext } from 'contexts/MemberContext'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import { isIncomeGraph } from 'global-utils'

export const HubGraphs = () => {
  const { hubId } = useContext(ChurchContext)
  const [graphs, setGraphs] = useState<GraphTypes>('rehearsals')
  const { currentUser } = useContext(MemberContext)

  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const { data, loading, error } = useQuery(HUB_GRAPHS, {
    variables: { hubId: hubId },
    onCompleted: (data) => {
      if (!setChurchData) return
      setChurchData(getServiceGraphData(data?.hubs[0], 'rehearsals'))
    },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div>
        <LeaderAvatar leader={data?.hubs[0].leader} leaderTitle="Hub Leader" />

        <div className="row-cols-2">
          <div>
            <MembershipCard
              link="/hub/members"
              title="Membership"
              count={data?.hubs[0].memberCount}
            />
          </div>
          <div>
            <GraphDropdown
              graphs={graphs}
              setGraphs={setGraphs}
              setChurchData={setChurchData}
              data={data?.hubs[0]}
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
            graphType={graphs}
            church="hub"
            income={true}
          />
        ) : (
          <ChurchGraph
            stat1="attendance"
            stat2={null}
            churchData={churchData || []}
            church="hub"
            graphType={graphs}
            income={false}
          />
        )}
      </div>
    </ApolloWrapper>
  )
}

export default HubGraphs
