/**
 * Tests for `useSelectedWeek`.
 *
 * The hook's labels (`weekLabel`, `weekShortLabel`, `rangeLabel`) render on
 * already-localized surfaces — the defaulters dashboard subtitle, the weekly
 * report cards, the WeekSelector chrome — but composed English literals
 * ("Week 18, 2026") and a hardcoded English month array until this branch.
 * The localization assertions below are the regression guard; the ISO-week
 * resolution assertions are characterization for logic that had no tests.
 *
 * System time is pinned to Monday 2026-05-04 (ISO week 19 of 2026) so
 * "current week" is deterministic.
 */
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useSearchParams } from 'react-router-dom'
import i18n from 'lib/i18n'
import useSelectedWeek from './useSelectedWeek'

const NOW = new Date('2026-05-04T12:00:00Z') // Monday, ISO week 19

const renderSelectedWeek = (initialEntry = '/reports') => {
  const searchParams: { current: URLSearchParams } = {
    current: new URLSearchParams(),
  }

  const SearchParamProbe = () => {
    const [params] = useSearchParams()
    searchParams.current = params
    return null
  }

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>
      <SearchParamProbe />
      {children}
    </MemoryRouter>
  )

  return { ...renderHook(() => useSelectedWeek(), { wrapper }), searchParams }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(async () => {
  vi.useRealTimers()
  await i18n.changeLanguage('en')
})

describe('useSelectedWeek — week resolution', () => {
  it('defaults to the current ISO week when no params are present', () => {
    const { result } = renderSelectedWeek()

    expect(result.current.week).toBe(19)
    expect(result.current.year).toBe(2026)
    expect(result.current.weekStart).toBe('2026-05-04')
    expect(result.current.isCurrent).toBe(true)
  })

  it('reads ?week= and ?year= from the URL', () => {
    const { result } = renderSelectedWeek('/reports?week=18&year=2026')

    expect(result.current.week).toBe(18)
    expect(result.current.weekStart).toBe('2026-04-27')
    expect(result.current.isCurrent).toBe(false)
  })

  it('ignores an out-of-range week and falls back to the current one', () => {
    expect(renderSelectedWeek('/reports?week=99').result.current.week).toBe(19)
    expect(renderSelectedWeek('/reports?week=0').result.current.week).toBe(19)
    expect(renderSelectedWeek('/reports?week=abc').result.current.week).toBe(19)
  })

  it('steps back a week and drops the params again on reset', () => {
    const { result } = renderSelectedWeek()

    act(() => result.current.prevWeek())
    expect(result.current.week).toBe(18)
    expect(result.current.isCurrent).toBe(false)

    act(() => result.current.resetToCurrent())
    expect(result.current.week).toBe(19)
    expect(result.current.isCurrent).toBe(true)
  })

  it('only appends ?week=&year= to links when off the current week', () => {
    const currentWeek = renderSelectedWeek()
    expect(currentWeek.result.current.linkWith('/services')).toBe('/services')

    const pastWeek = renderSelectedWeek('/reports?week=18&year=2026')
    expect(pastWeek.result.current.linkWith('/services')).toBe(
      '/services?week=18&year=2026'
    )
  })
})

describe('useSelectedWeek — localized labels', () => {
  it('composes English labels day-first', () => {
    const { result } = renderSelectedWeek('/reports?week=19&year=2026')

    expect(result.current.rangeLabel).toBe('4–10 May 2026')
    expect(result.current.weekShortLabel).toBe('Week 19, 2026')
    expect(result.current.weekLabel).toBe('Week 19 · 4–10 May 2026')
  })

  it('spells out both months when the week straddles a month boundary', () => {
    // ISO week 18 of 2026 runs Mon 27 Apr → Sun 3 May.
    const { result } = renderSelectedWeek('/reports?week=18&year=2026')

    expect(result.current.rangeLabel).toBe('27 Apr – 3 May 2026')
  })

  it('follows the active UI language for both the prefix and the month', async () => {
    await i18n.changeLanguage('fr')
    const { result } = renderSelectedWeek('/reports?week=19&year=2026')

    expect(result.current.weekShortLabel).toBe('Semaine 19, 2026')
    expect(result.current.rangeLabel).toBe('4–10 mai 2026')
    expect(result.current.weekLabel).toBe('Semaine 19 · 4–10 mai 2026')
  })

  it('keeps day-first ordering in German too', async () => {
    await i18n.changeLanguage('de')
    const { result } = renderSelectedWeek('/reports?week=19&year=2026')

    expect(result.current.weekShortLabel).toBe('Woche 19, 2026')
    expect(result.current.rangeLabel).toMatch(/^4–10 Mai\.? 2026$/)
  })
})
