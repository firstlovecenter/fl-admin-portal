import { Building2, Download, Globe2, Loader2, LocateFixed, Users } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Switch } from 'components/ui/switch'
import { Label } from 'components/ui/label'
import GooglePlacesCombobox from './GooglePlacesCombobox'
import MemberPlacesCombobox from './MemberPlacesCombobox'
import type { LazyQueryExecFunction, OperationVariables } from '@apollo/client'
import type { PlaceType } from '../types'

type SearchPanelProps = {
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
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    {children}
  </p>
)

const SearchPanel = ({
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
}: SearchPanelProps) => {
  const noop = () => {}

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SectionLabel>Search a place</SectionLabel>
        <GooglePlacesCombobox
          name="google-places-search"
          placeholder="Search an address"
          initialValue=""
          setCentre={setCentre}
          handleClose={noop}
        />
      </div>

      <div className="space-y-2">
        <SectionLabel>Search the FLC database</SectionLabel>
        <MemberPlacesCombobox
          name="member-places-search"
          placeholder="Members, Bacentas, venues…"
          initialValue=""
          setCentre={setCentre}
          placesSearchByName={placesSearchByName}
          handleClose={noop}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Label
              htmlFor="show-all-bacentas"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Globe2 className="size-4 text-maps" />
              Show all Bacentas
            </Label>
            <p className="text-xs text-muted-foreground">
              Drop a marker for every Bacenta with a recorded location and zoom
              out to fit the whole network.
            </p>
          </div>
          <div className="flex h-11 items-center">
            {loadingAllBacentas ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="show-all-bacentas"
                checked={showAllBacentas}
                onCheckedChange={onToggleAllBacentas}
                aria-label="Toggle all Bacentas overlay"
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel>Quick jumps</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 flex-col items-start gap-1 py-3 text-left"
            onClick={onMyLocation}
          >
            <LocateFixed className="size-4 text-maps" />
            <span className="text-sm font-medium">My location</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 flex-col items-start gap-1 py-3 text-left"
            onClick={onFlcHq}
          >
            <Building2 className="size-4 text-maps" />
            <span className="text-sm font-medium">FLC HQ</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel>Outreach</SectionLabel>
        <Button
          type="button"
          variant="default"
          className="w-full justify-start gap-2"
          onClick={onLoadUnvisitedMembers}
          disabled={loadingUnvisited}
        >
          <Users className="size-4" />
          {loadingUnvisited ? 'Loading…' : 'Load unvisited members'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Drops a marker for every member in your council that hasn't yet been
          visited this season.
        </p>
      </div>

      {onDownloadDirectory ? (
        <div className="space-y-2">
          <SectionLabel>Directory</SectionLabel>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-2"
            onClick={onDownloadDirectory}
            disabled={downloadingDirectory}
          >
            {downloadingDirectory ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {downloadingDirectory
              ? 'Generating CSV…'
              : downloadDirectoryLabel ?? 'Download directory'}
          </Button>
          <p className="text-xs text-muted-foreground">
            One CSV per level. Bacenta rows include latitude / longitude for
            mapping and route planning.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default SearchPanel
