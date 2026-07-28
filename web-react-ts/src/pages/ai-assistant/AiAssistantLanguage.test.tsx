/**
 * Covers the one line on the frontend that implements the reply-language
 * feature: the `language` field on the `sendChatMessage` mutation input.
 *
 * `AiAssistant.test.tsx` asserts on translation keys and renders only
 * `TodaysTipBanner`, so the mutation variables were entirely uncovered. The
 * regressions this guards are both realistic and silent — a merge drops the
 * field, or someone reads `i18n.language` at module scope where it is frozen at
 * first load. Either way French leaders quietly get English replies and nothing
 * anywhere errors.
 *
 * `useExternalStoreRuntime` is mocked to capture the `onNew` callback so the real
 * `handleNew` runs without driving assistant-ui's composer through jsdom.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import type { AppendMessage } from '@assistant-ui/react'

// The mocked client MUST be a stable reference. `apolloClient` sits in the
// dep array of the session-loading useEffect, so returning a fresh object from
// `useApolloClient` on every render makes the effect re-fire, call setMessages,
// re-render, and loop until the heap dies. (It does — that is how this comment
// came to exist.)
const { mutate, query, apolloClient } = vi.hoisted(() => {
  const m = vi.fn()
  const q = vi.fn()
  return { mutate: m, query: q, apolloClient: { mutate: m, query: q } }
})

// Captures the runtime's onNew so the test can invoke the real handleNew.
let onNew: ((message: AppendMessage) => Promise<void>) | undefined

// Only two things are stubbed: `useExternalStoreRuntime`, to capture `onNew`,
// and `AssistantRuntimeProvider`, rendered as null so nothing beneath it mounts.
// The primitives are left as the real exports — stubbing them means re-listing
// every member the component uses (`ThreadPrimitive.Suggestion` was the one that
// bit), and they all live inside the provider anyway.
vi.mock('@assistant-ui/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@assistant-ui/react')>()
  return {
    ...actual,
    useExternalStoreRuntime: (config: {
      onNew: (m: AppendMessage) => Promise<void>
    }) => {
      onNew = config.onNew
      return {} as unknown
    },
    AssistantRuntimeProvider: () => null,
  }
})

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useQuery: () => ({ data: undefined, loading: false, error: undefined }),
    useMutation: () => [vi.fn(), { loading: false }],
    useApolloClient: () => apolloClient,
  }
})

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

vi.mock('contexts/ChurchRoleScopeContext', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('contexts/ChurchRoleScopeContext')
  >()
  return {
    ...actual,
    useChurchRoleScope: () => ({
      selectedScope: {
        churchId: 'c1',
        churchType: 'Council',
        churchName: 'Adenta',
      },
      roleChurchOptions: [],
      setSelectedScope: vi.fn(),
    }),
  }
})

// eslint-disable-next-line import/first
import AiAssistant from './AiAssistant'

const send = async (text: string) => {
  if (!onNew) throw new Error('onNew was never captured — mock out of date')
  // `handleNew` reads only `message.content[0]`, so the rest of AppendMessage
  // (metadata, createdAt) is irrelevant here. Cast through `unknown` rather than
  // fabricating those fields, which would imply the code depends on them.
  await onNew({
    role: 'user',
    content: [{ type: 'text', text }],
  } as unknown as AppendMessage)
}

const lastInput = () => mutate.mock.calls[0][0].variables.input

beforeEach(() => {
  mutate.mockReset()
  query.mockReset()
  // The session-loading effect calls this; a rejected/absent promise would
  // surface as an unhandled rejection rather than a test failure.
  query.mockResolvedValue({ data: { chatSessionById: null } })
  mutate.mockResolvedValue({
    data: {
      sendChatMessage: {
        sessionId: 's1',
        message: { id: 'm1', text: 'reply', citations: [] },
      },
    },
  })
})

afterEach(async () => {
  cleanup()
  onNew = undefined
  await i18n.changeLanguage('en')
})

const mount = () =>
  render(
    <MemoryRouter>
      <AiAssistant />
    </MemoryRouter>
  )

describe('sendChatMessage language variable', () => {
  it.each(['en', 'fr', 'es', 'pt', 'de'])(
    'sends %s when that is the active UI language',
    async (lang) => {
      await i18n.changeLanguage(lang)
      mount()
      await send('How do I grow my bacenta?')

      await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
      expect(lastInput().language).toBe(lang)
    }
  )

  it('sends the rest of the input unchanged alongside the language', () => {
    // Guards against a merge that reshapes the input object and drops a field.
    return (async () => {
      await i18n.changeLanguage('fr')
      mount()
      await send('Comment faire croître ma bacenta ?')

      await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
      expect(lastInput()).toMatchObject({
        churchId: 'c1',
        text: 'Comment faire croître ma bacenta ?',
        language: 'fr',
      })
    })()
  })

  it('reads the language at send time, not at module load', async () => {
    // The realistic failure: capturing `i18n.language` in a module-scope const
    // or a stale closure. A leader who switches language mid-session must have
    // the NEXT message reflect the switch.
    await i18n.changeLanguage('en')
    mount()
    await send('first question')
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate.mock.calls[0][0].variables.input.language).toBe('en')

    await i18n.changeLanguage('de')
    await send('zweite Frage')
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(2))
    expect(mutate.mock.calls[1][0].variables.input.language).toBe('de')
  })

  it('strips a region subtag via resolvedLanguage', async () => {
    // supportedLngs + load: 'languageOnly' means a region-tagged navigator value
    // resolves to the bare subtag. The server strips regions too, but sending
    // the resolved value keeps the two consistent.
    await i18n.changeLanguage('pt-BR')
    mount()
    await send('Como faço crescer minha bacenta?')

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(lastInput().language).toBe('pt')
  })
})
