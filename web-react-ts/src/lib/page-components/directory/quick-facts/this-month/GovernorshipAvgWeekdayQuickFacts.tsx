import React, { useContext } from 'react'
import '../QuickFacts.css'
import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { GOVERNORSHIP_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'
import QuickFactsHeader from '../components/QuickFactsHeader'
import QuickFactsSlider from '../components/QuickFactsSlider'
import PlaceholderCustom from 'components/Placeholder'
import { AttendanceDetailsInterface } from '../components/AttendanceQuickFactsCard'
import { IncomeDetailsInterface } from '../components/IncomeQuickFactsCard'
import { MemberContext } from 'contexts/MemberContext'
import { BussingDetailsInterface } from '../components/BussingQuickFactsCard'

const GovernorshipAvgWeekdayQuickFacts = () => {
  const { governorshipId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(GOVERNORSHIP_AVG_WEEKDAY_STATS, {
    variables: { governorshipId, days: 30 },
  })

  const governorship = data?.governorships[0]
  const leadersName = `${governorship?.leader?.firstName} ${governorship?.leader?.lastName}`
  const churchName = `${governorship?.name}`
  const higherLevelName = `${governorship?.council?.name} ${governorship?.council?.__typename}`

  const attendanceDetails: AttendanceDetailsInterface[] = [
    {
      churchType: 'Governorship',
      cardType: 'Attendance',
      leadersName,
      churchName,
      churchAvgAttendanceThisMonth: `${governorship?.avgWeekdayStats?.attendance}`,
      avgHigherLevelAttendanceThisMonth: `${governorship?.council?.avgGovernorshipWeekdayStats?.attendance}`,
      higherLevelName,
    },
  ]

  const incomeDetails: IncomeDetailsInterface[] = [
    {
      churchType: 'Governorship',
      cardType: 'Income',
      leadersName,
      churchName,
      currency: currentUser.currency,
      churchAvgIncomeThisMonth: `${governorship?.avgWeekdayStats?.income}`,
      avgHigherLevelIncomeThisMonth: `${governorship?.council?.avgGovernorshipWeekdayStats.income}`,
      higherLevelName,
    },
  ]

  const bussingDetails: BussingDetailsInterface[] = [
    {
      churchType: 'Governorship',
      cardType: 'Bussing',
      leadersName,
      churchName,
      churchBussingThisMonth: `${governorship?.avgBussingAttendance}`,
      avgHigherLevelBussingThisMonth: `${governorship?.council?.avgGovernorshipBussingAttendance}`,
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
export default GovernorshipAvgWeekdayQuickFacts
