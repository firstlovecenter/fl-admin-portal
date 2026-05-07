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

// Hand-written so mutation/preview projections (which call `history(limit: N)`
// with no `$offset`) prepend onto the existing scrolled list instead of
// silently overwriting slots [0..N-1] and dropping the entry that was at
// slot N-1. The off-the-shelf `offsetLimitPagination()` defaults a missing
// `offset` to 0 and writes-in-place, which corrupts the cache after any
// post-mutation projection of `history(limit: 5)`.
const historyFieldPolicy: FieldPolicy<Reference[]> = {
  keyArgs: false,
  merge(existing, incoming, { args, readField }) {
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
  },
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
      ...config?.typePolicies,
    },
  })

export default buildApolloCache
