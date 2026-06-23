import { useEffect, useRef, useState } from 'react'

import { getValidAccessToken } from 'lib/auth-service'

import {
  ArrivalsDownloadLevel,
  ArrivalsExportPayload,
} from './buildArrivalsWorkbook'

// Target levels the picker page can request. Mirrors backend
// `isArrivalsTargetLevel` in api/src/resolvers/downloads/arrivals-cypher.ts.
export type ArrivalsTargetLevel = 'Stream' | 'Council' | 'Governorship'

const buildDownloadUrl = (
  level: ArrivalsDownloadLevel,
  churchId: string,
  arrivalDate: string,
  targetLevel: ArrivalsTargetLevel | null
): string => {
  const graphqlUri =
    import.meta.env.VITE_SYNAGO_GRAPHQL_URI || 'http://localhost:4001/graphql'
  const apiBase = graphqlUri.replace(/\/graphql\/?$/, '')
  const params = new URLSearchParams()
  params.set('arrivalDate', arrivalDate)
  if (targetLevel) params.set('targetLevel', targetLevel)
  return `${apiBase}/downloads/arrivals/${encodeURIComponent(
    level
  )}/${encodeURIComponent(churchId)}.json?${params.toString()}`
}

export const fetchArrivalsExport = async (
  level: ArrivalsDownloadLevel,
  churchId: string,
  arrivalDate: string,
  targetLevel: ArrivalsTargetLevel | null = null,
  signal?: AbortSignal
): Promise<ArrivalsExportPayload> => {
  // Mint a token from the httpOnly refresh cookie if the in-memory one is gone
  // (e.g. straight after a reload) — SYN-173. Surfaces as the catch below.
  let token: string
  try {
    token = await getValidAccessToken()
  } catch {
    throw new Error('Sign in expired. Please sign in again.')
  }
  const res = await fetch(
    buildDownloadUrl(level, churchId, arrivalDate, targetLevel),
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  )
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string
    }
    throw new Error(
      typeof body.error === 'string' ? body.error : `Download failed (${res.status})`
    )
  }
  return (await res.json()) as ArrivalsExportPayload
}

type UseArrivalsExportResult = {
  payload: ArrivalsExportPayload | null
  loading: boolean
  error: string | null
}

const useArrivalsExport = (
  level: ArrivalsDownloadLevel | null,
  churchId: string | undefined,
  arrivalDate: string,
  // Picker target. `null` (default) keeps pre-picker behaviour for the
  // legacy multi-sheet xlsx button.
  targetLevel: ArrivalsTargetLevel | null = null
): UseArrivalsExportResult => {
  const [payload, setPayload] = useState<ArrivalsExportPayload | null>(null)
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
    fetchArrivalsExport(
      level,
      churchId,
      arrivalDate,
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
          err instanceof Error ? err.message : 'Could not load arrivals'
        setError(message)
        setPayload(null)
        setLoading(false)
      })

    return () => {
      requestIdRef.current += 1
      controller.abort()
    }
  }, [level, churchId, arrivalDate, targetLevel])

  return { payload, loading, error }
}

export default useArrivalsExport
