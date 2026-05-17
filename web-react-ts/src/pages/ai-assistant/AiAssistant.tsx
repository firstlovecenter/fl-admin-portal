import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useApolloClient, useQuery } from '@apollo/client'
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useExternalStoreRuntime,
  useMessagePartText,
  type AppendMessage,
  type ThreadMessageLike,
} from '@assistant-ui/react'
import { ArrowUpIcon, HandHeart, History, PanelLeftOpen } from 'lucide-react'
import { Button } from 'components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'components/ui/sheet'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { cn } from 'components/lib/utils'
import AssistantMessageContent from './AssistantMessageContent'
import ChatHistorySidebar from './ChatHistorySidebar'
import TodaysTipBanner from './TodaysTipBanner'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import {
  CHAT_SESSION_BY_ID,
  MY_CHAT_SESSIONS,
  SEND_CHAT_MESSAGE,
  type ChatMessageView,
  type ChatSessionDetailResult,
  type MyChatSessionsResult,
  type SendChatMessageResult,
  type SendChatMessageVariables,
} from './aiAssistantQueries'

// ---------------------------------------------------------------------------
// Local message shape — keeps citations alongside text so we can render the
// assistant footer without joining a second query.
// ---------------------------------------------------------------------------
type LocalMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  citations: string[]
}

const toThreadMessage = (m: LocalMessage): ThreadMessageLike => ({
  id: m.id,
  role: m.role,
  content: [{ type: 'text', text: m.text }],
})

const SUGGESTIONS = [
  'How do I encourage a discouraged Bacenta leader?',
  'What does Daddy say about loyalty in ministry?',
  'How should I shepherd new members?',
  'What is Prophet&rsquo;s teaching on prayer for revival?',
]

const AiAssistant = () => {
  const { selectedScope } = useChurchRoleScope()
  const churchId = selectedScope?.churchId ?? null
  const apolloClient = useApolloClient()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)

  // Sidebar: list of past sessions for this church.
  const { data: sessionsData, loading: sessionsLoading } =
    useQuery<MyChatSessionsResult>(MY_CHAT_SESSIONS, {
      variables: { churchId: churchId ?? '', limit: 30 },
      skip: !churchId,
      fetchPolicy: 'cache-and-network',
    })
  const sessions = sessionsData?.myChatSessions ?? []

  // When a session id changes (user picked from sidebar), load its messages.
  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      return
    }
    let cancelled = false
    setIsRunning(false)
    apolloClient
      .query<ChatSessionDetailResult>({
        query: CHAT_SESSION_BY_ID,
        variables: { sessionId },
        fetchPolicy: 'network-only',
      })
      .then((result) => {
        if (cancelled) return
        const detail = result.data?.chatSessionById
        if (!detail) {
          setMessages([])
          return
        }
        setMessages(
          detail.messages.map((m: ChatMessageView) => ({
            id: m.id,
            role: m.role === 'user' ? 'user' : 'assistant',
            text: m.text,
            citations: m.citations ?? [],
          }))
        )
      })
    return () => {
      cancelled = true
    }
  }, [sessionId, apolloClient])

  const handleNew = useCallback(
    async (message: AppendMessage) => {
      if (!churchId) return
      const first = message.content[0]
      if (!first || first.type !== 'text' || !('text' in first)) return
      const userText = first.text.trim()
      if (!userText) return

      // Optimistic user message.
      const optimisticUserId = `user-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: optimisticUserId, role: 'user', text: userText, citations: [] },
      ])
      setIsRunning(true)

      try {
        const result = await apolloClient.mutate<
          SendChatMessageResult,
          SendChatMessageVariables
        >({
          mutation: SEND_CHAT_MESSAGE,
          variables: {
            input: { sessionId, churchId, text: userText },
          },
          refetchQueries: [
            { query: MY_CHAT_SESSIONS, variables: { churchId, limit: 30 } },
          ],
        })

        const reply = result.data?.sendChatMessage
        if (!reply) throw new Error('Empty reply from assistant')

        setSessionId(reply.sessionId)
        setMessages((prev) => [
          ...prev,
          {
            id: reply.message.id,
            role: 'assistant',
            text: reply.message.text,
            citations: reply.message.citations ?? [],
          },
        ])
      } catch {
        // Roll back optimistic user message on failure.
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUserId))
      } finally {
        setIsRunning(false)
      }
    },
    [apolloClient, churchId, sessionId]
  )

  const runtime = useExternalStoreRuntime({
    isRunning,
    isDisabled: !churchId,
    messages,
    convertMessage: toThreadMessage,
    onNew: handleNew,
  })

  const handleSelectSession = useCallback((id: string | null) => {
    setSessionId(id)
    setMobileHistoryOpen(false)
  }, [])

  const handleSessionDeleted = useCallback(
    (deletedId: string) => {
      if (deletedId === sessionId) {
        setSessionId(null)
        setMessages([])
      }
    },
    [sessionId]
  )

  return (
    <div className="flex h-svh flex-col bg-background pb-[env(safe-area-inset-bottom)]">
      {/* ── Header (sticky, mobile-first) ─────────────────────────────── */}
      <StickyPageHeader bare className="bg-background/90">
        <div className="flex items-center gap-3 px-4 py-3 pr-16 md:pr-4">
          <MobileHistoryTrigger
            open={mobileHistoryOpen}
            onOpenChange={setMobileHistoryOpen}
            sidebar={
              <ChatHistorySidebar
                sessions={sessions}
                loading={sessionsLoading}
                activeSessionId={sessionId}
                churchId={churchId}
                onSelectSession={handleSelectSession}
                onSessionDeleted={handleSessionDeleted}
              />
            }
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI <span className="text-arrivals">Assistant</span>
            </h1>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {selectedScope?.churchName
                ? `Anchored to ${selectedScope.churchName}.`
                : 'Pick a church scope to anchor the conversation.'}
            </p>
          </div>
        </div>
      </StickyPageHeader>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden lg:grid lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar — sticky, always visible */}
        <aside className="hidden border-r border-border bg-card/40 p-3 lg:flex lg:flex-col">
          <ChatHistorySidebar
            sessions={sessions}
            loading={sessionsLoading}
            activeSessionId={sessionId}
            churchId={churchId}
            onSelectSession={handleSelectSession}
            onSessionDeleted={handleSessionDeleted}
          />
        </aside>

        {/* Chat column */}
        <main className="flex min-w-0 flex-1 flex-col">
          <TodaysTipBanner
            churchId={churchId}
            authRole={selectedScope?.authRole}
          />
          <AssistantRuntimeProvider runtime={runtime}>
            <ChatThread disabled={!churchId} />
          </AssistantRuntimeProvider>
        </main>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MobileHistoryTrigger = ({
  open,
  onOpenChange,
  sidebar,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  sidebar: ReactNode
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 lg:hidden"
        aria-label="Open chat history"
      >
        <History className="size-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-[300px] p-4">
      <SheetHeader className="mb-3 text-left">
        <SheetTitle className="flex items-center gap-2 text-base">
          <PanelLeftOpen className="size-4" /> Past chats
        </SheetTitle>
      </SheetHeader>
      {sidebar}
    </SheetContent>
  </Sheet>
)

const ChatThread = ({ disabled }: { disabled: boolean }) => (
  <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
    <ThreadPrimitive.Viewport className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
      <ThreadPrimitive.Empty>
        <EmptyState disabled={disabled} />
      </ThreadPrimitive.Empty>

      <ThreadPrimitive.Messages
        components={{
          UserMessage,
          AssistantMessage,
          EditComposer: () => null,
        }}
      />

      <ThreadPrimitive.If running>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-foreground/40" />
          Thinking&hellip;
        </div>
      </ThreadPrimitive.If>
    </ThreadPrimitive.Viewport>

    {/* Composer — pinned to the bottom of the chat column via flex layout
        (NOT sticky inside the scroll container, which created the
        scroll-bug-and-overflow combo on the prior design). */}
    <div className="border-t border-border bg-card px-3 py-3 sm:px-4 sm:py-4">
      <ComposerPrimitive.Root
        className={cn(
          'flex w-full flex-col rounded-2xl border border-border bg-muted/40 transition-colors focus-within:bg-muted',
          disabled && 'opacity-60'
        )}
      >
        <ComposerPrimitive.Input
          placeholder={
            disabled
              ? 'Pick a church scope to start chatting…'
              : 'Ask Daddy anything…'
          }
          disabled={disabled}
          rows={1}
          className="min-h-11 w-full resize-none bg-transparent px-4 pt-3 pb-1.5 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />
        <div className="flex items-center justify-end px-2 pb-2">
          <ComposerPrimitive.Send
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
            aria-label="Send"
          >
            <ArrowUpIcon className="size-4" />
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  </ThreadPrimitive.Root>
)

const EmptyState = ({ disabled }: { disabled: boolean }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
    <div
      className="flex size-14 items-center justify-center rounded-2xl"
      style={{ backgroundColor: 'hsl(var(--brand) / 0.12)' }}
    >
      <HandHeart className="size-7" style={{ color: 'hsl(var(--brand))' }} />
    </div>
    <div className="max-w-md space-y-1">
      <h2 className="text-base font-semibold text-foreground">
        How can I help you today?
      </h2>
      <p className="text-sm text-muted-foreground">
        {disabled
          ? 'Pick a church scope from the top of the dashboard to start chatting.'
          : 'I draw on Prophet&rsquo;s books and Scripture to help you lead with clarity.'}
      </p>
    </div>
    {!disabled && (
      <div className="mt-2 grid w-full max-w-md gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((label) => (
          <SuggestionChip key={label}>{label}</SuggestionChip>
        ))}
      </div>
    )}
  </div>
)

const SuggestionChip = ({ children }: { children: string }) => (
  <ThreadPrimitive.Suggestion
    prompt={children}
    method="replace"
    autoSend
    className="rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
  >
    {children}
  </ThreadPrimitive.Suggestion>
)

const UserMessage = () => (
  <MessagePrimitive.Root className="flex justify-end">
    <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
)

const AssistantMessage = () => (
  <MessagePrimitive.Root className="flex justify-start gap-3">
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: 'hsl(var(--brand) / 0.12)' }}
    >
      <HandHeart className="size-4" style={{ color: 'hsl(var(--brand))' }} />
    </div>
    <div className="min-w-0 max-w-[85%] rounded-2xl bg-muted/60 px-4 py-2.5">
      <MessagePrimitive.Parts components={{ Text: MarkdownTextPart }} />
    </div>
  </MessagePrimitive.Root>
)

// Custom Text-part renderer for assistant messages. `useMessagePartText`
// reads the nearest message-part context established by
// `MessagePrimitive.Parts`, so we get exactly this part's text without
// reaching into the message store ourselves.
const MarkdownTextPart = () => {
  const { text } = useMessagePartText()
  if (!text) return null
  return <AssistantMessageContent text={text} />
}

export default AiAssistant
