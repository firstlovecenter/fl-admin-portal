import { useId } from 'react'
import { Checkbox } from 'components/ui/checkbox'
import type { ChurchLevel } from 'global-types'
import { ListChecks, ListX } from 'lucide-react'

type Props = {
  // Levels available for the user to tick — typically the descendants of
  // the scope, top-down (e.g. Oversight scope -> Campus..Bacenta).
  availableLevels: ChurchLevel[]
  selectedLevels: ChurchLevel[]
  onChange: (next: ChurchLevel[]) => void
}

// Multi-select picker that controls which ancestor church columns (Name /
// Leader / Leader Phone) appear in the membership CSV. Rows are always
// per-member; ticks only toggle column triplets on/off. Zero ticks is a
// legal state — the CSV falls back to identity columns only, matching
// the Bacenta-scope (no-descendants) behaviour.
//
// Renders nothing when there are no available levels (e.g. Bacenta scope).
const AncestorLevelPicker = ({
  availableLevels,
  selectedLevels,
  onChange,
}: Props) => {
  const headingId = useId()
  if (availableLevels.length === 0) return null

  const selected = new Set(selectedLevels)
  const allTicked = availableLevels.every((l) => selected.has(l))
  const noneTicked = selected.size === 0

  const toggle = (level: ChurchLevel) => {
    const next = new Set(selected)
    if (next.has(level)) next.delete(level)
    else next.add(level)
    // Re-emit in availableLevels order so callers get a stable, top-down
    // selection regardless of click order.
    onChange(availableLevels.filter((l) => next.has(l)))
  }

  const selectAll = () => onChange([...availableLevels])
  const clearAll = () => onChange([])

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
            Sub-church columns
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tick a level to add its church name, leader, and leader phone to
            every row.
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
            disabled={noneTicked}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ListX className="size-3.5" />
            Clear
          </button>
        </div>
      </div>

      <ul
        role="group"
        aria-labelledby={headingId}
        className="mt-3 grid grid-cols-2 gap-1.5 lg:grid-cols-1"
      >
        {availableLevels.map((level) => {
          const isOn = selected.has(level)
          return (
            <li key={level}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-accent/40">
                <Checkbox
                  checked={isOn}
                  onCheckedChange={() => toggle(level)}
                  aria-label={`Include ${level} columns`}
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

export default AncestorLevelPicker
