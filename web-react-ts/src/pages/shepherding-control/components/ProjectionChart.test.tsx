/**
 * Tests for ProjectionChart.tsx — the rows it hands to `ChurchGraph`.
 *
 * Two behaviours are covered, both SYN-217:
 *  1. Every row carries `weekLabel`. `ChurchGraph`'s XAxis reads its category
 *     off that key; without it the axis domain is empty and recharts paints
 *     neither ticks nor bars, so the projection chart was a blank plot area.
 *  2. The in-progress week never reaches the chart, matching the gate
 *     `getServiceGraphData` applies to every other chart in the portal.
 *
 * `ChurchGraph` is mocked because recharts cannot lay out or measure in jsdom;
 * the rows it receives are the contract this component owns.
 *
 * Weeks used below are ISO weeks of 2026:
 *   W16 = Mon 2026-04-13 … Sun 2026-04-19
 *   W19 = Mon 2026-05-04 … Sun 2026-05-10
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
// Side-effect import: initialises the i18next instance the component's
// useTranslation() resolves against, so t() returns English rather than keys.
import 'lib/i18n'
import { AggregateRecord } from 'pages/shepherding-control/shepherding-control-types'
import ProjectionChart from './ProjectionChart'

const churchDataSpy = vi.fn()

vi.mock('components/ChurchGraph/ChurchGraph', () => ({
  default: (props: { churchData: unknown[] }) => {
    churchDataSpy(props.churchData)
    return <div data-testid="church-graph" />
  },
}))

const MID_WEEK_19 = new Date('2026-05-06T09:00:00') // Wednesday of W19
const SUNDAY_WEEK_19 = new Date('2026-05-10T09:00:00') // Sunday closing W19

const record = (week: number, attendance: number): AggregateRecord => ({
  id: `stream-${week}-2026`,
  week,
  year: 2026,
  attendance,
  income: attendance * 10,
})

const SERVICE_RECORDS = [19, 18, 17, 16, 15].map((w) => record(w, w))

const renderChart = (props?: {
  serviceRecords?: AggregateRecord[]
  bussingRecords?: AggregateRecord[]
  metricA?: 'serviceAttendance' | 'bussingAttendance' | 'income'
  anchor?: { week: number; year: number }
}) =>
  render(
    <ProjectionChart
      level="Stream"
      serviceRecords={props?.serviceRecords ?? SERVICE_RECORDS}
      bussingRecords={props?.bussingRecords ?? []}
      metricA={props?.metricA ?? 'serviceAttendance'}
      metricB="income"
      anchor={props?.anchor ?? { week: 19, year: 2026 }}
      windowWeeks={4}
    />
  )

const lastRows = () =>
  churchDataSpy.mock.calls[churchDataSpy.mock.calls.length - 1][0] as {
    week: number | null
    weekLabel: string
    attendance: number | null
  }[]

beforeEach(() => churchDataSpy.mockClear())

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('ProjectionChart rows', () => {
  it('labels every row so the category axis has a domain to render', () => {
    vi.useFakeTimers()
    vi.setSystemTime(MID_WEEK_19)

    renderChart()

    expect(lastRows().map((r) => r.weekLabel)).toEqual([
      'W15',
      'W16',
      'W17',
      'W18',
    ])
  })

  it('drops the in-progress week and back-fills the window with an older one', () => {
    vi.useFakeTimers()
    vi.setSystemTime(MID_WEEK_19)

    renderChart()

    expect(lastRows().map((r) => r.week)).toEqual([15, 16, 17, 18])
  })

  it('suffixes the year on a window that reaches back past New Year', () => {
    vi.useFakeTimers()
    // Wednesday of W2/2026 — W1/2026 and the 2025 weeks are all complete.
    vi.setSystemTime(new Date('2026-01-07T09:00:00'))

    renderChart({
      serviceRecords: [
        { id: 'a', week: 2, year: 2026, attendance: 12, income: 120 },
        { id: 'b', week: 1, year: 2026, attendance: 11, income: 110 },
        { id: 'c', week: 52, year: 2025, attendance: 10, income: 100 },
        { id: 'd', week: 51, year: 2025, attendance: 9, income: 90 },
      ],
      anchor: { week: 2, year: 2026 },
    })

    // W2 is the week we are living through, so it drops out.
    expect(lastRows().map((r) => r.weekLabel)).toEqual([
      "W51'25",
      "W52'25",
      'W1',
    ])
  })

  it('windows the bussing dataset when the metric is a bussing one', () => {
    vi.useFakeTimers()
    vi.setSystemTime(MID_WEEK_19)

    renderChart({
      metricA: 'bussingAttendance',
      bussingRecords: [19, 18, 17].map((w) => record(w, w * 2)),
    })

    expect(lastRows().map((r) => r.week)).toEqual([17, 18])
    expect(lastRows().map((r) => r.attendance)).toEqual([34, 36])
  })

  it('charts the anchor week once its Sunday has arrived', () => {
    vi.useFakeTimers()
    vi.setSystemTime(SUNDAY_WEEK_19)

    renderChart()

    expect(lastRows().map((r) => r.week)).toEqual([16, 17, 18, 19])
    expect(lastRows().map((r) => r.weekLabel)).toEqual([
      'W16',
      'W17',
      'W18',
      'W19',
    ])
  })
})
