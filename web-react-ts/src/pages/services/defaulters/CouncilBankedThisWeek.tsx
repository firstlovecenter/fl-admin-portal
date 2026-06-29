import { useLazyQuery } from '@apollo/client'
import useChurchLevel from 'hooks/useChurchLevel'
import {
  CAMPUS_SERVICES_COUNCIL_JOINT_BANKED_LIST,
  STREAM_COUNCIL_JOINT_BANKED_LIST,
} from './DefaultersQueries'
import { DefaultersUseChurchType } from './defaulters-types'
import JointBankingWeekList from './JointBankingWeekList'
import useSelectedWeek from 'hooks/useSelectedWeek'

const CouncilBankedThisWeek = () => {
  const { weekStart, week } = useSelectedWeek()
  const [streamCouncilBankedThisWeek, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_COUNCIL_JOINT_BANKED_LIST)
  const [campusThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_SERVICES_COUNCIL_JOINT_BANKED_LIST
  )

  const data = useChurchLevel({
    councilFunction: streamCouncilBankedThisWeek,
    councilRefetch: streamRefetch,
    streamFunction: streamCouncilBankedThisWeek,
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
      records={church?.councilBankedThisWeek ?? []}
      subjectLabel="Council"
      variant="banked"
      serviceLink="/council/service-details"
      week={week}
    />
  )
}

export default CouncilBankedThisWeek
