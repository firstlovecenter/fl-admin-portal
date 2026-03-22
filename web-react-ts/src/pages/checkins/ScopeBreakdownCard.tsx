import { useQuery } from '@apollo/client'
import PlaceholderCustom from 'components/Placeholder'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import { Card, Col, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { GET_CHECKIN_DASHBOARD } from './checkinsQueries'

interface ScopeBreakdownCardProps {
  eventId: string
  scopeId: string
  scopeName: string
  scopeLevel: string
}

const ScopeBreakdownCard = ({
  eventId,
  scopeId,
  scopeName,
  scopeLevel,
}: ScopeBreakdownCardProps) => {
  const navigate = useNavigate()

  const { data, loading } = useQuery(GET_CHECKIN_DASHBOARD, {
    pollInterval: SHORT_POLL_INTERVAL,
    variables: { eventId, filterScopeId: scopeId },
    fetchPolicy: 'cache-and-network',
  })

  const stats = data?.GetCheckInDashboard?.stats

  const statRows = [
    { title: 'Checked In', value: stats?.checkedInCount, color: 'green' },
    { title: 'Defaulted', value: stats?.defaultedCount, color: 'red' },
    { title: 'Checked Out', value: stats?.checkedOutCount, color: 'yellow' },
    { title: 'Total Expected', value: stats?.totalExpected, color: 'white' },
  ]

  const handleClick = () =>
    navigate(`/checkins/event/${eventId}?filterScopeId=${scopeId}`)

  return (
    <Col xs={12} className="mb-3">
      <Card style={{ cursor: 'pointer' }} onClick={handleClick}>
        <Card.Header>
          <div className="fw-bold">{`${scopeName} ${scopeLevel}`}</div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <>
              <PlaceholderCustom loading as="div" />
              <PlaceholderCustom loading as="div" />
              <PlaceholderCustom loading as="div" />
              <PlaceholderCustom loading as="div" />
            </>
          ) : (
            <>
              {statRows.map((row, i) => (
                <div key={i} className={row.color}>
                  {`${row.title} - ${row.value ?? 0}`}
                </div>
              ))}
              {stats && (
                <Row className="mt-2">
                  <Col>
                    <span
                      style={{
                        color:
                          stats.percentage >= 75
                            ? '#28a745'
                            : stats.percentage >= 50
                            ? '#ffc107'
                            : '#dc3545',
                        fontWeight: 'bold',
                      }}
                    >
                      {stats.percentage}% Attendance
                    </span>
                  </Col>
                </Row>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Col>
  )
}

export default ScopeBreakdownCard
