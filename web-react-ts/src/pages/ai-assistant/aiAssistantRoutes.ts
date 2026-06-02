import { LazyRouteTypes } from 'global-types'
import { lazy } from 'react'
import { permitMe } from 'permission-utils'

const AiAssistant = lazy(() => import('pages/ai-assistant/AiAssistant'))

export const aiAssistant: LazyRouteTypes[] = [
  {
    path: '/ai-assistant',
    element: AiAssistant,
    // Keep open to every operational role at Bacenta+ (leaders, admins,
    // arrivals admins, tellers) — but exclude single-purpose roles like
    // Stream Arrivals Counter, whose chrome hides this surface.
    roles: permitMe('Bacenta'),
  },
]
