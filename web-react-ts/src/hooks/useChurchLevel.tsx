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

  return { church, subChurchLevel, loading, error, refetch: chooseRefetch() }
}

export default useChurchLevel
