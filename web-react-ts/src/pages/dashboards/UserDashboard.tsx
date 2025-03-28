import { useContext } from 'react'
import { useNavigate } from 'react-router'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import './Dashboards.css'
import { MemberContext } from 'contexts/MemberContext'
import RoleCard from './RoleCard'
import {
  GraphTypes,
  getMonthlyStatAverage,
  getServiceGraphData,
} from '../services/graphs/graphs-utils'
import StatDisplay from 'pages/services/graphs/CompStatDisplay'
import { Col, Row, Table, Container } from 'react-bootstrap'
import Placeholder from '../../components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import useComponentQuery from './useComponentQuery'
import { Role, UserJobs } from 'global-types'
import useSetUserChurch from 'hooks/useSetUserChurch'

const UserDashboard = () => {
  const { currentUser, userJobs } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const { setUserChurch } = useSetUserChurch()
  const navigate = useNavigate()
  const { assessmentChurch } = useComponentQuery()

  let graphType: GraphTypes = 'serviceAggregate'

  if (assessmentChurch?.__typename === 'Bacenta') {
    graphType = 'services'
  }
  if (assessmentChurch?.__typename === 'Hub') {
    graphType = 'rehearsals'
  }

  if (assessmentChurch && 'aggregateBussingRecords' in assessmentChurch) {
    graphType = 'bussingAggregate'
  }

  if (assessmentChurch && 'aggregateRehearsalRecords' in assessmentChurch) {
    graphType = 'rehearsalAggregate'
  }

  const assessmentData = getServiceGraphData(assessmentChurch, graphType) || []

  return (
    <>
      <Container>
        <Placeholder loading={!currentUser?.fullName} as="p">
          <p className="mb-0">{`Welcome to`}</p>
        </Placeholder>
        <Placeholder loading={!currentUser?.fullName} as="h5">
          <h5 className="font-weight-bold roboto">{`${currentUser?.fullName}'s Dashboard`}</h5>
        </Placeholder>
        <div className="card-button-row">
          <Table>
            <tbody>
              <tr>
                {userJobs ? (
                  userJobs?.map((role: UserJobs, i: number) => (
                    <td
                      className="col-auto p-0"
                      key={i}
                      onClick={() => {
                        clickCard(currentUser)
                        setUserChurch(role.church[0])
                        clickCard(role.church[0])
                        navigate(role.link)
                      }}
                    >
                      <RoleCard
                        number={role.number}
                        authRoles={role.authRoles}
                        role={role.name as Role}
                        loading={!userJobs}
                      />
                    </td>
                  ))
                ) : (
                  <td className="col-auto pl-0">
                    <RoleCard
                      loading={!userJobs}
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
                loading={!assessmentData[0]}
                statistic={getMonthlyStatAverage(assessmentData, 'attendance')}
              />
            </Col>
            <Col>
              <StatDisplay
                title="Avg Weekly Income (GH₵)"
                loading={!assessmentData[0]}
                statistic={getMonthlyStatAverage(assessmentData, 'income')}
              />
            </Col>
          </Row>
          {!currentUser.noIncomeTracking ? (
            <ChurchGraph
              loading={!assessmentChurch}
              stat1="attendance"
              stat2="income"
              income={true}
              graphType={graphType}
              church={assessmentChurch?.__typename.toLowerCase() || ''}
              churchData={assessmentData}
              secondaryTitle={`${assessmentChurch?.name} ${assessmentChurch?.__typename}`}
            />
          ) : (
            <ChurchGraph
              loading={!assessmentChurch}
              stat1="attendance"
              income={false}
              graphType={graphType}
              church={assessmentChurch?.__typename.toLowerCase() || ''}
              churchData={assessmentData}
              secondaryTitle={`${assessmentChurch?.name} ${assessmentChurch?.__typename}`}
              stat2={null}
            />
          )}
        </>
      </Container>
    </>
  )
}

export default UserDashboard
