import { useMutation, useQuery } from '@apollo/client'
import { useEffect, useState, useCallback } from 'react'
import { Container, Card, Button, Row, Col, Alert, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { CHECKIN_MEMBER, GET_CHECKIN_DASHBOARD } from './checkinsQueries'
import { QrReader } from 'react-qr-reader'
import { getDeviceFingerprint } from './DeviceFingerprint'
import SelfieCaptureModal from './SelfieCaptureModal'
import { compareFaces, FaceMatchResult } from './FaceMatchService'
import { uploadToS3, UploadToS3Props } from 'utils/s3Upload'
import { GENERATE_PRESIGNED_URL } from 'components/formik/ImageUploadGQL'

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
  const [generatePresignedUrl] = useMutation(GENERATE_PRESIGNED_URL)

  // Anti-proxy state
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('')
  const [gpsCoords, setGpsCoords] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<string>('Acquiring GPS...')
  const [showSelfieModal, setShowSelfieModal] = useState(false)
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null)
  const [faceMatch, setFaceMatch] = useState<FaceMatchResult | null>(null)
  const [pendingCheckInArgs, setPendingCheckInArgs] = useState<any>(null)
  const [processingMessage, setProcessingMessage] = useState<string | null>(null)

  // Get device fingerprint on mount
  useEffect(() => {
    getDeviceFingerprint().then(setDeviceFingerprint)
  }, [])

  // Get GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS not supported')
      return
    }
    setGpsStatus('Acquiring GPS...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setGpsStatus('GPS acquired ✅')
      },
      (err) => {
        setGpsStatus(`GPS unavailable: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }, [])

  /**
   * Upload selfie to S3 and return the public URL.
   */
  const uploadSelfie = useCallback(
    async (base64: string): Promise<string | null> => {
      try {
        setProcessingMessage('Uploading selfie...')
        // Convert base64 to File
        const res = await fetch(base64)
        const blob = await res.blob()
        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })
        const url = await uploadToS3({ file, generatePresignedUrl } as UploadToS3Props)
        return url
      } catch (err) {
        console.error('Selfie upload failed:', err)
        return null
      }
    },
    [generatePresignedUrl]
  )

  /**
   * Execute the actual check-in mutation with all verification data.
   */
  const executeCheckIn = useCallback(
    async (args: {
      eventId: string
      method: string
      code: string
      selfieUrl?: string | null
      faceResult?: FaceMatchResult | null
    }) => {
      const { eventId, method, code, selfieUrl, faceResult } = args
      setProcessingMessage('Completing check-in...')
      return checkIn({
        variables: {
          eventId,
          method,
          code,
          deviceFingerprint,
          latitude: gpsCoords?.latitude ?? null,
          longitude: gpsCoords?.longitude ?? null,
          selfieBase64: selfieUrl || null,
          faceMatchScore: faceResult?.score ?? null,
          faceMatchStatus: faceResult?.status ?? null,
        },
      })
        .then(() => {
          setProcessingMessage(null)
          setTimeout(() => {
            navigate(`/checkins/event/${eventId}`)
          }, 1500)
        })
        .catch(() => {
          setProcessingMessage(null)
        })
    },
    [checkIn, deviceFingerprint, gpsCoords, navigate]
  )

  /**
   * Handle selfie captured — upload to S3, run face match, then complete check-in.
   */
  const handleSelfieCapture = useCallback(
    async (base64: string) => {
      setSelfieBase64(base64)
      setShowSelfieModal(false)

      // Upload selfie
      const url = await uploadSelfie(base64)

      // Run face match (if face-api available)
      setProcessingMessage('Running face verification...')
      // We use an empty string for reference — in production,
      // you'd pass the member's profile photo URL here.
      const faceResult = await compareFaces(base64, '')
      setFaceMatch(faceResult)

      // Now complete the check-in with all data
      if (pendingCheckInArgs) {
        await executeCheckIn({
          ...pendingCheckInArgs,
          selfieUrl: url,
          faceResult,
        })
        setPendingCheckInArgs(null)
      }
    },
    [uploadSelfie, pendingCheckInArgs, executeCheckIn]
  )

  /**
   * Initiate check-in flow. If selfie is needed, opens the modal first.
   * Otherwise proceeds directly.
   */
  const initiateCheckIn = useCallback(
    (eventId: string, method: string, code: string) => {
      // For now, always proceed directly.
      // If the event requires selfie, the server will have selfieRequired=true
      // and we could query event details first. For simplicity, we offer selfie
      // as an optional step the user can trigger.
      const args = { eventId, method, code }
      executeCheckIn(args)
    },
    [executeCheckIn]
  )

  // Auto-submit when QR scanned
  useEffect(() => {
    if (scannedData && scannedData.eventId && scannedData.code) {
      initiateCheckIn(scannedData.eventId, 'QR', scannedData.code)
    }
  }, [scannedData, initiateCheckIn])

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
    initiateCheckIn(eventIdInput, 'PIN', pinInput)
  }

  const resetToScan = () => {
    setScannedData(null)
    setShowScanner(true)
    setPinInput('')
    setEventIdInput('')
    setSelfieBase64(null)
    setFaceMatch(null)
    setProcessingMessage(null)
  }

  return (
    <Container className="py-4">
      <HeadingPrimary className="mb-3">Event Check-In</HeadingPrimary>

      {/* Status indicators */}
      <div className="mb-3 d-flex gap-2 flex-wrap">
        <span className="badge bg-secondary">
          🔑 Device: {deviceFingerprint ? '✅' : '⏳'}
        </span>
        <span
          className={`badge ${gpsCoords ? 'bg-success' : 'bg-warning text-dark'}`}
        >
          📍 {gpsStatus}
        </span>
        {selfieBase64 && <span className="badge bg-info">📸 Selfie captured</span>}
        {faceMatch && (
          <span
            className={`badge ${faceMatch.status === 'VERIFIED' ? 'bg-success' : faceMatch.status === 'FLAGGED' ? 'bg-danger' : 'bg-secondary'}`}
          >
            Face: {faceMatch.status}
            {faceMatch.score != null
              ? ` (${(faceMatch.score * 100).toFixed(0)}%)`
              : ''}
          </span>
        )}
      </div>

      {processingMessage && (
        <Alert variant="info" className="mb-3 d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          {processingMessage}
        </Alert>
      )}

      {data?.CheckInMember && (
        <Alert variant="success" className="mb-3">
          <strong>✅ Checked in successfully!</strong>
          <div className="mt-2">
            Member: {data.CheckInMember.memberName}
            <br />
            Time: {new Date(data.CheckInMember.checkedInAt).toLocaleString()}
            {data.CheckInMember.geoVerified != null && (
              <>
                <br />
                Geo: {data.CheckInMember.geoVerified ? '✅ Verified' : '❌ Not verified'}
                {data.CheckInMember.distanceFromVenue != null &&
                  ` (${data.CheckInMember.distanceFromVenue}m)`}
              </>
            )}
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

      {/* Selfie Capture Modal */}
      <SelfieCaptureModal
        show={showSelfieModal}
        onHide={() => setShowSelfieModal(false)}
        onCapture={handleSelfieCapture}
      />
    </Container>
  )
}

export default MemberCheckInForm
