import React, { useContext } from 'react'
import '../QuickFacts.css'
import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { CAMPUS_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'
import QuickFactsHeader from '../components/QuickFactsHeader'
import QuickFactsSlider from '../components/QuickFactsSlider'
import PlaceholderCustom from 'components/Placeholder'
import { AttendanceDetailsInterface } from '../components/AttendanceQuickFactsCard'
import { IncomeDetailsInterface } from '../components/IncomeQuickFactsCard'
import { MemberContext } from 'contexts/MemberContext'

const CampusAvgWeekdayQuickFacts = () => {
  const { campusId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(CAMPUS_AVG_WEEKDAY_STATS, {
    variables: { campusId, days: 30 },
  })

  const campus = data?.campuses[0]
  const leadersName = `${campus?.leader?.firstName} ${campus?.leader?.lastName}`
  const churchName = `${campus?.name}`
  const higherLevelName = `${campus?.oversight?.name} `

  const attendanceDetails: AttendanceDetailsInterface[] = [
    {
      churchType: 'Campus',
      cardType: 'Attendance',
      leadersName,
      churchName,
      churchAvgAttendanceThisMonth: `${campus?.avgWeekdayStats?.attendance}`,
      avgHigherLevelAttendanceThisMonth: `${campus?.oversight?.avgCampusWeekdayStats?.attendance}`,
      higherLevelName,
    },
  ]

  const incomeDetails: IncomeDetailsInterface[] = [
    {
      churchType: 'Campus',
      cardType: 'Income',
      leadersName,
      churchName,
      currency: currentUser.currency,
      churchAvgIncomeThisMonth: `${campus?.avgWeekdayStats?.income}`,
      avgHigherLevelIncomeThisMonth: `${campus?.oversight?.avgCampusWeekdayStats?.income}`,
      higherLevelName,
    },
  ]

  const bussingDetails = [
    {
      churchType: 'Campus',
      cardType: 'Bussing',
      leadersName,
      churchName,
      churchBussingThisMonth: `${campus?.avgBussingAttendance}`,
      avgHigherLevelBussingThisMonth: `${campus?.oversight?.avgCampusBussingAttendance}`,
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
export default CampusAvgWeekdayQuickFacts
