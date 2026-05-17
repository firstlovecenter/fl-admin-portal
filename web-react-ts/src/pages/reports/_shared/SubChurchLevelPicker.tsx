import { useId } from 'react'
import { Checkbox } from 'components/ui/checkbox'
import { ListChecks, ListX } from 'lucide-react'
import {
  SUB_CHURCH_TARGETS_ORDERED,
  type SubChurchesTargetLevel,
} from './report-types'

type Props = {
  // Levels the picker offers, top-down. Caller passes
  // `TARGETS_BY_SCOPE[scope]` after stripping any that don't apply.
  availableLevels: readonly SubChurchesTargetLevel[]
  selectedLevels: readonly SubChurchesTargetLevel[]
  onChange: (next: SubChurchesTargetLevel[]) => void
}

// Multi-select picker for the four metric reports' "by Sub-Church" pages.
// The DEEPEST tick determines row granularity; higher ticks decorate each
// row with that ancestor's Name / Leader / Leader Phone columns. At least
// one tick is required — the page can't render without a target.
//
// Rendered as a row of checkboxes. Bacenta is intentionally excluded
// (Bacenta-as-target is unsupported on the backend; see
// `weekly-report-cypher.ts` comment).
const SubChurchLevelPicker = ({
  availableLevels,
  selectedLevels,
  onChange,
}: Props) => {
  const headingId = useId()
  if (availableLevels.length === 0) return null

  const selected = new Set(selectedLevels)
  const allTicked = availableLevels.every((l) => selected.has(l))

  const toggle = (level: SubChurchesTargetLevel) => {
    const next = new Set(selected)
    if (next.has(level)) {
      // Don't let the user unselect the last tick — without one we have
      // no target level and the page can't query anything.
      if (next.size === 1) return
      next.delete(level)
    } else {
      next.add(level)
    }
    // Re-emit in canonical top-down order so consumers can rely on
    // `selectedLevels[selectedLevels.length - 1]` being the deepest.
    onChange(
      SUB_CHURCH_TARGETS_ORDERED.filter((l) => next.has(l) && availableLevels.includes(l))
    )
  }

  const selectAll = () => onChange([...availableLevels])
  // Leave the deepest available level ticked so the page still has a
  // target. Deepest = last entry in canonical top-down order intersected
  // with what's available.
  const deepest = availableLevels[availableLevels.length - 1]
  const clearAll = () => onChange([deepest])

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            id={headingId}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Sub-church breakdown
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The deepest ticked level sets the row granularity. Each
            additional tick adds that level&apos;s name, leader, and leader
            phone as columns.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={selectAll}
            disabled={allTicked}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ListChecks className="size-3.5" />
            All
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={selected.size === 1}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ListX className="size-3.5" />
            Reset
          </button>
        </div>
      </div>

      <ul
        role="group"
        aria-labelledby={headingId}
        className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4"
      >
        {availableLevels.map((level) => {
          const isOn = selected.has(level)
          const isLastTick = isOn && selected.size === 1
          return (
            <li key={level}>
              <label
                className={
                  isLastTick
                    ? 'flex min-h-11 cursor-not-allowed items-center gap-3 rounded-md border border-transparent px-3 py-2 opacity-60'
                    : 'flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-accent/40'
                }
              >
                <Checkbox
                  checked={isOn}
                  disabled={isLastTick}
                  onCheckedChange={() => toggle(level)}
                  aria-label={`Include ${level} as row or ancestor column`}
                />
                <span className="text-sm font-medium text-foreground">
                  {level}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default SubChurchLevelPicker
