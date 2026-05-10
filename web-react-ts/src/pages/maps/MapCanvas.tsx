import { useCallback, useState } from 'react'
import {
  GoogleMap,
  Marker,
  MarkerClusterer,
  OverlayView,
  useLoadScript,
} from '@react-google-maps/api'
import { LocateFixed, X } from 'lucide-react'
import { Button } from 'components/ui/button'
import LoadingScreen from 'components/base-component/LoadingScreen'
import InfoWindowCard from './components/InfoWindowCard'
import { getMapIcon, getMapIconClass } from './components/map-utils'
import { FLC_HQ, TYPENAME_LABEL } from './maps-constants'
import type { PlaceType } from './types'

type LibrariesOptions = ('places' | 'drawing' | 'geometry' | 'visualization')[]

const LIBRARIES: LibrariesOptions = ['places']

const MAP_OPTIONS: google.maps.MapOptions = {
  mapId: 'b0ab33f7a0fc53d5',
  disableDefaultUI: true,
  clickableIcons: true,
  mapTypeId: 'hybrid',
}

type MapCanvasProps = {
  centre?: PlaceType
  places: PlaceType[]
  onMapReady?: (map: google.maps.Map) => void
  onLocate?: () => void
}

// Centres the OverlayView pixel-perfectly above its anchor lat/lng.
// `OverlayView.getPixelPositionOffset` is invoked by the lib with the
// rendered card's measured width/height — we shift it half its width left
// and its full height upward so the bottom edge sits on the marker.
const popupOffset = (width: number, height: number) => ({
  x: -(width / 2),
  y: -(height + 24),
})

const MapCanvas = ({ centre, places, onMapReady, onLocate }: MapCanvasProps) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  })
  const [activeMarker, setActiveMarker] = useState<PlaceType | null>(null)

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      onMapReady?.(map)
    },
    [onMapReady]
  )

  if (!isLoaded) {
    return <LoadingScreen text="Loading map…" />
  }

  // Skip drawing the centre place a second time when it appears in `places`
  // (the original logic only filtered when it was the first index, which
  // missed all other positions).
  const otherPlaces = centre
    ? places.filter((p) => p.id !== centre.id)
    : places

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted">
      <GoogleMap
        zoom={18}
        center={FLC_HQ}
        mapContainerClassName="h-full w-full"
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
        {centre ? (
          <Marker
            position={centre.position}
            label={{
              text: centre.name,
              className: 'marker selected ' + (getMapIconClass(centre) ?? ''),
            }}
            onClick={() => setActiveMarker(centre)}
          />
        ) : null}

        <MarkerClusterer>
          {(clusterer) => (
            <>
              {otherPlaces.map((place) => {
                const typeLabel = TYPENAME_LABEL[place.typename]
                return (
                  <Marker
                    key={place.id || `${place.position.lat}-${place.position.lng}`}
                    label={{
                      text: typeLabel
                        ? `${place.name} ${typeLabel}`
                        : place.name,
                      className: 'marker ' + (getMapIconClass(place) ?? ''),
                    }}
                    position={place.position}
                    clusterer={clusterer}
                    icon={getMapIcon(place)}
                    onClick={() => setActiveMarker(place)}
                  />
                )
              })}
            </>
          )}
        </MarkerClusterer>

        {activeMarker ? (
          <OverlayView
            position={activeMarker.position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={popupOffset}
          >
            <div className="pointer-events-auto w-72 sm:w-80">
              <div className="relative rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-lg">
                <button
                  type="button"
                  onClick={() => setActiveMarker(null)}
                  aria-label="Close"
                  className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <X className="size-4" />
                </button>
                <InfoWindowCard place={activeMarker} />
                {/* Pointer triangle towards the marker */}
                <div
                  aria-hidden="true"
                  className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-sm border-b border-r border-border bg-card"
                />
              </div>
            </div>
          </OverlayView>
        ) : null}
      </GoogleMap>

      {onLocate ? (
        <Button
          type="button"
          size="icon"
          variant="default"
          aria-label="Centre map on my location"
          className="absolute bottom-6 right-6 size-12 rounded-full bg-card text-foreground shadow-lg hover:bg-card/90"
          onClick={onLocate}
        >
          <LocateFixed className="size-5" />
        </Button>
      ) : null}
    </div>
  )
}

export default MapCanvas
