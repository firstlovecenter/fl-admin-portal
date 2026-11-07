import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import 'lib/i18n'
import ProjectionChart from './ProjectionChart'
import { AggregateRecord } from 'pages/shepherding-control/shepherding-control-types'

const { chartProps } = vi.hoisted(() => ({
  chartProps: vi.fn(),
}))

vi.mock('components/ChurchGraph/ChurchGraph', () => ({
  default: (props: unknown) => {
    chartProps(props)
    return null
  },
}))

const record = (
  week: number,
  year: number,
  attendance: number
): AggregateRecord => ({
  id: `${year}-${week}`,
  week,
  year,
  attendance,
  income: 100,
})

afterEach(() => {
  cleanup()
  chartProps.mockClear()
})

describe('ProjectionChart week labels', () => {
  it('gives every bar a weekLabel so recharts does not drop the row', () => {
    const currentYear = new Date().getFullYear()
    const priorYear = currentYear - 1

    render(
      <ProjectionChart
        level="Denomination"
        serviceRecords={[
          record(50, priorYear, 400),
          record(10, currentYear, 500),
        ]}
        bussingRecords={[]}
        metricA="serviceAttendance"
        metricB="income"
        anchor={{ week: 10, year: currentYear }}
        windowWeeks={4}
      />
    )

    const data = (
      chartProps.mock.calls[0][0] as {
        churchData: Array<{ week: number; weekLabel: string }>
      }
    ).churchData

    expect(data.map((row) => row.weekLabel)).toEqual([
      `W50'${String(priorYear).slice(-2)}`,
      'W10',
    ])
    expect(data.every((row) => row.weekLabel)).toBe(true)
  })
})
