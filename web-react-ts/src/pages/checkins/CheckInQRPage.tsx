import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode.react'
import { Container, Spinner, Alert, Badge, Button } from 'react-bootstrap'
import { GeoAlt, ArrowClockwise, ChevronLeft } from 'react-bootstrap-icons'
import MenuButton from 'components/buttons/MenuButton'

// Base URL of the API — same host, just replace /graphql with the REST path
const API_BASE =
  import.meta.env.VITE_SYNAGO_GRAPHQL_URI?.replace('/graphql', '') ||
  'http://localhost:4001'

// QR tokens rotate every 60 seconds — re-query every 30s to stay fresh
const REFRESH_INTERVAL_MS = 30 * 1000
const TICK_MS = 1000

type EventInRange = {
  id: string
  name: string
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
  const [events, setEvents] = useState<EventInRange[]>([])
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<EventInRange | null>(null)

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

  const fetchEvents = useCallback(async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE}/public/events-in-range?lat=${lat}&lng=${lng}`
      )
      if (!res.ok) throw new Error('Failed to fetch events')
      const data: EventInRange[] = await res.json()
      setEvents(data)
      // If there's only one event, auto-select it
      if (data.length === 1) setSelectedEvent(data[0])
    } catch {
      // silently ignore — events list stays as-is until next refresh
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on coords ready, then every 30 s
  useEffect(() => {
    if (!coords) return
    fetchEvents(coords.lat, coords.lng)
    setCountdown(REFRESH_INTERVAL_MS / 1000)

    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchEvents(coords.lat, coords.lng)
          return REFRESH_INTERVAL_MS / 1000
        }
        return c - 1
      })
    }, TICK_MS)

    return () => clearInterval(tick)
  }, [coords, fetchEvents])

  // Update "time left" display for the selected event every second
  useEffect(() => {
    if (!selectedEvent) return

    const update = () => setTimeLeft(formatTimeLeft(selectedEvent.endsAt))
    update()
    const tick = setInterval(update, TICK_MS)
    return () => clearInterval(tick)
  }, [selectedEvent])

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

  // ── QR detail view ──
  if (selectedEvent) {
    const hasQR =
      selectedEvent.allowedCheckInMethods.includes('QR') &&
      !!selectedEvent.qrToken

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          padding: '16px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Back button */}
        <Button
          variant="link"
          className="ps-0 mb-2 text-muted d-flex align-items-center gap-1"
          style={{ flexShrink: 0 }}
          onClick={() => setSelectedEvent(null)}
        >
          <ChevronLeft size={16} />
          All events
        </Button>

        {/* Event name + badges */}
        <div className="text-center mb-2" style={{ flexShrink: 0 }}>
          <h5 className="fw-bold mb-1">{selectedEvent.name}</h5>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Badge bg="success">ACTIVE</Badge>
            <Badge bg="secondary">{selectedEvent.scopeLevel}</Badge>
          </div>
        </div>

        {/* QR code — grows to fill remaining space */}
        {hasQR ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 16,
                lineHeight: 0,
                width: 'min(80vw, 80vh)',
                height: 'min(80vw, 80vh)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QRCode
                value={selectedEvent.qrToken}
                size={1000}
                level="M"
                includeMargin={false}
                renderAs="svg"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Alert variant="secondary" className="text-center">
              QR check-in is not enabled for this event.
            </Alert>
          </div>
        )}

        {/* Footer meta */}
        <div className="text-center text-muted small mt-2" style={{ flexShrink: 0 }}>
          <p className="mb-0">
            Ends in:{' '}
            <span className="fw-semibold text-body">{timeLeft || '…'}</span>
            {' · '}Refreshes in {countdown}s
          </p>
          <p className="mb-0">Scan using the FL Admin app to check in</p>
        </div>
      </div>
    )
  }

  // ── Event list view ──
  return (
    <Container
      className="py-4"
      style={{ maxWidth: 480, minHeight: '100dvh' }}
    >
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-0 fw-bold">Check-In</h4>
          <small className="text-muted">Events at your current location</small>
        </div>
        <div className="d-flex align-items-center gap-2 text-muted small">
          <ArrowClockwise size={14} />
          <span>Refreshes in {countdown}s</span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" />
          <p className="mt-2 text-muted">Looking for events nearby…</p>
        </div>
      )}

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

      <div className="d-grid gap-2">
        {events.map((event) => (
          <MenuButton
            key={event.id}
            title={event.name}
            caption={`${event.scopeLevel} · Ends in ${formatTimeLeft(event.endsAt)}`}
            onClick={() => setSelectedEvent(event)}
            color="green"
            iconBg
          />
        ))}
      </div>
    </Container>
  )
}


