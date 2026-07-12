/**
 * Regression suite for SYN-201 (recharts 2 -> 3 migration).
 *
 * Both `<Bar onClick>` handlers in TrendSpark.tsx do
 * `const point = item.payload as ChartPoint | undefined` before reading
 * `point.id` / `point.category` / `point.week` / `point.year`, and then
 * call `onBarClick({ id: point.id, category: point.category, week:
 * point.week, year: point.year })` — a literal object built from those
 * four fields, not a `{ ...point }` spread.
 *
 * IMPORTANT — honest characterization, verified empirically against the
 * pinned recharts version (3.9.2) by temporarily reverting the `.payload`
 * unwrap and re-running this suite: **none of these tests fail.**
 * `computeBarRectangles` (recharts internal) spreads the original data row
 * directly onto the *top level* of the click argument for backward
 * compatibility, in addition to nesting it under `.payload`. `id`,
 * `category`, `week`, and `year` don't collide with any of recharts' own
 * reserved geometry keys (`x`, `y`, `width`, `height`, `value`,
 * `background`, `payload`, `tooltipPosition`, `parentViewBox`,
 * `originalDataIndex`, `stackedBarStart`), so reading them directly off
 * `item` currently returns the same values as reading them off
 * `item.payload` — and because `onBarClick` reconstructs a literal 4-field
 * object (not a spread), there is also no key-pollution to catch here the
 * way there is in `ChurchGraph.tsx`'s `clickCard({ ...row, __typename })`
 * (see that file's test for a case where the unwrap *is* independently
 * verifiable).
 *
 * `.payload` remains the correct implementation regardless — it's the only
 * field documented/typed on `BarRectangleItem`; the top-level flattening is
 * an internal implementation detail, not a public contract, and would stop
 * protecting a `week`/`year`/`id`/`category` field that happened to collide
 * with one of recharts' reserved keys. These tests exist as forward-looking
 * regression coverage (documenting and locking in the current, correct
 * click-handler behavior) rather than as proof the SYN-201 migration fixed
 * an observable bug in *this* file on *this* recharts version.
 *
 * These tests render a *real* `<BarChart>` (recharts is not mocked) and
 * fire a real click on the rendered bar geometry — see
 * `web-react-ts/src/test-utils/recharts-test-utils.ts` for why that needs a
 * `ResizeObserver` + `getBoundingClientRect` + `matchMedia` (reduced-motion)
 * polyfill under jsdom.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { setupRechartsJsdomEnv } from 'test-utils/recharts-test-utils'
import TrendSpark from './TrendSpark'

setupRechartsJsdomEnv()

afterEach(cleanup)

type TrendSparkDatum = {
  id?: string
  category?: string
  attendance?: string
  income?: string
  week?: number | string
  year?: number | string
  date?: string
}

function renderTrendSpark(props: {
  data: TrendSparkDatum[]
  incomeTracked?: boolean
  mode?: 'weekday' | 'bussing'
  onBarClick?: ReturnType<typeof vi.fn>
}) {
  const onBarClick = props.onBarClick ?? vi.fn()
  const utils = render(
    <TrendSpark
      data={props.data}
      incomeTracked={props.incomeTracked ?? true}
      mode={props.mode ?? 'weekday'}
      onBarClick={onBarClick}
    />
  )
  return { ...utils, onBarClick }
}

// recharts renders each data row's `<Bar>` rectangle with the row's `id` as
// the SVG element's `id` attribute — a stable hook for "the bar for this
// point" without reaching into recharts internals.
function getBarById(container: HTMLElement, id: string) {
  return container.querySelector(`.recharts-bar-rectangle path[id="${id}"]`)
}

function getBarsInOrder(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll('.recharts-bar-rectangle path.recharts-rectangle')
  )
}

describe('TrendSpark — Bar onClick (recharts-3 payload unwrap)', () => {
  it('attendance bar: clicking a drillable-category point unwraps item.payload and calls onBarClick with id/category/week/year', () => {
    const { container, onBarClick } = renderTrendSpark({
      data: [
        {
          id: 'sr-1',
          category: 'services',
          attendance: '42',
          income: '0',
          week: 5,
          year: 2026,
        },
      ],
      incomeTracked: false,
    })

    const bar = getBarById(container, 'sr-1')
    expect(bar).toBeTruthy()
    fireEvent.click(bar!)

    expect(onBarClick).toHaveBeenCalledWith({
      id: 'sr-1',
      category: 'services',
      week: 5,
      year: 2026,
    })
  })

  it('attendance bar (bussing mode): drillable "bussing" category calls onBarClick with the unwrapped point', () => {
    const { container, onBarClick } = renderTrendSpark({
      data: [
        {
          id: 'br-1',
          category: 'bussing',
          attendance: '20',
          week: 8,
          year: 2026,
        },
      ],
      mode: 'bussing',
      incomeTracked: false,
    })

    const bar = getBarById(container, 'br-1')
    fireEvent.click(bar!)

    expect(onBarClick).toHaveBeenCalledWith({
      id: 'br-1',
      category: 'bussing',
      week: 8,
      year: 2026,
    })
  })

  it('income bar: clicking a drillable-category point unwraps item.payload and calls onBarClick with the unwrapped point', () => {
    const { container, onBarClick } = renderTrendSpark({
      data: [
        {
          id: 'sr-2',
          category: 'services',
          attendance: '10',
          income: '75',
          week: 6,
          year: 2026,
        },
      ],
      incomeTracked: true,
    })

    // Two <Bar>s render for this single point (attendance + income); both
    // rectangles carry the same row id. The income bar is the second <Bar>
    // in JSX order, so it is the second rendered rectangle for that id.
    const bars = getBarsInOrder(container).filter(
      (el) => el.getAttribute('id') === 'sr-2'
    )
    expect(bars).toHaveLength(2)
    fireEvent.click(bars[1]!)

    expect(onBarClick).toHaveBeenCalledWith({
      id: 'sr-2',
      category: 'services',
      week: 6,
      year: 2026,
    })
  })

  it('no-ops when the category is not drillable (e.g. "ministryMeeting")', () => {
    const { container, onBarClick } = renderTrendSpark({
      data: [
        {
          id: 'mm-1',
          category: 'ministryMeeting',
          attendance: '30',
          week: 5,
          year: 2026,
        },
      ],
      incomeTracked: false,
    })

    const bar = getBarById(container, 'mm-1')
    fireEvent.click(bar!)

    expect(onBarClick).not.toHaveBeenCalled()
  })

  it('no-ops when the point has no id', () => {
    const { container, onBarClick } = renderTrendSpark({
      data: [{ category: 'services', attendance: '30', week: 5, year: 2026 }],
      incomeTracked: false,
    })

    const [bar] = getBarsInOrder(container)
    fireEvent.click(bar!)

    expect(onBarClick).not.toHaveBeenCalled()
  })

  it('no-ops when onBarClick is not provided', () => {
    const { container } = render(
      <TrendSpark
        data={[
          {
            id: 'sr-3',
            category: 'services',
            attendance: '30',
            week: 5,
            year: 2026,
          },
        ]}
        incomeTracked={false}
      />
    )

    const bar = getBarById(container, 'sr-3')
    expect(bar).toBeTruthy()
    // Clicking must not throw even without an onBarClick handler.
    expect(() => fireEvent.click(bar!)).not.toThrow()
  })
})

describe('TrendSpark — renderBarLabel', () => {
  it('renders a value label above the bar when attendance is > 0', () => {
    const { container } = renderTrendSpark({
      data: [
        {
          id: 'sr-1',
          category: 'services',
          attendance: '42',
          week: 5,
          year: 2026,
        },
      ],
      incomeTracked: false,
    })

    // renderBarLabel's <text> carries no class; recharts' own XAxis tick
    // <text> always carries `recharts-cartesian-axis-tick-value`, so this
    // selector isolates "our" value label from the axis tick text.
    const valueLabels = container.querySelectorAll(
      'text:not(.recharts-cartesian-axis-tick-value)'
    )
    expect(valueLabels.length).toBe(1)
    expect(valueLabels[0].textContent).toBe('42')
  })

  it('renders no value label when attendance is 0 (but income is > 0, so the chart still renders)', () => {
    const { container } = renderTrendSpark({
      data: [
        {
          id: 'sr-1',
          category: 'services',
          attendance: '0',
          income: '50',
          week: 5,
          year: 2026,
        },
      ],
      incomeTracked: true,
    })

    // Only the income bar's label ("50") should render; the attendance
    // bar's value is 0 so renderBarLabel returns null for it.
    const valueLabels = Array.from(
      container.querySelectorAll('text:not(.recharts-cartesian-axis-tick-value)')
    ).map((el) => el.textContent)
    expect(valueLabels).toEqual(['50'])
  })
})
