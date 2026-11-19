/**
 * SYN-233 — CloseDownBacentaButton must not send CloseDownBacenta for a
 * bacenta that still has members. The server rejects that mutation, and every
 * attempt used to land in the error log as INTERNAL_SERVER_ERROR. The dialog
 * now explains the fix (transfer the members) and offers an in-app link to
 * the member list instead of the confirm button.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { CALLER_HANDLES_ERRORS_CONTEXT } from 'lib/createApolloClient'
import { displayError } from 'utils/errorHandler'
import { throwToSentry } from 'global-utils'
import CloseDownBacentaButton from './CloseDownBacentaButton'

const closeDown = vi.fn()
const navigate = vi.fn()

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useMutation: () => [closeDown, { loading: false }],
  }
})

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigate }
})

vi.mock('global-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('global-utils')>()
  return { ...actual, throwToSentry: vi.fn() }
})

vi.mock('utils/errorHandler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('utils/errorHandler')>()
  return { ...actual, displayError: vi.fn() }
})

const clickCard = vi.fn()

const renderButton = (memberCount?: number) =>
  render(
    <MemoryRouter>
      <ChurchContext.Provider
        value={{ clickCard, governorshipId: 'gov-1' } as never}
      >
        <CloseDownBacentaButton
          bacentaId="b1"
          bacentaName="Adenta"
          leaderId="m1"
          memberCount={memberCount}
        />
      </ChurchContext.Provider>
    </MemoryRouter>
  )

const openDialog = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Close Down Adenta' }))

beforeEach(() => {
  closeDown.mockResolvedValue({ data: { CloseDownBacenta: { id: 'gov-1' } } })
})

afterEach(async () => {
  cleanup()
  vi.clearAllMocks()
  await i18n.changeLanguage('en')
})

describe('CloseDownBacentaButton — SYN-233 member guard', () => {
  it('SYN-233: explains the transfer and hides the confirm button when the bacenta has members', () => {
    renderButton(7)
    openDialog()

    expect(
      screen.getByText(
        'Adenta still has 7 members. Transfer all of them to another bacenta before closing it down.'
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: "Yes, I'm sure" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'View members' })
    ).toHaveAttribute('href', '/bacenta/members')
    expect(
      screen.getByRole('button', { name: 'No, take me back' })
    ).toBeInTheDocument()
    expect(closeDown).not.toHaveBeenCalled()
  })

  it('SYN-233: translates the member-guard message', async () => {
    await i18n.changeLanguage('fr')
    renderButton(2)
    fireEvent.click(screen.getByRole('button', { name: 'Fermer Adenta' }))

    expect(
      screen.getByText(
        'Adenta compte encore 2 membres. Transférez-les tous vers une autre bacenta avant de la fermer.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Voir les membres' })
    ).toBeInTheDocument()
  })

  it('SYN-233: an empty bacenta (memberCount 0) still confirms and closes down', async () => {
    renderButton(0)
    openDialog()

    expect(
      screen.queryByRole('link', { name: 'View members' })
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: "Yes, I'm sure" }))

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/bacenta/displayall')
    )
    expect(closeDown).toHaveBeenCalledWith({
      variables: { id: 'b1', leaderId: 'm1' },
      context: CALLER_HANDLES_ERRORS_CONTEXT,
    })
    expect(clickCard).toHaveBeenCalledWith({ id: 'gov-1' })
  })

  it('SYN-233: an omitted memberCount defaults to the confirm path', () => {
    renderButton()
    openDialog()

    expect(
      screen.getByRole('button', { name: "Yes, I'm sure" })
    ).toBeInTheDocument()
  })

  it('SYN-233: uses the singular form for one member', () => {
    renderButton(1)
    openDialog()

    expect(
      screen.getByText(
        'Adenta still has 1 member. Transfer them to another bacenta before closing it down.'
      )
    ).toBeInTheDocument()
  })

  it('SYN-233: a BAD_USER_INPUT rejection is shown once through displayError, not reported to Sentry', async () => {
    const rejection = {
      message:
        'Adenta Bacenta has 3 members. Please transfer all members and try again.',
      extensions: { code: 'BAD_USER_INPUT' },
    }
    closeDown.mockResolvedValueOnce({ data: null, errors: [rejection] })
    renderButton(0)
    openDialog()
    fireEvent.click(screen.getByRole('button', { name: "Yes, I'm sure" }))

    await vi.waitFor(() =>
      expect(displayError).toHaveBeenCalledWith(
        'Unable to close down bacenta',
        rejection
      )
    )
    expect(closeDown.mock.calls[0][0].context).toBe(
      CALLER_HANDLES_ERRORS_CONTEXT
    )
    expect(throwToSentry).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('SYN-233: an unexpected server fault is still reported through throwToSentry', async () => {
    const fault = {
      message: 'Error closing down bacenta: Neo4j unavailable',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    }
    closeDown.mockResolvedValueOnce({ data: null, errors: [fault] })
    renderButton(0)
    openDialog()
    fireEvent.click(screen.getByRole('button', { name: "Yes, I'm sure" }))

    await vi.waitFor(() => expect(displayError).toHaveBeenCalled())
    expect(throwToSentry).toHaveBeenCalledWith(
      'There was an error closing down this bacenta',
      fault
    )
  })
})
