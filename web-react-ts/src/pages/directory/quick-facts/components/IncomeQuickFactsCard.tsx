import React, { useContext } from 'react'
import { Badge } from 'components/ui/badge'
import { cn } from 'components/lib/utils'
import { MemberContext } from 'contexts/MemberContext'
import '../QuickFacts.css'
import { getPercentageChange } from './quick-fact-utils'

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

  const isPositive = (percentageRiseOrFall as number) >= 0

  return (
    <div
      className="quick-fact-card w-full text-center"
      data-testid="incomeCard"
    >
      <div className="church-text">{details?.churchType}</div>
      <div className="stat-text">
        {' '}
        Average Weekday <br />
        {details?.cardType}{' '}
      </div>
      <div className="leader-text">{details?.leadersName}</div>
      <div className="branch-text">
        {`${details?.churchName} ${details?.churchType}`}
      </div>
      <div className="income-number">
        <span className="currency">{currentUser.currency} </span>
        {details?.churchAvgIncomeThisMonth === 'null'
          ? '--'
          : details?.churchAvgIncomeThisMonth}
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
