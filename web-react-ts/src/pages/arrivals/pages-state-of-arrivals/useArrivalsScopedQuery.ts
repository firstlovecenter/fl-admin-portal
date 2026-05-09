import { type DocumentNode, useQuery } from '@apollo/client'
import { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { LONG_POLL_INTERVAL } from 'global-utils'
import { HigherChurchWithArrivals } from '../arrivals-types'

const ARRIVALS_LEVEL_COLLECTION = {
  Governorship: 'governorships',
  Council: 'councils',
  Stream: 'streams',
  Campus: 'campuses',
} as const

export type ArrivalsLevel = keyof typeof ARRIVALS_LEVEL_COLLECTION

const isArrivalsLevel = (value?: string): value is ArrivalsLevel =>
  !!value && value in ARRIVALS_LEVEL_COLLECTION

type UseArrivalsScopedQueryArgs = {
  queriesByLevel: Record<ArrivalsLevel, DocumentNode>
  pollInterval?: number
}

export const useArrivalsScopedQuery = ({
  queriesByLevel,
  pollInterval = LONG_POLL_INTERVAL,
}: UseArrivalsScopedQueryArgs) => {
  const { selectedScope } = useChurchRoleScope()
  const { arrivalDate } = useContext(ChurchContext)

  const churchType = isArrivalsLevel(selectedScope?.churchType)
    ? selectedScope?.churchType
    : undefined
  const churchId = selectedScope?.churchId
  const churchName = selectedScope?.churchName

  // Apollo's useQuery validates the document inside its useState lazy
  // initialiser — before `skip` is checked. Pass a stable fallback document
  // when churchType is missing so the hook never sees `undefined`.
  const query = churchType
    ? queriesByLevel[churchType]
    : queriesByLevel.Governorship

  const skip = !churchId || !churchType

  const { data, loading, error, refetch } = useQuery(query, {
    variables: { id: churchId, arrivalDate },
    pollInterval,
    skip,
  })

  const collection = churchType
    ? data?.[ARRIVALS_LEVEL_COLLECTION[churchType]]
    : null
  const church = (collection?.[0] ?? null) as HigherChurchWithArrivals | null

  return {
    church,
    churchType,
    churchName,
    loading,
    error,
    refetch,
    isScopeSupported: !!churchType,
    hasScope: !!selectedScope,
  }
}
