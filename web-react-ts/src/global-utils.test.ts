/**
 * Tests for the date helpers in `global-utils`.
 *
 * `global-utils` carries its own copy of `getHumanReadableDate` (distinct from
 * the one in `lib/date-utils`) plus `getHumanReadableDateTime`. Both hardcoded
 * 'en-gb' and are called from already-localized surfaces — every weekly report
 * header ("Generated on …"), the accounts approvals list, and transaction
 * details — so they rendered English month names in every translated session.
 */
import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'
import { getHumanReadableDate, getHumanReadableDateTime } from './global-utils'
import * as globalUtils from './global-utils'
import * as dateUtils from 'lib/date-utils'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('getHumanReadableDate', () => {
  it('renders a day-first long date in English', () => {
    expect(getHumanReadableDate('2026-07-26T09:00:00Z')).toBe('26 July 2026')
  })

  it('adds the weekday when asked', () => {
    expect(getHumanReadableDate('2026-07-26T09:00:00Z', true)).toBe(
      'Sunday, 26 July 2026'
    )
  })

  it('follows the active UI language', async () => {
    await i18n.changeLanguage('de')
    expect(getHumanReadableDate('2026-07-26T09:00:00Z')).toBe('26. Juli 2026')

    await i18n.changeLanguage('pt')
    expect(getHumanReadableDate('2026-07-26T09:00:00Z')).toBe(
      '26 de julho de 2026'
    )
  })

  it('returns undefined for an empty date', () => {
    expect(getHumanReadableDate('')).toBeUndefined()
  })
})

describe('getHumanReadableDateTime', () => {
  it('includes the time and follows the active UI language', async () => {
    const english = getHumanReadableDateTime('2026-07-26T09:30:00Z')
    expect(english).toContain('26 July 2026')

    await i18n.changeLanguage('fr')
    const french = getHumanReadableDateTime('2026-07-26T09:30:00Z')
    expect(french).toContain('juillet')
    expect(french).not.toContain('July')
  })

  it('returns undefined for an empty date', () => {
    expect(getHumanReadableDateTime('')).toBeUndefined()
  })
})

/**
 * SYN-218. `global-utils` used to carry its own `getWeekNumber` /
 * `getISOWeekYear` alongside a second, divergent `getWeekNumber` in
 * `lib/date-utils`. They now resolve to one implementation; these guard
 * against a copy being reintroduced here.
 */
describe('week helpers are re-exported, not re-implemented (SYN-218)', () => {
  it('exports the very same function objects as lib/date-utils', () => {
    expect(globalUtils.getWeekNumber).toBe(dateUtils.getWeekNumber)
    expect(globalUtils.getISOWeekYear).toBe(dateUtils.getISOWeekYear)
  })

  it('does not mutate the Date handed to it', () => {
    const input = new Date(2026, 7, 31, 12, 30, 15, 250)
    const snapshot = input.getTime()

    expect(globalUtils.getWeekNumber(input)).toBe(36)
    expect(globalUtils.getISOWeekYear(input)).toBe(2026)
    expect(input.getTime()).toBe(snapshot)
  })
})
