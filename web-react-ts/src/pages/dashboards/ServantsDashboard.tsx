import { useContext } from 'react'
import { useNavigate } from 'react-router'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import { MemberContext } from 'contexts/MemberContext'
import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import StatDisplay from 'pages/services/graphs/CompStatDisplay'
import { isAuthorised } from 'global-utils'
import { permitMe } from 'permission-utils'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Role } from 'global-types'
import Placeholder from 'components/Placeholder'
import RoleCard from './RoleCard'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
} from '../services/graphs/graphs-utils'
import useComponentQuery from './useComponentQuery'
import { getServantRoles } from './dashboard-utils'
import { SERVANT_CHURCH_LIST } from './DashboardQueries'
import './Dashboards.css'

const ServantsDashboard = () => {
  const { memberId, currentUser } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  let servantId = currentUser.id
  if (isAuthorised(permitMe('Governorship'), currentUser.roles)) {
    servantId = memberId
  }

  const { data, loading, error } = useQuery(SERVANT_CHURCH_LIST, {
    variables: { id: servantId },
  })
  const servant = data?.members[0]
  const computedRoles = getServantRoles(servant)
  const roles = computedRoles ? computedRoles.userroles : []

  const { assessmentChurch } = useComponentQuery({
    servant: { ...servant, roles: computedRoles.roleTitles },
  })
  const assessmentChurchData = getServiceGraphData(
    assessmentChurch,
    'serviceAggregate'
  )

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-3 px-4">
        <Placeholder loading={!servant?.fullName} as="p">
          <p className="mb-0">Welcome to</p>
        </Placeholder>
        <Placeholder loading={!servant?.fullName} as="h5">
          <h5 className="roboto text-lg font-semibold">{`${servant?.fullName}'s Dashboard`}</h5>
        </Placeholder>

        <div className="card-button-row">
          <div className="-mx-1 flex flex-wrap items-stretch">
            {roles?.length ? (
              roles.map((role, i) => (
                <div
                  className="px-1"
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    clickCard(servant)
                    clickCard(role.church[0])
                    navigate(role.link)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      clickCard(servant)
                      clickCard(role.church[0])
                      navigate(role.link)
                    }
                  }}
                >
                  <RoleCard
                    number={role.number}
                    loading={!roles}
                    authRoles={role.authRoles}
                    role={role.name as Role}
                  />
                </div>
              ))
            ) : (
              <div className="px-1">
                <RoleCard
                  loading={!assessmentChurchData}
                  number=""
                  authRoles=""
                  role="leaderBacenta"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatDisplay
            title="Avg Weekly Attendance"
            loading={!assessmentChurchData}
            statistic={getMonthlyStatAverage(
              assessmentChurchData,
              'attendance'
            )}
          />

          <StatDisplay
            title={`Avg Weekly Income (${currentUser?.currency || 'GHS'})`}
            loading={!assessmentChurchData}
            statistic={getMonthlyStatAverage(assessmentChurchData, 'income')}
          />
        </div>
        <ChurchGraph
          loading={!assessmentChurchData}
          stat1="attendance"
          stat2="income"
          church={assessmentChurch?.__typename.toLowerCase() || ''}
          churchData={assessmentChurchData || []}
          graphType="services"
          secondaryTitle={`${assessmentChurch?.name} ${assessmentChurch?.__typename}`}
        />
      </div>
    </ApolloWrapper>
  )
}

export default ServantsDashboard
