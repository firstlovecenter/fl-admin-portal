import { Check, RotateCcw } from 'lucide-react'
import { Button } from 'components/ui/button'

type Props = {
  isDirty: boolean
  onApply: () => void
  onDiscard: () => void
}

// Inline status bar that surfaces a "you have uncommitted filter
// changes" state. The Bussing / Weekday sub-church pages use this so a
// rapid sequence of checkbox toggles + date nudges only fires one query
// (on Apply) instead of a flurry of refetches. Hidden when there's
// nothing to apply — first-time visitors who just want the default
// report never see this band.
const ApplyBar = ({ isDirty, onApply, onDiscard }: Props) => {
  if (!isDirty) return null
  return (
    <section
      role="status"
      aria-live="polite"
      className="flex flex-col gap-3 rounded-xl border border-banking/30 bg-banking/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium text-foreground">
        Filters changed — click{' '}
        <span className="font-semibold text-banking">Apply</span> to refresh
        the report.
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          className="min-h-11 gap-1.5"
        >
          <RotateCcw className="size-4" />
          Discard
        </Button>
        <Button
          type="button"
          onClick={onApply}
          className="min-h-11 gap-1.5"
        >
          <Check className="size-4" />
          Apply
        </Button>
      </div>
    </section>
  )
}

export default ApplyBar
