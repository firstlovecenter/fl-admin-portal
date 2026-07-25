/**
 * Tests for the i18n conversion of CouncilForm.tsx.
 *
 * Same shape/scope as `GovernorshipForm.test.tsx` one level up: hardcoded
 * English strings moved to `t('directory.councilForm.*')` /
 * `t('shared.churchLevel*.*')` / `t('directory.common.*')`. The "Add
 * Governorship" / "Close Down Council" mutation flows
 * (`MoveGovernorshipToCouncil` / `CloseDownCouncil`) are untouched and not
 * exercised here.
 *
 * See `GovernorshipForm.test.tsx` for the shared mocking rationale
 * (`contexts/AuthContext`, `MemberContext.currentUser.roles:
 * ['adminDenomination']`, `ChurchContext`, `MockedProvider` with no mocks,
 * the `ResizeObserver` stub for `cmdk`, and the pre-existing
 * `SearchCombobox` label/id mismatch that rules out `getByLabelText` for
 * the leader field).
 *
 * NOTE (pre-existing, out of scope): the "Close Down Council" dialog's
 * Cancel button reads `t('directory.governorshipForm.closeDownCancel')` —
 * i.e. it borrows GovernorshipForm's translation key instead of having its
 * own `directory.councilForm.closeDownCancel` entry. The rendered text
 * ("No, take me back" / "Non, retour en arrière") happens to be
 * level-agnostic, so this isn't a visible bug, just a cross-namespace key
 * reuse — flagged to the user, not changed here.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import CouncilForm, { CouncilFormValues } from './CouncilForm'

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

const churchContextValue = { clickCard: vi.fn(), councilId: 'council-1' }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

const initialValues: CouncilFormValues = {
  name: 'Dansoman',
  leaderName: 'Kwame Owusu',
  leaderId: 'leader-1',
  leaderEmail: 'kwame@example.com',
  adminId: '',
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/council/update']}>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <CouncilForm
              initialValues={initialValues}
              onSubmit={vi.fn()}
              title="Update Council Form"
              newCouncil={false}
            />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('CouncilForm i18n', () => {
  it('renders the default English heading, labels, and trigger buttons', () => {
    renderForm()

    expect(
      screen.getByRole('heading', { name: 'Dansoman Council' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name of Council')).toHaveValue('Dansoman')
    expect(screen.getByText('Choose a Leader')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add Governorship' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Close Down Council' })
    ).toBeInTheDocument()
  })

  it('opens the "Add Governorship" dialog with its translated title and body', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add Governorship' }))

    const dialog = (await screen.findByText('Add A Governorship')).closest(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      within(dialog).getByText('Choose a governorship to move to this council')
    ).toBeInTheDocument()
  })

  it('opens the "Close Down Council" dialog with its translated confirmation and cancel control', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Close Down Council' }))

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      await within(dialog).findByText(
        'Are you sure you want to close down this council?'
      )
    ).toBeInTheDocument()
    expect(within(dialog).getByText('No, take me back')).toBeInTheDocument()
  })

  it('re-renders the heading, labels, and trigger buttons in French', async () => {
    renderForm()

    await i18n.changeLanguage('fr')

    expect(
      await screen.findByRole('heading', { name: 'Dansoman Conseil' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nom du conseil')).toHaveValue('Dansoman')
    expect(screen.getByText('Choisir un responsable')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ajouter un gouvernorat' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Fermer le conseil' })
    ).toBeInTheDocument()
  })

  it('opens the French-translated "Close Down Council" dialog', async () => {
    renderForm()
    await i18n.changeLanguage('fr')

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: 'Fermer le conseil' })
    )

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(
      await within(dialog).findByText(
        'Êtes-vous sûr de vouloir fermer ce conseil ?'
      )
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('Non, retour en arrière')
    ).toBeInTheDocument()
  })
})
