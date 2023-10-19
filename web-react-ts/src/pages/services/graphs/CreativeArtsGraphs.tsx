import React, { useContext, useState } from 'react'

import { ChurchContext } from '../../../contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { getServiceGraphData, getMonthlyStatAverage } from './graphs-utils'
import ChurchGraph from '../../../components/ChurchGraph/ChurchGraph'
import { CREATIVEARTS_GRAPHS } from './GraphsQueries'
import MembershipCard from './CompMembershipCard'
import StatDisplay from './CompStatDisplay'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Col, Container, Row } from 'react-bootstrap'
import GraphDropdown from './GraphDropdown'
import { MemberContext } from 'contexts/MemberContext'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'

export const CreativeArtsGraphs = () => {
  const { creativeArtsId } = useContext(ChurchContext)
  const [rehearsal, setRehearsal] = useState(true)
  const [ministryMeeting, setMinistryMeeting] = useState(false)
  const { currentUser } = useContext(MemberContext)

  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const { data, loading, error } = useQuery(CREATIVEARTS_GRAPHS, {
    variables: { creativeArtsId: creativeArtsId },
    onCompleted: (data) => {
      if (!setChurchData) return
      setChurchData(getServiceGraphData(data?.creativeArts[0], 'bussing'))
    },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container>
        <LeaderAvatar
          leader={data?.creativeArts[0].leader}
          leaderTitle="Creative Arts Leader"
        />

        <Row className="row-cols-2">
          <Col>
            <MembershipCard
              link="/creativeArts/members"
              title="Membership"
              count={data?.creativeArts[0].memberCount}
            />
          </Col>
          <Col>
            <GraphDropdown
              setRehearsal={setRehearsal}
              setMinistryMeeting={setMinistryMeeting}
              setChurchData={setChurchData}
              data={data?.creativeArts[0]}
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
          {(!currentUser.noIncomeTracking || loading) && (
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
            stat2={ministryMeeting ? null : 'income'}
            churchData={churchData || []}
            church="creativeArts"
            graphType={rehearsal ? 'rehearsal' : 'service'}
            income={true}
          />
        ) : (
          <ChurchGraph
            stat1="attendance"
            stat2={null}
            churchData={churchData || []}
            church="creativeArts"
            graphType={rehearsal ? 'rehearsal' : 'service'}
            income={false}
          />
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default CreativeArtsGraphs
