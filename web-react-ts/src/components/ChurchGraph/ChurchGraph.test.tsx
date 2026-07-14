/**
 * Regression suite for SYN-201 (recharts 2 -> 3 migration).
 *
 * `handleBarClick` in ChurchGraph.tsx unwraps `item.payload` (the only
 * field documented/typed on recharts 3's `BarRectangleItem`) before reading
 * `row.id` / `row.category` / `row.week` / `row.year`, and then does
 * `clickCard({ ...row, __typename })`.
 *
 * IMPORTANT — what was verified empirically against the pinned recharts
 * version (3.9.2), by temporarily reverting the `.payload` unwrap and
 * re-running this suite:
 *   - `computeBarRectangles` (recharts internal) spreads the original data
 *     row directly onto the *top level* of the click argument for backward
 *     compatibility, in addition to nesting it under `.payload`. So for
 *     field names that don't collide with recharts' own reserved geometry
 *     keys (`x`, `y`, `width`, `height`, `value`, `background`, `payload`,
 *     `tooltipPosition`, `parentViewBox`, `originalDataIndex`,
 *     `stackedBarStart`) — which `id`/`category`/`week`/`year` do not —
 *     reading them directly off `item` currently returns the *same* value
 *     as reading them off `item.payload`. Un-reverting the unwrap does NOT
 *     change any `id`/`category`/`week`/`year` value read in this file on
 *     this recharts version.
 *   - It DOES matter for `clickCard({ ...row, __typename })`: if `row` is
 *     the raw `item` (not `.payload`), the spread leaks recharts' internal
 *     geometry keys (`x`, `y`, `width`, `height`, `value`, `background`,
 *     `tooltipPosition`, `parentViewBox`, `originalDataIndex`,
 *     `stackedBarStart`, plus a self-referential `payload`) into the object
 *     handed to `ChurchContext.clickCard` — which is real pollution of
 *     session-stored click-card state. The "services" test below asserts
 *     an *exact* (`toEqual`) clickCard payload shape specifically to catch
 *     this — it fails on a reverted (un-unwrapped) `handleBarClick` call.
 *   - The `.payload` unwrap is still the objectively correct implementation
 *     even though (b) above is the only currently-observable regression:
 *     the top-level flattening is an internal implementation detail of
 *     `computeBarRectangles`, not part of `BarRectangleItem`'s public type,
 *     and is collision-prone for any row field that happens to share a name
 *     with recharts' reserved geometry keys.
 *
 * These tests render a *real* `<BarChart>` (recharts is not mocked) and
 * fire a real click on the rendered bar geometry.
 *
 * jsdom has no `ResizeObserver` and always reports 0x0 `getBoundingClientRect`,
 * and recharts 3's bar entrance animation renders 0-height/width (i.e. not
 * clickable) geometry until the animation completes. `setupRechartsJsdomEnv`
 * (web-react-ts/src/test-utils/recharts-test-utils.ts) works around both so
 * `<ResponsiveContainer>` and `<Bar>` render final, clickable SVG synchronously.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChurchContext } from 'contexts/ChurchContext'
import { setupRechartsJsdomEnv } from 'test-utils/recharts-test-utils'
import ChurchGraph from './ChurchGraph'
import type { GraphTypes } from 'pages/services/graphs/graphs-utils'
import type { ChurchLevelLower } from 'global-types'

setupRechartsJsdomEnv()

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderGraph(props: {
  graphType: GraphTypes
  church: ChurchLevelLower | string
  churchData: Record<string, unknown>[]
  stat1?: 'attendance' | 'income'
  stat2?: 'attendance' | 'income' | 'target' | null
  clickCard?: ReturnType<typeof vi.fn>
}) {
  const clickCard = props.clickCard ?? vi.fn()
  const utils = render(
    <MemoryRouter>
      <ChurchContext.Provider value={{ clickCard }}>
        <ChurchGraph
          stat1={props.stat1 ?? 'attendance'}
          stat2={props.stat2 ?? null}
          churchData={props.churchData}
          graphType={props.graphType}
          church={props.church}
        />
      </ChurchContext.Provider>
    </MemoryRouter>
  )
  return { ...utils, clickCard }
}

// The bar rectangles recharts renders carry the row's `id` as the SVG
// element's `id` attribute (when the row has one) — a convenient, stable
// hook for selecting "the bar for this row" without reaching into recharts
// internals.
function getBarById(container: HTMLElement, id: string) {
  return container.querySelector(`.recharts-bar-rectangle path[id="${id}"]`)
}

// When a row has no `id` (aggregate rows, or the no-op test cases), fall
// back to positional selection — recharts renders bars in data order.
function getBarsInOrder(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll('.recharts-bar-rectangle path.recharts-rectangle')
  )
}

afterEach(cleanup)

describe('ChurchGraph — handleBarClick (recharts-3 payload unwrap)', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('bussingAggregate: clicking a bar navigates to the church-level arrivals path with the ISO Sunday of that week/year', () => {
    const { container } = renderGraph({
      graphType: 'bussingAggregate',
      church: 'campus',
      churchData: [
        { week: 10, year: 2026, attendance: 120, weekLabel: 'Week 10' },
      ],
    })

    const [bar] = getBarsInOrder(container)
    expect(bar).toBeTruthy()
    fireEvent.click(bar!)

    // Week 10, 2026 -> ISO Sunday 2026-03-08 (verified independently against
    // the isoSundayOfWeek algorithm in ChurchGraph.tsx).
    expect(mockNavigate).toHaveBeenCalledWith('/arrivals/campus?date=2026-03-08')
  })

  it('bussingAggregate: no-ops when the church level has no arrivals path (e.g. bacenta)', () => {
    const { container } = renderGraph({
      graphType: 'bussingAggregate',
      church: 'bacenta',
      churchData: [
        { week: 10, year: 2026, attendance: 120, weekLabel: 'Week 10' },
      ],
    })

    const [bar] = getBarsInOrder(container)
    fireEvent.click(bar!)

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('bussingAggregate: no-ops when week/year are missing (invalid ISO date)', () => {
    const { container } = renderGraph({
      graphType: 'bussingAggregate',
      church: 'campus',
      churchData: [{ attendance: 120, weekLabel: 'Week ?' }],
    })

    const [bar] = getBarsInOrder(container)
    fireEvent.click(bar!)

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('services: clicking a normal bar unwraps item.payload, calls clickCard with EXACTLY the row + __typename (no recharts geometry keys leaking in via the {...row} spread), and navigates to service-details — THE regression test: fails if handleBarClick reads the raw click arg instead of item.payload, because clickCard({ ...row, __typename }) then leaks x/y/width/height/value/background/tooltipPosition/parentViewBox/originalDataIndex/stackedBarStart into session-stored click-card state', () => {
    const { container, clickCard } = renderGraph({
      graphType: 'services',
      church: 'bacenta',
      churchData: [
        {
          id: 'sr-1',
          category: 'services',
          attendance: 42,
          weekLabel: 'Week 5',
        },
      ],
    })

    const bar = getBarById(container, 'sr-1')
    expect(bar).toBeTruthy()
    fireEvent.click(bar!)

    // Exact match (not objectContaining) — this is what actually catches
    // the regression. See the file-header comment for why id/category/
    // week/year alone would not have caught it on this recharts version.
    expect(clickCard).toHaveBeenCalledWith({
      id: 'sr-1',
      category: 'services',
      attendance: 42,
      weekLabel: 'Week 5',
      __typename: 'ServiceRecord',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/bacenta/service-details')
  })

  it('bussing: clicking a normal bar calls clickCard with BussingRecord typename and navigates to bussing-details', () => {
    const { container, clickCard } = renderGraph({
      graphType: 'bussing',
      church: 'governorship',
      churchData: [
        {
          id: 'br-1',
          category: 'bussing',
          attendance: 20,
          weekLabel: 'Week 5',
        },
      ],
    })

    const bar = getBarById(container, 'br-1')
    fireEvent.click(bar!)

    expect(clickCard).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'br-1', __typename: 'BussingRecord' })
    )
    expect(mockNavigate).toHaveBeenCalledWith('/governorship/bussing-details')
  })

  it('bussing: clicking the income sub-bar (statKey === "income") falls back to ServiceRecord/service-details instead of BussingRecord', () => {
    const { container, clickCard } = renderGraph({
      graphType: 'bussing',
      church: 'governorship',
      stat1: 'attendance',
      stat2: 'income',
      churchData: [
        {
          id: 'br-2',
          category: 'bussing',
          attendance: 20,
          income: 50,
          weekLabel: 'Week 5',
        },
      ],
    })

    // Two <Bar>s share the same row id ('br-2'); the income bar is the
    // second Bar in JSX order, so it is the second rendered rectangle.
    const bars = getBarsInOrder(container).filter(
      (el) => el.getAttribute('id') === 'br-2'
    )
    expect(bars).toHaveLength(2)
    fireEvent.click(bars[1]!)

    expect(clickCard).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'br-2', __typename: 'ServiceRecord' })
    )
    expect(mockNavigate).toHaveBeenCalledWith('/governorship/service-details')
  })

  it('onStageAttendance: clicking a normal bar calls clickCard with StageAttendanceRecord typename and navigates to onstage-attendance-details', () => {
    const { container, clickCard } = renderGraph({
      graphType: 'onStageAttendance',
      church: 'council',
      churchData: [
        {
          id: 'sa-1',
          category: 'onStageAttendance',
          attendance: 15,
          weekLabel: 'Week 5',
        },
      ],
    })

    const bar = getBarById(container, 'sa-1')
    fireEvent.click(bar!)

    expect(clickCard).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sa-1', __typename: 'StageAttendanceRecord' })
    )
    expect(mockNavigate).toHaveBeenCalledWith('/council/onstage-attendance-details')
  })

  it('no-ops (no clickCard / navigate) when the row has no id', () => {
    const { container, clickCard } = renderGraph({
      graphType: 'services',
      church: 'bacenta',
      churchData: [{ category: 'services', attendance: 42, weekLabel: 'Week 5' }],
    })

    const [bar] = getBarsInOrder(container)
    fireEvent.click(bar!)

    expect(clickCard).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('no-ops (no clickCard / navigate) when row.category includes "Aggregate"', () => {
    const { container, clickCard } = renderGraph({
      graphType: 'serviceAggregate',
      church: 'council',
      churchData: [
        {
          id: 'agg-1',
          category: 'serviceAggregate',
          attendance: 200,
          weekLabel: 'Week 5',
        },
      ],
    })

    const bar = getBarById(container, 'agg-1')
    fireEvent.click(bar!)

    expect(clickCard).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

describe('ChurchGraph — red/yellow/green bar palette', () => {
  // Leadership-requested traffic-light colouring: the primary series cycles
  // red -> yellow -> green across its bars via per-bar <Cell>s. Assert on the
  // rendered SVG `fill` so the palette is locked in and a future recharts bump
  // or refactor that drops the <Cell>s is caught.
  const RED = 'hsl(var(--destructive))'
  const YELLOW = 'hsl(var(--warning))'
  const GREEN = 'hsl(var(--success))'

  it('cycles the primary bars through red, yellow, green in data order', () => {
    const { container } = renderGraph({
      graphType: 'services',
      church: 'bacenta',
      churchData: [
        { id: 'sr-1', category: 'services', attendance: 42, weekLabel: 'W1' },
        { id: 'sr-2', category: 'services', attendance: 55, weekLabel: 'W2' },
        { id: 'sr-3', category: 'services', attendance: 30, weekLabel: 'W3' },
        { id: 'sr-4', category: 'services', attendance: 61, weekLabel: 'W4' },
      ],
    })

    const fills = getBarsInOrder(container).map((el) => el.getAttribute('fill'))
    expect(fills).toEqual([RED, YELLOW, GREEN, RED])
  })

  it('honours an explicit stat1Color override instead of the palette (Shepherding Control legend)', () => {
    const clickCard = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <ChurchContext.Provider value={{ clickCard }}>
          <ChurchGraph
            stat1="attendance"
            stat2={null}
            churchData={[
              { id: 'sr-1', category: 'services', attendance: 42, weekLabel: 'W1' },
              { id: 'sr-2', category: 'services', attendance: 55, weekLabel: 'W2' },
            ]}
            graphType="services"
            church="bacenta"
            stat1Color="hsl(var(--arrivals))"
          />
        </ChurchContext.Provider>
      </MemoryRouter>
    )

    const fills = getBarsInOrder(container).map((el) => el.getAttribute('fill'))
    expect(fills.every((f) => f === 'hsl(var(--arrivals))')).toBe(true)
  })
})

describe('ChurchGraph — renderBarLabel', () => {
  it('renders a value label above the bar when the value is > 0', () => {
    renderGraph({
      graphType: 'services',
      church: 'bacenta',
      churchData: [
        { id: 'sr-1', category: 'services', attendance: 42, weekLabel: 'Week 5' },
      ],
    })

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders no value label when the value is 0', () => {
    const { container } = renderGraph({
      graphType: 'services',
      church: 'bacenta',
      churchData: [
        { id: 'sr-1', category: 'services', attendance: 0, weekLabel: 'Week 5' },
      ],
    })

    // renderBarLabel's <text> carries no class; recharts' own XAxis tick
    // <text> always carries `recharts-cartesian-axis-tick-value`, so this
    // selector isolates "our" value label from the axis tick text. (Note:
    // assert on `.length`, not the NodeList/array itself — vitest's failure
    // diff cannot pretty-print raw SVG elements without throwing.)
    const valueLabels = container.querySelectorAll(
      'text:not(.recharts-cartesian-axis-tick-value)'
    )
    expect(valueLabels.length).toBe(0)
  })
})
