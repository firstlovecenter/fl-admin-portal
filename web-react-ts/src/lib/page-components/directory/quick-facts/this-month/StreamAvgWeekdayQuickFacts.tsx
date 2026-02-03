import React, { useContext } from 'react'
import '../QuickFacts.css'
import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { STREAM_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'
import QuickFactsHeader from '../components/QuickFactsHeader'
import QuickFactsSlider from '../components/QuickFactsSlider'
import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import { AttendanceDetailsInterface } from '../components/AttendanceQuickFactsCard'
import { IncomeDetailsInterface } from '../components/IncomeQuickFactsCard'
import { BussingDetailsInterface } from '../components/BussingQuickFactsCard'

const StreamAvgWeekdayQuickFacts = () => {
  const { streamId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(STREAM_AVG_WEEKDAY_STATS, {
    variables: { streamId, days: 30 },
  })

  const stream = data?.streams[0]
  const leadersName = `${stream?.leader?.firstName} ${stream?.leader?.lastName}`
  const churchName = `${stream?.name}`
  const higherLevelName = `${stream?.campus?.name} ${stream?.campus?.__typename}`

  const attendanceDetails: AttendanceDetailsInterface[] = [
    {
      churchType: 'Stream',
      cardType: 'Attendance',
      leadersName,
      churchName,
      churchAvgAttendanceThisMonth: `${stream?.avgWeekdayStats?.attendance}`,
      avgHigherLevelAttendanceThisMonth: `${stream?.campus?.avgStreamWeekdayStats?.attendance}`,
      higherLevelName,
    },
  ]

  const incomeDetails: IncomeDetailsInterface[] = [
    {
      churchType: 'Stream',
      cardType: 'Income',
      leadersName,
      churchName,
      currency: currentUser.currency,
      churchAvgIncomeThisMonth: `${stream?.avgWeekdayStats?.income}`,
      avgHigherLevelIncomeThisMonth: `${stream?.campus?.avgStreamWeekdayStats?.income}`,
      higherLevelName,
    },
  ]

  const bussingDetails: BussingDetailsInterface[] = [
    {
      churchType: 'Stream',
      cardType: 'Bussing',
      leadersName,
      churchName,
      churchBussingThisMonth: `${stream?.avgBussingAttendance}`,
      avgHigherLevelBussingThisMonth: `${stream?.campus?.avgStreamBussingAttendance}`,
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
export default StreamAvgWeekdayQuickFacts
