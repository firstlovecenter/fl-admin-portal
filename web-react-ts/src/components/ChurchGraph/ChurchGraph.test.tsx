/**
 * Tests for ChurchGraph.tsx — the recharts 3 drill-down migration.
 *
 * The changed behavior: `handleBarClick(clicked, statKey)` now reads the datum
 * as `clicked?.payload ?? clicked` (recharts 3 nests the datum under
 * `.payload`; recharts 2 spread it flat — the `?? clicked` keeps both shapes
 * working). Depending on graphType it either navigates to the arrivals summary
 * (bussingAggregate) or calls `clickCard` + navigates to the record detail.
 *
 * recharts cannot lay out / hit-test bars in jsdom, so it is mocked with a thin
 * harness identical to the TrendSpark test: `BarChart` injects its `data` into
 * each `Bar`, and each `Bar` renders one clickable button per datum firing the
 * real handler with the recharts-3 `{ payload: datum }` shape. This drives the
 * real `handleBarClick` including the navigate / clickCard side effects.
 *
 * ChurchContext (for clickCard) and react-router's useNavigate are mocked.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChurchContext } from 'contexts/ChurchContext'
import ChurchGraph from './ChurchGraph'

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock recharts: BarChart passes `data` down to each Bar; each Bar renders a
// clickable button per datum invoking onClick with the recharts-3 payload shape.
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

const clickCard = vi.fn()

function renderChurchGraph(props: Partial<React.ComponentProps<typeof ChurchGraph>>) {
  return render(
    <ChurchContext.Provider value={{ clickCard } as any}>
      <ChurchGraph
        loading={false}
        stat1="attendance"
        stat2={null}
        churchData={[]}
        graphType="services"
        church="bacenta"
        {...props}
      />
    </ChurchContext.Provider>
  )
}

describe('ChurchGraph drill-down (recharts 3 onClick migration)', () => {
  afterEach(cleanup)

  it('calls clickCard with the datum + __typename and navigates to the detail route (services)', async () => {
    const datum = {
      id: 'sr-1',
      weekLabel: 'W10',
      attendance: 120,
      week: 10,
      year: 2026,
    }
    renderChurchGraph({
      graphType: 'services',
      church: 'bacenta',
      churchData: [datum],
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(clickCard).toHaveBeenCalledTimes(1)
    expect(clickCard).toHaveBeenCalledWith({
      ...datum,
      __typename: 'ServiceRecord',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/bacenta/service-details')
  })

  it('uses the BussingRecord route for a drillable bussing bar', async () => {
    const datum = { id: 'bus-1', weekLabel: 'W10', attendance: 80 }
    renderChurchGraph({
      graphType: 'bussing',
      church: 'bacenta',
      churchData: [datum],
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(clickCard).toHaveBeenCalledWith({
      ...datum,
      __typename: 'BussingRecord',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/bacenta/bussing-details')
  })

  it('navigates to the arrivals summary for a bussingAggregate bar (no clickCard)', async () => {
    renderChurchGraph({
      graphType: 'bussingAggregate',
      church: 'campus',
      churchData: [{ weekLabel: 'W10', attendance: 200, week: 10, year: 2026 }],
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(clickCard).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/^\/arrivals\/campus\?date=\d{4}-\d{2}-\d{2}$/)
    )
  })

  it('is a no-op for a bussingAggregate bar with an invalid week/year', async () => {
    renderChurchGraph({
      graphType: 'bussingAggregate',
      church: 'campus',
      // week/year missing -> isoSundayOfWeek returns null -> no navigation
      churchData: [{ weekLabel: 'W?', attendance: 200 }],
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(clickCard).not.toHaveBeenCalled()
  })

  it('is a no-op when a non-aggregate datum has no id', async () => {
    renderChurchGraph({
      graphType: 'services',
      church: 'bacenta',
      churchData: [{ weekLabel: 'W10', attendance: 120 }], // no id
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(clickCard).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('is a no-op when the datum category contains "Aggregate"', async () => {
    renderChurchGraph({
      graphType: 'services',
      church: 'bacenta',
      churchData: [
        { id: 'agg-1', category: 'serviceAggregate', attendance: 120 },
      ],
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('bar-attendance-point-0'))

    expect(clickCard).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders a skeleton (no chart) while loading', () => {
    renderChurchGraph({ loading: true, churchData: [] })
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })
})
