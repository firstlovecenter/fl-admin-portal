/**
 * SYN-217 — shepherding-control charts the same weekly aggregates as the trends
 * graphs, but windows them itself instead of going through
 * `getServiceGraphData`, so the in-progress week suppression added in SYN-214
 * never reached it: the newest column was the week we are still living through.
 *
 * Weeks used below are ISO weeks of 2026:
 *   W32 = Mon 2026-08-03 … Sun 2026-08-09
 *   W33 = Mon 2026-08-10 … Sun 2026-08-16
 *   W34 = Mon 2026-08-17 … Sun 2026-08-23
 *   W35 = Mon 2026-08-24 … Sun 2026-08-30
 */

import { describe, it, expect } from 'vitest'
import { AggregateRecord } from './shepherding-control-types'
import {
  currentAnchorWeekYear,
  shiftAnchor,
  sliceWindowedRecords,
} from './shepherding-control-utils'

const MID_WEEK_35 = new Date('2026-08-26T09:00:00') // Wednesday of W35
const SUNDAY_WEEK_35 = new Date('2026-08-30T09:00:00') // Sunday closing W35

const record = (
  week: number,
  attendance: number,
  year = 2026
): AggregateRecord => ({
  id: `council-${week}-${year}`,
  week,
  year,
  attendance,
  income: attendance * 10,
})

const weeksOf = (records: AggregateRecord[]) => records.map((r) => r.week)

describe('sliceWindowedRecords', () => {
  it('drops the in-progress week even when it is the anchor', () => {
    const result = sliceWindowedRecords(
      [record(35, 533), record(34, 533), record(33, 581), record(32, 908)],
      { week: 35, year: 2026 },
      4,
      MID_WEEK_35
    )

    expect(weeksOf(result)).toEqual([32, 33, 34])
  })

  it('cannot be paged forward onto the in-progress week', () => {
    // The presenter clicked "newer" past today — the anchor now sits in the
    // future, so the anchor comparison alone would let W35 back in.
    const result = sliceWindowedRecords(
      [record(35, 533), record(34, 533), record(33, 581)],
      { week: 39, year: 2026 },
      4,
      MID_WEEK_35
    )

    expect(weeksOf(result)).toEqual([33, 34])
  })

  it('charts the current week once its Sunday has arrived', () => {
    const result = sliceWindowedRecords(
      [record(35, 533), record(34, 533), record(33, 581)],
      { week: 35, year: 2026 },
      4,
      SUNDAY_WEEK_35
    )

    expect(weeksOf(result)).toEqual([33, 34, 35])
  })

  it('keeps the newest `windowWeeks` completed weeks, oldest first', () => {
    const result = sliceWindowedRecords(
      [
        record(35, 533),
        record(34, 100),
        record(33, 200),
        record(32, 300),
        record(31, 400),
        record(30, 500),
      ],
      { week: 35, year: 2026 },
      4,
      MID_WEEK_35
    )

    expect(weeksOf(result)).toEqual([31, 32, 33, 34])
  })

  it('still drops weeks newer than an anchor the presenter paged back to', () => {
    const result = sliceWindowedRecords(
      [record(34, 100), record(33, 200), record(32, 300)],
      { week: 33, year: 2026 },
      4,
      MID_WEEK_35
    )

    expect(weeksOf(result)).toEqual([32, 33])
  })

  it('ignores records with no usable week or year', () => {
    const result = sliceWindowedRecords(
      [
        { id: 'a', week: null, year: 2026, attendance: 10 },
        { id: 'b', week: 33, year: null, attendance: 10 },
        record(33, 200),
      ],
      { week: 34, year: 2026 },
      4,
      MID_WEEK_35
    )

    expect(weeksOf(result)).toEqual([33])
  })

  it('returns an empty window for an empty dataset', () => {
    expect(
      sliceWindowedRecords([], { week: 34, year: 2026 }, 4, MID_WEEK_35)
    ).toEqual([])
  })

  it('leaves a week that only shares the number with the in-progress week', () => {
    const result = sliceWindowedRecords(
      [record(35, 400, 2025), record(34, 100)],
      { week: 35, year: 2026 },
      4,
      MID_WEEK_35
    )

    expect(result.map((r) => `${r.year}-${r.week}`)).toEqual([
      '2025-35',
      '2026-34',
    ])
  })
})

describe('currentAnchorWeekYear', () => {
  it('opens on the last completed week while the current one is in progress', () => {
    expect(currentAnchorWeekYear(MID_WEEK_35)).toEqual({ week: 34, year: 2026 })
  })

  it('opens on the current week once its Sunday has arrived', () => {
    expect(currentAnchorWeekYear(SUNDAY_WEEK_35)).toEqual({
      week: 35,
      year: 2026,
    })
  })

  it('does not mutate the date it is handed', () => {
    const now = new Date(MID_WEEK_35)
    currentAnchorWeekYear(now)
    expect(now.toISOString()).toBe(MID_WEEK_35.toISOString())
  })

  it('steps back across a year boundary', () => {
    // Thu 2026-01-01 sits in ISO week 1 of 2026 (Mon 2025-12-29 → Sun
    // 2026-01-04), so the last completed week is W52 of 2025.
    expect(currentAnchorWeekYear(new Date('2026-01-01T09:00:00'))).toEqual({
      week: 52,
      year: 2025,
    })
  })

  // It derives the previous week by subtracting seven days from `now` rather
  // than rebuilding a date from (week, year) the way `shiftAnchor` does — that
  // helper works in UTC while `getWeekNumber` / `getISOWeekYear` read local
  // time, which disagree for anyone off UTC. Paging forward from the anchor
  // must still land back on the week we are living through.
  it('sits exactly one week behind the in-progress week', () => {
    expect(shiftAnchor(currentAnchorWeekYear(MID_WEEK_35), 1)).toEqual({
      week: 35,
      year: 2026,
    })
  })
})
