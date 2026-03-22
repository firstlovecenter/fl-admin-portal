import { useMutation } from '@apollo/client'
import { useState } from 'react'
import {
  Alert,
  Button,
  ListGroup,
  ListGroupItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Spinner,
} from 'react-bootstrap'
import { GeoAlt } from 'react-bootstrap-icons'
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
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const [manualCheckIn, { loading }] = useMutation(MANUAL_CHECKIN, {
    onCompleted: () => {
      setSelectedMemberId(null)
      setReason('')
      setSearchTerm('')
      setGeoError(null)
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
    setGeoError(null)
    setGeoLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoLoading(false)
        await manualCheckIn({
          variables: {
            eventId,
            memberId: selectedMemberId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            reason: reason || null,
          },
        })
      },
      () => {
        setGeoLoading(false)
        setGeoError(
          'Could not get your location. Enable GPS and try again — geofence is required even for manual check-ins.'
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
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
                placeholder="Search by name..."
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
      {geoError && (
        <ModalBody className="pt-0">
          <Alert variant="warning" className="mb-0 d-flex align-items-center gap-2">
            <GeoAlt size={16} className="flex-shrink-0" />
            <span className="small">{geoError}</span>
          </Alert>
        </ModalBody>
      )}
      <ModalFooter>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleCheckIn}
          disabled={
            !selectedMemberId ||
            loading ||
            geoLoading ||
            defaultedAttendees.length === 0
          }
        >
          {geoLoading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Getting location…
            </>
          ) : loading ? (
            'Checking In…'
          ) : (
            'Check In'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
