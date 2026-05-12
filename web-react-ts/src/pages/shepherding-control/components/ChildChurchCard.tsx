import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from 'components/ui/avatar'
import { Card } from 'components/ui/card'
import { cn } from 'components/lib/utils'
import { ChildSummary } from 'pages/shepherding-control/shepherding-control-types'

type Props = {
  child: ChildSummary
  onSelect: (child: ChildSummary) => void
}

const ChildChurchCard = ({ child, onSelect }: Props) => {
  const initials = `${child.leader?.firstName?.[0] ?? ''}${
    child.leader?.lastName?.[0] ?? ''
  }`

  return (
    <button
      type="button"
      onClick={() => onSelect(child)}
      className={cn(
        'group min-h-16 w-full text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl'
      )}
    >
      <Card className="min-h-16 p-5 transition-transform group-hover:scale-[1.02] group-active:scale-[0.99] bg-card border-border">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 shrink-0 border border-border">
            <AvatarImage
              src={child.leader?.pictureUrl ?? undefined}
              alt={child.leader?.nameWithTitle ?? child.name}
            />
            <AvatarFallback className="bg-muted text-lg font-semibold text-muted-foreground">
              {initials || '—'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl font-semibold text-foreground">
              {child.name}
            </p>
            <p className="mt-1 truncate text-base text-muted-foreground">
              {child.leader?.nameWithTitle ?? 'No leader assigned'}
            </p>
          </div>
        </div>
      </Card>
    </button>
  )
}

export default ChildChurchCard
