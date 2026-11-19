import React from 'react'
import { cn } from 'components/lib/utils'
import { Button } from 'components/ui/button'
import { Loader2 } from 'lucide-react'

export type BulkAction = {
  label: string
  variant?: 'default' | 'outline' | 'destructive' | 'ghost'
  onClick: () => void
  icon?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  className?: string
}

type BulkActionBarProps = {
  count: number
  label?: string
  actions: BulkAction[]
}

const BulkActionBar = ({
  count,
  label = 'selected',
  actions,
}: BulkActionBarProps) => {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border',
        'transition-transform duration-200 ease-in-out',
        count > 0 ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      )}
      aria-hidden={count === 0}
    >
      <div className="pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 px-4">
        <p className="text-sm font-medium text-foreground mb-3">
          <span className="text-primary font-bold">{count}</span>{' '}
          {label}
        </p>
        <div className="flex items-center gap-2">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant ?? 'outline'}
              className={cn('min-h-[44px] gap-1.5 flex-1', action.className)}
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
            >
              {action.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                action.icon
              )}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BulkActionBar
