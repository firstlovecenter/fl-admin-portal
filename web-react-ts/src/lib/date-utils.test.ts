/**
 * Tests for `lib/date-utils`.
 *
 * Focus is the localization behaviour added on this branch:
 *  - `parseDate` and `getHumanReadableDate` follow the active UI language
 *    instead of always emitting en-GB. Several already-localized pages
 *    (banking lists, arrivals forms, member DOB) call them with no arguments,
 *    so the default path is the one that matters.
 *  - `isToday` compares calendar days directly. It used to string-match
 *    `parseDate(date) === 'Today'`, which silently returns false in every
 *    non-English session — and it gates real arrivals behaviour
 *    (`FormAttendanceConfirmation`, `FormPayVehicleRecord`, `arrivals-utils`).
 *
 * The pure date maths inlined from `jd-date-utils` is covered too, since it
 * had no tests at all and this file now sits above it.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import i18n from 'lib/i18n'
import {
  parseDate,
  getHumanReadableDate,
  getMemberDob,
  isToday,
  getMondayThisWeek,
  parseNeoTime,
  parseTimeToDate,
  getTodayTime,
  addHours,
  addMinutes,
} from './date-utils'

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

afterEach(async () => {
  await i18n.changeLanguage('en')
  vi.useRealTimers()
})

describe('parseDate — relative labels', () => {
  it('returns Today / Yesterday / N days ago in English by default', () => {
    expect(parseDate(new Date().toISOString())).toBe('Today')
    expect(parseDate(daysAgo(1))).toBe('Yesterday')
    expect(parseDate(daysAgo(4))).toBe('4 days ago')
  })

  it('follows the active UI language with no options passed', async () => {
    await i18n.changeLanguage('fr')

    expect(parseDate(new Date().toISOString())).toBe("Aujourd'hui")
    expect(parseDate(daysAgo(1))).toBe('Hier')
    expect(parseDate(daysAgo(4))).toBe('Il y a 4 jours')
  })

  it('prefers an explicitly passed t over the ambient instance', () => {
    const t = vi.fn(() => 'STUBBED')
    expect(parseDate(new Date().toISOString(), { t })).toBe('STUBBED')
    expect(t).toHaveBeenCalledWith('shared.dates.today')
  })
})

describe('parseDate — long-date fallback beyond a week', () => {
  it('formats day-first for English', () => {
    // 2026-07-26 is a Sunday.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T09:00:00Z'))

    expect(parseDate('2026-07-26T09:00:00Z')).toBe('Sun, 26 Jul 2026')
  })

  it('formats in the active language', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T09:00:00Z'))
    await i18n.changeLanguage('de')

    const result = parseDate('2026-07-26T09:00:00Z')
    expect(result).toContain('2026')
    expect(result).toContain('Juli')
    expect(result).not.toContain('Jul 26')
  })

  it('upgrades a bare language code to its region-tagged locale', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T09:00:00Z'))

    // Callers pass `i18n.resolvedLanguage` ('en'), which bare `Intl` would
    // read as en-US and render month-first.
    expect(parseDate('2026-07-26T09:00:00Z', { locale: 'en' })).toBe(
      'Sun, 26 Jul 2026'
    )
  })
})

describe('getHumanReadableDate', () => {
  it('renders a long English date by default', () => {
    expect(getHumanReadableDate('2026-07-26T09:00:00Z')).toBe('26 July 2026')
  })

  it('includes the weekday when asked', () => {
    expect(getHumanReadableDate('2026-07-26T09:00:00Z', true)).toBe(
      'Sunday, 26 July 2026'
    )
  })

  it('follows the active UI language', async () => {
    await i18n.changeLanguage('fr')
    expect(getHumanReadableDate('2026-07-26T09:00:00Z')).toBe('26 juillet 2026')

    await i18n.changeLanguage('es')
    expect(getHumanReadableDate('2026-07-26T09:00:00Z')).toBe(
      '26 de julio de 2026'
    )
  })

  it('returns undefined for a missing date', () => {
    expect(getHumanReadableDate(undefined)).toBeUndefined()
  })
})

describe('getMemberDob', () => {
  it('formats a member date of birth in the active language', async () => {
    await i18n.changeLanguage('pt')
    expect(getMemberDob({ dob: { date: '1990-03-14' } })).toBe(
      '14 de março de 1990'
    )
  })

  it('distinguishes "no member" (undefined) from "member with no dob" (null)', () => {
    expect(getMemberDob(undefined)).toBeUndefined()
    expect(getMemberDob({})).toBeNull()
  })
})

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-26T09:00:00Z'))
  })

  it('is true for the same calendar day and false for other days', () => {
    expect(isToday('2026-07-26T23:00:00Z')).toBe(true)
    expect(isToday('2026-07-25T09:00:00Z')).toBe(false)
    expect(isToday('2026-07-27T09:00:00Z')).toBe(false)
  })

  it('stays true in a non-English session', async () => {
    // Regression guard: this returned false in every translated session while
    // it string-matched parseDate's output against the literal 'Today'.
    await i18n.changeLanguage('fr')
    expect(isToday('2026-07-26T09:00:00Z')).toBe(true)
  })
})

describe('pure date maths (inlined from jd-date-utils)', () => {
  it('getMondayThisWeek walks back to Monday, treating Sunday as week-end', () => {
    // 2026-07-26 is a Sunday -> Monday of that same week is the 20th.
    expect(getMondayThisWeek(new Date('2026-07-26T09:00:00Z')).getDate()).toBe(
      20
    )
    // 2026-07-22 is a Wednesday -> Monday the 20th.
    expect(getMondayThisWeek(new Date('2026-07-22T09:00:00Z')).getDate()).toBe(
      20
    )
  })

  it('parseNeoTime zero-pads HH:MM:SS and passes undefined through', () => {
    const stamp = new Date(2026, 6, 26, 8, 5, 3).toISOString()
    expect(parseNeoTime(stamp)).toBe('08:05:03')
    expect(parseNeoTime(undefined)).toBeUndefined()
  })

  it('parseTimeToDate zeroes milliseconds for an HH:MM input', () => {
    expect(new Date(parseTimeToDate('14:30')).getMilliseconds()).toBe(0)
  })

  it('getTodayTime returns a bare date when no time string is given', () => {
    expect(getTodayTime()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(getTodayTime('2020-01-01T05:06:07.000Z')).toMatch(
      /^\d{4}-\d{2}-\d{2}T05:06:07\.000Z$/
    )
  })

  it('addHours / addMinutes shift without mutating the input', () => {
    const iso = '2026-07-26T09:00:00.000Z'
    expect(addHours(iso, 3).toISOString()).toBe('2026-07-26T12:00:00.000Z')
    expect(addMinutes(iso, 45).toISOString()).toBe('2026-07-26T09:45:00.000Z')
    expect(iso).toBe('2026-07-26T09:00:00.000Z')
  })
})
