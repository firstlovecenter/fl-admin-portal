/**
 * Tests for the i18n conversion of OversightForm.tsx.
 *
 * Same shape/scope as `GovernorshipForm.test.tsx` (manages Campuses instead
 * of Bacentas one level down). The "Add Campus" / "Close Down Oversight"
 * mutation flows (`MoveCampusToOversight` / `CloseDownOversight`) are
 * untouched and not exercised here. See `GovernorshipForm.test.tsx` for the
 * shared mocking rationale.
 *
 * NOTE (pre-existing, out of scope): the "Close Down Oversight" dialog's
 * Cancel button reads `t('directory.governorshipForm.closeDownCancel')`
 * (cross-namespace key reuse) — see the same note in
 * `CouncilForm.test.tsx`.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import OversightForm, { OversightFormValues } from './OversightForm'

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

const churchContextValue = { clickCard: vi.fn(), oversightId: 'oversight-1' }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

const initialValues: OversightFormValues = {
  name: 'Tema',
  leaderName: 'Kwame Owusu',
  leaderId: 'leader-1',
  leaderEmail: 'kwame@example.com',
  adminId: '',
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/oversight/update']}>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <OversightForm
              initialValues={initialValues}
              onSubmit={vi.fn()}
              title="Update Oversight Form"
              newOversight={false}
            />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('OversightForm i18n', () => {
  it('renders the default English heading, labels, and trigger buttons', () => {
    renderForm()

    expect(
      screen.getByRole('heading', { name: 'Tema Oversight' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name of Oversight')).toHaveValue('Tema')
    expect(screen.getByText('Choose a Leader')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add Campus' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Close Down Oversight' })
    ).toBeInTheDocument()
  })

  it('opens the "Add Campus" dialog with its translated title and body', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add Campus' }))

    const dialog = (await screen.findByText('Add A Campus')).closest(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      within(dialog).getByText('Choose a campus to move to this oversight')
    ).toBeInTheDocument()
  })

  it('opens the "Close Down Oversight" dialog with its translated confirmation and cancel control', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', { name: 'Close Down Oversight' })
    )

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      await within(dialog).findByText(
        'Are you sure you want to close down this oversight?'
      )
    ).toBeInTheDocument()
    expect(within(dialog).getByText('No, take me back')).toBeInTheDocument()
  })

  it('re-renders the heading, labels, and trigger buttons in French', async () => {
    renderForm()

    await i18n.changeLanguage('fr')

    expect(
      await screen.findByRole('heading', { name: 'Tema Supervision' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nom de la supervision')).toHaveValue('Tema')
    expect(screen.getByText('Choisir un responsable')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ajouter un campus' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Fermer la supervision' })
    ).toBeInTheDocument()
  })

  it('opens the French-translated "Close Down Oversight" dialog', async () => {
    renderForm()
    await i18n.changeLanguage('fr')

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: 'Fermer la supervision' })
    )

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(
      await within(dialog).findByText(
        'Êtes-vous sûr de vouloir fermer cette supervision ?'
      )
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('Non, retour en arrière')
    ).toBeInTheDocument()
  })
})
