/**
 * Tests for the i18n conversion of QuickFactComparisonCard.tsx.
 *
 * All display strings except the internally-generated `deltaText` pill come
 * in as props (already translated by the calling page). The pill itself
 * used to compose a raw English sentence ("At the council avg" /
 * "12% above council avg" / "12% below council avg") from
 * `benchmarkLabel.toLowerCase()` — this now routes through
 * `t('directory.quickFactComparisonCard.*')`. No markup or layout changed.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { TrendingUp } from 'lucide-react'
import i18n from 'lib/i18n'
import QuickFactComparisonCard from './QuickFactComparisonCard'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const baseProps = {
  icon: TrendingUp,
  accent: 'members' as const,
  metricLabel: 'Weekday Attendance',
  churchLabel: 'Your avg this month',
  churchValue: '25',
  benchmarkLabel: 'Council avg',
  benchmarkValue: '20',
  benchmarkContext: 'Avg Bacenta in Kaneshie Council',
}

describe('QuickFactComparisonCard i18n', () => {
  it('renders "above" delta text in English', () => {
    render(<QuickFactComparisonCard {...baseProps} delta={25} />)

    expect(screen.getByText('25% above council avg')).toBeInTheDocument()
  })

  it('renders "below" delta text in English', () => {
    render(<QuickFactComparisonCard {...baseProps} delta={-10} />)

    expect(screen.getByText('10% below council avg')).toBeInTheDocument()
  })

  it('renders "at the benchmark" delta text in English when flat', () => {
    render(<QuickFactComparisonCard {...baseProps} delta={0} />)

    expect(screen.getByText('At the council avg')).toBeInTheDocument()
  })

  it('renders no delta pill when delta is null', () => {
    render(<QuickFactComparisonCard {...baseProps} delta={null} />)

    expect(screen.queryByText(/above council avg/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/below council avg/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/At the council avg/i)).not.toBeInTheDocument()
  })

  it('translates the delta text to French', async () => {
    await i18n.changeLanguage('fr')

    render(<QuickFactComparisonCard {...baseProps} delta={25} />)

    expect(screen.getByText('25 % au-dessus de council avg')).toBeInTheDocument()
  })
})
