import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import 'lib/i18n'
import ShepherdingSlide from './ShepherdingSlide'

const baseProps = {
  slide: null,
  loading: false,
  metricA: 'serviceAttendance',
  metricB: null,
  anchor: { week: 36, year: 2026 },
  windowWeeks: 4,
  onSelectChild: vi.fn(),
} as const

afterEach(cleanup)

describe('ShepherdingSlide without slide data', () => {
  it('shows the load error instead of a permanent spinner when the query failed', () => {
    render(<ShepherdingSlide {...baseProps} failed />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This slide could not be loaded.'
    )
    expect(screen.queryByText('Loading slide…')).not.toBeInTheDocument()
  })

  it('keeps the loading state while the query is still running', () => {
    render(<ShepherdingSlide {...baseProps} loading />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
