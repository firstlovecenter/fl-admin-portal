/**
 * Tests for the i18n conversion of CreateBacenta.tsx.
 *
 * The only user-visible string this wrapper owns is the `title` prop
 * passed into `BacentaForm` (now `t('directory.create.startNewBacenta')`,
 * distinct wording from the other six Create*.tsx wrappers' "Create a New
 * {level}" pattern — the source itself says "Start a New Bacenta"). Form
 * field content is covered by BacentaForm.test.tsx.
 *
 * Mocking follows the same pattern as BacentaForm.test.tsx (MockedProvider
 * for SearchMember's useLazyQuery, ChurchContext for UpdateBusPaymentDialog,
 * MemberContext roles for RoleView-gated sections) plus a mock of
 * `contexts/AuthContext` since CreateBacenta itself calls `useAuth()` for
 * `refreshAccessToken`.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import CreateBacenta from './CreateBacenta'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    refreshAccessToken: vi.fn(),
  })),
}))

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}

    unobserve() {}

    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).ResizeObserver = ResizeObserverStub
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const churchContextValue = {
  governorshipId: 'gov-1',
  bacentaId: undefined,
  clickCard: vi.fn(),
}
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bacenta/create']}>
      <MockedProvider mocks={[]} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <CreateBacenta />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('CreateBacenta i18n', () => {
  it('renders the English "Start a New Bacenta" title', () => {
    renderPage()

    expect(screen.getByText('Start a New Bacenta')).toBeInTheDocument()
  })

  it('renders the French-translated title', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      screen.getByText('Commencer un nouveau Bacenta')
    ).toBeInTheDocument()
  })
})
