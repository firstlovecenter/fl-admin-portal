import {
  ApolloError,
  ApolloQueryResult,
  LazyQueryExecFunction,
  OperationVariables,
} from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchLevel } from 'global-types'
import { getSubChurchLevel } from 'global-utils'
import { getWeekNumber } from 'lib/date-utils'
import { HigherChurchWithArrivals } from 'pages/arrivals/arrivals-types'
import { HigherChurchWithDefaulters } from 'pages/services/defaulters/defaulters-types'
import { useContext, useEffect, useState } from 'react'

type useChurchLevelProps = {
  governorshipFunction?: LazyQueryExecFunction<any, OperationVariables>
  governorshipRefetch?: () => Promise<ApolloQueryResult<any>>
  councilFunction: LazyQueryExecFunction<any, OperationVariables>
  councilRefetch: () => Promise<ApolloQueryResult<any>>
  streamFunction: LazyQueryExecFunction<any, OperationVariables>
  streamRefetch: () => Promise<ApolloQueryResult<any>>
  campusFunction: LazyQueryExecFunction<any, OperationVariables>
  campusRefetch: () => Promise<ApolloQueryResult<any>>
  oversightFunction?: LazyQueryExecFunction<any, OperationVariables>
  oversightRefetch?: () => Promise<ApolloQueryResult<any>>
  denominationFunction?: LazyQueryExecFunction<any, OperationVariables>
  denominationRefetch?: () => Promise<ApolloQueryResult<any>>
  /** Optional ISO `YYYY-MM-DD` Monday for week-scoped queries (joint banking
   * lists). When omitted the queries fall back to the server's current week. */
  weekStart?: string
  /** Optional ISO week number for `aggregateServiceRecordForWeek($week)`.
   * Defaults to `getWeekNumber()` for callers that don't select a week. */
  week?: number
}

const useChurchLevel = (props: useChurchLevelProps) => {
  const { currentUser } = useContext(MemberContext)

  const currentChurch = currentUser?.currentChurch
  const churchLevel: ChurchLevel = currentUser?.currentChurch?.__typename
  const subChurchLevel: ChurchLevel = getSubChurchLevel(
    currentChurch?.__typename
  )

  const [church, setChurch] = useState<
    HigherChurchWithDefaulters | HigherChurchWithArrivals | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<undefined | ApolloError>()

  const { arrivalDate } = useContext(ChurchContext)
  // Week selection — `weekStart` scopes the joint banking list `@cypher`
  // window (SYN-191: without it the list fell back to the server's current
  // week and never matched the week the dashboard counted). `week` feeds the
  // joint-defaulter queries' `aggregateServiceRecordForWeek(week: Int!)` field.
  const { weekStart } = props
  const week = props.week ?? getWeekNumber()

  const chooseRefetch = () => {
    switch (churchLevel) {
      case 'Governorship':
        return props.governorshipRefetch || props.councilRefetch
      case 'Council':
        return props.councilRefetch
      case 'Stream':
        return props.streamRefetch
      case 'Campus':
        return props.campusRefetch
      case 'Oversight':
        return props.oversightRefetch || props.campusRefetch
      case 'Denomination':
        return props.denominationRefetch || props.campusRefetch
      default:
        return props.councilRefetch
    }
  }

  const refetch = async () => {
    const fn = chooseRefetch()
    if (!fn) return
    setLoading(true)
    try {
      const res = await fn()
      if (res.error) setError(res.error)
      const pick = (key: string) => {
        const value = res.data?.[key]?.[0]
        if (value != null) setChurch(value)
      }
      switch (churchLevel) {
        case 'Governorship': pick('governorships'); break
        case 'Council': pick('councils'); break
        case 'Stream': pick('streams'); break
        case 'Campus': pick('campuses'); break
        case 'Oversight': pick('oversights'); break
        case 'Denomination': pick('denominations'); break
        default: break
      }
    } catch (e) {
      if (e instanceof ApolloError) setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const whichQuery = async () => {
      switch (churchLevel) {
        case 'Governorship':
          {
            if (!props.governorshipFunction) break
            const res = await props.governorshipFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate: arrivalDate,
                week,
                weekStart,
              },
            })

            setChurch(res.data?.governorships[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break
        case 'Council':
          {
            const res = await props.councilFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate: arrivalDate,
                week,
                weekStart,
              },
            })

            setChurch(res?.data?.councils[0])
            setLoading(res.loading)
            setError(res.error)
          }

          break
        case 'Stream':
          {
            const res = await props.streamFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate: arrivalDate,
                week,
                weekStart,
              },
            })
            setChurch(res?.data?.streams[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break

        case 'Campus':
          {
            const res = await props.campusFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate: arrivalDate,
                week,
                weekStart,
              },
            })

            setChurch(res?.data?.campuses[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break
        case 'Oversight':
          {
            if (!props.oversightFunction) break
            const res = await props.oversightFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate: arrivalDate,
                week,
                weekStart,
              },
            })

            setChurch(res?.data?.oversights[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break
        case 'Denomination':
          {
            if (!props.denominationFunction) break
            const res = await props.denominationFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate: arrivalDate,
                week,
                weekStart,
              },
            })

            setChurch(res?.data?.denominations[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break

        default:
          break
      }
    }

    whichQuery()
  }, [setChurch])

  return { church, subChurchLevel, loading, error, refetch }
}

export default useChurchLevel
