import { Card } from 'components/ui/card'
import { cn } from 'components/lib/utils'
import { ChildSummary } from 'pages/shepherding-control/shepherding-control-types'

type Props = {
  child: ChildSummary
  onSelect: (child: ChildSummary) => void
}

const ChildChurchCard = ({ child, onSelect }: Props) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(child)}
      className={cn(
        'group min-h-16 w-full text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl'
      )}
    >
      <Card className="min-h-16 p-5 transition-transform group-hover:scale-[1.02] group-active:scale-[0.99] bg-card/80 border-white/10">
        <p className="truncate text-2xl font-semibold text-foreground">
          {child.name}
        </p>
        <p className="mt-1 text-base uppercase tracking-wider text-muted-foreground">
          Tap to drill in
        </p>
      </Card>
    </button>
  )
}

export default ChildChurchCard
