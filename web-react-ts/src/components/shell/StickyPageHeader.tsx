import * as React from 'react'
import { cn } from 'components/lib/utils'

/**
 * Sticky page header that reserves space for the AppShell's floating mobile
 * controls.
 *
 * On mobile, AppShell renders floating `absolute … top-3 z-20 md:hidden`
 * controls over the content column: the PWA BackButton on the left
 * (`left-3`), and on the right a language switcher + sidebar toggle pair
 * (`right-3`, two `size-11` buttons with `gap-2`). Any sticky header at
 * `top-0` competes for both edges, so the default inner container reserves
 * `pl-16 pr-28` on mobile (left: one 44 px control; right: two 44 px
 * controls + gap + insets) and collapses to `md:px-4 lg:px-6` once the
 * toggles hide at the `md` breakpoint.
 *
 * Use `<StickyPageHeaderActions>` to group right-aligned action buttons —
 * it adds the `shrink-0` + `flex items-center gap-2` defaults so the
 * actions never wrap mid-icon.
 *
 * The chrome uses `z-10` so it stays *below* the `z-20` floating shell
 * controls (sidebar toggle, language switcher, PWA BackButton). Do not
 * raise the z-index.
 *
 * For multi-row headers (search bars, breadcrumbs above titles, etc.) just
 * render multiple rows as children — the chrome and edge reservations still
 * apply. If a consumer truly needs full control over the inner layout,
 * pass `bare` to skip the default container; the consumer is then
 * responsible for re-applying `pl-16 pr-28 md:px-4 lg:px-6` on both edges.
 */
type StickyPageHeaderProps = React.HTMLAttributes<HTMLElement> & {
  density?: 'default' | 'compact'
  bare?: boolean
  innerClassName?: string
}

const outerChrome =
  'sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur'

const innerByDensity = {
  default: 'mx-auto max-w-6xl py-3 pl-16 pr-28 md:px-4 lg:px-6',
  compact: 'mx-auto max-w-6xl py-2 pl-16 pr-28 md:px-4 lg:px-6',
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
