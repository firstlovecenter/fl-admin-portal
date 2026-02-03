import React, { useContext } from 'react'
import '../QuickFacts.css'
import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { COUNCIL_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'
import QuickFactsHeader from '../components/QuickFactsHeader'
import QuickFactsSlider from '../components/QuickFactsSlider'
import PlaceholderCustom from 'components/Placeholder'
import { AttendanceDetailsInterface } from '../components/AttendanceQuickFactsCard'
import { IncomeDetailsInterface } from '../components/IncomeQuickFactsCard'
import { MemberContext } from 'contexts/MemberContext'
import { BussingDetailsInterface } from '../components/BussingQuickFactsCard'

const CouncilAvgWeekdayQuickFacts = () => {
  const { councilId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(COUNCIL_AVG_WEEKDAY_STATS, {
    variables: { councilId, days: 30 },
  })

  const council = data?.councils[0]
  const leadersName = `${council?.leader?.firstName} ${council?.leader?.lastName}`
  const churchName = `${council?.name}`
  const higherLevelName = `${council?.stream?.name} ${council?.stream?.__typename}`

  const attendanceDetails: AttendanceDetailsInterface[] = [
    {
      churchType: 'Council',
      cardType: 'Attendance',
      leadersName,
      churchName,
      churchAvgAttendanceThisMonth: `${council?.avgWeekdayStats?.attendance}`,
      avgHigherLevelAttendanceThisMonth: `${council?.stream?.avgCouncilWeekdayStats?.attendance}`,
      higherLevelName,
    },
  ]

  const incomeDetails: IncomeDetailsInterface[] = [
    {
      churchType: 'Council',
      cardType: 'Income',
      leadersName,
      churchName,
      currency: currentUser.currency,
      churchAvgIncomeThisMonth: `${council?.avgWeekdayStats?.income}`,
      avgHigherLevelIncomeThisMonth: `${council?.stream?.avgCouncilWeekdayStats?.income}`,
      higherLevelName,
    },
  ]

  const bussingDetails: BussingDetailsInterface[] = [
    {
      churchType: 'Council',
      cardType: 'Bussing',
      leadersName,
      churchName,
      churchBussingThisMonth: `${council?.avgBussingAttendance}`,
      avgHigherLevelBussingThisMonth: `${council?.stream?.avgCouncilBussingAttendance}`,
      higherLevelName,
    },
  ]

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div className="quick-fact-page">
        <QuickFactsHeader />
        <PlaceholderCustom loading={loading}>
          <div className=" page-padding mt-3 quick-fact-card-wrapper">
            <QuickFactsSlider
              attendanceDetails={attendanceDetails}
              incomeDetails={incomeDetails}
              bussingDetails={bussingDetails}
            />
          </div>
        </PlaceholderCustom>
      </div>
    </ApolloWrapper>
  )
}
export default CouncilAvgWeekdayQuickFacts
