import React from 'react'
import { Badge } from 'react-bootstrap'
import '../QuickFacts.css'
import { getPercentageChange } from './quick-fact-utils'

export interface BussingDetailsInterface {
  churchType: string
  cardType: string
  leadersName: string
  churchName: string
  churchBussingThisMonth: number | string
  avgHigherLevelBussingThisMonth: number | string
  higherLevelName: string
}

export interface BussingQuickFactsProps {
  bussingDetails: BussingDetailsInterface[]
}

const BussingQuickFactsCard = (props: BussingQuickFactsProps) => {
  const details = props?.bussingDetails[0]

  const percentageRiseOrFall = getPercentageChange(
    details?.churchBussingThisMonth as number,
    details?.avgHigherLevelBussingThisMonth as number
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
      data-testid="bussingCard"
    >
      <div className="church-text">{details?.churchType}</div>
      <div className="stat-text "> Average {details?.cardType} </div>
      <div className="leader-text">{details?.leadersName}</div>
      <div className="branch-text">
        {details?.churchName + ' ' + details?.churchType}
      </div>
      <div className="bussing-number">
        {details?.churchBussingThisMonth === 'null'
          ? '--'
          : details?.churchBussingThisMonth}
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
      <div className="bussing-number">
        {details?.avgHigherLevelBussingThisMonth === 'null'
          ? '--'
          : details?.avgHigherLevelBussingThisMonth}
      </div>
      <div className="average-text">
        Average {details?.churchType} <br /> Bussing
      </div>
      <div className="higher-church-text">{details?.higherLevelName}</div>
    </div>
  )
}

export default BussingQuickFactsCard
