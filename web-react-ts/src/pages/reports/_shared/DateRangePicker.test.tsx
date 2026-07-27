import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import i18n from 'lib/i18n'
import DateRangePicker from './DateRangePicker'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('DateRangePicker i18n', () => {
  it('renders English date-range chrome', async () => {
    await i18n.changeLanguage('en')
    render(
      <DateRangePicker
        startDate="2026-01-05"
        endDate="2026-01-18"
        onStartDateChange={() => undefined}
        onEndDateChange={() => undefined}
      />
    )

    expect(screen.getByText('Date range')).toBeInTheDocument()
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.getByText(/Covers/)).toBeInTheDocument()
  })

  it('renders French date-range chrome', async () => {
    await i18n.changeLanguage('fr')
    render(
      <DateRangePicker
        startDate="2026-01-05"
        endDate="2026-01-18"
        onStartDateChange={() => undefined}
        onEndDateChange={() => undefined}
      />
    )

    expect(screen.getByText(i18n.t('reports.shared.dateRange'))).toBeInTheDocument()
    expect(screen.getByText('Plage de dates')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('reports.shared.from'))).toBeInTheDocument()
    expect(screen.getByText('Du')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('reports.shared.to'))).toBeInTheDocument()
    expect(screen.getByText('Au')).toBeInTheDocument()
  })
})
