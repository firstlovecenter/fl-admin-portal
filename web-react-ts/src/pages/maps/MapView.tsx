import { useCallback, useContext, useRef, useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { useLocation, useNavigate } from 'react-router-dom'
import { Map as MapIcon, X } from 'lucide-react'
import { Button } from 'components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from 'components/ui/sheet'
import { MemberContext } from 'contexts/MemberContext'
import { alertMsg, throwToSentry } from 'global-utils'
import MapCanvas from './MapCanvas'
import MapPanel, { type PanelKey } from './components/MapPanel'
import {
  BACENTAS_WITH_LOCATIONS,
  LOAD_COUNCIL_UNVISITED_MEMBERS,
  PLACES_SEARCH_BY_LOCATION,
  PLACES_SEARCH_BY_NAME,
} from './mapsQueries'
import { FLC_HQ } from './maps-constants'
import type { LatLng, PlaceType } from './types'

type RawPlace = {
  id: string
  typename: PlaceType['typename']
  name: string
  firstName?: string
  lastName?: string
  latitude: number
  longitude: number
  description?: string
  picture?: string
}

type RawBacenta = {
  id: string
  name: string
  location: { latitude: number; longitude: number } | null
  leader: {
    id: string
    fullName: string
    phoneNumber?: string
    whatsappNumber?: string
  } | null
  governorship: { id: string; name: string } | null
}

const BACENTA_FETCH_LIMIT = 2000

const toPlaceType = (raw: RawPlace): PlaceType => ({
  id: raw.id,
  name: raw.name ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim(),
  typename: raw.typename,
  description: raw.description,
  picture: raw.picture,
  position: { lat: raw.latitude, lng: raw.longitude },
})

const PATH_TO_PANEL: Array<[string, PanelKey]> = [
  ['/maps/indoor-venues', 'indoor'],
  ['/maps/outdoor-venues', 'outdoor'],
  ['/maps/hostels', 'hostel'],
  ['/maps/schools', 'school'],
]

const resolvePanelKey = (pathname: string): PanelKey => {
  for (const [path, key] of PATH_TO_PANEL) {
    if (pathname.startsWith(path)) return key
  }
  return 'search'
}

const MapView = () => {
  const { currentUser } = useContext(MemberContext)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activePanel = resolvePanelKey(pathname)

  const [centre, setCentre] = useState<PlaceType | undefined>()
  const [places, setPlaces] = useState<PlaceType[]>([])
  const [showAllBacentas, setShowAllBacentas] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)

  const [runSearchByLocation] = useLazyQuery(PLACES_SEARCH_BY_LOCATION)
  const [runSearchByName] = useLazyQuery(PLACES_SEARCH_BY_NAME)
  const [runLoadUnvisited, { loading: loadingUnvisited }] = useLazyQuery(
    LOAD_COUNCIL_UNVISITED_MEMBERS
  )
  const [runLoadAllBacentas, { loading: loadingAllBacentas }] = useLazyQuery<{
    bacentas: RawBacenta[]
  }>(BACENTAS_WITH_LOCATIONS)

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const panTo = useCallback((position: LatLng) => {
    mapRef.current?.panTo(position)
  }, [])

  const fitBoundsTo = useCallback((points: LatLng[]) => {
    if (!mapRef.current || points.length === 0) return
    const bounds = new window.google.maps.LatLngBounds()
    points.forEach((p) => bounds.extend(p))
    mapRef.current.fitBounds(bounds, 64) // 64 px padding
  }, [])

  const fetchNearbyPlaces = useCallback(
    async (position: LatLng): Promise<PlaceType[]> => {
      if (!currentUser?.id) return []
      try {
        const res = await runSearchByLocation({
          variables: {
            id: currentUser.id,
            latitude: position.lat,
            longitude: position.lng,
          },
        })
        const raw: RawPlace[] =
          res.data?.members?.[0]?.placesSearchByLocation ?? []
        return raw.map(toPlaceType)
      } catch (err) {
        throwToSentry('Maps: failed to fetch nearby places', err)
        return []
      }
    },
    [currentUser?.id, runSearchByLocation]
  )

  const handleSetCentre = useCallback(
    async (place: PlaceType) => {
      if (
        !Number.isFinite(place.position.lat) ||
        !Number.isFinite(place.position.lng)
      ) {
        alertMsg('No location found')
        return
      }
      setCentre(place)
      panTo(place.position)
      const nearby = await fetchNearbyPlaces(place.position)
      setPlaces(nearby)
    },
    [fetchNearbyPlaces, panTo]
  )

  const handleMyLocation = useCallback(() => {
    if (!('geolocation' in window.navigator)) {
      alertMsg('Geolocation is not supported in this browser')
      return
    }
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        const place: PlaceType = {
          id: 'my-location',
          name: 'Your location',
          typename: 'Member',
          position: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }
        setCentre(place)
        panTo(place.position)
      },
      () => alertMsg('Could not access your location')
    )
  }, [panTo])

  const handleFlcHq = useCallback(async () => {
    const place: PlaceType = {
      id: 'flc-hq',
      name: 'First Love Center',
      typename: 'Member',
      position: FLC_HQ,
    }
    setCentre(place)
    panTo(FLC_HQ)
    const nearby = await fetchNearbyPlaces(FLC_HQ)
    setPlaces(nearby)
  }, [fetchNearbyPlaces, panTo])

  const handleLoadUnvisited = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const res = await runLoadUnvisited({
        variables: { id: currentUser.id },
      })
      const raw: RawPlace[] =
        res.data?.members?.[0]?.memberLoadCouncilUnvisitedMembers ?? []
      setCentre({
        id: 'flc-hq',
        name: 'First Love Center',
        typename: 'Member',
        position: FLC_HQ,
      })
      panTo(FLC_HQ)
      setPlaces(raw.map(toPlaceType))
    } catch (err) {
      throwToSentry('Maps: failed to load unvisited members', err)
    }
  }, [currentUser?.id, panTo, runLoadUnvisited])

  const handleToggleAllBacentas = useCallback(
    async (next: boolean) => {
      setShowAllBacentas(next)
      if (!next) {
        // Off: clear the bacenta markers but keep the user's selected centre.
        setPlaces([])
        return
      }
      try {
        const res = await runLoadAllBacentas({
          variables: { limit: BACENTA_FETCH_LIMIT },
        })
        const raw: RawBacenta[] = res.data?.bacentas ?? []
        const points: PlaceType[] = raw
          .filter(
            (b): b is RawBacenta & { location: NonNullable<RawBacenta['location']> } =>
              !!b.location &&
              Number.isFinite(b.location.latitude) &&
              Number.isFinite(b.location.longitude)
          )
          .map((b) => ({
            id: b.id,
            name: b.name,
            typename: 'Bacenta',
            description: JSON.stringify({
              bacentaLeader: b.leader
                ? {
                    firstName: b.leader.fullName?.split(' ')[0] ?? '',
                    lastName:
                      b.leader.fullName?.split(' ').slice(1).join(' ') ?? '',
                  }
                : { firstName: '', lastName: '' },
              bacenta: { id: b.id, name: b.name },
              council: b.governorship ?? { id: '', name: '' },
              councilLeader: { firstName: '', lastName: '' },
            }),
            position: { lat: b.location.latitude, lng: b.location.longitude },
          }))
        setCentre(undefined)
        setPlaces(points)
        fitBoundsTo(points.map((p) => p.position))
      } catch (err) {
        throwToSentry('Maps: failed to load all Bacentas', err)
        setShowAllBacentas(false)
      }
    },
    [fitBoundsTo, runLoadAllBacentas]
  )

  const handleOpenDirectoryReport = useCallback(
    () => navigate('/reports/directory'),
    [navigate]
  )

  const panelProps = {
    active: activePanel,
    setCentre: handleSetCentre,
    onMyLocation: handleMyLocation,
    onFlcHq: handleFlcHq,
    onLoadUnvisitedMembers: handleLoadUnvisited,
    loadingUnvisited,
    placesSearchByName: runSearchByName,
    showAllBacentas,
    onToggleAllBacentas: handleToggleAllBacentas,
    loadingAllBacentas,
    onDownloadDirectory: handleOpenDirectoryReport,
    downloadDirectoryLabel: 'Download Bacenta directory',
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card pl-16 pr-16 md:px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-maps/10 text-maps">
          <MapIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-foreground">
            Maps
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Explore members, Bacentas and outreach venues.
          </p>
        </div>
        {pathname !== '/maps' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-9 sm:inline-flex"
            onClick={() => navigate('/maps')}
          >
            <X className="size-4" />
            Back to search
          </Button>
        ) : null}
      </header>

      <div className="grid h-full min-h-0 flex-1 grid-cols-1 lg:grid-cols-[380px_1fr]">
        {/* Desktop side panel */}
        <aside className="hidden h-full min-h-0 border-r border-border lg:block">
          <MapPanel {...panelProps} />
        </aside>

        {/* Map canvas */}
        <main className="relative h-full min-h-0">
          <MapCanvas
            centre={centre}
            places={places}
            onMapReady={handleMapReady}
            onLocate={handleMyLocation}
          />

          {/* Mobile panel toggle — bottom-left of map */}
          <Button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            aria-label="Open maps controls"
            className="absolute bottom-6 left-6 h-12 gap-2 rounded-full px-5 shadow-lg lg:hidden"
          >
            <MapIcon className="size-4" />
            <span className="text-sm font-semibold">
              {activePanel === 'search' ? 'Search & explore' : 'Venues'}
            </span>
          </Button>
        </main>
      </div>

      {/* Mobile panel sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[85svh] flex-col gap-0 rounded-t-2xl p-0"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-base">
              <MapIcon className="size-4 text-maps" />
              Maps
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <MapPanel {...panelProps} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default MapView
