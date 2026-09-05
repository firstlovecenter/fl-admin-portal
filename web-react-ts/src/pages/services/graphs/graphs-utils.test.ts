/**
 * SYN-214 — the trends graphs must not plot a week whose services are not yet
 * due. Before its Sunday, the in-progress week's `AggregateServiceRecord` holds
 * whatever stray records carry that week's date, which charted as a phantom bar
 * mirroring the previous week.
 *
 * Weeks used below are ISO weeks of 2026:
 *   W34 = Mon 2026-08-17 … Sun 2026-08-23
 *   W35 = Mon 2026-08-24 … Sun 2026-08-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  isInProgressServiceWeek,
  GraphTypes,
} from './graphs-utils'

const MID_WEEK_35 = new Date('2026-08-26T09:00:00') // Wednesday of W35
const SUNDAY_WEEK_35 = new Date('2026-08-30T09:00:00') // Sunday closing W35

const aggregate = (week: number, attendance: number, income: number) => ({
  id: `council-${week}-2026`,
  week,
  year: 2026,
  attendance,
  income,
  numberOfServices: 3,
})

/** Only the fields `getServiceGraphData` reads are provided. */
const churchWith = (aggregateServiceRecords: unknown[]) =>
  ({ aggregateServiceRecords }) as never

const useClock = (now: Date) => {
  vi.useFakeTimers()
  vi.setSystemTime(now)
}

afterEach(() => {
  vi.useRealTimers()
})

describe('isInProgressServiceWeek', () => {
  it('flags the current week before its Sunday', () => {
    expect(isInProgressServiceWeek(35, 2026, MID_WEEK_35)).toBe(true)
  })

  it('flags the current week on its first day, Monday', () => {
    expect(
      isInProgressServiceWeek(35, 2026, new Date('2026-08-24T09:00:00'))
    ).toBe(true)
  })

  it('still flags the current week on Saturday, the last day before it is due', () => {
    expect(
      isInProgressServiceWeek(35, 2026, new Date('2026-08-29T23:00:00'))
    ).toBe(true)
  })

  it('clears the current week once Sunday arrives', () => {
    expect(isInProgressServiceWeek(35, 2026, SUNDAY_WEEK_35)).toBe(false)
  })

  it('never flags a completed week', () => {
    expect(isInProgressServiceWeek(34, 2026, MID_WEEK_35)).toBe(false)
  })

  it('does not flag the same week number in another year', () => {
    expect(isInProgressServiceWeek(35, 2025, MID_WEEK_35)).toBe(false)
  })

  it('ignores records with no usable week or year', () => {
    expect(isInProgressServiceWeek(null, 2026, MID_WEEK_35)).toBe(false)
    expect(isInProgressServiceWeek(35, undefined, MID_WEEK_35)).toBe(false)
  })

  it('does not mutate the caller’s date', () => {
    const now = new Date(MID_WEEK_35)
    isInProgressServiceWeek(35, 2026, now)
    expect(now.toISOString()).toBe(MID_WEEK_35.toISOString())
  })

  // ISO week 1 of 2026 runs Mon 2025-12-29 → Sun 2026-01-04, so the aggregator
  // keys it `-1-2025` while running in December and `-1-2026` from 1 January.
  // Both are the same in-progress week and both must stay off the chart.
  describe('a week straddling New Year', () => {
    it.each([
      ['Tue 2025-12-30', '2025-12-30T09:00:00'],
      ['Thu 2026-01-01', '2026-01-01T09:00:00'],
      ['Sat 2026-01-03', '2026-01-03T09:00:00'],
    ])('suppresses both calendar keys on %s', (_label, iso) => {
      const now = new Date(iso)
      expect(isInProgressServiceWeek(1, 2025, now)).toBe(true)
      expect(isInProgressServiceWeek(1, 2026, now)).toBe(true)
    })

    it('releases both keys on Sunday 2026-01-04', () => {
      const now = new Date('2026-01-04T09:00:00')
      expect(isInProgressServiceWeek(1, 2025, now)).toBe(false)
      expect(isInProgressServiceWeek(1, 2026, now)).toBe(false)
    })

    it('leaves the completed week 52 of 2025 alone', () => {
      expect(
        isInProgressServiceWeek(52, 2025, new Date('2026-01-01T09:00:00'))
      ).toBe(false)
    })
  })
})

describe('getServiceGraphData — weekday categories keep the current week', () => {
  beforeEach(() => useClock(MID_WEEK_35))

  it('keeps the in-progress week in the All Services dataset', () => {
    const church = churchWith([
      aggregate(35, 533, 11900),
      aggregate(34, 533, 11900),
      aggregate(33, 581, 17600),
      aggregate(32, 908, 7800),
    ])

    const result = getServiceGraphData(church, 'serviceAggregate', 24) ?? []

    expect(result.map((r) => r.week)).toEqual([32, 33, 34, 35])
    expect(result.map((r) => r.weekLabel)).toEqual([
      'W32',
      'W33',
      'W34',
      'W35',
    ])
  })

  it('keeps the in-progress week in the Joint Service dataset', () => {
    const church = {
      services: [
        {
          id: 'a',
          week: 35,
          attendance: 214,
          serviceDate: { date: '2026-08-26' },
        },
        {
          id: 'b',
          week: 34,
          attendance: 228,
          serviceDate: { date: '2026-08-23' },
        },
      ],
    } as never

    const result = getServiceGraphData(church, 'services', 24) ?? []

    expect(result.map((r) => r.week)).toEqual([34, 35])
  })

  it('includes the in-progress week in the stat-card averages', () => {
    const church = churchWith([
      aggregate(35, 1000, 1000),
      aggregate(34, 200, 400),
      aggregate(33, 100, 200),
    ])

    const data = getServiceGraphData(church, 'serviceAggregate', 24) ?? []

    // Default window is 4; three weeks → (1000 + 200 + 100) / 3
    expect(getMonthlyStatAverage(data as never, 'attendance')).toBe('433.33')
  })

  it('renders the in-progress week when it is the only week present', () => {
    const result = getServiceGraphData(
      churchWith([aggregate(35, 533, 11900)]),
      'serviceAggregate',
      24
    )

    expect(result?.map((r) => r.week)).toEqual([35])
  })

  it('keeps the in-progress week in the USD All Services dataset', () => {
    const church = {
      aggregateServiceRecords: [
        { id: 'w35', week: 35, year: 2026, attendance: 533, dollarIncome: 900 },
        { id: 'w34', week: 34, year: 2026, attendance: 581, dollarIncome: 800 },
      ],
    } as never

    const result =
      getServiceGraphData(church, 'serviceAggregateWithDollar', 24) ?? []

    expect(result.map((r) => r.week)).toEqual([34, 35])
  })

  it.each<GraphTypes>(['bussingAggregate', 'rehearsalAggregate'])(
    'leaves the current week alone for non-Sunday-cadence category %s',
    (category) => {
      const church = {
        aggregateBussingRecords: [aggregate(35, 83, 0), aggregate(34, 70, 0)],
        aggregateRehearsalRecords: [aggregate(35, 83, 0), aggregate(34, 70, 0)],
      } as never

      const result = getServiceGraphData(church, category, 24) ?? []

      expect(result.map((r) => r.week)).toEqual([34, 35])
    }
  )
})

describe('getServiceGraphData — on Sunday the week remains visible', () => {
  beforeEach(() => useClock(SUNDAY_WEEK_35))

  it('renders the current week once its Sunday has arrived', () => {
    const church = churchWith([
      aggregate(35, 533, 11900),
      aggregate(34, 581, 17600),
    ])

    const result = getServiceGraphData(church, 'serviceAggregate', 24) ?? []

    expect(result.map((r) => r.week)).toEqual([34, 35])
  })
})
