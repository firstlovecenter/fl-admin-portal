import {
  FieldPolicy,
  InMemoryCache,
  InMemoryCacheConfig,
  Reference,
} from '@apollo/client'

const HISTORY_PARENT_TYPES = [
  'Member',
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'Denomination',
  'Hub',
  'Basonta',
] as const

const MEMBERS_PARENT_TYPES = [
  'Member',
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'Denomination',
] as const

// Mutation/preview projections call `history(limit: N)` and `members(limit: N)`
// with no `$offset`. The off-the-shelf `offsetLimitPagination()` defaults a
// missing `offset` to 0 and writes the response in-place at slots [0..N-1],
// silently corrupting any tail the user has already scrolled into. This merge
// treats no-`offset` writes as a fresh-head snapshot and prepends + dedupes
// by id, keeping the existing scroll state intact.
const offsetMerge: FieldPolicy<Reference[]>['merge'] = (
  existing,
  incoming,
  { args, readField }
) => {
  if (!incoming || incoming.length === 0) return existing ?? []

  if (!args || args.offset == null) {
    if (!existing || existing.length === 0) return incoming
    const incomingIds = new Set(
      incoming.map((item) => readField('id', item))
    )
    const tail = existing.filter(
      (item) => !incomingIds.has(readField('id', item))
    )
    return [...incoming, ...tail]
  }

  const merged = existing ? existing.slice() : []
  const offset = args.offset as number
  for (let i = 0; i < incoming.length; i += 1) {
    merged[offset + i] = incoming[i]
  }
  return merged
}

const historyFieldPolicy: FieldPolicy<Reference[]> = {
  keyArgs: false,
  merge: offsetMerge,
}

// `members` is keyed by every filter arg so each filter combination gets its
// own merged list. Without this, switching from "all members" to
// "gender: Female" would clobber the unfiltered cache slot.
const membersFieldPolicy: FieldPolicy<Reference[]> = {
  keyArgs: [
    'search',
    'genders',
    'maritalStatuses',
    'leaderTitles',
    'basontas',
    'leaderRanks',
  ],
  merge: offsetMerge,
}

const buildApolloCache = (config?: InMemoryCacheConfig): InMemoryCache =>
  new InMemoryCache({
    ...config,
    typePolicies: {
      ...Object.fromEntries(
        HISTORY_PARENT_TYPES.map((type) => [
          type,
          { fields: { history: historyFieldPolicy } },
        ])
      ),
      ...Object.fromEntries(
        MEMBERS_PARENT_TYPES.map((type) => [
          type,
          {
            fields: {
              history: historyFieldPolicy,
              members: membersFieldPolicy,
            },
          },
        ])
      ),
      ...config?.typePolicies,
    },
  })

export default buildApolloCache
