/**
 * Tests for the i18n conversion of GovernorshipForm.tsx.
 *
 * Every hardcoded English string in this form moved to
 * `t('directory.governorshipForm.*')` / `t('shared.churchLevel.*')` /
 * `t('directory.common.*')`. No markup, layout, or business logic changed
 * — the "Add Bacenta" and "Close Down Governorship" mutation flows
 * (`MoveBacentaToGovernorship` / `CloseDownGovernorship`) are untouched and
 * are not exercised here; this file only proves the translated strings
 * render (default English + French) and that both dialogs open with their
 * translated titles.
 *
 * Heavy dependencies are mocked/minimal:
 *  - `contexts/AuthContext`'s `useAuth` is mocked to `isAuthenticated: true`
 *    (see `DenominationForm.test.tsx` for why: `HeadingPrimary` /
 *    `HeadingSecondary` / `Input`'s `PlaceholderCustom` loading-skeleton
 *    gate, and `RoleView`'s `isAuthorised` guard).
 *  - `MemberContext` supplies `currentUser.roles: ['adminDenomination']` —
 *    a member of every `permitAdmin(churchLevel)` list in
 *    `permission-utils.ts` for every level below Denomination, so the
 *    `RoleView roles={permitAdmin('Council')}`-gated leader search renders
 *    without needing a level-specific role fixture.
 *  - `ChurchContext` supplies `clickCard` + `governorshipId` (read by the
 *    two `useMutation` calls' `refetchQueries`, never invoked here since no
 *    mutation is submitted).
 *  - Only `useMutation` is used at the top level (no `useQuery`), so
 *    `MockedProvider` needs no mocks — nothing fires a network request
 *    within the span of these tests.
 *  - `SearchBacenta` (used inside the "Add Bacenta" dialog) is `cmdk`-based
 *    and needs `ResizeObserver`, which jsdom does not implement — stubbed
 *    in `beforeAll`, matching `UpdateMember.test.tsx`.
 *
 * NOTE (pre-existing, out of scope): the leader field's label never
 * actually associates with its `cmdk` input via `htmlFor`/`id` — see the
 * note in `DenominationForm.test.tsx`. `getByText` is used for that label
 * instead of `getByLabelText`.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import GovernorshipForm, {
  GovernorshipFormValues,
} from './GovernorshipForm'

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

const churchContextValue = { clickCard: vi.fn(), governorshipId: 'gov-1' }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

const initialValues: GovernorshipFormValues = {
  name: 'Kaneshie',
  leaderName: 'Kwame Owusu',
  leaderId: 'leader-1',
  leaderEmail: 'kwame@example.com',
  adminId: '',
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/governorship/update']}>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <GovernorshipForm
              initialValues={initialValues}
              onSubmit={vi.fn()}
              title="Update Governorship Form"
              newGovernorship={false}
            />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('GovernorshipForm i18n', () => {
  it('renders the default English heading, labels, and trigger buttons', () => {
    renderForm()

    expect(
      screen.getByRole('heading', { name: 'Kaneshie Governorship' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name of Governorship')).toHaveValue(
      'Kaneshie'
    )
    expect(screen.getByText('Choose a Leader')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add Bacenta' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Close Down Governorship' })
    ).toBeInTheDocument()
  })

  it('opens the "Add Bacenta" dialog with its translated title, body, and close control', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add Bacenta' }))

    const dialog = (await screen.findByText('Add A Bacenta')).closest(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      within(dialog).getByText('Choose a bacenta to move to this governorship')
    ).toBeInTheDocument()
    // The plain-text "Close" cancel button and Radix's built-in sr-only "Close"
    // label on the X icon button both match "Close" — scope to the footer to
    // disambiguate.
    const footer = dialog.querySelector(
      '[data-slot="dialog-footer"]'
    ) as HTMLElement
    expect(within(footer).getByText('Close')).toBeInTheDocument()
  })

  it('opens the "Close Down Governorship" dialog with its translated confirmation and cancel control', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', { name: 'Close Down Governorship' })
    )

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      await within(dialog).findByText(
        'Are you sure you want to close down this governorship?'
      )
    ).toBeInTheDocument()
    expect(within(dialog).getByText('No, take me back')).toBeInTheDocument()
  })

  it('re-renders the heading, labels, and trigger buttons in French', async () => {
    renderForm()

    await i18n.changeLanguage('fr')

    expect(
      await screen.findByRole('heading', { name: 'Kaneshie Gouvernorat' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nom du gouvernorat')).toHaveValue('Kaneshie')
    expect(screen.getByText('Choisir un responsable')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ajouter un Bacenta' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Fermer le gouvernorat' })
    ).toBeInTheDocument()
  })

  it('opens the French-translated "Add Bacenta" and "Close Down" dialogs', async () => {
    renderForm()
    await i18n.changeLanguage('fr')

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: 'Ajouter un Bacenta' })
    )
    const addDialog = (await screen.findByText('Ajouter un Bacenta', {
      selector: '[data-slot="dialog-title"]',
    })) as HTMLElement
    expect(addDialog).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fermer' }))

    await user.click(screen.getByRole('button', { name: 'Fermer le gouvernorat' }))
    const closeDialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(
      await within(closeDialog).findByText(
        'Êtes-vous sûr de vouloir fermer ce gouvernorat ?'
      )
    ).toBeInTheDocument()
    expect(
      within(closeDialog).getByText('Non, retour en arrière')
    ).toBeInTheDocument()
  })
})
