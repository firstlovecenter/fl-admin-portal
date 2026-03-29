import { useQuery } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { GET_CHECKIN_EVENT_HISTORY } from './checkinsQueries'
import PullToRefresh from 'react-simple-pull-to-refresh'

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Event Created',
  UPDATED: 'Event Updated',
  PAUSED: 'Event Paused',
  RESUMED: 'Event Resumed',
  ENDED: 'Event Ended',
  MEMBER_CHECKED_IN: 'Member Checked In',
  MANUAL_CHECKIN: 'Manual Check-In',
  MEMBER_CHECKED_OUT: 'Member Checked Out',
  FACE_REVIEW: 'Face Match Reviewed',
}

const ACTION_COLOURS: Record<string, string> = {
  CREATED: '#28a745',
  UPDATED: '#17a2b8',
  PAUSED: '#ffc107',
  RESUMED: '#28a745',
  ENDED: '#6c757d',
  MEMBER_CHECKED_IN: '#28a745',
  MANUAL_CHECKIN: '#007bff',
  MEMBER_CHECKED_OUT: '#fd7e14',
  FACE_REVIEW: '#6f42c1',
}

const CheckInEventAuditLog = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const { data, loading, error, refetch } = useQuery(
    GET_CHECKIN_EVENT_HISTORY,
    {
      variables: { eventId, limit: 200 },
      skip: !eventId,
      fetchPolicy: 'cache-and-network',
    }
  )

  const entries = data?.GetCheckInEventHistory ?? []

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <div
            className="d-flex align-items-center mb-1"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(-1)}
          >
            <span className="me-2 text-muted">&#8592;</span>
            <small className="text-muted">Back</small>
          </div>

          <div className="text-center mb-4">
            <HeadingPrimary>Audit Log</HeadingPrimary>
            <HeadingSecondary>Check-In Event History</HeadingSecondary>
          </div>

          {entries.length === 0 ? (
            <p className="text-center text-muted mt-5">
              No history entries yet.
            </p>
          ) : (
            <ul className="timeline">
              {entries.map((entry: any) => {
                const colour =
                  ACTION_COLOURS[entry.action] ?? '#6c757d'
                const label =
                  ACTION_LABELS[entry.action] ?? entry.action
                return (
                  <li key={entry.id}>
                    <p className="timeline-text">
                      <span
                        className="fw-semibold"
                        style={{ color: colour }}
                      >
                        {label}
                      </span>
                      {' — '}
                      {entry.description}
                      <br />
                      <small className="text-secondary">
                        {new Date(entry.timestamp).toLocaleString(undefined, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {entry.performedByName && (
                          <> &mdash; {entry.performedByName}</>
                        )}
                      </small>
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CheckInEventAuditLog
