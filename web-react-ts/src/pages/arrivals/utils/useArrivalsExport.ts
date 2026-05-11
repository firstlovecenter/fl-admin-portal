import { useEffect, useRef, useState } from 'react'

import { getAccessToken } from 'lib/auth-service'

import {
  ArrivalsDownloadLevel,
  ArrivalsExportPayload,
} from './buildArrivalsWorkbook'

const buildDownloadUrl = (
  level: ArrivalsDownloadLevel,
  churchId: string,
  arrivalDate: string
): string => {
  const graphqlUri =
    import.meta.env.VITE_SYNAGO_GRAPHQL_URI || 'http://localhost:4001/graphql'
  const apiBase = graphqlUri.replace(/\/graphql\/?$/, '')
  const params = new URLSearchParams()
  params.set('arrivalDate', arrivalDate)
  return `${apiBase}/downloads/arrivals/${encodeURIComponent(
    level
  )}/${encodeURIComponent(churchId)}.json?${params.toString()}`
}

export const fetchArrivalsExport = async (
  level: ArrivalsDownloadLevel,
  churchId: string,
  arrivalDate: string,
  signal?: AbortSignal
): Promise<ArrivalsExportPayload> => {
  const token = getAccessToken()
  if (!token) throw new Error('Sign in expired. Please sign in again.')
  const res = await fetch(buildDownloadUrl(level, churchId, arrivalDate), {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
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
  arrivalDate: string
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
    fetchArrivalsExport(level, churchId, arrivalDate, controller.signal)
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
  }, [level, churchId, arrivalDate])

  return { payload, loading, error }
}

export default useArrivalsExport
