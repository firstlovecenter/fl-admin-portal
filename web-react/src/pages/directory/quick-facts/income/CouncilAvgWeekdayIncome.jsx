import React, { useContext } from 'react'
import '../QuickFacts.css'
import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import BaseComponent from 'components/base-component/BaseComponent'
import { COUNCIL_AVG_WEEKDAY_INCOME_THIS_MONTH } from '../QuickFactsQueries'
import QuickFactsHeader from '../components/QuickFactsHeader'
import IncomeQuickFactsCard from '../components/IncomeQuickFactsCard'

const CouncilAvgWeekdayIncome = () => {
  const { councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    COUNCIL_AVG_WEEKDAY_INCOME_THIS_MONTH,
    {
      variables: { councilId: councilId },
    }
  )

  const council = data?.councils[0]

  const details = [
    {
      churchType: 'Council',
      cardType: 'Income',
      leadersName: `${council?.leader?.firstName} ${council?.leader?.lastName}`,
      churchName: `${council?.name}`,
      churchAvgIncomeThisMonth: `${council?.avgWeekdayIncomeThisMonth}`,
      avgHigherLevelIncomeThisMonth: `${council?.stream?.avgCouncilWeekdayIncomeThisMonth}`,
      higherLevelName: `${council?.stream?.name} ${council?.stream?.__typename}`,
    },
  ]

  return (
    <BaseComponent loading={loading} error={error} data={data}>
      <div className="quick-fact-page">
        <QuickFactsHeader previous={'attendance'} next={'attendance'} />

        <div className=" page-padding mt-3 quick-fact-card-wrapper">
          <IncomeQuickFactsCard details={details} />
        </div>
      </div>
    </BaseComponent>
  )
}
export default CouncilAvgWeekdayIncome
