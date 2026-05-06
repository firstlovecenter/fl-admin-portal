import { useEffect, useRef, useState } from 'react'

/**
 * Controlled search-input state that adopts an async-arriving `initialValue`
 * without clobbering text the user has already typed.
 *
 * - First arrival of `initialValue` (or any update while the field still shows
 *   the previous initialValue) populates the field.
 * - Once the user has typed something different, future re-renders with a new
 *   `initialValue` are ignored so their edits aren't overwritten.
 */
export function useSearchInitialValue(initialValue?: string) {
  const [searchString, setSearchString] = useState(initialValue ?? '')
  const prevInitialRef = useRef<string | undefined>(initialValue)

  useEffect(() => {
    const prev = prevInitialRef.current
    prevInitialRef.current = initialValue
    if (initialValue && (searchString === '' || searchString === prev)) {
      setSearchString(initialValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue])

  return [searchString, setSearchString] as const
}
