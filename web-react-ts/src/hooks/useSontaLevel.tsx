import {
  ApolloError,
  ApolloQueryResult,
  LazyQueryExecFunction,
  OperationVariables,
} from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
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
}

const useSontaLevel = (props: useSontaLevelProps) => {
  const { currentUser } = useContext(MemberContext)
  const { selectedScope } = useChurchRoleScope()

  // "Church in Focus" picker is the source of truth when set; fall back to
  // the user's primary `currentChurch` for legacy / pre-scope flows.
  const focusChurch = selectedScope
    ? {
        id: selectedScope.churchId,
        __typename: selectedScope.churchType as ChurchLevel,
      }
    : currentUser?.currentChurch
  const currentChurch = focusChurch
  const churchLevel: ChurchLevel = focusChurch?.__typename
  const subChurchLevel: ChurchLevel = getSubChurchLevel(focusChurch?.__typename)

  const [church, setChurch] = useState<
    HigherChurchWithDefaulters | HigherChurchWithArrivals | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<undefined | ApolloError>()

  const { arrivalDate } = useContext(ChurchContext)

  const chooseRefetch = () => {
    switch (churchLevel) {
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
    if (!currentChurch?.id || !churchLevel) {
      setLoading(false)
      return
    }
    setLoading(true)

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
            if (!props.councilFunction) break
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
            if (!props.streamFunction) break
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
            if (!props.campusFunction) break
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
          // Unknown level — exit loading so the UI doesn't hang.
          setLoading(false)
          break
      }
    }

    whichQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChurch?.id, churchLevel])

  return { church, subChurchLevel, loading, error, refetch: chooseRefetch() }
}

export default useSontaLevel
