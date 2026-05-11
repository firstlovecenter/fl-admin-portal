import { type ReactNode } from 'react'

type StatTileProps = {
  icon: ReactNode
  label: string
  value: string
}

const StatTile = ({ icon, label, value }: StatTileProps) => (
  <div className="rounded-lg border border-border bg-background/40 p-3">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
    </div>
    <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">
      {value}
    </p>
  </div>
)

export default StatTile
