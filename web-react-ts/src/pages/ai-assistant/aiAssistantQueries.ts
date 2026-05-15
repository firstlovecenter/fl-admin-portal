import { gql } from '@apollo/client'

export const MY_CHAT_SESSIONS = gql`
  query MyChatSessions($churchId: ID!, $limit: Int) {
    myChatSessions(churchId: $churchId, limit: $limit) {
      id
      title
      churchId
      updatedAt
      preview
    }
  }
`

export type ChatSessionPreview = {
  id: string
  title: string
  churchId: string
  updatedAt: string
  preview: string
}

export type MyChatSessionsResult = {
  myChatSessions: ChatSessionPreview[]
}

export const CHAT_SESSION_BY_ID = gql`
  query ChatSessionById($sessionId: ID!) {
    chatSessionById(sessionId: $sessionId) {
      id
      title
      churchId
      createdAt
      updatedAt
      messages {
        id
        role
        text
        createdAt
        citations
      }
    }
  }
`

export type ChatMessageView = {
  id: string
  role: string
  text: string
  createdAt: string
  citations: string[]
}

export type ChatSessionDetailResult = {
  chatSessionById: {
    id: string
    title: string
    churchId: string
    createdAt: string
    updatedAt: string
    messages: ChatMessageView[]
  } | null
}

export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($input: SendChatMessageInput!) {
    sendChatMessage(input: $input) {
      sessionId
      title
      message {
        id
        role
        text
        createdAt
        citations
      }
    }
  }
`

export type SendChatMessageVariables = {
  input: {
    sessionId?: string | null
    churchId: string
    text: string
  }
}

export type SendChatMessageResult = {
  sendChatMessage: {
    sessionId: string
    title: string
    message: ChatMessageView
  }
}

export const DELETE_CHAT_SESSION = gql`
  mutation DeleteChatSession($sessionId: ID!) {
    deleteChatSession(sessionId: $sessionId)
  }
`

export type DeleteChatSessionResult = {
  deleteChatSession: boolean
}

// Re-export the weekly-tip query so the assistant page can reuse it.
export {
  WEEKLY_TIP_FOR_CHURCH,
  type WeeklyTipForChurchResult,
} from 'pages/dashboards/userWeeklyTipQueries'
