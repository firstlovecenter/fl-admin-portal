import { useState, useCallback, useRef } from 'react'
import { Card, Button, Row, Col, ButtonGroup } from 'react-bootstrap'

/**
 * GeoPoint type used by the picker.
 */
export interface GeoPoint {
  latitude: number
  longitude: number
}

interface GeoFencePickerProps {
  enabled: boolean
  fenceType: 'CIRCLE' | 'POLYGON'
  center: GeoPoint | null
  radius: number
  polygon: GeoPoint[]
  onToggle: (enabled: boolean) => void
  onFenceTypeChange: (type: 'CIRCLE' | 'POLYGON') => void
  onCenterChange: (center: GeoPoint) => void
  onRadiusChange: (radius: number) => void
  onPolygonChange: (polygon: GeoPoint[]) => void
}

/**
 * A lightweight geofence picker that works without Google Maps API.
 * Admin can:
 *  - Toggle geo-verify on/off
 *  - Choose circle vs polygon
 *  - Use "My Location" to set the center quickly
 *  - Enter lat/lng manually
 *  - Set radius for circle mode
 *  - Add polygon vertices manually
 */
const GeoFencePicker = ({
  enabled,
  fenceType,
  center,
  radius,
  polygon,
  onToggle,
  onFenceTypeChange,
  onCenterChange,
  onRadiusChange,
  onPolygonChange,
}: GeoFencePickerProps) => {
  const [locating, setLocating] = useState(false)
  const [newVertexLat, setNewVertexLat] = useState('')
  const [newVertexLng, setNewVertexLng] = useState('')
  const mapRef = useRef<HTMLDivElement>(null)

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCenterChange({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setLocating(false)
      },
      (err) => {
        alert(`Could not get location: ${err.message}`)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [onCenterChange])

  const addVertex = () => {
    const lat = parseFloat(newVertexLat)
    const lng = parseFloat(newVertexLng)
    if (isNaN(lat) || isNaN(lng)) return
    onPolygonChange([...polygon, { latitude: lat, longitude: lng }])
    setNewVertexLat('')
    setNewVertexLng('')
  }

  const removeVertex = (index: number) => {
    onPolygonChange(polygon.filter((_, i) => i !== index))
  }

  return (
    <Card className="p-3 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <label className="form-label fw-bold mb-0">
          📍 Geo-Verify (Location Check)
        </label>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            id="geoVerifyToggle"
          />
          <label className="form-check-label" htmlFor="geoVerifyToggle">
            {enabled ? 'Enabled' : 'Disabled'}
          </label>
        </div>
      </div>

      {enabled && (
        <>
          <div className="mb-3">
            <label className="form-label">Fence Type</label>
            <ButtonGroup className="w-100">
              <Button
                variant={fenceType === 'CIRCLE' ? 'primary' : 'outline-primary'}
                onClick={() => onFenceTypeChange('CIRCLE')}
              >
                ⭕ Circle
              </Button>
              <Button
                variant={
                  fenceType === 'POLYGON' ? 'primary' : 'outline-primary'
                }
                onClick={() => onFenceTypeChange('POLYGON')}
              >
                🔷 Polygon
              </Button>
            </ButtonGroup>
          </div>

          {/* Circle mode */}
          {fenceType === 'CIRCLE' && (
            <>
              <Row className="g-2 mb-3">
                <Col xs={12}>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={useMyLocation}
                    disabled={locating}
                    className="w-100 mb-2"
                  >
                    {locating ? '⏳ Getting location...' : '📍 Use My Location as Center'}
                  </Button>
                </Col>
                <Col md={6}>
                  <label className="form-label small">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control form-control-sm"
                    value={center?.latitude ?? ''}
                    onChange={(e) =>
                      onCenterChange({
                        latitude: parseFloat(e.target.value) || 0,
                        longitude: center?.longitude ?? 0,
                      })
                    }
                    placeholder="e.g. 5.6037"
                  />
                </Col>
                <Col md={6}>
                  <label className="form-label small">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control form-control-sm"
                    value={center?.longitude ?? ''}
                    onChange={(e) =>
                      onCenterChange({
                        latitude: center?.latitude ?? 0,
                        longitude: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g. -0.1870"
                  />
                </Col>
              </Row>
              <div className="mb-3">
                <label className="form-label">Radius (metres)</label>
                <input
                  type="number"
                  className="form-control"
                  value={radius}
                  onChange={(e) => onRadiusChange(parseInt(e.target.value) || 100)}
                  min={10}
                  max={50000}
                />
                <small className="text-muted">
                  Typical: 50–200m for a building, 500–2000m for a campus
                </small>
              </div>
            </>
          )}

          {/* Polygon mode */}
          {fenceType === 'POLYGON' && (
            <>
              <div className="mb-2">
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="w-100 mb-2"
                >
                  {locating
                    ? '⏳ Getting location...'
                    : '📍 Add My Location as Vertex'}
                </Button>
              </div>
              {polygon.length > 0 && (
                <div className="mb-3">
                  <small className="text-muted">
                    Vertices ({polygon.length}):
                  </small>
                  <ul className="list-group list-group-flush">
                    {polygon.map((pt, i) => (
                      <li
                        key={i}
                        className="list-group-item d-flex justify-content-between align-items-center py-1 px-2"
                      >
                        <small>
                          #{i + 1}: {pt.latitude.toFixed(6)},{' '}
                          {pt.longitude.toFixed(6)}
                        </small>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeVertex(i)}
                        >
                          ✕
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Row className="g-2 mb-2">
                <Col>
                  <input
                    type="number"
                    step="any"
                    className="form-control form-control-sm"
                    placeholder="Latitude"
                    value={newVertexLat}
                    onChange={(e) => setNewVertexLat(e.target.value)}
                  />
                </Col>
                <Col>
                  <input
                    type="number"
                    step="any"
                    className="form-control form-control-sm"
                    placeholder="Longitude"
                    value={newVertexLng}
                    onChange={(e) => setNewVertexLng(e.target.value)}
                  />
                </Col>
                <Col xs="auto">
                  <Button variant="primary" size="sm" onClick={addVertex}>
                    Add
                  </Button>
                </Col>
              </Row>
              {polygon.length > 0 && polygon.length < 3 && (
                <small className="text-danger">
                  Minimum 3 vertices required for a polygon
                </small>
              )}
            </>
          )}

          {/* Preview map reference area */}
          <div
            ref={mapRef}
            className="border rounded bg-white text-center p-3 mt-2"
            style={{ minHeight: 80 }}
          >
            <small className="text-muted">
              {fenceType === 'CIRCLE' && center
                ? `Circle: (${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}) r=${radius}m`
                : fenceType === 'POLYGON' && polygon.length >= 3
                  ? `Polygon with ${polygon.length} vertices`
                  : 'Configure the geofence above'}
            </small>
          </div>
        </>
      )}
    </Card>
  )
}

export default GeoFencePicker
