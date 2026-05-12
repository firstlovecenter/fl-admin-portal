import { useQuery } from '@apollo/client'
import { SHEPHERDING_DENOMINATION } from './ShepherdingControlQueries'
import {
  ChildSummary,
  ShepherdingLevel,
  SlideData,
} from './shepherding-control-types'
import {
  childRelationshipFor,
  QUERY_FOR_LEVEL,
  RESULT_KEY_FOR_LEVEL,
} from './shepherding-control-utils'

// Returns slide data for a single (level, id), including direct children
// sorted alphabetically by name. Skips Apollo execution when id is empty.
export const useShepherdingSlide = (
  level: ShepherdingLevel | null,
  id: string | null
) => {
  const query = level ? QUERY_FOR_LEVEL[level] : SHEPHERDING_DENOMINATION
  const result = useQuery(query, {
    variables: { id: id ?? '' },
    skip: !id || !level,
  })

  if (!level || !id) {
    return { slide: null as SlideData | null, loading: false, error: null }
  }

  const node = result.data?.[RESULT_KEY_FOR_LEVEL[level]]?.[0]
  if (!node) {
    return {
      slide: null as SlideData | null,
      loading: result.loading,
      error: result.error ?? null,
    }
  }

  const childKey = childRelationshipFor[level]
  const rawChildren: ChildSummary[] = childKey ? node[childKey] ?? [] : []
  const children = [...rawChildren].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  const slide: SlideData = {
    id: node.id,
    name: node.name,
    level,
    leader: node.leader
      ? {
          id: node.leader.id,
          pictureUrl: node.leader.pictureUrl ?? null,
          nameWithTitle: node.leader.nameWithTitle ?? null,
          firstName: node.leader.firstName ?? null,
          lastName: node.leader.lastName ?? null,
        }
      : null,
    memberCount: node.memberCount ?? null,
    bacentaCount: node.bacentaCount ?? null,
    aggregateServiceRecords: node.aggregateServiceRecords ?? [],
    aggregateBussingRecords: node.aggregateBussingRecords ?? [],
    children,
  }

  return {
    slide,
    loading: result.loading,
    error: result.error ?? null,
  }
}
