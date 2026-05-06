import { LazyRouteTypes } from 'global-types'
import { lazy } from 'react'

const AiAssistant = lazy(() => import('pages/ai-assistant/AiAssistant'))

export const aiAssistant: LazyRouteTypes[] = [
  {
    path: '/ai-assistant',
    element: AiAssistant,
    roles: ['all'],
  },
]
