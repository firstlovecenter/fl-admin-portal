import { Loader2 } from 'lucide-react'
import { type ComponentType, type ReactNode } from 'react'

import { cn } from 'components/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from 'components/ui/drawer'
import { useIsMobile } from 'hooks/use-mobile'

type Accent = 'arrivals' | 'defaulters' | 'banking' | 'members' | 'churches'

const accentBg: Record<Accent, string> = {
  arrivals: 'bg-arrivals/10',
  defaulters: 'bg-defaulters/10',
  banking: 'bg-banking/10',
  members: 'bg-members/10',
  churches: 'bg-churches/10',
}

const accentText: Record<Accent, string> = {
  arrivals: 'text-arrivals',
  defaulters: 'text-defaulters',
  banking: 'text-banking',
  members: 'text-members',
  churches: 'text-churches',
}

const accentRing: Record<Accent, string> = {
  arrivals: 'ring-arrivals',
  defaulters: 'ring-defaulters',
  banking: 'ring-banking',
  members: 'ring-members',
  churches: 'ring-churches',
}

export type DownloadFormatOption<TFormat extends string> = {
  id: TFormat
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
}

type DownloadFormatDialogProps<TFormat extends string> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  formats: ReadonlyArray<DownloadFormatOption<TFormat>>
  pending: TFormat | null
  onSelect: (id: TFormat) => void
  accent?: Accent
}

type FormatGridProps<TFormat extends string> = {
  formats: ReadonlyArray<DownloadFormatOption<TFormat>>
  pending: TFormat | null
  onSelect: (id: TFormat) => void
  accent: Accent
}

const FormatGrid = <TFormat extends string>({
  formats,
  pending,
  onSelect,
  accent,
}: FormatGridProps<TFormat>) => (
  <div className="grid gap-3">
    {formats.map((format) => {
      const Icon = format.icon
      const isPending = pending === format.id
      const isDisabled = pending !== null && !isPending
      return (
        <button
          key={format.id}
          type="button"
          onClick={() => onSelect(format.id)}
          disabled={pending !== null}
          aria-busy={isPending}
          className={cn(
            'group flex min-h-11 items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors',
            'hover:border-foreground/20 hover:bg-muted/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed',
            isPending
              ? cn('border-transparent ring-2', accentRing[accent])
              : 'border-border',
            isDisabled && 'opacity-50'
          )}
        >
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              accentBg[accent],
              accentText[accent]
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                <span className="sr-only">Downloading…</span>
              </>
            ) : (
              <Icon className="size-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{format.label}</p>
            <p className="text-sm text-muted-foreground">{format.description}</p>
          </div>
        </button>
      )
    })}
  </div>
)

const DownloadFormatDialog = <TFormat extends string>({
  open,
  onOpenChange,
  title,
  description,
  formats,
  pending,
  onSelect,
  accent = 'banking',
}: DownloadFormatDialogProps<TFormat>) => {
  const isMobile = useIsMobile()

  const handleOpenChange = (next: boolean) => {
    if (pending !== null && !next) return
    onOpenChange(next)
  }

  const grid: ReactNode = (
    <FormatGrid
      formats={formats}
      pending={pending}
      onSelect={onSelect}
      accent={accent}
    />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="px-4 pb-6">{grid}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {grid}
      </DialogContent>
    </Dialog>
  )
}

export default DownloadFormatDialog
