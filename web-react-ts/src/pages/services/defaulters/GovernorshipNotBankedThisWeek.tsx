import { useLazyQuery } from '@apollo/client'
import useChurchLevel from 'hooks/useChurchLevel'
import {
  CAMPUS_SERVICES_GOVERNORSHIP_JOINT_DEFAULTERS_LIST,
  COUNCIL_GOVERNORSHIP_JOINT_DEFAULTERS_LIST,
  STREAM_GOVERNORSHIP_JOINT_DEFAULTERS_LIST,
} from './DefaultersQueries'
import { DefaultersUseChurchType } from './defaulters-types'
import JointBankingWeekList from './JointBankingWeekList'
import useSelectedWeek from 'hooks/useSelectedWeek'

const GovernorshipNotBankedThisWeek = () => {
  const { weekStart, week } = useSelectedWeek()
  const [councilGovernorshipNotBankedThisWeek, { refetch: councilRefetch }] =
    useLazyQuery(COUNCIL_GOVERNORSHIP_JOINT_DEFAULTERS_LIST)
  const [streamGovernorshipNotBankedThisWeek, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_GOVERNORSHIP_JOINT_DEFAULTERS_LIST)
  const [campusThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_SERVICES_GOVERNORSHIP_JOINT_DEFAULTERS_LIST
  )

  const data = useChurchLevel({
    councilFunction: councilGovernorshipNotBankedThisWeek,
    councilRefetch,
    streamFunction: streamGovernorshipNotBankedThisWeek,
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
      records={church?.governorshipBankingDefaultersThisWeek ?? []}
      subjectLabel="Governorship"
      variant="not-banked"
      serviceLink="/governorship/service-details"
      week={week}
    />
  )
}

export default GovernorshipNotBankedThisWeek
