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

type useSontaLevelProps = {
  governorshipFunction?: LazyQueryExecFunction<any, OperationVariables>
  governorshipRefetch?: () => Promise<ApolloQueryResult<any>>
  councilFunction?: LazyQueryExecFunction<any, OperationVariables>
  councilRefetch?: () => Promise<ApolloQueryResult<any>>
  streamFunction?: LazyQueryExecFunction<any, OperationVariables>
  streamRefetch?: () => Promise<ApolloQueryResult<any>>
  campusFunction?: LazyQueryExecFunction<any, OperationVariables>
  campusRefetch: () => Promise<ApolloQueryResult<any>>
  oversightFunction?: LazyQueryExecFunction<any, OperationVariables>
  oversightRefetch?: () => Promise<ApolloQueryResult<any>>
  denominationFunction?: LazyQueryExecFunction<any, OperationVariables>
  denominationRefetch?: () => Promise<ApolloQueryResult<any>>

  hubFunction?: LazyQueryExecFunction<any, OperationVariables>
  hubRefetch: () => Promise<ApolloQueryResult<any>>
  hubCouncilFunction?: LazyQueryExecFunction<any, OperationVariables>
  hubCouncilRefetch: () => Promise<ApolloQueryResult<any>>
  ministryFunction?: LazyQueryExecFunction<any, OperationVariables>
  ministryRefetch: () => Promise<ApolloQueryResult<any>>
  creativeArtsFunction?: LazyQueryExecFunction<any, OperationVariables>
  creativeArtsRefetch: () => Promise<ApolloQueryResult<any>>
}

const useSontaLevel = (props: useSontaLevelProps) => {
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
      case 'CreativeArts':
        return props.creativeArtsRefetch
      case 'Ministry':
        return props.ministryRefetch
      case 'HubCouncil':
        return props.hubCouncilRefetch
      case 'Hub':
        return props.hubRefetch
      case 'Governorship':
        return props.governorshipRefetch
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
        case 'CreativeArts':
          {
            if (!props.creativeArtsFunction) break
            const res = await props.creativeArtsFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate,
              },
            })

            setChurch(res?.data?.creativeArts[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break
        case 'Ministry':
          {
            if (!props.ministryFunction) break
            const res = await props.ministryFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate,
              },
            })

            setChurch(res?.data?.ministries[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break
        case 'HubCouncil':
          {
            if (!props.hubCouncilFunction) break
            const res = await props.hubCouncilFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate,
              },
            })

            setChurch(res?.data?.hubCouncils[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break
        case 'Hub':
          {
            if (!props.hubFunction) break

            const res = await props.hubFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate,
              },
            })

            setChurch(res?.data?.hubs[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break
        case 'Governorship':
          {
            if (!props.governorshipFunction) break
            const res = await props.governorshipFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate,
              },
            })

            setChurch(res.data?.governorships[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break
        case 'Council':
          {
            if (!props.councilFunction) break
            const res = await props.councilFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate,
              },
            })

            setChurch(res?.data?.councils[0])
            setLoading(res.loading)
            setError(res.error)
          }

          break
        case 'Stream':
          {
            if (!props.streamFunction) break
            const res = await props.streamFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate,
              },
            })
            setChurch(res?.data?.streams[0])
            setLoading(res.loading)
            setError(res.error)
          }
          break

        case 'Campus':
          {
            if (!props.campusFunction) break
            const res = await props.campusFunction({
              variables: {
                id: currentChurch?.id,
                arrivalDate,
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
                arrivalDate,
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
                arrivalDate,
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

export default useSontaLevel
