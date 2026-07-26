/**
 * i18n coverage for WeekSelector and ArrivalDateSelector — the two date-range
 * pickers that sit at the top of the (already-localized) reports, defaulters
 * and arrivals pages. Their chrome and their aria-labels were English-only,
 * and the labels they display come from `useSelectedWeek` /
 * `useSelectedArrivalDate`, which are exercised here through the rendered
 * component rather than mocked away.
 */
import React from 'react'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { GET_BUSSING_DATES } from 'hooks/useSelectedArrivalDateQueries'
import WeekSelector from './WeekSelector/WeekSelector'
import ArrivalDateSelector from './ArrivalDateSelector/ArrivalDateSelector'

const NOW = new Date('2026-05-04T12:00:00Z') // Monday, ISO week 19

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(async () => {
  vi.useRealTimers()
  cleanup()
  await i18n.changeLanguage('en')
})

const renderWeekSelector = (entry = '/reports?week=18&year=2026') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <WeekSelector />
    </MemoryRouter>
  )

const bussingDatesMock = {
  request: { query: GET_BUSSING_DATES },
  result: { data: { bussingDates: [] } },
}

const renderArrivalDateSelector = () =>
  render(
    <MockedProvider mocks={[bussingDatesMock]} addTypename={false}>
      <MemoryRouter initialEntries={['/arrivals']}>
        <ArrivalDateSelector />
      </MemoryRouter>
    </MockedProvider>
  )

describe('WeekSelector', () => {
  it('labels its navigation buttons in English by default', () => {
    renderWeekSelector()

    expect(
      screen.getByRole('button', { name: 'Previous week' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next week' })).toBeInTheDocument()
    expect(screen.getByText('Week 18, 2026')).toBeInTheDocument()
    expect(screen.getByText('27 Apr – 3 May 2026')).toBeInTheDocument()
  })

  it('offers the reset link only when off the current week', () => {
    renderWeekSelector()
    expect(
      screen.getByRole('button', { name: 'Reset to current week' })
    ).toBeInTheDocument()

    cleanup()
    renderWeekSelector('/reports')
    expect(
      screen.queryByRole('button', { name: 'Reset to current week' })
    ).not.toBeInTheDocument()
  })

  it('translates its chrome, aria-labels and month names together', async () => {
    await i18n.changeLanguage('fr')
    renderWeekSelector()

    expect(
      screen.getByRole('button', { name: 'Semaine précédente' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Semaine suivante' })
    ).toBeInTheDocument()
    expect(screen.getByText('Semaine 18, 2026')).toBeInTheDocument()
    expect(screen.getByText('27 avr. – 3 mai 2026')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Revenir à la semaine en cours' })
    ).toBeInTheDocument()
  })
})

describe('ArrivalDateSelector', () => {
  // Asserted synchronously: with fake timers pinned, MockedProvider's async
  // resolution never flushes, and the component renders its empty state from
  // `bussingDates = []` on the first (loading) pass anyway.
  it('renders the empty-week state in English by default', () => {
    renderArrivalDateSelector()

    expect(screen.getByText('No bussings this week')).toBeInTheDocument()
    expect(screen.getByText('Week of 4–10 May 2026')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Previous week' })
    ).toBeInTheDocument()
  })

  it('translates the empty-week state and the week label', async () => {
    await i18n.changeLanguage('es')
    renderArrivalDateSelector()

    expect(screen.getByText('No hay buses esta semana')).toBeInTheDocument()
    expect(screen.getByText('Semana del 4–10 may 2026')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Semana anterior' })
    ).toBeInTheDocument()
  })
})
