import { useMutation } from '@apollo/client'
import { useState } from 'react'
import {
  Button,
  ListGroup,
  ListGroupItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from 'react-bootstrap'
import { MANUAL_CHECKIN } from './checkinsQueries'

interface ManualCheckInModalProps {
  show: boolean
  onHide: () => void
  defaultedAttendees: Array<{
    memberId: string
    firstName: string
    lastName: string
    roleLabel: string
    unitName: string
  }>
  eventId: string
  onMutationComplete?: () => void
}

export const ManualCheckInModal = ({
  show,
  onHide,
  defaultedAttendees,
  eventId,
  onMutationComplete,
}: ManualCheckInModalProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [manualCheckIn, { loading }] = useMutation(MANUAL_CHECKIN, {
    onCompleted: () => {
      setSelectedMemberId(null)
      setReason('')
      setSearchTerm('')
      onMutationComplete?.()
    },
  })

  const filteredAttendees = defaultedAttendees.filter((a) =>
    `${a.firstName} ${a.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleCheckIn = async () => {
    if (!selectedMemberId) return
    await manualCheckIn({
      variables: {
        eventId,
        memberId: selectedMemberId,
        reason: reason || null,
      },
    })
  }

  const selectedAttendee = filteredAttendees.find(
    (a) => a.memberId === selectedMemberId
  )

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <ModalHeader closeButton>
        <ModalTitle>Manual Check-In</ModalTitle>
      </ModalHeader>
      <ModalBody>
        {defaultedAttendees.length === 0 ? (
          <p className="text-muted">No pending check-ins.</p>
        ) : (
          <div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <p className="mb-2">
              <strong>Select an attendee to manually check in:</strong>
              {searchTerm && (
                <span className="text-muted ms-2">
                  ({filteredAttendees.length} of {defaultedAttendees.length})
                </span>
              )}
            </p>

            {filteredAttendees.length === 0 ? (
              <p className="text-muted">No attendees match your search.</p>
            ) : (
              <ListGroup style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredAttendees.map((attendee) => (
                  <ListGroupItem
                    key={attendee.memberId}
                    onClick={() => setSelectedMemberId(attendee.memberId)}
                    style={{ cursor: 'pointer' }}
                    className={
                      selectedMemberId === attendee.memberId
                        ? 'bg-light border-primary'
                        : ''
                    }
                  >
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>
                          {attendee.firstName} {attendee.lastName}
                        </strong>
                        <div className="small text-muted">
                          {attendee.roleLabel} • {attendee.unitName}
                        </div>
                      </div>
                      {selectedMemberId === attendee.memberId && (
                        <div className="text-primary">✓</div>
                      )}
                    </div>
                  </ListGroupItem>
                ))}
              </ListGroup>
            )}

            {selectedAttendee && (
              <div className="mt-3">
                <label htmlFor="reason" className="form-label">
                  Reason (optional):
                </label>
                <input
                  type="text"
                  id="reason"
                  className="form-control"
                  placeholder="e.g., Arrived late, Technical issue"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleCheckIn}
          disabled={
            !selectedMemberId || loading || defaultedAttendees.length === 0
          }
        >
          {loading ? 'Checking In...' : 'Check In'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
