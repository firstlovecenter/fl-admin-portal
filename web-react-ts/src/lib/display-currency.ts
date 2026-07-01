import { ChurchLevel } from 'global-types'

/**
 * Church levels whose money figures MAY be displayed in USD.
 *
 * Oversight and Denomination consolidate campuses that may legitimately use
 * different local currencies (GHS, BDT, GMD, MGA, SLL, XAF, ZMW). When they span
 * more than one currency, a raw sum of local `income` adds unlike currencies and
 * is meaningless, so the aggregator stores their `income` as the USD-converted
 * total and the UI labels it USD. But a *single-currency* oversight (e.g. all-GHS
 * Outside Accra) keeps its native currency — forcing USD there produces a figure
 * ~1/10th the real cedi total that no longer matches the campus or report figures.
 */
const USD_DISPLAY_LEVELS: ReadonlyArray<ChurchLevel> = ['Oversight', 'Denomination']

/**
 * True when money should be displayed in USD.
 *
 * When the actual income `currency` (from the aggregate) is known, trust it —
 * a single-currency oversight is NOT a USD level even though it consolidates
 * campuses. When it isn't known (not yet loaded, or the caller has none), fall
 * back to the level: Oversight and Denomination default to USD.
 *
 * Accepts the GraphQL `__typename` or a `churchType`/level string.
 */
export const isUsdDisplayLevel = (
  churchLevel: ChurchLevel | string | null | undefined,
  incomeCurrency?: string | null
): boolean => {
  if (incomeCurrency != null && incomeCurrency !== '') {
    return incomeCurrency.toUpperCase() === 'USD'
  }
  return !!churchLevel && USD_DISPLAY_LEVELS.includes(churchLevel as ChurchLevel)
}
