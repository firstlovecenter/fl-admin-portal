import React from 'react'
import { Badge } from 'components/ui/badge'
import { cn } from 'components/lib/utils'
import '../QuickFacts.css'
import { getPercentageChange } from './quick-fact-utils'

export interface AttendanceDetailsInterface {
  churchType: string
  cardType: string
  leadersName: string
  churchName: string
  churchAvgAttendanceThisMonth: number | string
  avgHigherLevelAttendanceThisMonth: number | string
  higherLevelName: string
}

export interface AttendanceQuickFactsProps {
  attendanceDetails: AttendanceDetailsInterface[]
}

const AttendanceQuickFactsCard = (props: AttendanceQuickFactsProps) => {
  const details = props?.attendanceDetails[0]

  const percentageRiseOrFall = getPercentageChange(
    details?.churchAvgAttendanceThisMonth as number,
    details?.avgHigherLevelAttendanceThisMonth as number
  )

  const isPositive = (percentageRiseOrFall as number) >= 0

  return (
    <div
      className="quick-fact-card w-full text-center"
      data-testid="attendanceCard"
    >
      <div className="church-text">{details?.churchType}</div>
      <div className="stat-text">
        Average Weekday <br />
        {details?.cardType}
      </div>
      <div className="leader-text">{details?.leadersName}</div>
      <div className="branch-text">
        {`${details?.churchName} ${details?.churchType}`}
      </div>
      <div className="facts-number">
        {details?.churchAvgAttendanceThisMonth === 'null'
          ? '--'
          : details?.churchAvgAttendanceThisMonth}
      </div>
      <div>
        <Badge
          className={cn(
            'mt-auto',
            isPositive
              ? 'badge-percentage-green bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]'
              : 'badge-percentage-red bg-destructive text-destructive-foreground hover:bg-destructive'
          )}
        >
          {isPositive ? '+' : ''}
          {percentageRiseOrFall}%
        </Badge>
      </div>
      <hr className="separator" />
      <div className="facts-number text-center">
        {details?.avgHigherLevelAttendanceThisMonth === 'null'
          ? '--'
          : details?.avgHigherLevelAttendanceThisMonth}
      </div>
      <div className="average-text">
        Average {details?.churchType} <br /> Attendance
      </div>
      <div className="higher-church-text">{details?.higherLevelName}</div>
    </div>
  )
}

export default AttendanceQuickFactsCard
