import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import QRCode from 'qrcode.react'
import { Container, Spinner, Alert, Card, Badge } from 'react-bootstrap'
import { GeoAlt, ArrowClockwise } from 'react-bootstrap-icons'
import { GET_EVENTS_IN_RANGE } from './checkinsQueries'

// QR tokens rotate every 60 seconds — re-query every 30s to stay fresh
const REFRESH_INTERVAL_MS = 30 * 1000
// Countdown tick
const TICK_MS = 1000

type EventInRange = {
  id: string
  name: string
  type: string
  scopeLevel: string
  startsAt: string
  endsAt: string
  status: string
  qrToken: string
  allowedCheckInMethods: string[]
}

function formatTimeLeft(endsAt: string): string {
  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now())
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

export default function CheckInQRPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000)
  const [timeLeftMap, setTimeLeftMap] = useState<Record<string, string>>({})

  // Request GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      setGeoLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoLoading(false)
      },
      () => {
        setGeoError(
          'Location access denied. Please enable GPS and refresh the page.'
        )
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const { data, loading, refetch } = useQuery<{
    GetEventsInRange: EventInRange[]
  }>(GET_EVENTS_IN_RANGE, {
    variables: { latitude: coords?.lat ?? 0, longitude: coords?.lng ?? 0 },
    skip: !coords,
    fetchPolicy: 'network-only',
  })

  // Auto-refresh every 30s and count down
  useEffect(() => {
    if (!coords) return
    setCountdown(REFRESH_INTERVAL_MS / 1000)

    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          refetch()
          return REFRESH_INTERVAL_MS / 1000
        }
        return c - 1
      })
    }, TICK_MS)

    return () => clearInterval(tick)
  }, [coords, refetch])

  // Update "time left" display every second for each event
  useEffect(() => {
    const events = data?.GetEventsInRange ?? []
    if (!events.length) return

    const tick = setInterval(() => {
      setTimeLeftMap(
        Object.fromEntries(events.map((e) => [e.id, formatTimeLeft(e.endsAt)]))
      )
    }, TICK_MS)

    // Initialise immediately
    setTimeLeftMap(
      Object.fromEntries(events.map((e) => [e.id, formatTimeLeft(e.endsAt)]))
    )

    return () => clearInterval(tick)
  }, [data])

  // ── GPS loading ──
  if (geoLoading) {
    return (
      <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100 gap-3">
        <Spinner animation="border" />
        <p className="text-muted">Getting your location…</p>
      </Container>
    )
  }

  // ── GPS error ──
  if (geoError) {
    return (
      <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <Alert variant="warning" className="text-center" style={{ maxWidth: 400 }}>
          <GeoAlt size={28} className="mb-2" />
          <p className="mb-0">{geoError}</p>
        </Alert>
      </Container>
    )
  }

  const events = data?.GetEventsInRange ?? []

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-0 fw-bold">Check-In QR Codes</h4>
          <small className="text-muted">
            Showing events at your current location
          </small>
        </div>
        <div className="d-flex align-items-center gap-2 text-muted small">
          <ArrowClockwise size={14} />
          <span>Refreshes in {countdown}s</span>
        </div>
      </div>

      {/* Loading events */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" />
          <p className="mt-2 text-muted">Looking for events nearby…</p>
        </div>
      )}

      {/* No events in range */}
      {!loading && events.length === 0 && (
        <div className="text-center py-5">
          <GeoAlt size={48} className="text-muted mb-3" />
          <h5 className="text-muted">No active events at your location</h5>
          <p className="text-muted small">
            You must be within the event's geofence for its QR code to appear
            here.
          </p>
        </div>
      )}

      {/* QR cards */}
      <div className="d-flex flex-column gap-4">
        {events.map((event) => (
          <Card key={event.id} className="shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center py-4 px-3">
              {/* Event name + badge */}
              <div className="text-center mb-3">
                <h5 className="fw-bold mb-1">{event.name}</h5>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <Badge bg="success">ACTIVE</Badge>
                  <Badge bg="secondary">{event.scopeLevel}</Badge>
                  <Badge bg="info" text="dark">{event.type}</Badge>
                </div>
              </div>

              {/* QR code — only shown if QR method is enabled for this event */}
              {event.allowedCheckInMethods.includes('QR') && event.qrToken ? (
                <div
                  className="p-3 bg-white rounded mb-3"
                  style={{ lineHeight: 0 }}
                >
                  <QRCode
                    value={event.qrToken}
                    size={220}
                    level="M"
                    includeMargin={false}
                    renderAs="svg"
                  />
                </div>
              ) : (
                <Alert variant="secondary" className="text-center small mb-3">
                  QR check-in is not enabled for this event.
                </Alert>
              )}

              {/* Event meta */}
              <div className="text-center text-muted small">
                <p className="mb-1">
                  Ends in:{' '}
                  <span className="fw-semibold text-body">
                    {timeLeftMap[event.id] ?? '…'}
                  </span>
                </p>
                <p className="mb-0">
                  Scan using the FL Admin app to check in
                </p>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </Container>
  )
}
