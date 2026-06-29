import { useLazyQuery } from '@apollo/client'
import useChurchLevel from 'hooks/useChurchLevel'
import {
  CAMPUS_SERVICES_GOVERNORSHIP_JOINT_BANKED_LIST,
  COUNCIL_GOVERNORSHIP_JOINT_BANKED_LIST,
  STREAM_GOVERNORSHIP_JOINT_BANKED_LIST,
} from './DefaultersQueries'
import { DefaultersUseChurchType } from './defaulters-types'
import JointBankingWeekList from './JointBankingWeekList'
import useSelectedWeek from 'hooks/useSelectedWeek'

const GovernorshipBankedThisWeek = () => {
  const { weekStart, week } = useSelectedWeek()
  const [councilGovernorshipBankedThisWeek, { refetch: councilRefetch }] =
    useLazyQuery(COUNCIL_GOVERNORSHIP_JOINT_BANKED_LIST)
  const [streamGovernorshipBankedThisWeek, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_GOVERNORSHIP_JOINT_BANKED_LIST)
  const [campusThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_SERVICES_GOVERNORSHIP_JOINT_BANKED_LIST
  )

  const data = useChurchLevel({
    councilFunction: councilGovernorshipBankedThisWeek,
    councilRefetch,
    streamFunction: streamGovernorshipBankedThisWeek,
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
      records={church?.governorshipBankedThisWeek ?? []}
      subjectLabel="Governorship"
      variant="banked"
      serviceLink="/governorship/service-details"
      week={week}
    />
  )
}

export default GovernorshipBankedThisWeek
