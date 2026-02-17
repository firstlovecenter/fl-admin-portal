import { useMutation } from '@apollo/client'
import { useEffect, useState } from 'react'
import { Container, Card, Button, Row, Col, Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { CHECKIN_MEMBER } from './checkinsQueries'
import { QrReader } from 'react-qr-reader'

const MemberCheckInForm = () => {
  const navigate = useNavigate()
  const [scannedData, setScannedData] = useState<{
    eventId: string
    code: string
  } | null>(null)
  const [showScanner, setShowScanner] = useState(true)
  const [pinInput, setPinInput] = useState('')
  const [eventIdInput, setEventIdInput] = useState('')
  const [checkIn, { loading, error, data }] = useMutation(CHECKIN_MEMBER)

  // Auto-submit when QR scanned
  useEffect(() => {
    if (scannedData && scannedData.eventId && scannedData.code) {
      checkIn({
        variables: {
          eventId: scannedData.eventId,
          method: 'QR',
          code: scannedData.code,
        },
      })
        .then(() => {
          // Navigate to the event dashboard after successful check-in
          setTimeout(() => {
            navigate(`/checkins/event/${scannedData.eventId}`)
          }, 1500)
        })
        .catch(() => {
          // Error is handled by Apollo wrapper
        })
    }
  }, [scannedData, checkIn, navigate])

  const handleQrScan = (result: any) => {
    if (result?.getText) {
      const text = result.getText()
      const [eventId, code] = text.split(':')
      if (eventId && code) {
        setScannedData({ eventId, code })
        setShowScanner(false)
      }
    }
  }

  const handlePinSubmit = () => {
    if (!eventIdInput || !pinInput) return
    checkIn({
      variables: {
        eventId: eventIdInput,
        method: 'PIN',
        code: pinInput,
      },
    })
      .then(() => {
        setTimeout(() => {
          navigate(`/checkins/event/${eventIdInput}`)
        }, 1500)
      })
      .catch(() => {
        // Error is handled by Apollo wrapper
      })
  }

  const resetToScan = () => {
    setScannedData(null)
    setShowScanner(true)
    setPinInput('')
    setEventIdInput('')
  }

  return (
    <Container className="py-4">
      <HeadingPrimary className="mb-3">Event Check-In</HeadingPrimary>

      {data?.CheckInMember && (
        <Alert variant="success" className="mb-3">
          <strong>✅ Checked in successfully!</strong>
          <div className="mt-2">
            Member: {data.CheckInMember.memberName}
            <br />
            Time: {new Date(data.CheckInMember.checkedInAt).toLocaleString()}
          </div>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-3">
          <strong>❌ Check-in failed:</strong> {error.message}
        </Alert>
      )}

      <Row className="g-3">
        <Col md={6}>
          <Card className="p-3 h-100">
            <h5 className="mb-3">📷 Scan QR Code</h5>
            {showScanner ? (
              <>
                <QrReader
                  onResult={handleQrScan}
                  constraints={{ facingMode: 'environment' }}
                  className="w-100"
                />
                <p className="text-muted mt-2 small">
                  Point your camera at the event QR code to check in
                  automatically
                </p>
              </>
            ) : (
              <div className="text-center">
                <p className="text-success">
                  {loading
                    ? '⏳ Processing check-in...'
                    : '✅ QR code scanned!'}
                </p>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={resetToScan}
                >
                  Scan Again
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col md={6}>
          <Card className="p-3 h-100">
            <h5 className="mb-3">🔢 Enter PIN Code</h5>
            <div className="mb-3">
              <label className="form-label">Event ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter event ID"
                value={eventIdInput}
                onChange={(e) => setEventIdInput(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">PIN Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter 6-digit PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                maxLength={6}
                disabled={loading}
              />
            </div>
            <Button
              variant="primary"
              onClick={handlePinSubmit}
              disabled={!eventIdInput || !pinInput || loading}
              className="w-100"
            >
              {loading ? 'Checking In...' : 'Check In with PIN'}
            </Button>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default MemberCheckInForm
