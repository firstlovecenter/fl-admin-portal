import { useQuery } from '@apollo/client'
import { useContext, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Container, Form, Modal } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { GET_CHECKIN_DASHBOARD } from './checkinsQueries'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import PullToRefresh from 'react-simple-pull-to-refresh'

const CheckedInMembersList = () => {
  const { eventId } = useParams()
  const { church } = useContext(ChurchContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const { data, loading, error, refetch } = useQuery(GET_CHECKIN_DASHBOARD, {
    pollInterval: SHORT_POLL_INTERVAL,
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const dashboard = data?.GetCheckInDashboard
  const event = dashboard?.event
  const checkedIn = useMemo(() => dashboard?.checkedIn ?? [], [dashboard])

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return checkedIn

    const term = searchTerm.toLowerCase()
    return checkedIn.filter(
      (member: any) =>
        member.firstName?.toLowerCase().includes(term) ||
        member.lastName?.toLowerCase().includes(term) ||
        member.roleLabel?.toLowerCase().includes(term) ||
        member.unitName?.toLowerCase().includes(term)
    )
  }, [checkedIn, searchTerm])

  return (
    <>
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <HeadingPrimary loading={loading}>Checked In Members</HeadingPrimary>
          <HeadingSecondary loading={!event?.name}>
            {event?.name}
            {church?.name && ` • ${church.name}`}
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
                <Button
                  key={member.memberId}
                  variant={member.isLate ? 'outline-warning' : 'outline-success'}
                  size="lg"
                  className="fw-semibold py-3 text-start"
                  onClick={() => setSelectedMember(member)}
                >
                  {member.firstName} {member.lastName}
                  {member.isLate && (
                    <span className="ms-2 badge bg-warning text-dark fw-normal" style={{ fontSize: '0.7rem' }}>
                      Late
                    </span>
                  )}
                </Button>
              ))
            ) : (
              <div className="alert alert-info">
                {searchTerm
                  ? 'No members match your search.'
                  : 'No members checked in yet.'}
              </div>
            )}
          </div>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>

    {/* Member detail modal */}
    <Modal show={!!selectedMember} onHide={() => setSelectedMember(null)} centered>
      {selectedMember && (
        <>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedMember.firstName} {selectedMember.lastName}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="badge bg-success fs-6">Checked In</span>
              {selectedMember.isLate && (
                <span className="badge bg-warning text-dark fs-6">Late</span>
              )}
            </div>
            {selectedMember.checkInMethod && (
              <p className="mb-2">
                <span className="text-muted">Method: </span>
                <span className="badge bg-info">{selectedMember.checkInMethod}</span>
              </p>
            )}
            {selectedMember.unitType && selectedMember.unitName && (
              <p className="mb-2">
                <span className="text-muted">{selectedMember.unitType}: </span>
                <strong>{selectedMember.unitName}</strong>
              </p>
            )}
            {selectedMember.roleLabel && (
              <p className="mb-2">
                <span className="text-muted">Role: </span>
                {selectedMember.roleLabel}
              </p>
            )}
            {selectedMember.checkedInAt && (
              <p className="mb-0">
                <span className="text-muted">Time: </span>
                {new Date(selectedMember.checkedInAt).toLocaleString()}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedMember(null)}>
              Close
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
    </>
  )
}

export default CheckedInMembersList
