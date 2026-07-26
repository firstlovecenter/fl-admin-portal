import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import i18n from 'lib/i18n'
import MetricPicker from './MetricPicker'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('MetricPicker i18n', () => {
  it('shows the English label for the selected metric', async () => {
    await i18n.changeLanguage('en')
    render(
      <MetricPicker
        label="Metric A"
        value="serviceAttendance"
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText('Metric A')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveTextContent('Service Attendance')
  })

  it('shows French metric labels rather than English fallbacks', async () => {
    await i18n.changeLanguage('fr')
    render(
      <MetricPicker
        label={i18n.t('shepherding.metricA')}
        value="income"
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText(i18n.t('shepherding.metricA'))).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveTextContent(
      i18n.t('shepherding.metrics.income')
    )
    expect(screen.getByRole('combobox')).not.toHaveTextContent('Income (GHS)')
  })
})
