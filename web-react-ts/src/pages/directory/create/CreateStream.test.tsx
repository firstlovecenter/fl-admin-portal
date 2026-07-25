/**
 * Tests for the i18n conversion of CreateStream.tsx.
 *
 * The only user-visible string this wrapper owns is the `title` prop
 * passed into `StreamForm`: `t('directory.create.createNewLevel', {level:
 * t('shared.churchLevel.Stream')})`. Form field content is covered by
 * StreamForm.test.tsx (phase 3a).
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import CreateStream from './CreateStream'

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

const churchContextValue = { campusId: 'campus-1', clickCard: vi.fn() }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/stream/create']}>
      <MockedProvider mocks={[]} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <CreateStream />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('CreateStream i18n', () => {
  it('renders the English "Create a New Stream" title', () => {
    renderPage()

    expect(screen.getByText('Create a New Stream')).toBeInTheDocument()
  })

  it('renders the French-translated title', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(screen.getByText('Créer un nouveau Filière')).toBeInTheDocument()
  })
})
