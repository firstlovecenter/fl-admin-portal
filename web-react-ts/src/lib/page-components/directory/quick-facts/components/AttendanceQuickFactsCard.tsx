import React from 'react'
import { Badge } from 'react-bootstrap'
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

  const getBadgeBackground = () => {
    if ((percentageRiseOrFall as number) >= 0) return 'green'
    return 'red'
  }

  const getBadgeColor = () => {
    if ((percentageRiseOrFall as number) >= 0) return 'badge-percentage-green'
    return 'badge-percentage-red'
  }

  return (
    <div
      className="w-100 text-center quick-fact-card"
      data-testid="attendanceCard"
    >
      <div className="church-text">{details?.churchType}</div>
      <div className="stat-text ">
        Average Weekday <br />
        {details?.cardType}
      </div>
      <div className="leader-text">{details?.leadersName}</div>
      <div className="branch-text">
        {details?.churchName + ' ' + details?.churchType}
      </div>
      <div className="facts-number">
        {details?.churchAvgAttendanceThisMonth === 'null'
          ? '--'
          : details?.churchAvgAttendanceThisMonth}
      </div>
      <div>
        <Badge
          bg={`${getBadgeBackground()}`}
          className={`${getBadgeColor()} mt-auto`}
        >
          {(percentageRiseOrFall as number) >= 0 ? '+' : ''}
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
