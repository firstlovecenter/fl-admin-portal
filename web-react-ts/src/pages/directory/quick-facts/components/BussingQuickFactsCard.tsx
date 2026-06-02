import React from 'react'
import { Badge } from 'components/ui/badge'
import { cn } from 'components/lib/utils'
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

  const isPositive = (percentageRiseOrFall as number) >= 0

  return (
    <div
      className="quick-fact-card w-full text-center"
      data-testid="bussingCard"
    >
      <div className="church-text">{details?.churchType}</div>
      <div className="stat-text"> Average {details?.cardType} </div>
      <div className="leader-text">{details?.leadersName}</div>
      <div className="branch-text">
        {`${details?.churchName} ${details?.churchType}`}
      </div>
      <div className="bussing-number">
        {details?.churchBussingThisMonth === 'null'
          ? '--'
          : details?.churchBussingThisMonth}
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
