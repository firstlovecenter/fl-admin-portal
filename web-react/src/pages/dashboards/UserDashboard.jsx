import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import './Dashboards.css'
import { MemberContext } from 'contexts/MemberContext'
import RoleCard from './RoleCard'
import { getMonthlyStatAverage } from '../services/reports/report-utils'
import StatDisplay from 'pages/services/reports/CompStatDisplay'
import Container from 'react-bootstrap/Container'
import { Col, Row } from 'react-bootstrap'
import Placeholder from '../../components/Placeholder'

const UserDashboard = () => {
  const { currentUser, userJobs, setMemberId } = useContext(MemberContext)
  const navigate = useNavigate()

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
          <table>
            <tbody>
              <tr>
                {userJobs?.assessmentData ? (
                  userJobs?.jobs.map((role, i) => (
                    <td
                      className="col-auto pl-0"
                      key={i}
                      onClick={() => {
                        setMemberId(currentUser.id)
                        role.clickCard()
                        navigate(role.link)
                      }}
                    >
                      <RoleCard number={role.number} role={role.name} />
                    </td>
                  ))
                ) : (
                  <td className="col-auto pl-0">
                    <RoleCard loading={!userJobs?.assessmentData} />
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
        <>
          <Row className="mt-3">
            <Col>
              <StatDisplay
                title="Avg Attendance"
                loading={!userJobs?.assessmentData}
                statistic={getMonthlyStatAverage(
                  userJobs?.assessmentData,
                  'attendance'
                )}
              />
            </Col>

            <Col>
              <StatDisplay
                title="Avg Income (in GH₵)"
                loading={!userJobs?.assessmentData}
                statistic={getMonthlyStatAverage(
                  userJobs?.assessmentData,
                  'income'
                )}
              />
            </Col>
          </Row>
          <ChurchGraph
            loading={!userJobs?.assessmentData}
            stat1="attendance"
            stat2="income"
            church={userJobs?.assessmentChurch?.__typename.toLowerCase()}
            churchData={userJobs?.assessmentData}
            secondaryTitle={`${userJobs?.assessmentChurch?.name} ${userJobs?.assessmentChurch?.__typename}`}
          />
        </>
      </Container>
    </>
  )
}

export default UserDashboard
