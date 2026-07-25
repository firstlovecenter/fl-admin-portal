/**
 * Tests for the i18n conversion of CampusForm.tsx.
 *
 * Same shape/scope as `GovernorshipForm.test.tsx` / `StreamForm.test.tsx`,
 * plus income-tracking/currency Select fields whose *option lists*
 * (`YES_NO_OPTIONS`, `CURRENCY_OPTIONS` from `global-utils.ts`) are
 * deliberately NOT translated in this pass — shared across dozens of
 * unrelated pages, out of scope. Only the `label`/`defaultOption` props
 * moved to `t()`.
 *
 * The "Add Stream" / "Close Down Campus" mutation flows
 * (`MoveStreamToCampus` / `CloseDownCampus`) are untouched and not
 * exercised here. See `GovernorshipForm.test.tsx` for the shared mocking
 * rationale.
 *
 * NOTE (pre-existing, out of scope): the "Close Down Campus" dialog's
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
import CampusForm, { CampusFormValues } from './CampusForm'

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

const churchContextValue = { clickCard: vi.fn(), campusId: 'campus-1' }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

const initialValues: CampusFormValues = {
  name: 'Achimota',
  leaderName: 'Kwame Owusu',
  leaderId: 'leader-1',
  leaderEmail: 'kwame@example.com',
  adminId: '',
  incomeTracking: 'Yes',
  currency: 'GHS',
  conversionRateToDollar: 1,
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/campus/update']}>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <CampusForm
              initialValues={initialValues}
              onSubmit={vi.fn()}
              title="Update Campus Form"
              newCampus={false}
            />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('CampusForm i18n', () => {
  it('renders the default English heading, labels, Select labels, and trigger buttons', () => {
    renderForm()

    expect(
      screen.getByRole('heading', { name: 'Achimota Campus' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name of Campus')).toHaveValue('Achimota')
    expect(
      screen.getByLabelText('Will you be tracking income for this Campus?')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Currency')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Dollar Conversion Rate (How Much Is $1 In Currency)')
    ).toBeInTheDocument()
    expect(screen.getByText('Choose a Leader')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add Stream' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Close Down Campus' })
    ).toBeInTheDocument()
  })

  it('opens the "Add Stream" dialog with its translated title and body', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add Stream' }))

    const dialog = (await screen.findByText('Add A Stream')).closest(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      within(dialog).getByText('Choose a stream to move to this campus')
    ).toBeInTheDocument()
  })

  it('opens the "Close Down Campus" dialog with its translated confirmation and cancel control', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Close Down Campus' }))

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      await within(dialog).findByText(
        'Are you sure you want to close down this campus?'
      )
    ).toBeInTheDocument()
    expect(within(dialog).getByText('No, take me back')).toBeInTheDocument()
  })

  it('re-renders the heading, labels, Select labels, and trigger buttons in French', async () => {
    renderForm()

    await i18n.changeLanguage('fr')

    expect(
      await screen.findByRole('heading', { name: 'Achimota Campus' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nom du campus')).toHaveValue('Achimota')
    expect(
      screen.getByLabelText('Allez-vous suivre les revenus de ce campus ?')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Devise')).toBeInTheDocument()
    expect(
      screen.getByLabelText(
        'Taux de conversion en dollars (combien vaut 1 $ dans cette devise)'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Choisir un responsable')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ajouter une filière' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Fermer le campus' })
    ).toBeInTheDocument()
  })

  it('opens the French-translated "Close Down Campus" dialog', async () => {
    renderForm()
    await i18n.changeLanguage('fr')

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: 'Fermer le campus' })
    )

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(
      await within(dialog).findByText(
        'Êtes-vous sûr de vouloir fermer ce campus ?'
      )
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('Non, retour en arrière')
    ).toBeInTheDocument()
  })
})
