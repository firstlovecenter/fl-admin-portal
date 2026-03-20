import { useMutation, useQuery } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Badge,
  Alert,
  Spinner,
} from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import {
  GET_FLAGGED_CHECKINS,
  RESOLVE_FLAGGED_CHECKIN,
} from './checkinsQueries'

interface FlaggedRecord {
  record: {
    id: string
    eventId: string
    memberId: string
    memberName: string
    selfieUrl: string | null
    faceMatchScore: number | null
    faceMatchStatus: string
  }
  attendee: {
    memberId: string
    fullName: string
    unitName: string
    selfieUrl: string | null
  }
  reason: string
}

const CheckInFlaggedReview = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const { data, loading, error, refetch } = useQuery(GET_FLAGGED_CHECKINS, {
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const [resolveFlag, { loading: resolving }] = useMutation(
    RESOLVE_FLAGGED_CHECKIN
  )

  const flagged: FlaggedRecord[] = data?.GetFlaggedCheckIns ?? []

  const handleResolve = async (recordId: string, resolution: string) => {
    try {
      await resolveFlag({
        variables: { recordId, resolution },
      })
      setResolvedIds((prev) => new Set(prev).add(recordId))
      refetch()
    } catch (err) {
      console.error('Failed to resolve flag:', err)
    }
  }

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container className="py-4">
        <HeadingPrimary className="mb-3">
          🚩 Flagged Check-Ins Review
        </HeadingPrimary>

        <Button
          variant="outline-secondary"
          size="sm"
          className="mb-3"
          onClick={() => navigate(`/checkins/event/${eventId}`)}
        >
          ← Back to Dashboard
        </Button>

        {flagged.length === 0 && (
          <Alert variant="success">
            No flagged check-ins for this event. All clear! ✅
          </Alert>
        )}

        <Row className="g-3">
          {flagged.map((item) => {
            const isResolved = resolvedIds.has(item.record.id)
            return (
              <Col md={6} lg={4} key={item.record.id}>
                <Card
                  className={`h-100 ${isResolved ? 'border-success' : 'border-danger'}`}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-0">{item.record.memberName}</h6>
                        <small className="text-muted">
                          {item.attendee.unitName}
                        </small>
                      </div>
                      <Badge
                        bg={
                          isResolved
                            ? 'success'
                            : item.record.faceMatchStatus === 'FLAGGED'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {isResolved
                          ? 'Resolved'
                          : item.record.faceMatchStatus}
                      </Badge>
                    </div>

                    {/* Selfie comparison */}
                    <Row className="g-2 mb-3">
                      <Col xs={6}>
                        <small className="text-muted d-block mb-1">
                          Selfie
                        </small>
                        {item.record.selfieUrl ? (
                          <img
                            src={item.record.selfieUrl}
                            alt="Selfie"
                            className="w-100 rounded"
                            style={{
                              aspectRatio: '1',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            className="bg-light rounded d-flex align-items-center justify-content-center"
                            style={{ aspectRatio: '1' }}
                          >
                            <small className="text-muted">No selfie</small>
                          </div>
                        )}
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted d-block mb-1">
                          Profile
                        </small>
                        {item.attendee.selfieUrl ? (
                          <img
                            src={item.attendee.selfieUrl}
                            alt="Profile"
                            className="w-100 rounded"
                            style={{
                              aspectRatio: '1',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            className="bg-light rounded d-flex align-items-center justify-content-center"
                            style={{ aspectRatio: '1' }}
                          >
                            <small className="text-muted">No profile</small>
                          </div>
                        )}
                      </Col>
                    </Row>

                    {/* Match info */}
                    <div className="mb-3">
                      <small className="text-danger">{item.reason}</small>
                      {item.record.faceMatchScore != null && (
                        <div className="mt-1">
                          <div className="progress" style={{ height: 6 }}>
                            <div
                              className={`progress-bar ${
                                item.record.faceMatchScore > 0.5
                                  ? 'bg-success'
                                  : 'bg-danger'
                              }`}
                              style={{
                                width: `${item.record.faceMatchScore * 100}%`,
                              }}
                            />
                          </div>
                          <small className="text-muted">
                            Confidence:{' '}
                            {(item.record.faceMatchScore * 100).toFixed(1)}%
                          </small>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {!isResolved && (
                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          className="flex-fill"
                          disabled={resolving}
                          onClick={() =>
                            handleResolve(item.record.id, 'VERIFY')
                          }
                        >
                          ✅ Verify
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="flex-fill"
                          disabled={resolving}
                          onClick={() =>
                            handleResolve(item.record.id, 'REJECT')
                          }
                        >
                          ❌ Keep Flagged
                        </Button>
                      </div>
                    )}
                    {isResolved && (
                      <div className="text-center text-success">
                        ✅ Resolved by admin
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Container>
    </ApolloWrapper>
  )
}

export default CheckInFlaggedReview
