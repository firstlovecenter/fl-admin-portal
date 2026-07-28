/**
 * Translation coverage for the AI Assistant's UI chrome.
 *
 * Scope note, because this page is the one place the boundary matters:
 *
 *  - The **chrome** is translated, and that is what this file covers.
 *  - The assistant's **reply** is translated too, but server-side — the reply
 *    language is a prompt constraint, since the quotations are generated in the
 *    resolver. Covered by `assistant-language.test.ts` and
 *    `assistant-prompt.test.ts`; the mutation variable that carries the language
 *    is covered by `AiAssistantLanguage.test.tsx`. See plan.md phase 10.
 *  - `SUGGESTIONS` **stay in English**, and that has not changed. They look like
 *    display copy but are *inputs*, sent verbatim to a retrieval pipeline built
 *    over an English corpus of Prophet's books.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'

import TodaysTipBanner from './TodaysTipBanner'

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useQuery: () => ({
      data: {
        weeklyTipForChurch: {
          id: 'tip-1',
          body: 'Shepherd with patience. There is more in the body.',
          scripture: null,
          recommendedBook: {
            title: 'Loyalty And Disloyalty',
            author: 'Dag Heward-Mills',
          },
        },
      },
      loading: false,
      error: undefined,
    }),
    useMutation: () => [vi.fn(), { loading: false }],
    useApolloClient: () => ({}),
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

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('TodaysTipBanner', () => {
  it('translates its chrome, leaving the generated tip text alone', async () => {
    await i18n.changeLanguage('fr')
    wrap(<TodaysTipBanner churchId="c1" authRole="leaderCouncil" />)

    expect(screen.getByText('Conseil du jour')).toBeInTheDocument()
    expect(screen.queryByText('Today’s tip')).not.toBeInTheDocument()

    // The tip itself is model-generated English and passes through untouched.
    expect(screen.getByText(/Shepherd with patience/)).toBeInTheDocument()

    // 'Read next' lives in the collapsed half of the banner.
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByText('À lire ensuite :')).toBeInTheDocument()
  })
})

describe('assistant chrome keys', () => {
  it('translates every chrome string across all five languages', async () => {
    const KEYS = [
      'assistant.howCanIHelp',
      'assistant.composerPlaceholder',
      'assistant.send',
      'assistant.newChat',
      'assistant.noPastChats',
      'assistant.todaysTip',
    ]

    for (const lang of ['en', 'fr', 'es', 'pt', 'de']) {
      // eslint-disable-next-line no-await-in-loop
      await i18n.changeLanguage(lang)
      KEYS.forEach((key) => {
        const value = i18n.t(key)
        expect(value).not.toBe(key)
        expect(value.length).toBeGreaterThan(0)
      })
    }
  })

  it('interpolates the church name into the anchor line', async () => {
    await i18n.changeLanguage('de')
    expect(i18n.t('assistant.anchoredTo', { church: 'Adenta' })).toBe(
      'Verankert bei Adenta.'
    )
  })

  it('translates Daddy and Prophet to each form of address', async () => {
    // These are ordinary words used as address, not coined terms, so they
    // translate — see kb/01-glossary.md. Asserted per language because the
    // earlier pass left them in English.
    const ADDRESS = {
      fr: { daddy: 'Papa', prophet: 'Prophète' },
      es: { daddy: 'Papá', prophet: 'Profeta' },
      pt: { daddy: 'Papá', prophet: 'Profeta' },
      de: { daddy: 'Papa', prophet: 'Propheten' },
    } as const

    for (const [lang, words] of Object.entries(ADDRESS)) {
      // eslint-disable-next-line no-await-in-loop
      await i18n.changeLanguage(lang)
      expect(i18n.t('assistant.composerPlaceholder')).toContain(words.daddy)
      expect(i18n.t('assistant.intro')).toContain(words.prophet)
      expect(i18n.t('assistant.composerPlaceholder')).not.toContain('Daddy')
    }
  })
})
