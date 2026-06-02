import { useNavigate } from 'react-router-dom'
import { Building, Building2, GraduationCap, Search, Tent } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from 'components/ui/tabs'
import { cn } from 'components/lib/utils'
import SearchPanel from './SearchPanel'
import VenuePanel from './VenuePanel'
import type { LazyQueryExecFunction, OperationVariables } from '@apollo/client'
import type { PlaceType, VenueKind } from '../types'

export type PanelKey = 'search' | VenueKind

const PANEL_PATH: Record<PanelKey, string> = {
  search: '/maps',
  indoor: '/maps/indoor-venues',
  outdoor: '/maps/outdoor-venues',
  hostel: '/maps/hostels',
  school: '/maps/schools',
}

const TAB_DEFS: Array<{
  key: PanelKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { key: 'search', label: 'Search', icon: Search },
  { key: 'indoor', label: 'Indoor', icon: Building2 },
  { key: 'outdoor', label: 'Outdoor', icon: Tent },
  { key: 'hostel', label: 'Hostels', icon: Building },
  { key: 'school', label: 'Schools', icon: GraduationCap },
]

type MapPanelProps = {
  active: PanelKey
  setCentre: (place: PlaceType) => void
  onMyLocation: () => void
  onFlcHq: () => void
  onLoadUnvisitedMembers: () => void
  loadingUnvisited?: boolean
  placesSearchByName: LazyQueryExecFunction<unknown, OperationVariables>
  showAllBacentas: boolean
  onToggleAllBacentas: (next: boolean) => void
  loadingAllBacentas: boolean
  onDownloadDirectory?: () => void
  downloadDirectoryLabel?: string
  downloadingDirectory?: boolean
  className?: string
}

const MapPanel = ({
  active,
  setCentre,
  onMyLocation,
  onFlcHq,
  onLoadUnvisitedMembers,
  loadingUnvisited,
  placesSearchByName,
  showAllBacentas,
  onToggleAllBacentas,
  loadingAllBacentas,
  onDownloadDirectory,
  downloadDirectoryLabel,
  downloadingDirectory,
  className,
}: MapPanelProps) => {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-card text-card-foreground',
        className
      )}
    >
      <Tabs
        value={active}
        onValueChange={(v) => navigate(PANEL_PATH[v as PanelKey])}
        className="flex h-full min-h-0 flex-col"
      >
        <div className="border-b border-border px-3 pt-3 pb-3">
          <TabsList className="grid w-full grid-cols-5 gap-1 bg-muted/40 p-1">
            {TAB_DEFS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] sm:text-xs"
                aria-label={label}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {active === 'search' ? (
            <div className="h-full overflow-y-auto p-4">
              <SearchPanel
                setCentre={setCentre}
                onMyLocation={onMyLocation}
                onFlcHq={onFlcHq}
                onLoadUnvisitedMembers={onLoadUnvisitedMembers}
                loadingUnvisited={loadingUnvisited}
                placesSearchByName={placesSearchByName}
                showAllBacentas={showAllBacentas}
                onToggleAllBacentas={onToggleAllBacentas}
                loadingAllBacentas={loadingAllBacentas}
                onDownloadDirectory={onDownloadDirectory}
                downloadDirectoryLabel={downloadDirectoryLabel}
                downloadingDirectory={downloadingDirectory}
              />
            </div>
          ) : (
            <div className="h-full pt-4">
              <VenuePanel kind={active} setCentre={setCentre} />
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}

export default MapPanel
