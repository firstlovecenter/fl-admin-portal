import { useContext } from 'react'
import { useNavigate } from 'react-router'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import './Dashboards.css'
import { MemberContext } from 'contexts/MemberContext'
import { useQuery } from '@apollo/client'
import { SERVANT_CHURCH_LIST } from './DashboardQueries'
import RoleCard from './RoleCard'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
} from '../services/graphs/graphs-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import StatDisplay from 'pages/services/graphs/CompStatDisplay'
import { isAuthorised } from 'global-utils'
import { permitMe } from 'permission-utils'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Col, Row, Table, Container } from 'react-bootstrap'
import Placeholder from '../../components/Placeholder'
import useComponentQuery from './useComponentQuery'
import { getServantRoles } from './dashboard-utils'
import { Role } from 'global-types'

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
      <Container>
        <Placeholder loading={!servant?.fullName} as="p">
          <p className="mb-0">{`Welcome to`}</p>
        </Placeholder>
        <Placeholder loading={!servant?.fullName} as="h5">
          <h5 className="font-weight-bold roboto">{`${servant?.fullName}'s Dashboard`}</h5>
        </Placeholder>

        <div className="card-button-row">
          <Table>
            <tbody>
              <tr /*className="row justify-content-start"*/>
                {roles?.length ? (
                  roles.map((role, i) => {
                    return (
                      <td
                        className="col-auto p-0"
                        key={i}
                        onClick={() => {
                          clickCard(servant)
                          clickCard(role.church[0])
                          navigate(role.link)
                        }}
                      >
                        <RoleCard
                          number={role.number}
                          loading={!roles}
                          authRoles={role.authRoles}
                          role={role.name as Role}
                        />
                      </td>
                    )
                  })
                ) : (
                  <td className="col-auto pl-0">
                    <RoleCard
                      loading={!assessmentChurchData}
                      number={''}
                      authRoles=""
                      role={'leaderFellowship'}
                    />
                  </td>
                )}
              </tr>
            </tbody>
          </Table>
        </div>

        <>
          <Row className="mt-3">
            <Col>
              <StatDisplay
                title="Avg Weekly Attendance"
                loading={!assessmentChurchData}
                statistic={getMonthlyStatAverage(
                  assessmentChurchData,
                  'attendance'
                )}
              />
            </Col>

            <Col>
              <StatDisplay
                title="Avg Weekly Income (GH₵)"
                loading={!assessmentChurchData}
                statistic={getMonthlyStatAverage(
                  assessmentChurchData,
                  'income'
                )}
              />
            </Col>
          </Row>
          <ChurchGraph
            loading={!assessmentChurchData}
            stat1="attendance"
            stat2="income"
            income={true}
            church={assessmentChurch?.__typename.toLowerCase() || ''}
            churchData={assessmentChurchData || []}
            graphType="services"
            secondaryTitle={`${assessmentChurch?.name} ${assessmentChurch?.__typename}`}
          />
        </>
      </Container>
    </ApolloWrapper>
  )
}

export default ServantsDashboard
