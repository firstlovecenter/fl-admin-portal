import { useState, useCallback } from 'react'

type UseBulkSelectReturn<T extends string> = {
  selectedIds: Set<T>
  toggle: (id: T) => void
  selectAll: () => void
  clear: () => void
  isSelected: (id: T) => boolean
  count: number
  isAllSelected: boolean
}

function useBulkSelect<T extends string = string>(
  allIds?: T[]
): UseBulkSelectReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set())

  const toggle = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (!allIds?.length) return
    setSelectedIds(new Set(allIds))
  }, [allIds])

  const clear = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback(
    (id: T) => selectedIds.has(id),
    [selectedIds]
  )

  const count = selectedIds.size
  const isAllSelected =
    count > 0 && allIds !== undefined && count === allIds.length

  return { selectedIds, toggle, selectAll, clear, isSelected, count, isAllSelected }
}

export default useBulkSelect
