import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { MessageSquarePlus, Trash2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import { cn } from 'components/lib/utils'
import {
  DELETE_CHAT_SESSION,
  MY_CHAT_SESSIONS,
  type ChatSessionPreview,
  type DeleteChatSessionResult,
} from './aiAssistantQueries'

type Props = {
  sessions: ChatSessionPreview[]
  loading: boolean
  activeSessionId: string | null
  churchId: string | null
  onSelectSession: (sessionId: string | null) => void
  onSessionDeleted?: (sessionId: string) => void
}

const formatRelative = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d`
  return d.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })
}

const ChatHistorySidebar = ({
  sessions,
  loading,
  activeSessionId,
  churchId,
  onSelectSession,
  onSessionDeleted,
}: Props) => {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteSession] = useMutation<DeleteChatSessionResult>(
    DELETE_CHAT_SESSION,
    {
      refetchQueries: churchId
        ? [{ query: MY_CHAT_SESSIONS, variables: { churchId, limit: 30 } }]
        : [],
    }
  )

  const handleDelete = async (
    e: React.MouseEvent,
    sessionId: string
  ): Promise<void> => {
    e.stopPropagation()
    if (deletingId) return
    setDeletingId(sessionId)
    try {
      await deleteSession({ variables: { sessionId } })
      onSessionDeleted?.(sessionId)
    } catch {
      // Apollo error link surfaces the snackbar; nothing to do here.
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <Button
        type="button"
        variant="default"
        onClick={() => onSelectSession(null)}
        className="w-full justify-start gap-2"
      >
        <MessageSquarePlus className="size-4" />
        New chat
      </Button>

      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            No past chats yet. Ask a question to start one.
          </p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((s) => {
              const isActive = s.id === activeSessionId
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSession(s.id)}
                    className={cn(
                      'group flex w-full items-start gap-2 rounded-xl border border-transparent px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'border-border bg-accent text-accent-foreground'
                        : 'hover:bg-muted/60'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.title || 'New conversation'}
                      </p>
                      {s.preview && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {s.preview}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatRelative(s.updatedAt)}
                      </span>
                      <span
                        role="button"
                        tabIndex={-1}
                        aria-label="Delete chat"
                        onClick={(e) => handleDelete(e, s.id)}
                        className={cn(
                          'flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100',
                          isActive && 'opacity-100',
                          deletingId === s.id && 'pointer-events-none opacity-50'
                        )}
                      >
                        <Trash2 className="size-3.5" />
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ChatHistorySidebar
