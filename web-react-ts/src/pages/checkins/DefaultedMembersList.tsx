import { useMutation, useQuery } from '@apollo/client'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, Container, Form, Modal, Spinner } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { GET_CHECKIN_DASHBOARD, MANUAL_CHECKIN } from './checkinsQueries'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import PullToRefresh from 'react-simple-pull-to-refresh'
import RoleView from 'auth/RoleView'

const DefaultedMembersList = () => {
  const { eventId } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmMember, setConfirmMember] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [geoError, setGeoError] = useState('')

  const { data, loading, error, refetch } = useQuery(GET_CHECKIN_DASHBOARD, {
    pollInterval: SHORT_POLL_INTERVAL,
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const [manualCheckIn, { loading: checkingIn }] = useMutation(MANUAL_CHECKIN, {
    refetchQueries: [{ query: GET_CHECKIN_DASHBOARD, variables: { eventId } }],
    onCompleted: () => {
      setConfirmMember(null)
      setReason('')
      setGeoError('')
    },
    onError: (err) => setGeoError(err.message),
  })

  const dashboard = data?.GetCheckInDashboard
  const event = dashboard?.event
  const defaulted = useMemo(() => dashboard?.defaulted ?? [], [dashboard])

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return defaulted

    const term = searchTerm.toLowerCase()
    return defaulted.filter(
      (member: any) =>
        member.firstName?.toLowerCase().includes(term) ||
        member.lastName?.toLowerCase().includes(term) ||
        member.roleLabel?.toLowerCase().includes(term) ||
        member.unitName?.toLowerCase().includes(term)
    )
  }, [defaulted, searchTerm])

  const handleConfirmCheckIn = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        manualCheckIn({
          variables: {
            eventId,
            memberId: confirmMember.memberId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            reason: reason.trim() || undefined,
          },
        })
      },
      () => setGeoError('Could not get your location. Please enable GPS and try again.')
    )
  }

  return (
    <>
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <HeadingPrimary loading={loading}>Defaulted Members</HeadingPrimary>
          <HeadingSecondary loading={!event?.name}>
            {event?.name}
          </HeadingSecondary>

          {/* Search Input */}
          <div className="mb-3">
            <Form.Control
              placeholder="Search by name, role, or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control-lg"
            />
          </div>

          {/* Member List */}
          <div className="d-grid gap-2">
            {filteredMembers.length ? (
              filteredMembers.map((member: any) => (
                <Card key={member.memberId} className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{member.fullName}</div>
                      <div className="text-muted small">{member.roleLabel}</div>
                      <div className="text-muted small">
                        {member.unitType}: {member.unitName}
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <span className="badge bg-warning">Pending</span>
                      {member.isLate && (
                        <span className="badge bg-danger">Late</span>
                      )}
                      <RoleView
                        roles={[
                          'adminGovernorship',
                          'adminCouncil',
                          'adminStream',
                          'adminCampus',
                          'adminOversight',
                          'adminDenomination',
                        ]}
                      >
                        <Button
                          size="sm"
                          variant="outline-success"
                          className="mt-1"
                          onClick={() => {
                            setConfirmMember(member)
                            setReason('')
                            setGeoError('')
                          }}
                        >
                          Manually Check In
                        </Button>
                      </RoleView>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="alert alert-success">
                {searchTerm
                  ? 'No members match your search.'
                  : 'All members have checked in!'}
              </div>
            )}
          </div>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>

      {/* Manual Check-In Confirmation Modal */}
      <Modal show={!!confirmMember} onHide={() => setConfirmMember(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Manually Check In</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Checking in <strong>{confirmMember?.fullName}</strong>
            <br />
            <span className="text-muted small">
              {confirmMember?.roleLabel} · {confirmMember?.unitType}: {confirmMember?.unitName}
            </span>
          </p>
          <Form.Group>
            <Form.Label className="small fw-semibold">Reason (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="e.g. Phone not working, arrived late..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Form.Group>
          {geoError && (
            <div className="alert alert-danger mt-3 mb-0 small">{geoError}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmMember(null)} disabled={checkingIn}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleConfirmCheckIn} disabled={checkingIn}>
            {checkingIn ? (
              <><Spinner size="sm" className="me-2" />Checking In...</>
            ) : (
              'Confirm Check In'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default DefaultedMembersList
