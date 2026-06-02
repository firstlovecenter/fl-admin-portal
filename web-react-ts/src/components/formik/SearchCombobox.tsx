import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import { Label } from 'components/ui/label'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from 'components/ui/popover'
import { CommandEmpty, CommandItem, CommandList } from 'components/ui/command'
import { cn } from 'components/lib/utils'
import TextError from './TextError/TextError'

type SearchComboboxProps<T> = {
  value: string
  onValueChange: (value: string) => void
  onSelect: (item: T) => void

  suggestions: T[]
  getItemKey: (item: T) => string
  getItemValue: (item: T) => string
  renderItem?: (item: T) => React.ReactNode

  label?: string
  name?: string
  id?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  emptyMessage?: string
  className?: string
}

function SearchCombobox<T>({
  value,
  onValueChange,
  onSelect,
  suggestions,
  getItemKey,
  getItemValue,
  renderItem,
  label,
  name,
  id,
  placeholder,
  error,
  disabled,
  emptyMessage = 'No results found',
  className,
}: SearchComboboxProps<T>) {
  const inputId = id ?? name
  const [open, setOpen] = React.useState(false)
  const anchorRef = React.useRef<HTMLDivElement>(null)

  const trimmed = value?.trim() ?? ''
  const showList = open && trimmed.length > 0

  const handleSelect = (item: T) => {
    onSelect(item)
    setOpen(false)
  }

  const hasError = Boolean(error)

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <CommandPrimitive
        shouldFilter={false}
        loop
        className="overflow-visible bg-transparent"
      >
        <Popover open={showList} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <div ref={anchorRef} className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <CommandPrimitive.Input
                id={inputId}
                name={name}
                placeholder={placeholder}
                value={value}
                onValueChange={onValueChange}
                onFocus={() => setOpen(true)}
                disabled={disabled}
                autoComplete="off"
                aria-invalid={hasError || undefined}
                className={cn(
                  'flex min-h-11 w-full min-w-0 rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-base text-foreground shadow-xs outline-none transition-[color,box-shadow]',
                  'placeholder:text-muted-foreground',
                  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                  'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                  'md:text-sm dark:bg-input/30'
                )}
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (anchorRef.current?.contains(e.target as Node)) {
                e.preventDefault()
              }
            }}
            className="w-[var(--radix-popover-trigger-width)] min-w-[--radix-popover-trigger-width] p-0"
          >
            <CommandList>
              {suggestions.length === 0 ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : (
                suggestions.map((item) => (
                  <CommandItem
                    key={getItemKey(item)}
                    value={getItemKey(item)}
                    onSelect={() => handleSelect(item)}
                  >
                    {renderItem ? renderItem(item) : getItemValue(item)}
                  </CommandItem>
                ))
              )}
            </CommandList>
          </PopoverContent>
        </Popover>
      </CommandPrimitive>
      {hasError ? <TextError>{error}</TextError> : null}
    </div>
  )
}

export default SearchCombobox
