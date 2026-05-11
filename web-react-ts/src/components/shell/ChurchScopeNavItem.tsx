import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Building2 } from 'lucide-react'
import { cn } from 'components/lib/utils'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { ChurchContext } from 'contexts/ChurchContext'
import { formatChurchLevel } from 'lib/scope-display'

// Keep in sync with the church types that register a /displaydetails route in
// pages/directory/directoryRoutes.ts. Drift hides the button silently.
const DISPLAYDETAILS_CHURCH_TYPES = new Set([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'Denomination',
])

interface ChurchScopeNavItemProps {
  /** When false (desktop collapsed), only the icon is shown. Defaults to true. */
  open?: boolean
  /** Called after navigation — used by the mobile drawer to dismiss itself. */
  onNavigate?: () => void
  /** Layout variant. Mobile gets a taller hit area to match MobileNavItem. */
  variant?: 'desktop' | 'mobile'
}

export const ChurchScopeNavItem = ({
  open = true,
  onNavigate,
  variant = 'desktop',
}: ChurchScopeNavItemProps) => {
  const { selectedScope } = useChurchRoleScope()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clickCard } = useContext(ChurchContext) as any
  const navigate = useNavigate()

  if (
    !selectedScope ||
    !DISPLAYDETAILS_CHURCH_TYPES.has(selectedScope.churchType)
  )
    return null

  const typeLabel = formatChurchLevel(selectedScope.churchType)
  const ariaLabel = `View ${selectedScope.churchName} ${typeLabel} details`

  const handleClick = () => {
    clickCard({
      id: selectedScope.churchId,
      name: selectedScope.churchName,
      __typename: selectedScope.churchType,
    })
    navigate(`/${selectedScope.churchType.toLowerCase()}/displaydetails`)
    onNavigate?.()
  }

  const label = (
    <>
      <span className="truncate whitespace-nowrap font-medium">
        {selectedScope.churchName}
      </span>
      <span className="shrink-0 whitespace-nowrap rounded bg-sidebar-accent px-1 py-px text-[10px] text-sidebar-foreground/55">
        {typeLabel}
      </span>
    </>
  )

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        className={cn(
          'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors',
          'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground active:scale-[0.98]'
        )}
      >
        <Building2 className="size-4 shrink-0 text-churches" />
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
          {label}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      title={`${selectedScope.churchName} ${typeLabel}`}
      className={cn(
        'flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors',
        'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground active:scale-[0.98]'
      )}
    >
      <Building2 className="size-5 shrink-0 text-churches" />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.12 }}
            className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
