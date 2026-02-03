import React, { useContext, useState } from 'react'

import { ChurchContext } from '@/contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'
import ChurchGraph from '@/components/ChurchGraph/ChurchGraph'
import { HUBCOUNCIL_GRAPHS } from './GraphsQueries'
import MembershipCard from './CompMembershipCard'
import StatDisplay from './CompStatDisplay'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Col, Container, Row } from 'react-bootstrap'
import GraphDropdown from './GraphDropdown'
import { MemberContext } from 'contexts/MemberContext'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import { isIncomeGraph } from 'global-utils'

export const HubCouncilGraphs = () => {
  const { hubCouncilId } = useContext(ChurchContext)
  const [graphs, setGraphs] = useState<GraphTypes>('rehearsalAggregate')
  const { currentUser } = useContext(MemberContext)

  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const { data, loading, error } = useQuery(HUBCOUNCIL_GRAPHS, {
    variables: { hubCouncilId },
    onCompleted: (data) => {
      if (!setChurchData) return
      setChurchData(getServiceGraphData(data?.hubCouncils[0], graphs))
    },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container>
        <LeaderAvatar
          leader={data?.hubCouncils[0].leader}
          leaderTitle="Hub Leader"
        />

        <Row className="row-cols-2">
          <Col>
            <MembershipCard
              link="/hub/members"
              title="Membership"
              count={data?.hubCouncils[0].memberCount}
            />
          </Col>
          <Col>
            <GraphDropdown
              graphs={graphs}
              setGraphs={setGraphs}
              setChurchData={setChurchData}
              data={data?.hubCouncils[0]}
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <StatDisplay
              title="Avg Weekly Attendance"
              statistic={getMonthlyStatAverage(churchData, 'attendance')}
            />
          </Col>
          {isIncomeGraph(graphs, currentUser) && (
            <Col>
              <StatDisplay
                title="Avg Weekly Income"
                statistic={getMonthlyStatAverage(churchData, 'income')}
              />
            </Col>
          )}
        </Row>

        {!currentUser.noIncomeTracking ? (
          <ChurchGraph
            stat1="attendance"
            stat2={!isIncomeGraph(graphs, currentUser) ? null : 'income'}
            churchData={churchData || []}
            graphType={graphs}
            church="hubCouncil"
            income
          />
        ) : (
          <ChurchGraph
            stat1="attendance"
            stat2={null}
            churchData={churchData || []}
            church="hubCouncil"
            graphType={graphs}
            income={false}
          />
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default HubCouncilGraphs
