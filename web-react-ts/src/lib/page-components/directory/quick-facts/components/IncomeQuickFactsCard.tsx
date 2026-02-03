import React, { useContext } from 'react'
import { Badge } from 'react-bootstrap'
import '../QuickFacts.css'
import { getPercentageChange } from './quick-fact-utils'
import { MemberContext } from 'contexts/MemberContext'

export interface IncomeDetailsInterface {
  churchType: string
  cardType: string
  leadersName: string
  churchName: string
  currency: string
  churchAvgIncomeThisMonth: number | string
  avgHigherLevelIncomeThisMonth: number | string
  higherLevelName: string
}

export interface IncomeQuickFactsProps {
  incomeDetails: IncomeDetailsInterface[]
}

const IncomeQuickFactsCard = (props: IncomeQuickFactsProps) => {
  const { currentUser } = useContext(MemberContext)
  const details = props?.incomeDetails[0]

  const percentageRiseOrFall = getPercentageChange(
    details?.churchAvgIncomeThisMonth as number,
    details?.avgHigherLevelIncomeThisMonth as number
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
    <div className="w-100 text-center quick-fact-card" data-testid="incomeCard">
      <div className="church-text">{details?.churchType}</div>
      <div className="stat-text ">
        {' '}
        Average Weekday <br />
        {details?.cardType}{' '}
      </div>
      <div className="leader-text">{details?.leadersName}</div>
      <div className="branch-text">
        {details?.churchName + ' ' + details?.churchType}
      </div>
      <div className="income-number">
        <span className="currency">{currentUser.currency} </span>
        {details?.churchAvgIncomeThisMonth === 'null'
          ? '--'
          : details?.churchAvgIncomeThisMonth}
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
      <div className="income-number">
        <span className="currency">{currentUser.currency} </span>
        {details?.avgHigherLevelIncomeThisMonth === 'null'
          ? '--'
          : details?.avgHigherLevelIncomeThisMonth}
      </div>
      <div className="average-text">
        Average {details?.churchType} <br /> Income
      </div>
      <div className="higher-church-text">{details?.higherLevelName}</div>
    </div>
  )
}

export default IncomeQuickFactsCard
