import React, { useContext, useState } from 'react'

import { ChurchContext } from '../../../contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'
import ChurchGraph from '../../../components/ChurchGraph/ChurchGraph'
import { BACENTA_GRAPHS } from './GraphsQueries'
import MembershipCard from './CompMembershipCard'
import StatDisplay from './CompStatDisplay'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Col, Container, Row } from 'react-bootstrap'
import GraphDropdown from './GraphDropdown'
import { MemberContext } from 'contexts/MemberContext'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import { isIncomeGraph } from 'global-utils'

export const BacentaGraphs = () => {
  const { bacentaId } = useContext(ChurchContext)
  const [graphs, setGraphs] = useState<GraphTypes>('bussing')
  const { currentUser } = useContext(MemberContext)

  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const { data, loading, error } = useQuery(BACENTA_GRAPHS, {
    variables: { id: bacentaId },
    onCompleted: (data) => {
      if (!setChurchData) return
      setChurchData(getServiceGraphData(data?.bacentas[0], graphs))
    },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container>
        <LeaderAvatar
          leader={data?.bacentas[0].leader}
          leaderTitle="Bacenta Leader"
        />

        <Row className="row-cols-2">
          <Col>
            <MembershipCard
              link="/bacenta/members"
              title="Membership"
              count={data?.bacentas[0].memberCount}
            />
          </Col>
          <Col>
            <GraphDropdown
              graphs={graphs}
              setGraphs={setGraphs}
              setChurchData={setChurchData}
              data={data?.bacentas[0]}
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <StatDisplay
              title={`Avg Weekly ${
                graphs === 'bussing' ? 'Bussing' : 'Attendance'
              }`}
              statistic={getMonthlyStatAverage(churchData, 'attendance')}
            />
          </Col>
          <Col>
            {isIncomeGraph(graphs, currentUser) && (
              <StatDisplay
                title="Avg Weekly Income"
                statistic={getMonthlyStatAverage(churchData, 'income')}
              />
            )}
          </Col>
        </Row>

        {!currentUser.noIncomeTracking ? (
          <ChurchGraph
            stat1="attendance"
            stat2={!isIncomeGraph(graphs, currentUser) ? null : 'income'}
            churchData={churchData || []}
            church="bacenta"
            graphType={graphs}
            income={true}
          />
        ) : (
          <ChurchGraph
            stat1="attendance"
            stat2={null}
            churchData={churchData || []}
            church="bacenta"
            graphType={graphs}
            income={false}
          />
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default BacentaGraphs
