import { useContext, useMemo } from 'react'
import { MemberContext } from 'contexts/MemberContext'

/**
 * SYN-113 — shared currency formatter for the accounts surface.
 *
 * Reads `currentUser.currency` from MemberContext (falls back to GHS).
 * Returns a memoised `format(value)` that emits the amount with the
 * correct ISO currency symbol and `tabular-nums`-friendly digit
 * grouping. Use in every accounts amount render so we stop hardcoding
 * `'GHS'` across 5+ files.
 *
 * Locale defaults to `en-GH`; fall back to `en-GB` (identical comma /
 * dot grouping, universally supported in CLDR) when the runtime
 * doesn't have `en-GH` data — older Node Lambda runtimes have done
 * this in the past.
 */
export const useCurrencyFormatter = () => {
  const { currentUser } = useContext(MemberContext)
  const currency: string = currentUser?.currency || 'GHS'

  return useMemo(() => {
    const tryFormat = (locale: string) => {
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        })
      } catch {
        return null
      }
    }

    const fmt = tryFormat('en-GH') ?? tryFormat('en-GB') ?? tryFormat('en-US')

    return {
      currency,
      format: (value: number | null | undefined): string => {
        if (value == null || !Number.isFinite(value)) return '—'
        return fmt ? fmt.format(value) : `${currency} ${value.toLocaleString()}`
      },
    }
  }, [currency])
}
