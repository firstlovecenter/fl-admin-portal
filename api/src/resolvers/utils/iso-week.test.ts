/**
 * Pins `getIsoWeek` to concrete ISO 8601 answers.
 *
 * The frontend keys its week-scoped queries on the same convention
 * (`web-react-ts/src/lib/date-utils.ts` — `getWeekNumber`), and weekly
 * aggregates are stored under whatever this function returns. The two live in
 * separate packages with separate test runners, so this suite deliberately
 * asserts the SAME anchor dates as the frontend's SYN-218 suite: if either
 * side's algorithm drifts, exactly one of the two suites goes red and the
 * mismatch surfaces instead of silently mis-keying aggregates.
 *
 * Keep the anchors below in sync with the matching block in
 * `web-react-ts/src/lib/date-utils.test.ts`.
 */
import { getIsoWeek } from './iso-week'

describe('getIsoWeek', () => {
  it('returns the ISO 8601 week for the shared anchor dates', () => {
    // Mon 31 Aug 2026 — the SYN-218 reproduction date.
    expect(getIsoWeek(new Date(2026, 7, 31))).toBe(36)
    // Sun 4 Jan 2026 is the last day of ISO week 1, not week 0.
    expect(getIsoWeek(new Date(2026, 0, 4))).toBe(1)
  })

  it('handles the year boundary in both directions', () => {
    // Mon 29 Dec 2025 already belongs to ISO week 1 (of week-year 2026).
    expect(getIsoWeek(new Date(2025, 11, 29))).toBe(1)
    // Fri 1 Jan 2021 is still ISO week 53 (of week-year 2020).
    expect(getIsoWeek(new Date(2021, 0, 1))).toBe(53)
  })

  it('gives every day of an ISO week the same number', () => {
    // Mon 31 Aug .. Sun 6 Sep 2026 is one ISO week.
    const week = [31, 1, 2, 3, 4, 5, 6].map((date, index) =>
      getIsoWeek(new Date(2026, index === 0 ? 7 : 8, date))
    )
    expect(week).toEqual([36, 36, 36, 36, 36, 36, 36])
  })

  it('does not mutate the Date it is given', () => {
    // The frontend counterpart used to mutate its argument (SYN-218). This one
    // copies via `new Date(date.getTime())`; lock that in.
    const input = new Date(2026, 7, 31, 12, 30, 15, 250)
    const snapshot = input.getTime()

    getIsoWeek(input)

    expect(input.getTime()).toBe(snapshot)
  })

  it('defaults to the current date when called with no argument', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 31, 9, 0, 0))

    expect(getIsoWeek()).toBe(36)

    jest.useRealTimers()
  })
})
