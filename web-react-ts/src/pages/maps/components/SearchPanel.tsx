import { useTranslation } from 'react-i18next'
import {
  Building2,
  Download,
  Globe2,
  Loader2,
  LocateFixed,
  Users,
} from 'lucide-react'
import { Button } from 'components/ui/button'
import { Switch } from 'components/ui/switch'
import { Label } from 'components/ui/label'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'
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
  const { t } = useTranslation()
  const noop = () => {}

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SectionLabel>{t('maps.search.aPlace')}</SectionLabel>
        <GooglePlacesCombobox
          name="google-places-search"
          placeholder={t('maps.search.anAddress')}
          initialValue=""
          setCentre={setCentre}
          handleClose={noop}
        />
      </div>

      <div className="space-y-2">
        <SectionLabel>{t('maps.search.flcDatabase')}</SectionLabel>
        <MemberPlacesCombobox
          name="member-places-search"
          placeholder={t('maps.search.databasePlaceholder')}
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
              {t('maps.search.showAllBacentas')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('maps.search.showAllBacentasHint')}
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
                aria-label={t('maps.search.toggleBacentasOverlay')}
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel>{t('maps.search.quickJumps')}</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 flex-col items-start gap-1 py-3 text-left"
            onClick={onMyLocation}
          >
            <LocateFixed className="size-4 text-maps" />
            <span className="text-sm font-medium">
              {t('maps.search.myLocation')}
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 flex-col items-start gap-1 py-3 text-left"
            onClick={onFlcHq}
          >
            <Building2 className="size-4 text-maps" />
            <span className="text-sm font-medium">
              {t('maps.search.flcHq')}
            </span>
          </Button>
        </div>
      </div>

      <RoleView roles={permitLeaderAdmin('Council')}>
        <div className="space-y-2">
          <SectionLabel>{t('maps.search.outreach')}</SectionLabel>
          <Button
            type="button"
            variant="default"
            className="w-full justify-start gap-2"
            onClick={onLoadUnvisitedMembers}
            disabled={loadingUnvisited}
          >
            <Users className="size-4" />
            {loadingUnvisited
              ? t('maps.search.loading')
              : t('maps.search.loadUnvisited')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('maps.search.loadUnvisitedHint')}
          </p>
        </div>
      </RoleView>

      {onDownloadDirectory ? (
        <div className="space-y-2">
          <SectionLabel>{t('maps.search.directory')}</SectionLabel>
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
              : downloadDirectoryLabel ?? t('maps.search.downloadDirectory')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('maps.search.downloadDirectoryHint')}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default SearchPanel
