/**
 * SYN-227 — MemberDeleteDialog must not report success for a rejected delete.
 *
 * The Apollo client runs mutations under errorPolicy: 'all' (SYN-178), so a
 * server refusal — "This member has active roles in church…" — resolves with
 * `.errors` rather than throwing. The dialog used to ignore that, toast
 * "Member has been deleted successfully" and navigate away while the member
 * stayed active. These cases pin both branches of the `.errors` check, plus
 * the CALLER_HANDLES_ERRORS_CONTEXT opt-out that stops the generic global
 * toast from doubling up on the dialog's own message.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import { CALLER_HANDLES_ERRORS_CONTEXT } from 'lib/createApolloClient'
import MemberDeleteDialog from './MemberDeleteDialog'

const {
  mutate,
  useMutationSpy,
  displayError,
  alertSuccess,
  navigate,
  throwToSentry,
} = vi.hoisted(() => ({
  mutate: vi.fn(),
  useMutationSpy: vi.fn(),
  displayError: vi.fn(),
  alertSuccess: vi.fn(),
  navigate: vi.fn(),
  throwToSentry: vi.fn(),
}))

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useMutation: (...args: unknown[]) => {
      useMutationSpy(...args)
      return [mutate, { loading: false }]
    },
  }
})

vi.mock('utils/errorHandler', () => ({ displayError }))

vi.mock('global-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('global-utils')>()
  return { ...actual, alertSuccess, throwToSentry }
})

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => navigate }
})

const ACTIVE_ROLES_MESSAGE =
  'This member has active roles in church. Please remove all active roles and try again'

const onClose = vi.fn()
const clickCard = vi.fn()

const renderDialog = () =>
  render(
    <MemoryRouter>
      <MemberContext.Provider value={{ memberId: 'm1' } as never}>
        <ChurchContext.Provider value={{ clickCard } as never}>
          <MemberDeleteDialog
            open
            onClose={onClose}
            memberFirstName="Test"
            memberLastName="Member"
            bacentaId="b1"
          />
        </ChurchContext.Provider>
      </MemberContext.Provider>
    </MemoryRouter>
  )

const fillAndSubmit = async () => {
  const user = userEvent.setup()
  await user.click(screen.getByText('Moved Cities'))
  await user.type(screen.getByLabelText(/Additional details/), 'relocated')
  await user.click(screen.getByRole('button', { name: 'Delete Member' }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('MemberDeleteDialog — SYN-227', () => {
  it('SYN-227: opts out of the global error toast', () => {
    renderDialog()

    expect(useMutationSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ context: CALLER_HANDLES_ERRORS_CONTEXT })
    )
  })

  it('SYN-227: a rejected delete shows the server reason and stays put', async () => {
    mutate.mockResolvedValue({
      data: { MakeMemberInactive: null },
      errors: [
        {
          message: ACTIVE_ROLES_MESSAGE,
          extensions: { code: 'BAD_USER_INPUT' },
        },
      ],
    })
    renderDialog()

    await fillAndSubmit()

    await waitFor(() =>
      expect(displayError).toHaveBeenCalledWith(
        'Cannot delete member',
        expect.objectContaining({ message: ACTIVE_ROLES_MESSAGE })
      )
    )
    expect(alertSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(clickCard).not.toHaveBeenCalled()
    // The submit button is re-enabled so the user can cancel or retry.
    expect(screen.getByRole('button', { name: 'Delete Member' })).toBeEnabled()
  })

  it('SYN-227: an internal error shows generic copy with the errorRef, never the raw message', async () => {
    mutate.mockResolvedValue({
      data: { MakeMemberInactive: null },
      errors: [
        {
          message: 'Neo.ClientError.Statement.SyntaxError: internal detail',
          extensions: { code: 'INTERNAL_SERVER_ERROR', errorRef: 'ABCD1234' },
        },
      ],
    })
    renderDialog()

    await fillAndSubmit()

    await waitFor(() => expect(displayError).toHaveBeenCalledTimes(1))
    const [, shown] = displayError.mock.calls[0]
    expect(shown.message).toContain('ABCD1234')
    expect(shown.message).not.toContain('Neo.ClientError')
    expect(alertSuccess).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('SYN-227: a successful delete still closes, confirms and navigates to the bacenta', async () => {
    mutate.mockResolvedValue({ data: { MakeMemberInactive: { id: 'm1' } } })
    renderDialog()

    await fillAndSubmit()

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/bacenta/displaydetails')
    )
    expect(mutate).toHaveBeenCalledWith({
      variables: expect.objectContaining({ memberId: 'm1' }),
    })
    expect(onClose).toHaveBeenCalled()
    expect(alertSuccess).toHaveBeenCalledWith(
      'Member has been deleted successfully'
    )
    expect(clickCard).toHaveBeenCalledWith({ __typename: 'Bacenta', id: 'b1' })
    expect(displayError).not.toHaveBeenCalled()
  })

  it('SYN-227: a thrown (network) failure still goes to throwToSentry, not success', async () => {
    mutate.mockRejectedValue(new Error('Failed to fetch'))
    renderDialog()

    await fillAndSubmit()

    await waitFor(() => expect(throwToSentry).toHaveBeenCalled())
    expect(alertSuccess).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
