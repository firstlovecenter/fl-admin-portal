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
 *
 * The refusal also names each role in the way (`extensions.activeRoles`); the
 * dialog lists them inline so the admin can see exactly what to hand over.
 * A refusal without that list still falls back to the toast.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import { CALLER_HANDLES_ERRORS_CONTEXT } from 'lib/createApolloClient'
import i18n from 'lib/i18n'
import MemberDeleteDialog, {
  BlockingRole,
  describeBlockingRole,
} from './MemberDeleteDialog'

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

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('MemberDeleteDialog — SYN-227', () => {
  it('SYN-227: opts out of the global error toast', () => {
    renderDialog()

    expect(useMutationSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ context: CALLER_HANDLES_ERRORS_CONTEXT })
    )
  })

  it('SYN-227: a refusal that names no roles shows the server reason and stays put', async () => {
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

const activeRolesRefusal = (activeRoles: unknown[]) => ({
  data: { MakeMemberInactive: null },
  errors: [
    {
      message: ACTIVE_ROLES_MESSAGE,
      extensions: { code: 'BAD_USER_INPUT', activeRoles },
    },
  ],
})

// RTL's findBy* default is 1s; a loaded CI box can need longer after a submit.
const AFTER_SUBMIT = { timeout: 3000 }

const BACENTA_LEADER: BlockingRole = {
  servantType: 'Leader',
  churchType: 'Bacenta',
  churchName: 'Adenta',
}
const GOVERNORSHIP_ADMIN: BlockingRole = {
  servantType: 'Admin',
  churchType: 'Governorship',
  churchName: 'Madina',
}
const STREAM_TELLER: BlockingRole = {
  servantType: 'Teller',
  churchType: 'Stream',
  churchName: 'Gospel Encounter',
}

describe('MemberDeleteDialog — SYN-227 blocking roles', () => {
  it('SYN-227: lists each role the refusal names, inside the dialog', async () => {
    mutate.mockResolvedValue(
      activeRolesRefusal([BACENTA_LEADER, GOVERNORSHIP_ADMIN, STREAM_TELLER])
    )
    renderDialog()

    await fillAndSubmit()

    const alert = await screen.findByRole('alert', {}, AFTER_SUBMIT)
    expect(
      within(alert).getByText('Test Member still holds church roles')
    ).toBeInTheDocument()
    expect(
      within(alert).getByText(
        'Remove each role below, or hand it over to someone else, then try deleting again.'
      )
    ).toBeInTheDocument()

    const items = within(alert).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      'Bacenta LeaderAdenta',
      'Governorship AdminMadina',
      'Stream TellerGospel Encounter',
    ])
  })

  it('SYN-227: the list replaces the toast and the delete does not go through', async () => {
    mutate.mockResolvedValue(activeRolesRefusal([BACENTA_LEADER]))
    renderDialog()

    await fillAndSubmit()

    await screen.findByText('Adenta', {}, AFTER_SUBMIT)
    expect(displayError).not.toHaveBeenCalled()
    expect(alertSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(clickCard).not.toHaveBeenCalled()
    expect(throwToSentry).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Delete Member' })).toBeEnabled()
  })

  it('SYN-227: two roles on the same church are both listed', async () => {
    // A Stream Admin is also that stream's Teller; both must be handed over.
    mutate.mockResolvedValue(
      activeRolesRefusal([
        { ...STREAM_TELLER, servantType: 'Admin' },
        STREAM_TELLER,
      ])
    )
    renderDialog()

    await fillAndSubmit()

    await screen.findByText('Stream Admin', {}, AFTER_SUBMIT)
    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent)
    ).toEqual(['Stream AdminGospel Encounter', 'Stream TellerGospel Encounter'])
  })

  it('SYN-227: a church with no name still lists its role', async () => {
    mutate.mockResolvedValue(
      activeRolesRefusal([{ ...BACENTA_LEADER, churchName: '' }])
    )
    renderDialog()

    await fillAndSubmit()

    const [item] = await screen.findAllByRole('listitem', {}, AFTER_SUBMIT)
    expect(item.textContent).toBe('Bacenta Leader')
  })

  it.each([
    ['an empty list', []],
    [
      'a malformed list',
      [null, { churchType: 'Bacenta', churchName: 'Adenta' }],
    ],
  ])('SYN-227: %s falls back to the toast', async (_case, activeRoles) => {
    mutate.mockResolvedValue(activeRolesRefusal(activeRoles))
    renderDialog()

    await fillAndSubmit()

    await waitFor(() =>
      expect(displayError).toHaveBeenCalledWith(
        'Cannot delete member',
        expect.objectContaining({ message: ACTIVE_ROLES_MESSAGE })
      )
    )
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('SYN-227: two churches with the same name are both listed', async () => {
    mutate.mockResolvedValue(
      activeRolesRefusal([BACENTA_LEADER, { ...BACENTA_LEADER }])
    )
    renderDialog()

    await fillAndSubmit()

    await screen.findAllByText('Adenta', {}, AFTER_SUBMIT)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('SYN-227: scrolls the list into view on a phone-sized dialog', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    mutate.mockResolvedValue(activeRolesRefusal([BACENTA_LEADER]))
    renderDialog()

    await fillAndSubmit()
    await screen.findByText('Adenta', {}, AFTER_SUBMIT)

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    scrollIntoView.mockRestore()
  })

  it('SYN-227: the dialog cannot be dismissed while the delete is in flight', async () => {
    let settle: (value: unknown) => void = () => undefined
    mutate.mockReturnValue(
      new Promise((resolve) => {
        settle = resolve
      })
    )
    renderDialog()
    const user = userEvent.setup()

    await fillAndSubmit()
    await waitFor(() => expect(mutate).toHaveBeenCalled())

    // Escape and the corner X would otherwise close the dialog and let the
    // late refusal below land on a closed one.
    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Close' })
    ).not.toBeInTheDocument()

    settle(activeRolesRefusal([BACENTA_LEADER]))

    expect(
      await screen.findByText('Adenta', {}, AFTER_SUBMIT)
    ).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('SYN-227: Escape after a refusal closes the dialog and clears the list', async () => {
    mutate.mockResolvedValue(activeRolesRefusal([BACENTA_LEADER]))
    renderDialog()

    await fillAndSubmit()
    await screen.findByText('Adenta', {}, AFTER_SUBMIT)

    await userEvent.setup().keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Adenta')).not.toBeInTheDocument()
  })

  it('SYN-227: Cancel clears the list so the next opening starts clean', async () => {
    mutate.mockResolvedValue(activeRolesRefusal([BACENTA_LEADER]))
    renderDialog()

    await fillAndSubmit()
    await screen.findByText('Adenta', {}, AFTER_SUBMIT)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    // onClose is a spy, so the dialog is still open: the list must be gone
    // because the dialog reset it, not because the dialog unmounted.
    expect(screen.queryByText('Adenta')).not.toBeInTheDocument()
  })

  it('SYN-227: a second attempt drops the earlier list before showing its own result', async () => {
    mutate
      .mockResolvedValueOnce(activeRolesRefusal([BACENTA_LEADER]))
      .mockResolvedValueOnce({
        data: { MakeMemberInactive: null },
        errors: [
          {
            message: 'You do not have permission to do this',
            extensions: { code: 'FORBIDDEN' },
          },
        ],
      })
    renderDialog()

    await fillAndSubmit()
    await screen.findByText('Adenta', {}, AFTER_SUBMIT)

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Delete Member' }))

    await waitFor(() => expect(displayError).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('Adenta')).not.toBeInTheDocument()
  })

  it('SYN-227: lists the roles in the selected language', async () => {
    await i18n.changeLanguage('fr')
    mutate.mockResolvedValue(
      activeRolesRefusal([BACENTA_LEADER, STREAM_TELLER])
    )
    renderDialog()

    await fillAndSubmit()

    expect(
      await screen.findByText(
        "Test Member occupe encore des rôles dans l'église",
        {},
        AFTER_SUBMIT
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Responsable de Bacenta')).toBeInTheDocument()
    expect(screen.getByText('Caissier de Filière')).toBeInTheDocument()
  })
})

describe('describeBlockingRole — SYN-227', () => {
  const t = i18n.getFixedT('en')

  it.each([
    ['Leader', 'Bacenta', 'Bacenta Leader'],
    ['Admin', 'Council', 'Council Admin'],
    ['ArrivalsAdmin', 'Campus', 'Campus Arrivals Admin'],
    ['ArrivalsCounter', 'Stream', 'Stream Arrivals Counter'],
    ['Teller', 'Stream', 'Stream Teller'],
  ] as const)(
    'SYN-227: names a %s of a %s as "%s"',
    (servantType, churchType, expected) => {
      expect(
        describeBlockingRole(
          { ...BACENTA_LEADER, servantType, churchType },
          t
        )
      ).toBe(expected)
    }
  )

  it('SYN-227: falls back to the raw servant type the API sends for an unmapped edge', () => {
    expect(
      describeBlockingRole(
        {
          ...BACENTA_LEADER,
          servantType: 'IS_ARRIVALS_PAYER_FOR' as BlockingRole['servantType'],
          churchType: 'Council',
        },
        t
      )
    ).toBe('Council IS_ARRIVALS_PAYER_FOR')
  })

  it('SYN-227: shows the role alone when the church has no level label', () => {
    expect(
      describeBlockingRole({ ...BACENTA_LEADER, churchType: null }, t)
    ).toBe('Leader')
  })
})
