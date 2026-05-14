/**
 * Characterization tests for ServiceForm.tsx (SYN-80 — W1 weekly service recording).
 *
 * Strategy:
 * - `SearchMember` fires a GraphQL lazy query on every keystroke. Rather than
 *   providing MockedProvider mocks for every interaction, the entire module is
 *   replaced with a thin controlled stub that calls `setFieldValue` directly.
 *   This keeps tests focused on ServiceForm logic, not SearchMember internals.
 * - `ImageUpload` fires a mutation to generate a presigned URL and then calls
 *   Cloudinary/S3. The module is replaced with a stub that calls `setFieldValue`
 *   with a predictable URL string, simulating a completed upload.
 * - `throwToSentry` is mocked so assertions on the error path don't require
 *   Sentry to be configured and don't trigger `window.alert` in jsdom.
 * - `useAuth` from `contexts/AuthContext` is mocked because the `Input`
 *   component calls it to decide whether to render a loading placeholder.
 * - `useNavigate` is mocked so post-submit navigation can be asserted.
 * - The Formik `validateOnMount` prop means the submit button renders as
 *   visually dimmed (opacity-65 class) when the form is invalid, but it is
 *   NOT `disabled`. Formik only disables via `isSubmitting`. Validation errors
 *   are surfaced per-field on submit.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import ServiceForm from './ServiceForm'
import type { Church } from 'global-types'

// ---------------------------------------------------------------------------
// Module-level mocks — declared before any imports that might trigger them
// ---------------------------------------------------------------------------

// useAuth is consumed by the Input wrapper (PlaceholderCustom → Label).
vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

// useNavigate is used in onSubmit to redirect after a successful record.
const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// throwToSentry lives in global-utils. Mock it so Sentry isn't required and
// window.alert doesn't fire in jsdom.
vi.mock('global-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('global-utils')>()
  return {
    ...actual,
    throwToSentry: vi.fn(),
  }
})

// Import mocked throwToSentry so individual tests can assert on it.
import { throwToSentry } from 'global-utils'
const mockThrowToSentry = throwToSentry as ReturnType<typeof vi.fn>

// SearchMember fires a GraphQL lazy query and depends on MemberContext.currentUser.id.
// Replace the whole module with a stub that accepts `setFieldValue` and a `name`
// prop, and exposes a data-testid so tests can set the treasurer value directly.
// The `error` prop is rendered so array-level treasurer errors remain assertable.
vi.mock('components/formik/SearchMember', () => ({
  default: ({
    name,
    setFieldValue,
    placeholder,
    error,
  }: {
    name: string
    setFieldValue: (field: string, value: string, shouldValidate?: boolean) => void
    placeholder?: string
    error?: string
  }) => (
    <div>
      <input
        data-testid={`search-member-${name}`}
        placeholder={placeholder ?? 'Start typing'}
        onChange={(e) => {
          setFieldValue('leaderEmail', '', false)
          setFieldValue(name, e.target.value)
        }}
      />
      {error && (
        <small role="alert" className="error">
          {error}
        </small>
      )}
    </div>
  ),
}))

// ImageUpload calls S3 and Cloudinary. Replace with a stub that sets the
// Formik field to a predictable URL when a file is "chosen". The stub also
// renders the Formik ErrorMessage for the field so validation errors are
// assertable after submit (the real component uses the same mechanism).
vi.mock('components/formik/ImageUpload', async () => {
  const { ErrorMessage } = await import('formik')
  return {
    default: ({
      name,
      setFieldValue,
      placeholder,
    }: {
      name: string
      setFieldValue: (field: string, value: string) => void
      placeholder?: string
    }) => (
      <div>
        <button
          type="button"
          data-testid={`image-upload-${name}`}
          onClick={() => setFieldValue(name, `https://example.com/${name}.jpg`)}
        >
          {placeholder ?? 'Choose'}
        </button>
        <ErrorMessage
          name={name}
          render={(msg: string) => (
            <small role="alert" className="error">
              {msg}
            </small>
          )}
        />
      </div>
    ),
  }
})

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

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

const stubMemberContextValue = {
  currentUser: {
    id: 'user-1',
    roles: ['leaderBacenta'] as const,
    currency: 'GHS',
  },
}

const stubChurchContextValue = {
  clickCard: vi.fn(),
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderServiceForm(
  RecordServiceMutation = vi.fn(),
  churchType: 'Bacenta' | 'Council' = 'Bacenta'
) {
  return render(
    <MemoryRouter initialEntries={['/bacenta/record-service']}>
      <MockedProvider mocks={[]} addTypename={false}>
        <ChurchContext.Provider value={stubChurchContextValue}>
          <MemberContext.Provider value={stubMemberContextValue}>
            <ServiceForm
              church={stubChurch}
              churchId="church-1"
              churchType={churchType}
              RecordServiceMutation={RecordServiceMutation}
            />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fill the form to a fully-valid state.
 * Uses today's date which is guaranteed to pass the "this week" validation
 * because ServiceForm sets `initialValues.serviceDate` to today.
 */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  // serviceDate is already pre-filled with today — leave it.

  // Attendance
  await user.clear(screen.getByLabelText(/attendance/i))
  await user.type(screen.getByLabelText(/attendance/i), '50')

  // Income (label is dynamic: "Income (in GHS)")
  const incomeInput = screen.getByLabelText(/income/i)
  await user.clear(incomeInput)
  await user.type(incomeInput, '100')

  // Number of Tithers
  await user.clear(screen.getByLabelText(/number of tithers/i))
  await user.type(screen.getByLabelText(/number of tithers/i), '10')

  // Treasurer 1 — fill first slot via the SearchMember stub
  const treasurer0 = screen.getByTestId('search-member-treasurers[0]')
  await user.clear(treasurer0)
  await user.type(treasurer0, 'member-id-1')

  // Add a second treasurer slot by clicking the + button on the first row
  const plusButtons = screen.getAllByRole('button', { name: /^$/i }).filter(
    // The + button has no text — filter by its position (first occurrence in treasurer section)
    (btn) => btn.querySelector('svg') !== null && btn.getAttribute('type') === 'button'
  )
  // Click the first + button to add a second treasurer slot
  await user.click(plusButtons[0])

  // Fill second slot
  const treasurer1 = screen.getByTestId('search-member-treasurers[1]')
  await user.clear(treasurer1)
  await user.type(treasurer1, 'member-id-2')

  // Treasurer selfie
  await user.click(screen.getByTestId('image-upload-treasurerSelfie'))

  // Family picture
  await user.click(screen.getByTestId('image-upload-familyPicture'))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ServiceForm', () => {
  afterEach(cleanup)
  beforeEach(() => {
    mockNavigate.mockReset()
    mockThrowToSentry.mockReset()
    stubChurchContextValue.clickCard.mockReset()
  })

  // ---- Case 1: Required-field validation ------------------------------------
  it('shows field-level validation errors when submitting an empty form; mutation is not called', async () => {
    const mutation = vi.fn()
    renderServiceForm(mutation)
    const user = userEvent.setup()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    // Formik surfaces errors per-field after submit attempt
    await waitFor(() => {
      expect(
        screen.getByText(/you cannot submit this form without entering your income/i)
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(/you cannot submit this form without entering your attendance/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/you cannot submit this form without entering your number of tithers/i)
    ).toBeInTheDocument()
    // TODO(refactor): The "You must have at least two treasurers" (array-level) error
    // is silently suppressed by Formik's yupToFormErrors deduplication logic:
    // when both a treasurers[0] item error and the treasurers array-level min(2) error
    // are present, Formik sets errors.treasurers = {0: '...'} (from the item error
    // first), then skips the array-level error because the path is already occupied.
    // The per-item error "Please pick a name from the dropdown" is what surfaces
    // instead, as a rendered [object Object] because the errors object is passed
    // directly as the error prop. This is a display bug — users see the wrong message.
    // The array-level min(2) error message never appears in the DOM in this state.
    expect(
      screen.getByText(/you must take a treasurers selfie/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/please submit a picture of your service/i)
    ).toBeInTheDocument()

    expect(mutation).not.toHaveBeenCalled()
  })

  // ---- Case 2: Negative income rejects -------------------------------------
  it('shows a validation error for negative cediIncome; mutation is not called', async () => {
    const mutation = vi.fn()
    renderServiceForm(mutation)
    const user = userEvent.setup()

    const incomeInput = screen.getByLabelText(/income/i)
    await user.clear(incomeInput)
    await user.type(incomeInput, '-10')
    // Tab away to trigger blur validation
    await user.tab()

    await waitFor(() => {
      expect(
        screen.getByText(/you cannot have negative income/i)
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mutation).not.toHaveBeenCalled()
    })
  })

  // ---- Case 3: Happy path — mutation called with correct variables ----------
  it('calls RecordServiceMutation with correct variables on a fully-valid form', async () => {
    const mutation = vi.fn().mockResolvedValue({
      data: { RecordService: { id: 'sr-1', __typename: 'ServiceRecord' } },
    })
    renderServiceForm(mutation)
    const user = userEvent.setup()

    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mutation).toHaveBeenCalledTimes(1)
    })

    const [callArg] = mutation.mock.calls[0]
    expect(callArg.variables).toMatchObject({
      churchId: 'church-1',
      attendance: 50,
      income: 100,
      numberOfTithers: 10,
      treasurerSelfie: 'https://example.com/treasurerSelfie.jpg',
      familyPicture: 'https://example.com/familyPicture.jpg',
    })
    // treasurers array must contain the two stub IDs
    expect(callArg.variables.treasurers).toContain('member-id-1')
    expect(callArg.variables.treasurers).toContain('member-id-2')
    // foreignCurrency: empty string in the form → parseForeignCurrency('') → null
    // NOTE(TODO refactor): parseForeignCurrency returns null for empty string (line 578
    // of global-utils.ts: empty string is in nonOptions). The variable sent is `null`.
    expect(callArg.variables.foreignCurrency).toBeNull()
  })

  // ---- Case 4: Happy path — navigates after successful submit ---------------
  it('navigates to /council/service-details after successful mutation (churchType = Council)', async () => {
    const mutation = vi.fn().mockResolvedValue({
      data: { RecordService: { id: 'sr-1', __typename: 'ServiceRecord' } },
    })
    renderServiceForm(mutation, 'Council')
    const user = userEvent.setup()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/council/service-details')
    })
  })

  // ---- Case 5: Mutation error — res.errors non-empty -----------------------
  it('calls throwToSentry when mutation returns non-empty res.errors', async () => {
    const mutation = vi.fn().mockResolvedValue({
      errors: [{ message: 'Service already recorded for this week' }],
    })
    renderServiceForm(mutation)
    const user = userEvent.setup()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockThrowToSentry).toHaveBeenCalled()
    })

    // Navigation must NOT happen on error
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  // ---- Case 6: Mutation throws -----------------------------------------------
  it('calls throwToSentry when the mutation promise rejects', async () => {
    const mutation = vi.fn().mockRejectedValue(new Error('Network error'))
    renderServiceForm(mutation)
    const user = userEvent.setup()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockThrowToSentry).toHaveBeenCalled()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  // ---- Case 7: Idempotent submit — isSubmitting disables button -------------
  it('disables the submit button while a mutation is in-flight (isSubmitting guard)', async () => {
    // Return a promise that never resolves so we can inspect the in-flight state.
    let resolvePromise!: () => void
    const mutation = vi.fn(
      () =>
        new Promise<{ data: null }>((resolve) => {
          resolvePromise = () => resolve({ data: null })
        })
    )
    renderServiceForm(mutation)
    const user = userEvent.setup()

    await fillValidForm(user)

    const submitBtn = screen.getByRole('button', { name: /submit/i })

    // Click submit — the mutation is now in-flight
    await user.click(submitBtn)

    await waitFor(() => {
      // SubmitButton sets disabled={formik.isSubmitting}
      expect(submitBtn).toBeDisabled()
    })

    // The mutation should have been called exactly once
    expect(mutation).toHaveBeenCalledTimes(1)

    // Clicking again while disabled must not fire a second call
    await user.click(submitBtn)
    expect(mutation).toHaveBeenCalledTimes(1)

    // Clean up — resolve the in-flight promise
    await act(async () => resolvePromise())
  })

  // ---- Case 8: Duplicate treasurer guard ------------------------------------
  it('calls throwToSentry and does NOT call mutation when the same member is in both treasurer slots', async () => {
    const mutation = vi.fn()
    renderServiceForm(mutation)
    const user = userEvent.setup()

    // Fill everything valid but use the SAME id in both treasurer slots
    const incomeInput = screen.getByLabelText(/income/i)
    await user.clear(incomeInput)
    await user.type(incomeInput, '100')

    await user.clear(screen.getByLabelText(/attendance/i))
    await user.type(screen.getByLabelText(/attendance/i), '50')

    await user.clear(screen.getByLabelText(/number of tithers/i))
    await user.type(screen.getByLabelText(/number of tithers/i), '10')

    // Treasurer slot 0 — same id as slot 1
    await user.type(
      screen.getByTestId('search-member-treasurers[0]'),
      'duplicate-id'
    )

    // Add second slot
    const plusButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('type') === 'button' && !btn.textContent?.trim())
    await user.click(plusButtons[0])

    // Treasurer slot 1 — same id
    await user.type(
      screen.getByTestId('search-member-treasurers[1]'),
      'duplicate-id'
    )

    // Upload photos
    await user.click(screen.getByTestId('image-upload-treasurerSelfie'))
    await user.click(screen.getByTestId('image-upload-familyPicture'))

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockThrowToSentry).toHaveBeenCalledWith(
        'You cannot choose the same treasurer twice!'
      )
    })

    expect(mutation).not.toHaveBeenCalled()
  })

  // ---- Case 9: Church name appears in the form heading ---------------------
  it('renders the church name in the page heading', () => {
    renderServiceForm()
    expect(screen.getByText('Test Bacenta')).toBeInTheDocument()
  })

  // ---- Case 10: Event label appears when provided --------------------------
  it('renders the event label when the event prop is given', () => {
    const mutation = vi.fn()
    render(
      <MemoryRouter initialEntries={['/bacenta/record-service']}>
        <MockedProvider mocks={[]} addTypename={false}>
          <ChurchContext.Provider value={stubChurchContextValue}>
            <MemberContext.Provider value={stubMemberContextValue}>
              <ServiceForm
                church={stubChurch}
                churchId="church-1"
                churchType="Bacenta"
                event="Rehearsal"
                RecordServiceMutation={mutation}
              />
            </MemberContext.Provider>
          </ChurchContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('Rehearsal')).toBeInTheDocument()
  })
})
