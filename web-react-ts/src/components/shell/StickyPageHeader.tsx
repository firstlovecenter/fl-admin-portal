import * as React from 'react'
import { cn } from 'components/lib/utils'

/**
 * Sticky page header that reserves space for the AppShell's floating mobile
 * sidebar toggle.
 *
 * The mobile sidebar toggle in `AppShell` lives at
 * `absolute right-3 top-3 z-20 md:hidden` and is 44 x 44 px. Any sticky
 * header at `top-0` competes for that real estate, so the default inner
 * container reserves `pr-16` on mobile (covers the toggle's `right-3` inset
 * + 44 px hit area + breathing room) and pulls back to `md:pr-4 lg:px-6`
 * once the toggle hides at the `md` breakpoint.
 *
 * Use `<StickyPageHeaderActions>` to group right-aligned action buttons —
 * it adds the `shrink-0` + `flex items-center gap-2` defaults so the
 * actions never wrap mid-icon.
 *
 * For multi-row headers (search bars, breadcrumbs above titles, etc.) just
 * render multiple rows as children — the chrome and right-side reservation
 * still apply. If a consumer truly needs full control over the inner
 * layout, pass `bare` to skip the default container; the consumer is then
 * responsible for re-applying `pr-16 md:pr-4 lg:px-6` on the right edge.
 */
type StickyPageHeaderProps = React.HTMLAttributes<HTMLElement> & {
  density?: 'default' | 'compact'
  bare?: boolean
  innerClassName?: string
}

const outerChrome =
  'sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur'

const innerByDensity = {
  default: 'mx-auto max-w-6xl py-3 pl-4 pr-16 md:pr-4 lg:px-6',
  compact: 'mx-auto max-w-6xl py-2 pl-4 pr-16 md:pr-4 lg:px-6',
} as const

const StickyPageHeader = ({
  className,
  innerClassName,
  density = 'default',
  bare = false,
  children,
  ...rest
}: StickyPageHeaderProps) => {
  if (bare) {
    return (
      <header className={cn(outerChrome, className)} {...rest}>
        {children}
      </header>
    )
  }
  return (
    <header className={cn(outerChrome, className)} {...rest}>
      <div className={cn(innerByDensity[density], innerClassName)}>
        {children}
      </div>
    </header>
  )
}

const StickyPageHeaderActions = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex shrink-0 items-center gap-2', className)}
    {...props}
  />
)

export { StickyPageHeader, StickyPageHeaderActions }
