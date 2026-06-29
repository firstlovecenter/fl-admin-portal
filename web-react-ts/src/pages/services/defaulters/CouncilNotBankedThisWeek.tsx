import { useLazyQuery } from '@apollo/client'
import useChurchLevel from 'hooks/useChurchLevel'
import {
  CAMPUS_SERVICES_COUNCIL_JOINT_DEFAULTERS_LIST,
  STREAM_COUNCIL_JOINT_DEFAULTERS_LIST,
} from './DefaultersQueries'
import { DefaultersUseChurchType } from './defaulters-types'
import JointBankingWeekList from './JointBankingWeekList'
import useSelectedWeek from 'hooks/useSelectedWeek'

const CouncilNotBankedThisWeek = () => {
  const { weekStart, week } = useSelectedWeek()
  const [streamCouncilNotBankedThisWeek, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_COUNCIL_JOINT_DEFAULTERS_LIST)
  const [campusThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_SERVICES_COUNCIL_JOINT_DEFAULTERS_LIST
  )

  const data = useChurchLevel({
    councilFunction: streamCouncilNotBankedThisWeek,
    councilRefetch: streamRefetch,
    streamFunction: streamCouncilNotBankedThisWeek,
    streamRefetch,
    campusFunction: campusThisWeek,
    campusRefetch,
    weekStart,
    week,
  })
  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  return (
    <JointBankingWeekList
      church={church}
      loading={loading}
      error={error}
      refetch={refetch}
      records={church?.councilBankingDefaultersThisWeek ?? []}
      subjectLabel="Council"
      variant="not-banked"
      serviceLink="/council/service-details"
      week={week}
    />
  )
}

export default CouncilNotBankedThisWeek
