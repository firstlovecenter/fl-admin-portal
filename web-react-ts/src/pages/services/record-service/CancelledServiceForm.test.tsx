/**
 * Characterization tests for CancelledServiceForm i18n surface.
 * Ensures English default strings still render after useTranslation wiring.
 *
 * Since PR #669 the page-level button is "Review & Submit": it opens a
 * confirmation dialog, and the mutation fires from the dialog's own Submit
 * button. The old "Submit Cancellation" label is no longer rendered (SYN-291).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { ChurchContext } from 'contexts/ChurchContext'
import 'lib/i18n'
import CancelledServiceForm from './CancelledServiceForm'
import { RECORD_CANCELLED_SERVICE } from './RecordServiceMutations'
import type { Church } from 'global-types'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const stubChurch: Church = {
  id: 'church-1',
  name: 'Test Bacenta',
  __typename: 'Bacenta',
  leader: {
    __typename: 'Member',
    id: 'leader-1',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    pictureUrl: '',
    currentTitle: 'Pastor',
    nameWithTitle: 'Pastor John Doe',
    phoneNumber: '',
    whatsappNumber: '',
    middleName: undefined,
  },
  memberCount: 10,
  members: [],
  history: [],
}

const clickCard = vi.fn()

function renderForm(mocks: MockedResponse[] = []) {
  return render(
    <MemoryRouter>
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChurchContext.Provider value={{ clickCard }}>
          <CancelledServiceForm
            church={stubChurch}
            churchId="church-1"
            churchType="bacenta"
          />
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('CancelledServiceForm', () => {
  afterEach(cleanup)
  beforeEach(() => {
    mockNavigate.mockReset()
    clickCard.mockReset()
  })

  it('renders cancelled-service heading and form labels in English', async () => {
    renderForm()

    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.getByText('Service')).toBeInTheDocument()
    expect(screen.getByText('Cancellation Details')).toBeInTheDocument()
    expect(screen.getByLabelText(/date of service/i)).toBeInTheDocument()
    expect(
      screen.getByLabelText(/reason for cancellation/i)
    ).toBeInTheDocument()
    expect(screen.getByText('No Service This Week')).toBeInTheDocument()

    // The submit control is now the review trigger, then the dialog's Submit.
    const user = userEvent.setup()
    await user.type(
      screen.getByLabelText(/reason for cancellation/i),
      'Joint service with Council'
    )
    await user.click(screen.getByRole('button', { name: /review & submit/i }))
    const dialog = await screen.findByRole('dialog', {
      name: /review cancellation/i,
    })
    expect(
      within(dialog).getByText('Review the details below before submitting.')
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: /^submit$/i })
    ).toBeInTheDocument()
  })

  it('keeps "Review & Submit" disabled until a reason is given', async () => {
    renderForm()
    const reviewBtn = screen.getByRole('button', { name: /review & submit/i })
    const user = userEvent.setup()

    // Touch the reason field so Formik validates and marks the form invalid.
    await user.click(screen.getByLabelText(/reason for cancellation/i))
    await user.tab()

    await waitFor(() => expect(reviewBtn).toBeDisabled())
    expect(await screen.findByText('You must give a reason')).toBeInTheDocument()
    await user.click(reviewBtn)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('records the cancellation and navigates once the dialog Submit is clicked', async () => {
    const serviceDate = new Date().toISOString().slice(0, 10)
    const result = {
      id: 'sr-1',
      serviceLog: {
        id: 'log-1',
        bacenta: { id: 'church-1', services: [{ id: 'sr-1' }] },
      },
    }
    const mutationResult = vi.fn(() => ({
      data: { RecordCancelledService: result },
    }))
    renderForm([
      {
        request: {
          query: RECORD_CANCELLED_SERVICE,
          variables: {
            churchId: 'church-1',
            serviceDate,
            noServiceReason: 'Joint service with Council',
          },
        },
        result: mutationResult,
      },
    ])
    const user = userEvent.setup()

    await user.type(
      screen.getByLabelText(/reason for cancellation/i),
      'Joint service with Council'
    )
    await user.click(screen.getByRole('button', { name: /review & submit/i }))
    const dialog = await screen.findByRole('dialog', {
      name: /review cancellation/i,
    })
    // The dialog previews exactly what will be sent.
    expect(
      within(dialog).getByText('Joint service with Council')
    ).toBeInTheDocument()
    expect(within(dialog).getByText(serviceDate)).toBeInTheDocument()

    // Opening the dialog alone must not record anything.
    expect(mutationResult).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: /^submit$/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/bacenta/service-details')
    })
    expect(mutationResult).toHaveBeenCalledTimes(1)
    expect(clickCard).toHaveBeenCalledWith(result)
  })
})
