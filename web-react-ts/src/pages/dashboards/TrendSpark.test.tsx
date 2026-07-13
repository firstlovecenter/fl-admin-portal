/**
 * Tests for TrendSpark.tsx — the recharts 3 drill-down migration.
 *
 * The changed behavior: the Bar `onClick` now reads the clicked datum from
 * `data?.payload` (recharts 3 hands the callback a BarRectangleItem whose
 * original datum lives under `.payload`; recharts 2 spread it flat). The
 * handler calls `onBarClick` with `{id, category, week, year}` ONLY when
 * `point.id`, `point.category`, a drillable category, and `onBarClick` are all
 * present. `drillableCategories = {'services', 'bussing', 'rehearsals'}`.
 *
 * recharts cannot lay out / hit-test bars in jsdom (ResponsiveContainer
 * measures 0x0), so recharts is mocked with a thin harness: `BarChart` injects
 * its `data` into each `Bar`, and each `Bar` renders one button per datum whose
 * onClick fires the real handler with the recharts-3 `{ payload: datum }`
 * shape. This exercises the real `onBarClick` wiring and every guard branch,
 * which is the behavior the migration touched.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TrendSpark from './TrendSpark'

// Mock recharts: BarChart passes `data` down to each Bar via a private prop,
// and Bar renders a clickable button per datum invoking onClick with the
// recharts-3 payload shape.
vi.mock('recharts', async () => {
  const React = (await import('react')).default
  return {
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive">{children}</div>
    ),
    BarChart: ({ data, children }: any) => (
      <div data-testid="bar-chart">
        {React.Children.map(children, (child: any) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { __data: data } as any)
            : child
        )}
      </div>
    ),
    Bar: ({ dataKey, onClick, __data, children }: any) => (
      <div data-testid={`bar-${dataKey}`}>
        {((__data as any[]) ?? []).map((datum: any, index: number) => (
          <button
            key={index}
            type="button"
            data-testid={`bar-${dataKey}-point-${index}`}
            onClick={() => onClick?.({ payload: datum })}
          >
            {dataKey}-{index}
          </button>
        ))}
        {children}
      </div>
    ),
    CartesianGrid: () => null,
    LabelList: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  }
})

const drillableRow = {
  id: 'service-1',
  category: 'services',
  attendance: '50',
  income: '100',
  week: 10,
  year: 2026,
}

describe('TrendSpark drill-down (recharts 3 onClick migration)', () => {
  afterEach(cleanup)

  it('calls onBarClick with {id, category, week, year} when a drillable bar is clicked', async () => {
    const onBarClick = vi.fn()
    render(
      <TrendSpark
        data={[drillableRow]}
        incomeTracked
        mode="weekday"
        onBarClick={onBarClick}
      />
    )

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(onBarClick).toHaveBeenCalledTimes(1)
    expect(onBarClick).toHaveBeenCalledWith({
      id: 'service-1',
      category: 'services',
      week: 10,
      year: 2026,
    })
  })

  it('is a no-op when the clicked datum has no id', async () => {
    const onBarClick = vi.fn()
    render(
      <TrendSpark
        data={[
          {
            // no id
            category: 'services',
            attendance: '50',
            week: 11,
            year: 2026,
          },
        ]}
        incomeTracked
        mode="weekday"
        onBarClick={onBarClick}
      />
    )

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(onBarClick).not.toHaveBeenCalled()
  })

  it('is a no-op when the datum category is not drillable', async () => {
    const onBarClick = vi.fn()
    render(
      <TrendSpark
        data={[
          {
            id: 'x-1',
            category: 'weekday', // not in {services, bussing, rehearsals}
            attendance: '50',
            week: 12,
            year: 2026,
          },
        ]}
        incomeTracked
        mode="weekday"
        onBarClick={onBarClick}
      />
    )

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(onBarClick).not.toHaveBeenCalled()
  })

  it('is a no-op when the datum has no category', async () => {
    const onBarClick = vi.fn()
    render(
      <TrendSpark
        data={[
          {
            id: 'x-2',
            // no category
            attendance: '50',
            week: 13,
            year: 2026,
          },
        ]}
        incomeTracked
        mode="weekday"
        onBarClick={onBarClick}
      />
    )

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(onBarClick).not.toHaveBeenCalled()
  })

  it('renders the empty state when there is no renderable data', () => {
    render(
      <TrendSpark data={[]} incomeTracked mode="bussing" onBarClick={vi.fn()} />
    )

    expect(screen.getByText(/no bussing data yet/i)).toBeInTheDocument()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('renders the income bar (drillable) in weekday mode when income is tracked and present', async () => {
    const onBarClick = vi.fn()
    render(
      <TrendSpark
        data={[drillableRow]}
        incomeTracked
        mode="weekday"
        onBarClick={onBarClick}
      />
    )

    // Both attendance and income bars are present.
    expect(screen.getByTestId('bar-attendance')).toBeInTheDocument()
    expect(screen.getByTestId('bar-income')).toBeInTheDocument()

    // Clicking the income bar of a drillable datum also drills.
    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-income-point-0'))
    expect(onBarClick).toHaveBeenCalledWith({
      id: 'service-1',
      category: 'services',
      week: 10,
      year: 2026,
    })
  })
})
