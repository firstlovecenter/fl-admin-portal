/**
 * Tests for the i18n conversion of CreateGovernorship.tsx.
 *
 * The only user-visible string this wrapper owns is the `title` prop
 * passed into `GovernorshipForm`: `t('directory.create.createNewLevel',
 * {level: t('shared.churchLevel.Governorship')})`. Form field content is
 * covered by GovernorshipForm.test.tsx (phase 3a).
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import CreateGovernorship from './CreateGovernorship'

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

const churchContextValue = { councilId: 'council-1', clickCard: vi.fn() }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/governorship/create']}>
      <MockedProvider mocks={[]} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <CreateGovernorship />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('CreateGovernorship i18n', () => {
  it('renders the English "Create a New Governorship" title', () => {
    renderPage()

    expect(screen.getByText('Create a New Governorship')).toBeInTheDocument()
  })

  it('renders the French-translated title', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      screen.getByText('Créer un nouveau Gouvernorat')
    ).toBeInTheDocument()
  })
})
