/**
 * `parseDate`'s uninitialised-i18next fallback.
 *
 * Deliberately a separate file from `date-utils.test.ts`: that one imports
 * `lib/i18n`, which boots the singleton for its whole module graph, so the
 * fallback branch is unreachable there. This file imports the date helper on
 * its own — the exact shape of a pure unit test that doesn't want i18n — and
 * pins the behaviour that made the branch necessary in the first place:
 * `i18next.t` returns `undefined` before init, so without the fallback
 * `parseDate` would render the literal string "undefined".
 */
import { describe, it, expect } from 'vitest'
import i18next from 'i18next'
import en from 'locales/en.json'
import { parseDate } from './date-utils'

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

describe('parseDate without lib/i18n imported', () => {
  it('confirms the precondition — i18next is not initialised here', () => {
    expect(i18next.isInitialized).toBeFalsy()
  })

  it('falls back to the bundled English catalogue rather than undefined', () => {
    expect(parseDate(new Date().toISOString())).toBe('Today')
    expect(parseDate(daysAgo(1))).toBe('Yesterday')
  })

  it('interpolates {{count}} in the fallback', () => {
    expect(parseDate(daysAgo(4))).toBe('4 days ago')
  })

  it('stays in sync with en.json — no duplicated literals to drift', () => {
    // If someone rewords `shared.dates.today`, the fallback follows. This
    // assertion is what makes that claim enforceable.
    expect(parseDate(new Date().toISOString())).toBe(en.shared.dates.today)
    expect(parseDate(daysAgo(1))).toBe(en.shared.dates.yesterday)
    expect(parseDate(daysAgo(4))).toBe(
      en.shared.dates.daysAgo.replace('{{count}}', '4')
    )
  })

  it('still formats the beyond-a-week long date via Intl', () => {
    // No translation involved on this path, so it works uninitialised and
    // defaults to en-GB (day-first).
    const old = new Date()
    old.setDate(old.getDate() - 40)
    expect(parseDate(old.toISOString())).toMatch(
      /^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4}$/
    )
  })
})
