/**
 * Tests for the i18n conversion of StreamForm.tsx.
 *
 * Same shape/scope as `GovernorshipForm.test.tsx` / `CouncilForm.test.tsx`,
 * plus three extra `Select` fields (Meeting Day, Vacation Status, Stream
 * Account) whose *option lists* (`STREAM_SERVICE_DAY_OPTIONS`,
 * `VACATION_OPTIONS`, `STREAM_ACCOUNT_OPTIONS` from `global-utils.ts`) are
 * deliberately NOT translated in this pass — shared across dozens of
 * unrelated pages, out of scope. Only the `label`/`defaultOption` props
 * moved to `t()`. This file asserts those two Select labels/defaults, not
 * the (untranslated) option text.
 *
 * The "Add Council" / "Close Down Stream" mutation flows
 * (`MoveCouncilToStream` / `CloseDownStream`) are untouched and not
 * exercised here. See `GovernorshipForm.test.tsx` for the shared mocking
 * rationale.
 *
 * NOTE (pre-existing, out of scope, found while writing this file):
 * `StreamForm`'s "Close Down Stream" success handler navigates to
 * `/council/displayall` (line ~312 of `StreamForm.tsx`) rather than
 * `/stream/displayall` — looks like a copy/paste artifact from
 * `CouncilForm.tsx`, unrelated to the i18n change (untouched business
 * logic). Not exercised or asserted here (would require driving the full
 * mutation through `MockedProvider`, out of scope per the task); flagged
 * to the user instead of silently fixed.
 *
 * NOTE (pre-existing, out of scope): the "Close Down Stream" dialog's
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
import StreamForm, { StreamFormValues } from './StreamForm'

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

const churchContextValue = { clickCard: vi.fn(), streamId: 'stream-1' }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

const initialValues: StreamFormValues = {
  name: 'Sunyani',
  leaderName: 'Kwame Owusu',
  leaderId: 'leader-1',
  leaderEmail: 'kwame@example.com',
  adminId: '',
  bankAccount: 'manual',
  meetingDay: 'Sunday',
  vacationStatus: 'Active',
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/stream/update']}>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <StreamForm
              initialValues={initialValues}
              onSubmit={vi.fn()}
              title="Update Stream Form"
              newStream={false}
            />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('StreamForm i18n', () => {
  it('renders the default English heading, labels, Select labels, and trigger buttons', () => {
    renderForm()

    expect(
      screen.getByRole('heading', { name: 'Sunyani Stream' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name of Stream')).toHaveValue('Sunyani')
    expect(screen.getByLabelText('Meeting Day')).toBeInTheDocument()
    expect(screen.getByLabelText('Vacation Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Stream Account')).toBeInTheDocument()
    expect(screen.getByText('Choose a Leader')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add Council' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Close Down Stream' })
    ).toBeInTheDocument()
  })

  it('opens the "Add Council" dialog with its translated title and body', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add Council' }))

    const dialog = (await screen.findByText('Add A Council')).closest(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      within(dialog).getByText('Choose a council to move to this stream')
    ).toBeInTheDocument()
  })

  it('opens the "Close Down Stream" dialog with its translated confirmation and cancel control', async () => {
    renderForm()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Close Down Stream' }))

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(dialog).not.toBeNull()
    expect(
      await within(dialog).findByText(
        'Are you sure you want to close down this stream?'
      )
    ).toBeInTheDocument()
    expect(within(dialog).getByText('No, take me back')).toBeInTheDocument()
  })

  it('re-renders the heading, labels, Select labels, and trigger buttons in French', async () => {
    renderForm()

    await i18n.changeLanguage('fr')

    expect(
      await screen.findByRole('heading', { name: 'Sunyani Filière' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nom de la filière')).toHaveValue('Sunyani')
    expect(screen.getByLabelText('Jour de réunion')).toBeInTheDocument()
    expect(screen.getByLabelText('Statut de vacances')).toBeInTheDocument()
    expect(screen.getByLabelText('Compte de la filière')).toBeInTheDocument()
    expect(screen.getByText('Choisir un responsable')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ajouter un conseil' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Fermer la filière' })
    ).toBeInTheDocument()
  })

  it('opens the French-translated "Close Down Stream" dialog', async () => {
    renderForm()
    await i18n.changeLanguage('fr')

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: 'Fermer la filière' })
    )

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement
    expect(
      await within(dialog).findByText(
        'Êtes-vous sûr de vouloir fermer cette filière ?'
      )
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('Non, retour en arrière')
    ).toBeInTheDocument()
  })
})
