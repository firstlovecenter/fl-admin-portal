import { ApolloClient } from '@apollo/client'
import { SHEPHERDING_SCOPE_CHECK } from './ShepherdingControlQueries'
import {
  ChildSummary,
  DepthChoice,
  SlideData,
  SlideNode,
} from './shepherding-control-types'
import {
  childRelationshipFor,
  nextLevelFor,
  QUERY_FOR_LEVEL,
  RESULT_KEY_FOR_LEVEL,
} from './shepherding-control-utils'

export const fetchSlide = async (
  client: ApolloClient<object>,
  node: SlideNode
): Promise<SlideData | null> => {
  const query = QUERY_FOR_LEVEL[node.type]
  const result = await client.query({
    query,
    variables: { id: node.id },
    fetchPolicy: 'network-only',
  })
  const data = result.data?.[RESULT_KEY_FOR_LEVEL[node.type]]?.[0]
  if (!data) return null

  const childKey = childRelationshipFor[node.type]
  const rawChildren: ChildSummary[] = childKey
    ? (data[childKey] ?? []).map(
        (c: {
          id: string
          name: string
          leader?: {
            id: string
            firstName?: string | null
            lastName?: string | null
            pictureUrl?: string | null
            nameWithTitle?: string | null
          } | null
        }) => ({
          id: c.id,
          name: c.name,
          leader: c.leader
            ? {
                id: c.leader.id,
                firstName: c.leader.firstName ?? null,
                lastName: c.leader.lastName ?? null,
                pictureUrl: c.leader.pictureUrl ?? null,
                nameWithTitle: c.leader.nameWithTitle ?? null,
              }
            : null,
        })
      )
    : []
  const children = [...rawChildren].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  return {
    id: data.id,
    name: data.name,
    level: node.type,
    leader: data.leader
      ? {
          id: data.leader.id,
          pictureUrl: data.leader.pictureUrl ?? null,
          nameWithTitle: data.leader.nameWithTitle ?? null,
          firstName: data.leader.firstName ?? null,
          lastName: data.leader.lastName ?? null,
        }
      : null,
    memberCount: data.memberCount ?? null,
    bacentaCount: data.bacentaCount ?? null,
    aggregateServiceRecords: data.aggregateServiceRecords ?? [],
    aggregateBussingRecords: data.aggregateBussingRecords ?? [],
    children,
  }
}

export const checkScope = async (
  client: ApolloClient<object>,
  node: SlideNode
): Promise<boolean> => {
  const result = await client.query({
    query: SHEPHERDING_SCOPE_CHECK,
    variables: { level: node.type, id: node.id },
    fetchPolicy: 'network-only',
  })
  return Boolean(result.data?.shepherdingScopeCheck)
}

export async function* walkSubtree(
  client: ApolloClient<object>,
  root: SlideNode,
  depth: DepthChoice,
  isCancelled: () => boolean
): AsyncGenerator<SlideData> {
  if (isCancelled()) return

  const rootSlide = await fetchSlide(client, root)
  if (!rootSlide) return
  yield rootSlide
  if (depth === 'this-level') return
  if (isCancelled()) return

  const childLevel = nextLevelFor(root.type)
  if (!childLevel) return

  for (const child of rootSlide.children) {
    if (isCancelled()) return
    const childNode: SlideNode = {
      type: childLevel,
      id: child.id,
      name: child.name,
    }

    if (depth === 'one-level-deeper') {
      const slide = await fetchSlide(client, childNode)
      if (slide) yield slide
      continue
    }

    yield* walkSubtree(client, childNode, depth, isCancelled)
  }
}
