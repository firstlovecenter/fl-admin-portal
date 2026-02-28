import { useMutation, useLazyQuery } from '@apollo/client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
  ProgressBar,
} from 'react-bootstrap'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import {
  CHECKIN_MEMBER,
  CHECKOUT_MEMBER,
  GET_CHECKIN_DASHBOARD,
} from './checkinsQueries'
import { QrReader } from 'react-qr-reader'
import { getDeviceFingerprint } from './DeviceFingerprint'
import SelfieCaptureModal from './SelfieCaptureModal'
import { compareFaces, FaceMatchResult } from './FaceMatchService'

/**
 * Check if user coordinates are within a circle geofence.
 * Uses Haversine formula (client-side approximation for UI gating).
 */
const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000 // metres
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Check if a point is inside a polygon (ray-casting).
 */
const isInsidePolygon = (
  lat: number,
  lng: number,
  polygon: { latitude: number; longitude: number }[]
): boolean => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude
    const yi = polygon[i].longitude
    const xj = polygon[j].latitude
    const yj = polygon[j].longitude
    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

type Phase = 'loading' | 'prerequisites' | 'ready' | 'checked-in'

const MemberCheckInForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eventIdFromUrl = searchParams.get('eventId') || ''

  // Phase state
  const [phase, setPhase] = useState<Phase>('loading')
  const [eventIdInput, setEventIdInput] = useState(eventIdFromUrl)
  const [eventData, setEventData] = useState<any>(null)

  // Prerequisites
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('')
  const [gpsCoords, setGpsCoords] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<string>('Acquiring GPS...')
  const [geoStatus, setGeoStatus] = useState<
    'checking' | 'inside' | 'outside'
  >('checking')
  const [timeStatus, setTimeStatus] = useState<
    'checking' | 'within' | 'outside'
  >('checking')
  const [geoDistance, setGeoDistance] = useState<number | null>(null)

  // Check-in state
  const [showScanner, setShowScanner] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [checkIn, { loading, error, data }] = useMutation(CHECKIN_MEMBER)
  const [checkOut] = useMutation(CHECKOUT_MEMBER)
  const [processingMessage, setProcessingMessage] = useState<string | null>(
    null
  )

  // Face ID state
  const [showSelfieModal, setShowSelfieModal] = useState(false)
  const [faceMatch, setFaceMatch] = useState<FaceMatchResult | null>(null)

  // Auto-checkout state
  const [outsideGeoSince, setOutsideGeoSince] = useState<number | null>(null)
  const [autoCheckoutCountdown, setAutoCheckoutCountdown] = useState<
    number | null
  >(null)
  const watchIdRef = useRef<number | null>(null)
  const checkoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch event details
  const [fetchDashboard, { loading: dashboardLoading }] = useLazyQuery(
    GET_CHECKIN_DASHBOARD,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        const event = data?.GetCheckInDashboard?.event
        if (event) {
          setEventData(event)
          setPhase('prerequisites')
        }
      },
      onError: () => {
        setEventData(null)
      },
    }
  )

  // Get device fingerprint on mount
  useEffect(() => {
    getDeviceFingerprint().then(setDeviceFingerprint)
  }, [])

  // Get GPS on mount with high accuracy
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
        setGpsStatus('GPS acquired')
      },
      (err) => {
        setGpsStatus(`GPS unavailable: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }, [])

  // Load event when ID is entered
  const loadEvent = useCallback(() => {
    if (!eventIdInput) return
    fetchDashboard({ variables: { eventId: eventIdInput } })
  }, [eventIdInput, fetchDashboard])

  // Auto-load if eventId in URL
  useEffect(() => {
    if (eventIdFromUrl) loadEvent()
  }, [eventIdFromUrl, loadEvent])

  // Validate prerequisites when GPS + event data are available
  useEffect(() => {
    if (phase !== 'prerequisites' || !eventData || !gpsCoords) return

    // Check time window
    const now = Date.now()
    const start = new Date(eventData.startsAt).getTime()
    const end = new Date(eventData.endsAt).getTime()
    if (now >= start && now <= end) {
      setTimeStatus('within')
    } else {
      setTimeStatus('outside')
    }

    // Check geofence
    if (eventData.geoFenceType === 'CIRCLE' && eventData.geoCenter) {
      const dist = haversineDistance(
        gpsCoords.latitude,
        gpsCoords.longitude,
        eventData.geoCenter.latitude,
        eventData.geoCenter.longitude
      )
      setGeoDistance(Math.round(dist))
      const radius = eventData.geoRadius || 200
      setGeoStatus(dist <= radius ? 'inside' : 'outside')
    } else if (
      eventData.geoFenceType === 'POLYGON' &&
      eventData.geoPolygon?.length >= 3
    ) {
      const inside = isInsidePolygon(
        gpsCoords.latitude,
        gpsCoords.longitude,
        eventData.geoPolygon
      )
      setGeoStatus(inside ? 'inside' : 'outside')
      setGeoDistance(null)
    } else {
      setGeoStatus('inside') // misconfigured fence — allow
    }
  }, [phase, eventData, gpsCoords])

  // Transition to 'ready' when both prerequisites pass
  useEffect(() => {
    if (
      phase === 'prerequisites' &&
      geoStatus === 'inside' &&
      timeStatus === 'within'
    ) {
      setPhase('ready')
    }
  }, [phase, geoStatus, timeStatus])

  // ─── Auto-checkout monitoring after check-in ───
  useEffect(() => {
    if (phase !== 'checked-in' || !eventData) return

    const autoCheckoutMs = (eventData.autoCheckoutMinutes ?? 30) * 60 * 1000

    // Start watching position
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          let isInside = true

          if (eventData.geoFenceType === 'CIRCLE' && eventData.geoCenter) {
            const dist = haversineDistance(
              latitude,
              longitude,
              eventData.geoCenter.latitude,
              eventData.geoCenter.longitude
            )
            isInside = dist <= (eventData.geoRadius || 200)
          } else if (
            eventData.geoFenceType === 'POLYGON' &&
            eventData.geoPolygon?.length >= 3
          ) {
            isInside = isInsidePolygon(latitude, longitude, eventData.geoPolygon)
          }

          if (!isInside) {
            setOutsideGeoSince((prev) => prev ?? Date.now())
          } else {
            // Back inside — reset timer
            setOutsideGeoSince(null)
            setAutoCheckoutCountdown(null)
          }
        },
        undefined,
        { enableHighAccuracy: true, maximumAge: 60000 }
      )
    }

    // Start countdown timer
    checkoutTimerRef.current = setInterval(() => {
      setOutsideGeoSince((since) => {
        if (!since) return since
        const elapsed = Date.now() - since
        const remaining = Math.max(
          0,
          Math.ceil((autoCheckoutMs - elapsed) / 60000)
        )
        setAutoCheckoutCountdown(remaining)

        if (elapsed >= autoCheckoutMs) {
          // Trigger auto-checkout
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              checkOut({
                variables: {
                  eventId: eventData.id,
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  deviceFingerprint,
                },
              }).catch(console.error)
            },
            undefined,
            { enableHighAccuracy: true }
          )
        }
        return since
      })
    }, 30000) // check every 30 seconds

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (checkoutTimerRef.current) {
        clearInterval(checkoutTimerRef.current)
      }
    }
  }, [phase, eventData, deviceFingerprint, checkOut])

  // ─── Check-in execution ───
  const executeCheckIn = useCallback(
    async (method: string, code?: string, faceResult?: FaceMatchResult) => {
      if (!eventData || !gpsCoords) return
      setProcessingMessage('Completing check-in...')
      return checkIn({
        variables: {
          eventId: eventData.id,
          method,
          code: code || null,
          deviceFingerprint,
          latitude: gpsCoords.latitude,
          longitude: gpsCoords.longitude,
          selfieBase64: null,
          faceMatchScore: faceResult?.score ?? null,
          faceMatchStatus: faceResult?.status ?? null,
        },
      })
        .then(() => {
          setProcessingMessage(null)
          setPhase('checked-in')
        })
        .catch(() => {
          setProcessingMessage(null)
        })
    },
    [checkIn, eventData, deviceFingerprint, gpsCoords]
  )

  // ─── QR scan handler ───
  const handleQrScan = useCallback(
    (result: any) => {
      if (result?.getText) {
        const text = result.getText()
        const parts = text.split(':')
        if (parts.length >= 2) {
          const code = parts.slice(1).join(':')
          setShowScanner(false)
          executeCheckIn('QR', code)
        }
      }
    },
    [executeCheckIn]
  )

  // ─── PIN submit handler ───
  const handlePinSubmit = useCallback(() => {
    if (!pinInput) return
    executeCheckIn('PIN', pinInput)
  }, [pinInput, executeCheckIn])

  // ─── Face ID handler ───
  const handleFaceIdCapture = useCallback(
    async (base64: string) => {
      setShowSelfieModal(false)
      setProcessingMessage('Running face verification...')
      // Compare against empty for now — in production, pass profile photo URL
      const faceResult = await compareFaces(base64, '')
      setFaceMatch(faceResult)
      setProcessingMessage(null)

      if (
        faceResult.status === 'VERIFIED' ||
        faceResult.status === 'SKIPPED'
      ) {
        await executeCheckIn('FACE_ID', undefined, faceResult)
      }
    },
    [executeCheckIn]
  )

  const allowedMethods: string[] = eventData?.allowedCheckInMethods || []

  return (
    <Container className="py-4">
      <HeadingPrimary className="mb-3">Leader Check-In</HeadingPrimary>

      {/* ─── Phase: Loading / Enter Event ID ─── */}
      {phase === 'loading' && (
        <Card className="p-4">
          <h5 className="mb-3">Enter Event ID</h5>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter event ID"
              value={eventIdInput}
              onChange={(e) => setEventIdInput(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            onClick={loadEvent}
            disabled={!eventIdInput || dashboardLoading}
            className="w-100"
          >
            {dashboardLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Loading Event...
              </>
            ) : (
              'Load Event'
            )}
          </Button>
        </Card>
      )}

      {/* ─── Phase: Validating Prerequisites ─── */}
      {phase === 'prerequisites' && eventData && (
        <Card className="p-4">
          <h5 className="mb-3">{eventData.name}</h5>
          <p className="text-muted mb-3">
            Verifying prerequisites before check-in is activated...
          </p>

          <div className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <span
                className={`badge me-2 ${
                  gpsCoords ? 'bg-success' : 'bg-warning text-dark'
                }`}
              >
                {gpsCoords ? 'READY' : 'PENDING'}
              </span>
              <span>GPS Location: {gpsStatus}</span>
            </div>

            <div className="d-flex align-items-center mb-2">
              <span
                className={`badge me-2 ${
                  timeStatus === 'within'
                    ? 'bg-success'
                    : timeStatus === 'outside'
                      ? 'bg-danger'
                      : 'bg-warning text-dark'
                }`}
              >
                {timeStatus === 'within'
                  ? 'PASS'
                  : timeStatus === 'outside'
                    ? 'FAIL'
                    : 'CHECKING'}
              </span>
              <span>
                Time Window:{' '}
                {timeStatus === 'within'
                  ? 'You are within the event time window'
                  : timeStatus === 'outside'
                    ? `Event runs ${new Date(eventData.startsAt).toLocaleTimeString()} - ${new Date(eventData.endsAt).toLocaleTimeString()}`
                    : 'Checking...'}
              </span>
            </div>

            <div className="d-flex align-items-center mb-2">
              <span
                className={`badge me-2 ${
                  geoStatus === 'inside'
                    ? 'bg-success'
                    : geoStatus === 'outside'
                      ? 'bg-danger'
                      : 'bg-warning text-dark'
                }`}
              >
                {geoStatus === 'inside'
                  ? 'PASS'
                  : geoStatus === 'outside'
                    ? 'FAIL'
                    : 'CHECKING'}
              </span>
              <span>
                Geofence:{' '}
                {geoStatus === 'inside'
                  ? `You are within the event geofence${geoDistance != null ? ` (${geoDistance}m away)` : ''}`
                  : geoStatus === 'outside'
                    ? `You are outside the geofence${geoDistance != null ? ` (${geoDistance}m away)` : ''}`
                    : 'Checking location...'}
              </span>
            </div>

            <div className="d-flex align-items-center">
              <span
                className={`badge me-2 ${deviceFingerprint ? 'bg-success' : 'bg-warning text-dark'}`}
              >
                {deviceFingerprint ? 'READY' : 'PENDING'}
              </span>
              <span>Device Fingerprint</span>
            </div>
          </div>

          {timeStatus === 'outside' && (
            <Alert variant="warning">
              Check-in is only available during the event time window. Please
              come back between{' '}
              {new Date(eventData.startsAt).toLocaleString()} and{' '}
              {new Date(eventData.endsAt).toLocaleString()}.
            </Alert>
          )}

          {geoStatus === 'outside' && (
            <Alert variant="danger">
              You must be within the event geofence to check in. Move closer to
              the venue and your location will be re-checked automatically.
            </Alert>
          )}

          {/* Auto-refresh GPS to re-check geofence */}
          {geoStatus === 'outside' && (
            <Button
              variant="outline-secondary"
              onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  (pos) => {
                    setGpsCoords({
                      latitude: pos.coords.latitude,
                      longitude: pos.coords.longitude,
                    })
                  },
                  undefined,
                  { enableHighAccuracy: true, timeout: 15000 }
                )
              }}
            >
              Refresh Location
            </Button>
          )}
        </Card>
      )}

      {/* ─── Phase: Ready — Show Available Check-In Methods ─── */}
      {phase === 'ready' && eventData && (
        <>
          {processingMessage && (
            <Alert
              variant="info"
              className="mb-3 d-flex align-items-center gap-2"
            >
              <Spinner animation="border" size="sm" />
              {processingMessage}
            </Alert>
          )}

          {error && (
            <Alert variant="danger" className="mb-3">
              <strong>Check-in failed:</strong> {error.message}
            </Alert>
          )}

          <Card className="p-3 mb-3 bg-success bg-opacity-10">
            <p className="mb-0 text-success">
              <strong>Prerequisites passed.</strong> You are within the geofence
              and time window. Choose your check-in method below.
            </p>
          </Card>

          <Row className="g-3">
            {/* QR Code Method */}
            {allowedMethods.includes('QR') && (
              <Col md={allowedMethods.length === 1 ? 12 : 6}>
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
                        Point your camera at the event QR code
                      </p>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowScanner(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={() => setShowScanner(true)}
                      disabled={loading}
                    >
                      Open Scanner
                    </Button>
                  )}
                </Card>
              </Col>
            )}

            {/* PIN Code Method */}
            {allowedMethods.includes('PIN') && (
              <Col md={allowedMethods.length === 1 ? 12 : 6}>
                <Card className="p-3 h-100">
                  <h5 className="mb-3">🔢 Enter PIN Code</h5>
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
                    disabled={!pinInput || loading}
                    className="w-100"
                  >
                    {loading ? 'Checking In...' : 'Check In with PIN'}
                  </Button>
                </Card>
              </Col>
            )}

            {/* Face ID Method */}
            {allowedMethods.includes('FACE_ID') && (
              <Col md={allowedMethods.length === 1 ? 12 : 6}>
                <Card className="p-3 h-100">
                  <h5 className="mb-3">🧑 Face ID Recognition</h5>
                  <p className="text-muted small mb-3">
                    Take a selfie to verify your identity. Your face will be
                    compared against your profile photo.
                  </p>
                  {faceMatch && (
                    <Alert
                      variant={
                        faceMatch.status === 'VERIFIED'
                          ? 'success'
                          : faceMatch.status === 'FLAGGED'
                            ? 'danger'
                            : 'secondary'
                      }
                      className="mb-3"
                    >
                      Face match: {faceMatch.status}
                      {faceMatch.score != null
                        ? ` (${(faceMatch.score * 100).toFixed(0)}%)`
                        : ''}
                    </Alert>
                  )}
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={() => setShowSelfieModal(true)}
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Start Face Recognition'}
                  </Button>
                </Card>
              </Col>
            )}
          </Row>
        </>
      )}

      {/* ─── Phase: Checked In ─── */}
      {phase === 'checked-in' && (
        <>
          {data?.CheckInMember && (
            <Alert variant="success" className="mb-3">
              <strong>Checked in successfully!</strong>
              <div className="mt-2">
                Member: {data.CheckInMember.memberName}
                <br />
                Time:{' '}
                {new Date(data.CheckInMember.checkedInAt).toLocaleString()}
                {data.CheckInMember.geoVerified != null && (
                  <>
                    <br />
                    Geo: {data.CheckInMember.geoVerified
                      ? 'Verified'
                      : 'Not verified'}
                    {data.CheckInMember.distanceFromVenue != null &&
                      ` (${data.CheckInMember.distanceFromVenue}m)`}
                  </>
                )}
              </div>
            </Alert>
          )}

          {/* Auto-checkout warning */}
          {autoCheckoutCountdown != null && autoCheckoutCountdown > 0 && (
            <Alert variant="warning" className="mb-3">
              <strong>Warning:</strong> You appear to have left the geofence.
              You will be automatically checked out in{' '}
              <strong>{autoCheckoutCountdown} minute(s)</strong> if you don't
              return.
              <ProgressBar
                animated
                variant="warning"
                now={
                  100 -
                  (autoCheckoutCountdown /
                    (eventData?.autoCheckoutMinutes ?? 30)) *
                    100
                }
                className="mt-2"
              />
            </Alert>
          )}

          {autoCheckoutCountdown === 0 && (
            <Alert variant="danger" className="mb-3">
              <strong>Auto-checked out.</strong> You were outside the geofence
              for more than {eventData?.autoCheckoutMinutes ?? 30} minutes.
            </Alert>
          )}

          <Card className="p-3 bg-light">
            <p className="text-muted mb-2">
              Your location is being monitored. Stay within the geofence to
              remain checked in. If you leave for more than{' '}
              {eventData?.autoCheckoutMinutes ?? 30} minutes, you will be
              automatically checked out.
            </p>
            <Button
              variant="outline-primary"
              onClick={() =>
                navigate(`/checkins/event/${eventData?.id || eventIdInput}`)
              }
            >
              View Event Dashboard
            </Button>
          </Card>
        </>
      )}

      {/* Selfie Capture Modal (for Face ID method) */}
      <SelfieCaptureModal
        show={showSelfieModal}
        onHide={() => setShowSelfieModal(false)}
        onCapture={handleFaceIdCapture}
      />
    </Container>
  )
}

export default MemberCheckInForm
