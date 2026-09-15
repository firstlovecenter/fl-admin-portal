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
  getWeekNumber,
  getISOWeekYear,
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

  it('getMondayThisWeek normalises to local midnight (Yup date-only min bound)', () => {
    // Regression: ServiceForm Yup.date().min(monday) compares against a
    // date-only input cast to midnight. A Monday evening source date used to
    // keep 23:xx as the lower bound, so "today" always failed validation.
    const mondayEvening = getMondayThisWeek(new Date('2026-07-27T23:45:00'))
    expect(mondayEvening.getHours()).toBe(0)
    expect(mondayEvening.getMinutes()).toBe(0)
    expect(mondayEvening.getSeconds()).toBe(0)
    expect(mondayEvening.getMilliseconds()).toBe(0)
    expect(mondayEvening.getDate()).toBe(27)
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

/**
 * SYN-218. Two things were wrong before this suite existed:
 *
 *  1. `global-utils.getWeekNumber` MUTATED the Date it was handed — it shifted
 *     the caller's object to that ISO week's Thursday and zeroed the time.
 *     Callers had to defend with `getWeekNumber(new Date(now))`.
 *  2. A second, divergent `getWeekNumber` lived here, counting weeks from the
 *     first Monday on or after 1 January rather than by ISO 8601. It ran a
 *     full week behind on most days, so the "This Week" defaulter pages and
 *     `useChurchLevel`'s default week queried the wrong week's aggregates.
 *
 * There is now one ISO 8601 implementation, it copies, and `global-utils`
 * re-exports it.
 */
describe('getWeekNumber / getISOWeekYear (SYN-218)', () => {
  it('does not mutate the Date it is given', () => {
    const input = new Date(2026, 7, 31, 12, 30, 15, 250)
    const snapshot = input.getTime()

    getWeekNumber(input)
    getISOWeekYear(input)

    // Before the fix this had shifted to Thu 3 Sep 2026 at 00:00:00.000.
    expect(input.getTime()).toBe(snapshot)
  })

  it('is safe to call twice on the same Date, and to interleave the two', () => {
    // `shepherding-control-utils.shiftAnchor` calls both on one Date; the
    // graph "in-progress week" check reads `now` again afterwards.
    const anchor = new Date(2026, 7, 31)
    expect(getWeekNumber(anchor)).toBe(36)
    expect(getISOWeekYear(anchor)).toBe(2026)
    expect(getWeekNumber(anchor)).toBe(36)
    expect(anchor.getDay()).toBe(1) // still the Monday it started as
  })

  it('returns the ISO 8601 week number, not the legacy first-Monday count', () => {
    // Regression: the old implementation here returned 34 for this date.
    expect(getWeekNumber(new Date(2026, 7, 31))).toBe(36)
    // ...and 0 for early January, which is not a valid week number at all.
    expect(getWeekNumber(new Date(2026, 0, 4))).toBe(1)
  })

  it('handles the year boundary, where week and week-year disagree', () => {
    // Mon 29 Dec 2025 already belongs to ISO week 1 of 2026.
    const boundary = new Date(2025, 11, 29)
    expect(getWeekNumber(boundary)).toBe(1)
    expect(getISOWeekYear(boundary)).toBe(2026)

    // Fri 1 Jan 2021 is still ISO week 53 of 2020.
    const backwards = new Date(2021, 0, 1)
    expect(getWeekNumber(backwards)).toBe(53)
    expect(getISOWeekYear(backwards)).toBe(2020)
  })

  it('accepts a Date, an ISO string, or nothing at all', () => {
    expect(getWeekNumber(new Date(2026, 7, 31))).toBe(36)
    expect(getWeekNumber('2026-08-31T00:00:00')).toBe(36)
    expect(getISOWeekYear('2026-08-31T00:00:00')).toBe(2026)

    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 31, 9, 0, 0))
    expect(getWeekNumber()).toBe(36)
    expect(getISOWeekYear()).toBe(2026)
    vi.useRealTimers()
  })

  it('treats an empty string as "now" rather than producing NaN', () => {
    // The removed `global-utils` copy branched on `typeof date === 'string'`,
    // so `''` reached `new Date('')` and returned NaN. Both live callers
    // (`UserDashboard`) short-circuit on a falsy date, so nothing depended on
    // that; pinning the coercion here because it is otherwise silent.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 31, 9, 0, 0))
    expect(getWeekNumber('')).toBe(36)
    expect(getISOWeekYear('')).toBe(2026)
    vi.useRealTimers()
  })

  it('agrees with the backend ISO week on every day across a 6-year sweep', () => {
    // Mirrors `api/src/resolvers/utils/iso-week.ts`. The backend keys weekly
    // aggregates on this, so any drift means the FE asks for a week the data
    // is not filed under.
    const backendIsoWeek = (date: Date): number => {
      const target = new Date(date.getTime())
      target.setHours(0, 0, 0, 0)
      const dayNum = target.getDay() || 7
      target.setDate(target.getDate() + 4 - dayNum)
      const yearStart = new Date(target.getFullYear(), 0, 1)
      return Math.ceil(
        ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
      )
    }

    // Driven by an explicit end date, not a day count: the interesting cases
    // are the ISO year boundaries, and an off-by-a-leap-day count would stop
    // just short of the last one.
    const mismatches: string[] = []
    const day = new Date(2022, 0, 1)
    const end = new Date(2028, 0, 7)
    while (day <= end) {
      const ours = getWeekNumber(day)
      const theirs = backendIsoWeek(day)
      if (ours !== theirs) {
        mismatches.push(`${day.toDateString()}: fe=${ours} be=${theirs}`)
      }
      day.setDate(day.getDate() + 1)
    }

    expect(mismatches).toEqual([])
    // Guard against the loop silently not running.
    expect(day.getFullYear()).toBe(2028)
  })
})
