import { useMutation } from '@apollo/client'
import { useState } from 'react'
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from 'react-bootstrap'
import ArrivalsMenuDropdown from 'pages/arrivals/ArrivalsMenuDropdown'
import {
  PAUSE_CHECKIN_EVENT,
  RESUME_CHECKIN_EVENT,
  UPDATE_CHECKIN_EVENT_DURATION,
  RESET_CHECKIN_EVENT_PIN,
  END_CHECKIN_EVENT,
  EDIT_CHECKIN_EVENT,
} from './checkinsQueries'

const allRoles = [
  { value: 'leaderCampus', label: 'Campus Leaders' },
  { value: 'leaderStream', label: 'Stream Leaders' },
  { value: 'leaderCouncil', label: 'Council Leaders' },
  { value: 'leaderGovernorship', label: 'Governorship Leaders' },
  { value: 'leaderBacenta', label: 'Bacenta Leaders' },
]

const checkInMethods = [
  { value: 'QR', label: 'QR Code Scan' },
  { value: 'PIN', label: 'PIN Code Entry' },
  { value: 'FACE_ID', label: 'Face ID Recognition' },
]

interface CheckInEventData {
  id: string
  name: string
  location?: string
  startsAt: string
  endsAt: string
  gracePeriod: number
  attendanceType: 'LEADERS_ONLY' | 'ALL_MEMBERS'
  allowedCheckInRoles: string[]
  allowedCheckInMethods: string[]
  autoCheckoutMinutes: number
}

interface CheckInAdminControlsProps {
  eventId: string
  eventStatus: string
  eventEndsAt: string
  event?: CheckInEventData
  canEdit?: boolean
  onMutationComplete?: () => void
}

export const CheckInAdminControls = ({
  eventId,
  eventStatus,
  eventEndsAt,
  event,
  canEdit = false,
  onMutationComplete,
}: CheckInAdminControlsProps) => {
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newEndTime, setNewEndTime] = useState(eventEndsAt)

  // Edit form state — pre-filled from event data
  const [editName, setEditName] = useState(event?.name ?? '')
  const [editLocation, setEditLocation] = useState(event?.location ?? '')
  const [editStartsAt, setEditStartsAt] = useState(
    event?.startsAt ? event.startsAt.slice(0, 16) : ''
  )
  const [editEndsAt, setEditEndsAt] = useState(
    event?.endsAt ? event.endsAt.slice(0, 16) : ''
  )
  const [editGracePeriod, setEditGracePeriod] = useState(
    event?.gracePeriod ?? 30
  )
  const [editAttendanceType, setEditAttendanceType] = useState<
    'LEADERS_ONLY' | 'ALL_MEMBERS'
  >(event?.attendanceType ?? 'LEADERS_ONLY')
  const [editRoles, setEditRoles] = useState<string[]>(
    event?.allowedCheckInRoles ?? ['leaderBacenta']
  )
  const [editMethods, setEditMethods] = useState<string[]>(
    event?.allowedCheckInMethods ?? ['QR']
  )
  const [editAutoCheckout, setEditAutoCheckout] = useState(
    event?.autoCheckoutMinutes ?? 30
  )

  const [pauseEvent, { loading: pauseLoading }] = useMutation(
    PAUSE_CHECKIN_EVENT,
    { onCompleted: onMutationComplete }
  )

  const [resumeEvent, { loading: resumeLoading }] = useMutation(
    RESUME_CHECKIN_EVENT,
    { onCompleted: onMutationComplete }
  )

  const [updateDuration, { loading: durationLoading }] = useMutation(
    UPDATE_CHECKIN_EVENT_DURATION,
    { onCompleted: onMutationComplete }
  )

  const [resetPin, { loading: pinLoading }] = useMutation(
    RESET_CHECKIN_EVENT_PIN,
    { onCompleted: onMutationComplete }
  )

  const [endEvent, { loading: endLoading }] = useMutation(END_CHECKIN_EVENT, {
    onCompleted: onMutationComplete,
  })

  const [editEvent, { loading: editLoading }] = useMutation(EDIT_CHECKIN_EVENT, {
    onCompleted: () => {
      setShowEditModal(false)
      onMutationComplete?.()
    },
  })

  const handlePause = async () => {
    await pauseEvent({ variables: { eventId } })
  }

  const handleResume = async () => {
    await resumeEvent({ variables: { eventId } })
  }

  const handleExtendDuration = async () => {
    await updateDuration({ variables: { eventId, endsAt: newEndTime } })
    setShowExtendModal(false)
  }

  const handleResetPin = async () => {
    await resetPin({ variables: { eventId } })
    setShowResetModal(false)
  }

  const handleEndEvent = async () => {
    await endEvent({ variables: { eventId } })
  }

  const toggleRole = (role: string) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const toggleMethod = (method: string) => {
    setEditMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    )
  }

  const handleEditEvent = async () => {
    await editEvent({
      variables: {
        eventId,
        input: {
          name: editName,
          location: editLocation || undefined,
          startsAt: editStartsAt || undefined,
          endsAt: editEndsAt || undefined,
          gracePeriod: Number(editGracePeriod),
          attendanceType: editAttendanceType,
          allowedCheckInRoles: editRoles,
          allowedCheckInMethods: editMethods,
          autoCheckoutMinutes: Number(editAutoCheckout),
        },
      },
    })
  }

  const openEditModal = () => {
    // Re-sync form state from current event data when opening
    setEditName(event?.name ?? '')
    setEditLocation(event?.location ?? '')
    setEditStartsAt(event?.startsAt ? event.startsAt.slice(0, 16) : '')
    setEditEndsAt(event?.endsAt ? event.endsAt.slice(0, 16) : '')
    setEditGracePeriod(event?.gracePeriod ?? 30)
    setEditAttendanceType(event?.attendanceType ?? 'LEADERS_ONLY')
    setEditRoles(event?.allowedCheckInRoles ?? ['leaderBacenta'])
    setEditMethods(event?.allowedCheckInMethods ?? ['QR'])
    setEditAutoCheckout(event?.autoCheckoutMinutes ?? 30)
    setShowEditModal(true)
  }

  const menuItems = [
    canEdit
      ? {
          title: 'Edit Event',
          onClick: openEditModal,
        }
      : null,
    eventStatus === 'ACTIVE'
      ? {
          title: pauseLoading ? 'Pausing...' : 'Pause Event',
          onClick: () => {
            if (!pauseLoading) void handlePause()
          },
        }
      : null,
    eventStatus === 'PAUSED'
      ? {
          title: resumeLoading ? 'Resuming...' : 'Resume Event',
          onClick: () => {
            if (!resumeLoading) void handleResume()
          },
        }
      : null,
    eventStatus !== 'ENDED'
      ? {
          title: durationLoading ? 'Extending...' : 'Extend Duration',
          onClick: () => {
            if (!durationLoading) setShowExtendModal(true)
          },
        }
      : null,
    {
      title: pinLoading ? 'Resetting PIN...' : 'Reset PIN',
      onClick: () => {
        if (!pinLoading) setShowResetModal(true)
      },
    },
    eventStatus !== 'ENDED'
      ? {
          title: endLoading ? 'Ending...' : 'End Event',
          onClick: () => {
            if (!endLoading) void handleEndEvent()
          },
        }
      : null,
  ].filter(
    (item): item is { title: string; onClick: () => void } => item !== null
  )

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-end">
        <ArrivalsMenuDropdown menuItems={menuItems} />
      </div>

      {/* Edit Event Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        size="lg"
      >
        <ModalHeader closeButton>
          <ModalTitle>Edit Event</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <label className="form-label">Event Name</label>
            <input
              type="text"
              className="form-control"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-control"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Start Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={editStartsAt}
                onChange={(e) => setEditStartsAt(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">End Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={editEndsAt}
                onChange={(e) => setEditEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Grace Period (minutes)</label>
              <input
                type="number"
                className="form-control"
                value={editGracePeriod}
                onChange={(e) => setEditGracePeriod(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Auto-Checkout (minutes)</label>
              <input
                type="number"
                className="form-control"
                value={editAutoCheckout}
                onChange={(e) => setEditAutoCheckout(Number(e.target.value))}
                min={5}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Attendance Type</label>
            <div className="d-flex gap-3">
              <div className="form-check">
                <input
                  type="radio"
                  id="edit-leadersOnly"
                  className="form-check-input"
                  checked={editAttendanceType === 'LEADERS_ONLY'}
                  onChange={() => setEditAttendanceType('LEADERS_ONLY')}
                />
                <label className="form-check-label" htmlFor="edit-leadersOnly">
                  Leaders Only
                </label>
              </div>
              <div className="form-check">
                <input
                  type="radio"
                  id="edit-allMembers"
                  className="form-check-input"
                  checked={editAttendanceType === 'ALL_MEMBERS'}
                  onChange={() => setEditAttendanceType('ALL_MEMBERS')}
                />
                <label className="form-check-label" htmlFor="edit-allMembers">
                  All Members
                </label>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Who Can Check In</label>
            <div className="d-flex flex-wrap gap-3">
              {allRoles.map((role) => (
                <div key={role.value} className="form-check">
                  <input
                    type="checkbox"
                    id={`edit-role-${role.value}`}
                    className="form-check-input"
                    checked={editRoles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`edit-role-${role.value}`}
                  >
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Check-In Methods</label>
            <div className="d-flex flex-wrap gap-3">
              {checkInMethods.map((method) => (
                <div key={method.value} className="form-check">
                  <input
                    type="checkbox"
                    id={`edit-method-${method.value}`}
                    className="form-check-input"
                    checked={editMethods.includes(method.value)}
                    onChange={() => toggleMethod(method.value)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`edit-method-${method.value}`}
                  >
                    {method.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEditEvent}
            disabled={editLoading || !editName || editRoles.length === 0 || editMethods.length === 0}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Extend Duration Modal */}
      <Modal
        show={showExtendModal}
        onHide={() => setShowExtendModal(false)}
        centered
      >
        <ModalHeader closeButton>
          <ModalTitle>Extend Event Duration</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <label htmlFor="endTime" className="form-label">
              New End Time:
            </label>
            <input
              type="datetime-local"
              id="endTime"
              className="form-control"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowExtendModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExtendDuration}
            disabled={durationLoading}
          >
            {durationLoading ? 'Extending...' : 'Extend'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Reset PIN Modal */}
      <Modal
        show={showResetModal}
        onHide={() => setShowResetModal(false)}
        centered
      >
        <ModalHeader closeButton>
          <ModalTitle>Reset PIN Code</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p>
            Are you sure you want to reset the PIN code? All members will need
            the new PIN to check in.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleResetPin}
            disabled={pinLoading}
          >
            {pinLoading ? 'Resetting...' : 'Reset PIN'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
