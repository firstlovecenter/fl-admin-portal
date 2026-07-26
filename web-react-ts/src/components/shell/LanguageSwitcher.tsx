import { useState } from 'react'
import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'components/ui/popover'
import { cn } from 'components/lib/utils'
import useLanguage from 'hooks/useLanguage'

type LanguageSwitcherProps = {
  /** Compact icon-only trigger (mobile chrome / collapsed sidebar). */
  variant?: 'icon' | 'row'
  className?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/**
 * Tap-friendly language picker for the app shell. Nested profile-menu
 * submenus are easy to miss on touch (and often need hover), so this is the
 * primary discovery surface — Settings LanguageCard remains for preference
 * browsing.
 */
export const LanguageSwitcher = ({
  variant = 'icon',
  className,
  align = 'end',
  side = 'bottom',
}: LanguageSwitcherProps) => {
  const { t } = useTranslation()
  const { language, languages, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const current =
    languages.find((item) => item.code === language) ?? languages[0]

  const pick = (code: string) => {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'row' ? (
          <button
            type="button"
            aria-label={t('language.ariaLabel')}
            className={cn(
              'flex h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors',
              'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              className
            )}
          >
            <Languages className="size-4 shrink-0" />
            <span className="flex-1 truncate text-left">
              {t('language.menuLabel')}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/55">
              {current?.nativeName}
            </span>
          </button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('language.ariaLabel')}
            title={t('language.menuLabel')}
            className={cn(
              'size-11 rounded-full border border-sidebar-border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground',
              className
            )}
          >
            <Languages className="size-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} side={side} className="w-56 p-2">
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('language.menuLabel')}
        </p>
        <ul
          className="space-y-0.5"
          role="listbox"
          aria-label={t('language.ariaLabel')}
        >
          {languages.map((lang) => {
            const selected = lang.code === language
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(lang.code)}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors',
                    selected
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-foreground hover:bg-accent/60'
                  )}
                >
                  <span className="flex-1 text-left">{lang.nativeName}</span>
                  {selected && <Check className="size-4 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
