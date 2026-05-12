import { useEffect, useRef, useState } from 'react'
import {
  AnchorWeekYear,
  MetricKey,
  ShepherdingLevel,
  WindowWeeks,
} from './shepherding-control-types'

const CHANNEL_NAME = 'shepherding-control'

export type ProjectorState = {
  level: ShepherdingLevel
  id: string
  name: string
  anchor: AnchorWeekYear
  windowWeeks: WindowWeeks
  metricA: MetricKey
  metricB: MetricKey | null
}

type Message =
  | { kind: 'state'; state: ProjectorState }
  | { kind: 'ready' }
  | { kind: 'closed' }

const supportsChannel = (): boolean =>
  typeof BroadcastChannel !== 'undefined'

// Controller side. Owns a single BroadcastChannel, posts state on every
// change, and tracks whether a projector window is alive (via the
// 'ready' acknowledgement). The Cast button opens the popup; closing the
// popup or the controller posts a 'closed' message so both sides can
// clean up.
export const useProjectorController = (state: ProjectorState | null) => {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const popupRef = useRef<Window | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!supportsChannel()) return undefined
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    const onMessage = (event: MessageEvent<Message>) => {
      if (event.data?.kind === 'ready') {
        setIsConnected(true)
      } else if (event.data?.kind === 'closed') {
        setIsConnected(false)
      }
    }
    channel.addEventListener('message', onMessage)

    return () => {
      channel.removeEventListener('message', onMessage)
      channel.close()
      channelRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!channelRef.current || !state) return
    channelRef.current.postMessage({ kind: 'state', state })
  }, [state])

  // Poll popup closure — the popup can be dismissed by the OS / user
  // without going through React, so we watch `window.closed` on a short
  // interval and post a 'closed' to clean state. Only runs while a popup
  // handle is held.
  useEffect(() => {
    if (!popupRef.current) return undefined
    const handle = window.setInterval(() => {
      if (popupRef.current?.closed) {
        popupRef.current = null
        setIsConnected(false)
        channelRef.current?.postMessage({ kind: 'closed' })
        window.clearInterval(handle)
      }
    }, 1000)
    return () => window.clearInterval(handle)
  }, [isConnected])

  const openProjector = () => {
    // Same-origin popup inherits sessionStorage in modern browsers, so the
    // auth token flows naturally to the new window. We keep `noopener`
    // unset for this reason.
    const features =
      'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no'
    const next = window.open('/shepherding-control/projector', 'shepherding-projector', features)
    if (next) {
      popupRef.current = next
      next.focus()
    }
  }

  const focusProjector = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus()
    } else {
      openProjector()
    }
  }

  return {
    isSupported: supportsChannel(),
    isConnected,
    openProjector,
    focusProjector,
  }
}

// Projector side. Subscribes to the channel, acknowledges with 'ready' on
// mount, and re-acknowledges on every render to handle the case where the
// controller opens the popup but the popup mounts after the controller's
// initial broadcast.
export const useProjectorViewer = (): ProjectorState | null => {
  const [state, setState] = useState<ProjectorState | null>(null)

  useEffect(() => {
    if (!supportsChannel()) return undefined
    const channel = new BroadcastChannel(CHANNEL_NAME)

    const onMessage = (event: MessageEvent<Message>) => {
      if (event.data?.kind === 'state') {
        setState(event.data.state)
      }
    }
    channel.addEventListener('message', onMessage)
    channel.postMessage({ kind: 'ready' })

    const onUnload = () => channel.postMessage({ kind: 'closed' })
    window.addEventListener('beforeunload', onUnload)

    return () => {
      channel.removeEventListener('message', onMessage)
      window.removeEventListener('beforeunload', onUnload)
      channel.postMessage({ kind: 'closed' })
      channel.close()
    }
  }, [])

  return state
}
