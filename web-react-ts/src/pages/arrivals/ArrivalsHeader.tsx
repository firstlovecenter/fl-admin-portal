import ArrivalDateSelector from 'components/ArrivalDateSelector/ArrivalDateSelector'

import DownloadArrivalsButton from './DownloadArrivalsButton'
import {
  ArrivalsDownloadLevel,
  isArrivalsDownloadLevel,
} from './utils/buildArrivalsWorkbook'

type ArrivalsHeaderProps = {
  // The user's church-in-focus level. Bootstrap dashboards just pass
  // `'Campus'` / `'Stream'` / etc. directly. If the level isn't one of the
  // download-supported levels (e.g. Bacenta when reused on a per-Bacenta
  // page later), the download button hides automatically.
  level: string | null | undefined
  churchId: string | undefined
}

/**
 * Drop-in Tailwind/Shadcn header that gives the legacy Bootstrap arrivals
 * dashboards the new date selector and download dropdown without requiring
 * a full redesign of the page. Sits above the existing Bootstrap markup;
 * the rest of the dashboard stays untouched.
 */
const ArrivalsHeader = ({ level, churchId }: ArrivalsHeaderProps) => {
  const downloadLevel: ArrivalsDownloadLevel | null = isArrivalsDownloadLevel(
    level ?? undefined
  )
    ? (level as ArrivalsDownloadLevel)
    : null

  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <ArrivalDateSelector className="lg:max-w-md lg:flex-1" />
      {downloadLevel && churchId && (
        <DownloadArrivalsButton level={downloadLevel} churchId={churchId} />
      )}
    </div>
  )
}

export default ArrivalsHeader
