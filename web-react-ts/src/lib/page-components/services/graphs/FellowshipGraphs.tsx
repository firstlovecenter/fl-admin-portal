import { useContext } from 'react'

import { ChurchContext } from '@/contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { getServiceGraphData, getMonthlyStatAverage } from './graphs-utils'
import ChurchGraph from '@/components/ChurchGraph/ChurchGraph'
import { FELLOWSHIP_GRAPHS } from './GraphsQueries'
import MembershipCard from './CompMembershipCard'
import StatDisplay from './CompStatDisplay'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { MemberContext } from 'contexts/MemberContext'
import { Container } from 'react-bootstrap'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'

export const FellowshipReport = () => {
  const { fellowshipId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(FELLOWSHIP_GRAPHS, {
    variables: { fellowshipId },
  })

  const serviceData = getServiceGraphData(data?.fellowships[0], 'services')

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container>
        <LeaderAvatar
          leader={data?.fellowships[0].leader}
          leaderTitle="Fellowship Leader"
        />

        <div className="row">
          <div className="col">
            <MembershipCard
              link="/fellowship/members"
              title="Membership"
              count={data?.fellowships[0].memberCount}
            />
          </div>
        </div>
        <div className="row mt-3">
          <div className="col">
            <StatDisplay
              title="Avg Weekly Attendance"
              statistic={getMonthlyStatAverage(serviceData, 'attendance')}
            />
          </div>

          {!currentUser.noIncomeTracking && (
            <div className="col">
              <StatDisplay
                title="Avg Weekly Income"
                statistic={getMonthlyStatAverage(serviceData, 'income')}
              />
            </div>
          )}
        </div>

        {!currentUser.noIncomeTracking ? (
          <ChurchGraph
            stat1="attendance"
            stat2="income"
            income
            churchData={serviceData || []}
            graphType="services"
            church="fellowship"
          />
        ) : (
          <ChurchGraph
            stat1="attendance"
            stat2={null}
            income={false}
            churchData={serviceData || []}
            graphType="services"
            church="fellowship"
          />
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default FellowshipReport
