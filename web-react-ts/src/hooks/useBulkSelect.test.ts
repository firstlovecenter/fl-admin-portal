import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useBulkSelect from './useBulkSelect'

describe('useBulkSelect', () => {
  describe('toggle', () => {
    it('adds an ID to the empty set', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b', 'c']))
      act(() => {
        result.current.toggle('a')
      })
      expect(result.current.selectedIds.has('a')).toBe(true)
      expect(result.current.count).toBe(1)
    })

    it('removes an ID that is already selected', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b', 'c']))
      act(() => {
        result.current.toggle('a')
      })
      act(() => {
        result.current.toggle('a')
      })
      expect(result.current.selectedIds.has('a')).toBe(false)
      expect(result.current.count).toBe(0)
    })

    it('adds and removes multiple distinct IDs independently', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b', 'c']))
      act(() => {
        result.current.toggle('a')
        result.current.toggle('b')
      })
      expect(result.current.selectedIds.has('a')).toBe(true)
      expect(result.current.selectedIds.has('b')).toBe(true)
      expect(result.current.count).toBe(2)
    })
  })

  describe('selectAll', () => {
    it('selects all provided IDs', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b', 'c']))
      act(() => {
        result.current.selectAll()
      })
      expect(result.current.selectedIds).toEqual(new Set(['a', 'b', 'c']))
      expect(result.current.count).toBe(3)
    })

    it('does nothing when allIds is not provided (undefined)', () => {
      const { result } = renderHook(() => useBulkSelect())
      act(() => {
        result.current.selectAll()
      })
      expect(result.current.count).toBe(0)
    })

    it('does nothing when allIds is an empty array', () => {
      const { result } = renderHook(() => useBulkSelect([]))
      act(() => {
        result.current.selectAll()
      })
      expect(result.current.count).toBe(0)
    })
  })

  describe('clear', () => {
    it('empties the selection', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b']))
      act(() => {
        result.current.selectAll()
      })
      expect(result.current.count).toBe(2)

      act(() => {
        result.current.clear()
      })
      expect(result.current.count).toBe(0)
      expect(result.current.selectedIds.size).toBe(0)
    })

    it('is a no-op when the set is already empty', () => {
      const { result } = renderHook(() => useBulkSelect(['a']))
      act(() => {
        result.current.clear()
      })
      expect(result.current.count).toBe(0)
    })
  })

  describe('count', () => {
    it('starts at zero', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b']))
      expect(result.current.count).toBe(0)
    })

    it('reflects the current number of selected IDs after toggles', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b', 'c']))
      act(() => {
        result.current.toggle('a')
      })
      expect(result.current.count).toBe(1)
      act(() => {
        result.current.toggle('b')
      })
      expect(result.current.count).toBe(2)
      act(() => {
        result.current.toggle('a')
      })
      expect(result.current.count).toBe(1)
    })
  })

  describe('isAllSelected', () => {
    it('is true when all provided IDs are selected', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b']))
      act(() => {
        result.current.selectAll()
      })
      expect(result.current.isAllSelected).toBe(true)
    })

    it('is false when only some IDs are selected', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b', 'c']))
      act(() => {
        result.current.toggle('a')
      })
      expect(result.current.isAllSelected).toBe(false)
    })

    it('is false when count is 0 (nothing selected)', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b']))
      expect(result.current.isAllSelected).toBe(false)
    })

    it('is false when allIds is undefined even after manual toggles', () => {
      // Without allIds, the count > 0 && allIds !== undefined check fails —
      // isAllSelected can never be true if allIds was not supplied.
      const { result } = renderHook(() => useBulkSelect(undefined))
      // toggle is still callable with an explicit id
      act(() => {
        result.current.toggle('orphan-id')
      })
      expect(result.current.isAllSelected).toBe(false)
    })
  })

  describe('isSelected', () => {
    it('returns true for a selected ID and false for an unselected ID', () => {
      const { result } = renderHook(() => useBulkSelect(['a', 'b']))
      act(() => {
        result.current.toggle('a')
      })
      expect(result.current.isSelected('a')).toBe(true)
      expect(result.current.isSelected('b')).toBe(false)
    })

    it('returns false after the ID is toggled off', () => {
      const { result } = renderHook(() => useBulkSelect(['a']))
      act(() => {
        result.current.toggle('a')
      })
      act(() => {
        result.current.toggle('a')
      })
      expect(result.current.isSelected('a')).toBe(false)
    })
  })
})
