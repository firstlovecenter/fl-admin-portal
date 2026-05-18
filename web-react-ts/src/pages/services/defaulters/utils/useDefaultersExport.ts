import { useEffect, useRef, useState } from 'react'

import { getAccessToken } from 'lib/auth-service'

import {
  DefaultersDownloadLevel,
  DefaultersExportPayload,
} from './buildDefaultersWorkbook'

// Target levels the picker page can request. Mirrors backend
// `isDefaultersTargetLevel` in api/src/resolvers/downloads/defaulters-cypher.ts.
export type DefaultersTargetLevel = 'Stream' | 'Council' | 'Governorship'

// Mirrors DownloadDefaultersButton: omit `weekStart` for the current week so
// the server uses `date()` directly and matches the dashboard queries.
const buildDownloadUrl = (
  level: DefaultersDownloadLevel,
  churchId: string,
  weekStart: string,
  isCurrent: boolean,
  targetLevel: DefaultersTargetLevel | null
): string => {
  const graphqlUri =
    import.meta.env.VITE_SYNAGO_GRAPHQL_URI || 'http://localhost:4001/graphql'
  const apiBase = graphqlUri.replace(/\/graphql\/?$/, '')
  const params = new URLSearchParams()
  if (!isCurrent) params.set('weekStart', weekStart)
  if (targetLevel) params.set('targetLevel', targetLevel)
  const qs = params.toString()
  return `${apiBase}/downloads/defaulters/${encodeURIComponent(
    level
  )}/${encodeURIComponent(churchId)}.json${qs ? `?${qs}` : ''}`
}

export const fetchDefaultersExport = async (
  level: DefaultersDownloadLevel,
  churchId: string,
  weekStart: string,
  isCurrent: boolean,
  targetLevel: DefaultersTargetLevel | null = null,
  signal?: AbortSignal
): Promise<DefaultersExportPayload> => {
  const token = getAccessToken()
  if (!token) throw new Error('Sign in expired. Please sign in again.')
  const res = await fetch(
    buildDownloadUrl(level, churchId, weekStart, isCurrent, targetLevel),
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  )
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(
      typeof body.error === 'string'
        ? body.error
        : `Download failed (${res.status})`
    )
  }
  return (await res.json()) as DefaultersExportPayload
}

type UseDefaultersExportResult = {
  payload: DefaultersExportPayload | null
  loading: boolean
  error: string | null
}

const useDefaultersExport = (
  level: DefaultersDownloadLevel | null,
  churchId: string | undefined,
  weekStart: string,
  isCurrent: boolean,
  // Picker target. When set, the response carries `summaryAtLevel` rows
  // at that depth (and the legacy `summary` is still populated for the
  // DownloadDefaultersButton xlsx flow). `null` (the default) preserves
  // pre-picker behaviour.
  targetLevel: DefaultersTargetLevel | null = null
): UseDefaultersExportResult => {
  const [payload, setPayload] = useState<DefaultersExportPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (!level || !churchId) {
      setPayload(null)
      setLoading(false)
      setError(null)
      return undefined
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchDefaultersExport(
      level,
      churchId,
      weekStart,
      isCurrent,
      targetLevel,
      controller.signal
    )
      .then((result) => {
        if (requestIdRef.current !== requestId) return
        setPayload(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message =
          err instanceof Error ? err.message : 'Could not load defaulters'
        setError(message)
        setPayload(null)
        setLoading(false)
      })

    return () => {
      requestIdRef.current += 1
      controller.abort()
    }
  }, [level, churchId, weekStart, isCurrent, targetLevel])

  return { payload, loading, error }
}

export default useDefaultersExport
