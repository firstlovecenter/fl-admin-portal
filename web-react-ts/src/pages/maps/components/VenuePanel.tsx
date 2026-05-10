import { useMemo, useState } from 'react'
import { useQuery, type DocumentNode } from '@apollo/client'
import { Plus, Search, Users, MapPin, GraduationCap } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Skeleton } from 'components/ui/skeleton'
import { cn } from 'components/lib/utils'
import RoleView from 'auth/RoleView'
import { permitAdmin } from 'permission-utils'
import {
  GET_HOSTEL_INFORMATION,
  GET_INDOOR_VENUES,
  GET_OUTDOOR_VENUES,
  GET_SENIOR_HIGH_SCHOOLS,
} from '../venues/venuesQueries'
import AddVenueSheet from './AddVenueSheet'
import type { PlaceType, VenueKind } from '../types'

type VenueRecord = {
  id: string
  name: string
  capacity: number | { low: number }
  school?: string
  university?: string
  location: { latitude: number; longitude: number }
}

type SortKey = 'Name' | 'Capacity' | ''

type Config = {
  query: DocumentNode
  dataKey: 'indoorVenues' | 'outdoorVenues' | 'hostels' | 'highSchools'
  label: string
  description: string
  addLabel: string
  emptyHint: string
  typename: PlaceType['typename']
  showSchool: boolean
}

const CONFIG: Record<VenueKind, Config> = {
  indoor: {
    query: GET_INDOOR_VENUES,
    dataKey: 'indoorVenues',
    label: 'Indoor venues',
    description: 'Indoor outreach venues across the network.',
    addLabel: 'Add indoor venue',
    emptyHint: 'No indoor venues yet — add one to get started.',
    typename: 'IndoorVenue',
    showSchool: false,
  },
  outdoor: {
    query: GET_OUTDOOR_VENUES,
    dataKey: 'outdoorVenues',
    label: 'Outdoor venues',
    description: 'Open-air outreach spaces.',
    addLabel: 'Add outdoor venue',
    emptyHint: 'No outdoor venues yet — add one to get started.',
    typename: 'OutdoorVenue',
    showSchool: false,
  },
  hostel: {
    query: GET_HOSTEL_INFORMATION,
    dataKey: 'hostels',
    label: 'Hostels',
    description: 'University hostels for tertiary outreach.',
    addLabel: 'Add hostel',
    emptyHint: 'No hostels yet — add one to get started.',
    typename: 'Hostel',
    showSchool: true,
  },
  school: {
    query: GET_SENIOR_HIGH_SCHOOLS,
    dataKey: 'highSchools',
    label: 'Senior high schools',
    description: 'Senior high schools for school outreach.',
    addLabel: 'Add senior high school',
    emptyHint: 'No senior high schools yet — add one to get started.',
    typename: 'HighSchool',
    showSchool: true,
  },
}

const capacityNumber = (capacity: VenueRecord['capacity']): number =>
  typeof capacity === 'object' ? capacity.low : capacity

type VenuePanelProps = {
  kind: VenueKind
  setCentre: (place: PlaceType) => void
}

const VenuePanel = ({ kind, setCentre }: VenuePanelProps) => {
  const config = CONFIG[kind]
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const sortVariable = useMemo(() => {
    if (sortBy === 'Name') return [{ name: 'ASC' as const }]
    if (sortBy === 'Capacity') return [{ capacity: 'ASC' as const }]
    return []
  }, [sortBy])

  const { data, loading } = useQuery(config.query, {
    variables: {
      options: {
        limit: 100,
        offset: 0,
        sort: sortVariable,
      },
    },
  })

  const venues: VenueRecord[] = data?.[config.dataKey] ?? []

  const filtered = useMemo(() => {
    if (!search.trim()) return venues
    const needle = search.toLowerCase()
    return venues.filter((v) => v.name?.toLowerCase().includes(needle))
  }, [venues, search])

  const handleVenueClick = (venue: VenueRecord) => {
    if (!venue.location) return
    setCentre({
      id: venue.id,
      name: venue.name,
      typename: config.typename,
      position: {
        lat: venue.location.latitude,
        lng: venue.location.longitude,
      },
    })
  }

  const SortPill = ({ value, label }: { value: SortKey; label: string }) => (
    <button
      type="button"
      onClick={() => setSortBy(sortBy === value ? '' : value)}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        sortBy === value
          ? 'border-maps/60 bg-maps/10 text-maps'
          : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 p-4 pt-0">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            {config.label}
          </h3>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${config.label.toLowerCase()}…`}
            className="min-h-11 pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by</span>
          <SortPill value="Name" label="Name" />
          <SortPill value="Capacity" label="Capacity" />
        </div>

        <RoleView roles={permitAdmin('Campus')}>
          <Button
            type="button"
            className="w-full justify-center gap-2"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="size-4" />
            {config.addLabel}
          </Button>
        </RoleView>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="space-y-2 px-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {search.trim() ? 'No matches.' : config.emptyHint}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((venue) => (
              <li key={venue.id}>
                <button
                  type="button"
                  onClick={() => handleVenueClick(venue)}
                  className="group flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-3 text-left transition-colors hover:border-border hover:bg-muted/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-maps/10 text-maps"
                  >
                    {kind === 'school' ? (
                      <GraduationCap className="size-4" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {venue.name}
                    </span>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Users className="size-3.5" />
                        {capacityNumber(venue.capacity)}
                      </span>
                      {config.showSchool && (venue.school || venue.university) ? (
                        <span className="truncate">
                          {venue.school ?? venue.university}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddVenueSheet
        kind={kind}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

export default VenuePanel
