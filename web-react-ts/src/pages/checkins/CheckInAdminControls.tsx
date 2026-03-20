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
} from './checkinsQueries'

interface CheckInAdminControlsProps {
  eventId: string
  eventStatus: string
  eventEndsAt: string
  onMutationComplete?: () => void
}

export const CheckInAdminControls = ({
  eventId,
  eventStatus,
  eventEndsAt,
  onMutationComplete,
}: CheckInAdminControlsProps) => {
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [newEndTime, setNewEndTime] = useState(eventEndsAt)

  const [pauseEvent, { loading: pauseLoading }] = useMutation(
    PAUSE_CHECKIN_EVENT,
    {
      onCompleted: onMutationComplete,
    }
  )

  const [resumeEvent, { loading: resumeLoading }] = useMutation(
    RESUME_CHECKIN_EVENT,
    {
      onCompleted: onMutationComplete,
    }
  )

  const [updateDuration, { loading: durationLoading }] = useMutation(
    UPDATE_CHECKIN_EVENT_DURATION,
    { onCompleted: onMutationComplete }
  )

  const [resetPin, { loading: pinLoading }] = useMutation(
    RESET_CHECKIN_EVENT_PIN,
    {
      onCompleted: onMutationComplete,
    }
  )

  const [endEvent, { loading: endLoading }] = useMutation(END_CHECKIN_EVENT, {
    onCompleted: onMutationComplete,
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

  const menuItems = [
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
