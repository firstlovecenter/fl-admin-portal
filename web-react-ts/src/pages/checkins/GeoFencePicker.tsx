import { useState, useCallback, useMemo, useRef } from 'react'
import { Card, Button, Row, Col, ButtonGroup } from 'react-bootstrap'
import {
  useLoadScript,
  GoogleMap,
  Circle,
  Polygon,
  Marker,
  Autocomplete,
} from '@react-google-maps/api'

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

const MAP_CONTAINER_STYLE = { width: '100%', height: 350, borderRadius: 8 }
const DEFAULT_CENTER = { lat: 5.6037, lng: -0.187 } // Accra
const LIBRARIES: ('places')[] = ['places']

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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  })

  const mapCenter = useMemo(() => {
    if (center) return { lat: center.latitude, lng: center.longitude }
    if (polygon.length > 0)
      return { lat: polygon[0].latitude, lng: polygon[0].longitude }
    return DEFAULT_CENTER
  }, [center, polygon])

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }
        onCenterChange(point)
        if (fenceType === 'POLYGON') {
          onPolygonChange([...polygon, point])
        }
        setLocating(false)
      },
      (err) => {
        alert(`Could not get location: ${err.message}`)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [onCenterChange, onPolygonChange, fenceType, polygon])

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      const point = { latitude: e.latLng.lat(), longitude: e.latLng.lng() }
      if (fenceType === 'CIRCLE') {
        onCenterChange(point)
      } else {
        onPolygonChange([...polygon, point])
      }
    },
    [fenceType, onCenterChange, onPolygonChange, polygon]
  )

  const onPlaceSelected = useCallback(() => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry?.location) return
    const point = {
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
    }
    if (fenceType === 'CIRCLE') {
      onCenterChange(point)
    } else {
      onPolygonChange([...polygon, point])
    }
    mapRef.current?.panTo(place.geometry.location)
  }, [fenceType, onCenterChange, onPolygonChange, polygon])

  const polygonPath = useMemo(
    () => polygon.map((p) => ({ lat: p.latitude, lng: p.longitude })),
    [polygon]
  )

  return (
    <Card className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <label className="form-label fw-bold mb-0">
          Geo-Verify (Location Check)
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
                variant={fenceType === 'CIRCLE' ? 'secondary' : 'outline-secondary'}
                onClick={() => onFenceTypeChange('CIRCLE')}
              >
                Circle
              </Button>
              <Button
                variant={
                  fenceType === 'POLYGON' ? 'secondary' : 'outline-secondary'
                }
                onClick={() => onFenceTypeChange('POLYGON')}
              >
                Polygon
              </Button>
            </ButtonGroup>
          </div>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={useMyLocation}
            disabled={locating}
            className="w-100 mb-3"
          >
            {locating
              ? 'Getting location...'
              : fenceType === 'CIRCLE'
                ? 'Use My Location as Center'
                : 'Add My Location as Vertex'}
          </Button>

          {/* Google Map */}
          {isLoaded ? (
            <div className="mb-3">
              <Autocomplete
                onLoad={(ac) => (autocompleteRef.current = ac)}
                onPlaceChanged={onPlaceSelected}
              >
                <input
                  type="text"
                  placeholder="Search for a location..."
                  className="form-control form-control-sm mb-2"
                />
              </Autocomplete>
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={mapCenter}
                zoom={15}
                onClick={handleMapClick}
                onLoad={(map) => { mapRef.current = map }}
                options={{ mapTypeId: 'hybrid', disableDefaultUI: false }}
              >
                {fenceType === 'CIRCLE' && center && (
                  <>
                    <Marker
                      position={{
                        lat: center.latitude,
                        lng: center.longitude,
                      }}
                      draggable
                      onDragEnd={(e) => {
                        if (!e.latLng) return
                        onCenterChange({
                          latitude: e.latLng.lat(),
                          longitude: e.latLng.lng(),
                        })
                      }}
                    />
                    <Circle
                      center={{
                        lat: center.latitude,
                        lng: center.longitude,
                      }}
                      radius={radius}
                      options={{
                        fillColor: '#4285F4',
                        fillOpacity: 0.2,
                        strokeColor: '#4285F4',
                        strokeWeight: 2,
                      }}
                    />
                  </>
                )}

                {fenceType === 'POLYGON' && polygon.length > 0 && (
                  <>
                    {polygon.map((pt, i) => (
                      <Marker
                        key={i}
                        position={{ lat: pt.latitude, lng: pt.longitude }}
                        label={String(i + 1)}
                      />
                    ))}
                    {polygon.length >= 3 && (
                      <Polygon
                        paths={polygonPath}
                        options={{
                          fillColor: '#4285F4',
                          fillOpacity: 0.2,
                          strokeColor: '#4285F4',
                          strokeWeight: 2,
                        }}
                      />
                    )}
                  </>
                )}
              </GoogleMap>
              <small className="text-muted d-block mt-1">
                {fenceType === 'CIRCLE'
                  ? 'Click the map to set the center. Drag the marker to reposition.'
                  : 'Click the map to add vertices.'}
              </small>
            </div>
          ) : (
            <div
              className="border rounded text-center p-4 mb-3"
              style={{ minHeight: 200 }}
            >
              <p className="text-muted">Loading map...</p>
            </div>
          )}

          {/* Circle controls */}
          {fenceType === 'CIRCLE' && (
            <Row className="g-2 mb-3">
              <Col md={4}>
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
              <Col md={4}>
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
              <Col md={4}>
                <label className="form-label small">Radius (metres)</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={radius}
                  onChange={(e) =>
                    onRadiusChange(parseInt(e.target.value) || 100)
                  }
                  min={10}
                  max={50000}
                />
              </Col>
            </Row>
          )}

          {/* Polygon vertex list */}
          {fenceType === 'POLYGON' && polygon.length > 0 && (
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
                      onClick={() =>
                        onPolygonChange(polygon.filter((_, idx) => idx !== i))
                      }
                    >
                      X
                    </Button>
                  </li>
                ))}
              </ul>
              {polygon.length > 0 && polygon.length < 3 && (
                <small className="text-danger">
                  Minimum 3 vertices required for a polygon
                </small>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  )
}

export default GeoFencePicker
