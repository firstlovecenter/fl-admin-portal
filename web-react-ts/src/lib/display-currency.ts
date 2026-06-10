import { ChurchLevel } from 'global-types'

/**
 * Church levels whose money figures are displayed in USD.
 *
 * Oversight and Denomination consolidate campuses that may legitimately use
 * different local currencies (GHS, BDT, GMD, MGA, SLL, XAF, ZMW). A raw sum of
 * local `income` across those campuses adds unlike currencies and is meaningless,
 * so the aggregator stores their `income` as the USD-converted total
 * (income === dollarIncome at these levels). The UI must therefore label and
 * format that money as USD — never the viewer's local currency.
 */
const USD_DISPLAY_LEVELS: ReadonlyArray<ChurchLevel> = ['Oversight', 'Denomination']

/**
 * True when money at this church level is stored/displayed in USD
 * (Oversight, Denomination). Accepts the GraphQL `__typename` or a
 * `churchType`/level string.
 */
export const isUsdDisplayLevel = (
  churchLevel: ChurchLevel | string | null | undefined
): boolean =>
  !!churchLevel && USD_DISPLAY_LEVELS.includes(churchLevel as ChurchLevel)
