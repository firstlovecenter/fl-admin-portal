/**
 * Characterization tests for SelfBankingList chrome strings after i18n
 * conversion. Asserts English defaults and a French re-render for the
 * primary page chrome (title, section heading, empty state, how-it-works).
 *
 * BankingHistory lives elsewhere and is intentionally out of scope.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import SelfBankingList from './SelfBankingList'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
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

const church = {
  id: 'bacenta-1',
  name: 'Legacy',
  __typename: 'Bacenta',
  bankingCode: '1234',
  services: [],
}

function renderList() {
  return render(
    <MemoryRouter>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={{ clickCard: vi.fn() }}>
          <SelfBankingList
            church={church}
            loading={false}
            error={undefined}
            skip={0}
            setSkip={vi.fn()}
            refetch={vi.fn()}
            confirmationTools={{
              confirmService: null,
              setConfirmService: vi.fn(),
            }}
            popupTools={{
              show: false,
              handleShow: vi.fn(),
              handleClose: vi.fn(),
            }}
          />
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('SelfBankingList i18n', () => {
  it('renders English chrome for the empty self-banking list', () => {
    renderList()

    expect(screen.getByText('Self-Banking')).toBeInTheDocument()
    expect(screen.getByText('Legacy')).toBeInTheDocument()
    expect(screen.getByText(/Banking Code · 1234/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Services to bank' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Tap a service to bank its offering')
    ).toBeInTheDocument()
    expect(screen.getByText('Nothing to bank yet')).toBeInTheDocument()
    expect(
      screen.getByText('How self-banking works')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Enter your MoMo number — we send a prompt to authorise.')
    ).toBeInTheDocument()
    expect(screen.getByText('Need help?')).toBeInTheDocument()
  })

  it('re-renders chrome strings in French', async () => {
    renderList()
    await i18n.changeLanguage('fr')

    expect(await screen.findByText('Auto-dépôt')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Cultes à déposer' })
    ).toBeInTheDocument()
    expect(
      screen.getByText("Rien à déposer pour l'instant")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Comment fonctionne l'auto-dépôt")
    ).toBeInTheDocument()
  })
})
