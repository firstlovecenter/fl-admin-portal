/**
 * Unit tests for describeServiceDate — the human-readable service-date phrasing
 * used in the banking reminder body (index.js runBankingReminder).
 *
 * The blended ladder (per product requirement):
 *   1 day   -> "yesterday"
 *   2 days  -> "2 days ago"
 *   3–6 days-> "last <Weekday>"
 *   7+ days -> "on <D> <Month>"
 *
 * Ghana is UTC+0, so `now` is pinned to a fixed UTC instant and every case is
 * expressed as a `YYYY-MM-DD` service date relative to it. Anchor day:
 * 2026-07-09 is a Thursday (Date.UTC(2026, 6, 9)).
 */

const { describeServiceDate } = require('./date-format')

// Thursday 2026-07-09, mid-afternoon Accra (UTC) — time-of-day must not matter.
const NOW = new Date('2026-07-09T15:00:00.000Z')

describe('describeServiceDate', () => {
  it('says "today" for the same calendar day (defensive; banking never sends this)', () => {
    expect(describeServiceDate('2026-07-09', NOW)).toBe('today')
  })

  it('says "yesterday" for one day back', () => {
    expect(describeServiceDate('2026-07-08', NOW)).toBe('yesterday')
  })

  it('says "2 days ago" for two days back', () => {
    expect(describeServiceDate('2026-07-07', NOW)).toBe('2 days ago')
  })

  it('names the weekday for 3 days back', () => {
    // 2026-07-06 is a Monday
    expect(describeServiceDate('2026-07-06', NOW)).toBe('last Monday')
  })

  it('names the weekday at the 6-day edge of the relative window', () => {
    // 2026-07-03 is a Friday
    expect(describeServiceDate('2026-07-03', NOW)).toBe('last Friday')
  })

  it('falls back to an absolute calendar date at 7 days (with leading "on ")', () => {
    // 2026-07-02 is a Thursday but 7 days out -> absolute
    expect(describeServiceDate('2026-07-02', NOW)).toBe('on 2 July')
  })

  it('uses an absolute date for well-aged records', () => {
    expect(describeServiceDate('2026-06-15', NOW)).toBe('on 15 June')
  })

  it('ignores the time-of-day component of now (whole-day diffs only)', () => {
    const earlyMorning = new Date('2026-07-09T00:05:00.000Z')
    const lateNight = new Date('2026-07-09T23:55:00.000Z')
    expect(describeServiceDate('2026-07-08', earlyMorning)).toBe('yesterday')
    expect(describeServiceDate('2026-07-08', lateNight)).toBe('yesterday')
  })

  it('handles a month boundary in the relative window', () => {
    const firstOfMonth = new Date('2026-08-01T12:00:00.000Z')
    // 2026-07-31 is the day before -> yesterday
    expect(describeServiceDate('2026-07-31', firstOfMonth)).toBe('yesterday')
    // 2026-07-29 is 3 days before (a Wednesday) -> weekday name
    expect(describeServiceDate('2026-07-29', firstOfMonth)).toBe(
      'last Wednesday'
    )
  })

  it('tolerates a full ISO datetime string (uses the date part)', () => {
    expect(describeServiceDate('2026-07-08T09:30:00.000Z', NOW)).toBe(
      'yesterday'
    )
  })

  it('returns the raw value unchanged when it is not a parseable date', () => {
    expect(describeServiceDate('not-a-date', NOW)).toBe('not-a-date')
    expect(describeServiceDate('2026-13-40', NOW)).toBe('2026-13-40')
  })

  it('rejects an impossible-but-well-formed date instead of rolling it over', () => {
    // Date.UTC(2026, 1, 30) silently rolls to March 2 — the guard must catch it.
    expect(describeServiceDate('2026-02-30', NOW)).toBe('2026-02-30')
  })

  it('coerces non-string input to a string rather than throwing', () => {
    expect(describeServiceDate(null, NOW)).toBe('')
    expect(describeServiceDate(undefined, NOW)).toBe('')
  })
})
