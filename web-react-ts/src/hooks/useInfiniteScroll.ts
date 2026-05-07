import {
  ApolloError,
  DocumentNode,
  OperationVariables,
  useApolloClient,
  useQuery,
} from '@apollo/client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type CacheKey = {
  id: string
  fieldName: string
}

type UseInfiniteScrollArgs<TData, TItem> = {
  query: DocumentNode
  variables?: OperationVariables
  pageSize: number
  initialPageSize?: number
  getItems: (data: TData) => TItem[]
  getCount?: (data: TData) => number | undefined
  rootMargin?: string
  skip?: boolean
  cacheKey?: CacheKey
}

export type UseInfiniteScrollResult<TData, TItem> = {
  data: TData | undefined
  items: TItem[]
  totalCount: number | undefined
  loading: boolean
  fetchingMore: boolean
  hasMore: boolean
  error: ApolloError | undefined
  sentinelRef: (el: HTMLElement | null) => void
  reset: () => Promise<void>
}

const DEFAULT_ROOT_MARGIN = '200px'

/**
 * Apollo + IntersectionObserver-based infinite-scroll hook.
 *
 * Drives offset/limit pagination. The query MUST declare `$offset: Int!` and
 * `$limit: Int!` variables; the hook injects them. The cache field SHOULD
 * have an `offsetLimitPagination` type policy so successive pages merge.
 *
 * Consumer contract:
 * - `variables` may be a fresh object each render (the hook compares by
 *   serialized key internally).
 * - `getItems` / `getCount` are read through refs, so passing inline arrows
 *   is fine — they don't need to be memoized.
 * - On filter changes (e.g. a debounced search term), update `variables` and
 *   call `reset()` to evict the cached field and refetch from offset 0.
 * - `loading` is true only on the first fetch when no data is available;
 *   background refetches (including variables-change refetches) stay false.
 *   If you need a spinner on filter changes, track that locally — the hook
 *   keeps the previous page rendered until the new one lands.
 * - Use `fetchingMore` for "loading more".
 */
const useInfiniteScroll = <TData, TItem = unknown>({
  query,
  variables,
  pageSize,
  initialPageSize,
  getItems,
  getCount,
  rootMargin = DEFAULT_ROOT_MARGIN,
  skip = false,
  cacheKey,
}: UseInfiniteScrollArgs<TData, TItem>): UseInfiniteScrollResult<
  TData,
  TItem
> => {
  const client = useApolloClient()
  const firstPage = initialPageSize ?? pageSize

  const variablesKey = useMemo(
    () => JSON.stringify(variables ?? {}),
    [variables]
  )

  // Latest-value refs so the IntersectionObserver callback and reset() stay
  // referentially stable across renders even when consumers pass fresh
  // object/function literals.
  const variablesRef = useRef(variables)
  const getItemsRef = useRef(getItems)
  const getCountRef = useRef(getCount)
  variablesRef.current = variables
  getItemsRef.current = getItems
  getCountRef.current = getCount

  const { data, loading, error, fetchMore, refetch } = useQuery<TData>(query, {
    variables: { ...variables, offset: 0, limit: firstPage },
    skip,
  })

  const [fetchingMore, setFetchingMore] = useState(false)
  const [fetchMoreError, setFetchMoreError] = useState<ApolloError | undefined>(
    undefined
  )
  const hasMoreRef = useRef(true)
  const offsetRef = useRef(firstPage)
  const initializedKeyRef = useRef<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const items = useMemo<TItem[]>(
    () => (data ? getItems(data) : []),
    [data, getItems]
  )
  const totalCount = data && getCount ? getCount(data) : undefined

  // Single effect keyed on variablesKey:
  // - resets pagination state when caller-supplied variables change
  // - seeds offset/hasMore from the first page (or rehydrated cache) once it
  //   matches the current variables
  useEffect(() => {
    if (initializedKeyRef.current !== variablesKey) {
      hasMoreRef.current = true
      offsetRef.current = firstPage
      setFetchMoreError(undefined)
      initializedKeyRef.current = null
    }
    if (initializedKeyRef.current === null && !loading && data) {
      const len = getItemsRef.current(data).length
      const total = getCountRef.current?.(data)
      offsetRef.current = len
      hasMoreRef.current =
        total !== undefined ? len < total : len >= firstPage
      initializedKeyRef.current = variablesKey
    }
  }, [variablesKey, firstPage, loading, data])

  const loadMore = useCallback(async () => {
    if (skip || fetchingMore || loading || !hasMoreRef.current) return
    setFetchingMore(true)
    setFetchMoreError(undefined)
    const offset = offsetRef.current
    try {
      const result = await fetchMore({
        variables: { ...variablesRef.current, offset, limit: pageSize },
      })
      const pageItems = result.data ? getItemsRef.current(result.data) : []
      offsetRef.current += pageItems.length
      if (pageItems.length < pageSize) hasMoreRef.current = false
    } catch (err) {
      setFetchMoreError(err as ApolloError)
    } finally {
      setFetchingMore(false)
    }
  }, [fetchMore, fetchingMore, loading, pageSize, skip])

  const sentinelRef = useCallback(
    (el: HTMLElement | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!el) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) loadMore()
        },
        { rootMargin }
      )
      observer.observe(el)
      observerRef.current = observer
    },
    [loadMore, rootMargin]
  )

  useEffect(
    () => () => {
      observerRef.current?.disconnect()
    },
    []
  )

  const reset = useCallback(async () => {
    if (cacheKey) {
      client.cache.evict({ id: cacheKey.id, fieldName: cacheKey.fieldName })
      client.cache.gc()
    }
    initializedKeyRef.current = null
    hasMoreRef.current = true
    offsetRef.current = firstPage
    setFetchMoreError(undefined)
    await refetch({
      ...variablesRef.current,
      offset: 0,
      limit: firstPage,
    })
  }, [client, cacheKey, firstPage, refetch])

  return {
    data,
    items,
    totalCount,
    loading: loading && !data,
    fetchingMore,
    hasMore: hasMoreRef.current,
    error: error ?? fetchMoreError,
    sentinelRef,
    reset,
  }
}

export default useInfiniteScroll
