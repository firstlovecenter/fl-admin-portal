/**
 * TransferMemberSheet.test.tsx
 *
 * Covers:
 *  - does not render sheet content when open=false
 *  - renders SearchBacenta and Transfer button when open=true
 *  - Transfer button is disabled before a bacenta is selected (Formik initialValues has bacenta=null)
 *  - Transfer button is enabled after a bacenta is selected
 *  - calls UPDATE_MEMBER_BACENTA with the correct variables on submit
 *  - calls onClose after successful submission
 *
 * SearchBacenta brings in MemberContext and five Apollo lazy queries. It is
 * mocked to a minimal stub that exposes a "Select Bacenta" button — clicking
 * it calls setFieldValue with a known fixture value so the Formik state is
 * updated without any GraphQL machinery.
 */
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockedProvider } from '@apollo/client/testing'
import { UPDATE_MEMBER_BACENTA } from 'pages/directory/update/UpdateMutations'
import TransferMemberSheet from './TransferMemberSheet'

// SearchBacenta stub — calls setFieldValue('bacenta', fixture) on click.
vi.mock('components/formik/SearchBacenta', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createElement } = require('react')
  return {
    default: ({
      setFieldValue,
      name,
    }: {
      setFieldValue: (field: string, value: unknown) => void
      name: string
    }) =>
      createElement(
        'button',
        {
          type: 'button',
          'data-testid': 'search-bacenta-stub',
          onClick: () =>
            setFieldValue(name, { id: 'bacenta-999', name: 'Grace Bacenta' }),
        },
        'Select Bacenta'
      ),
  }
})

// Mock sonner so toast.error from displayError doesn't cause side-effects.
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}))

afterEach(cleanup)

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MEMBER_ID = 'member-1'
const BACENTA_ID = 'bacenta-999'
const CURRENT_BACENTA_ID = 'current-1'

const DEFAULT_PROPS = {
  open: true,
  onClose: vi.fn(),
  memberId: MEMBER_ID,
  memberName: 'John Doe',
  currentBacentaId: CURRENT_BACENTA_ID,
  currentBacentaName: 'Old Bacenta',
}

// The variables that the component will call the mutation with after the stub
// bacenta is selected.
const MUTATION_VARIABLES = {
  memberId: MEMBER_ID,
  bacentaId: BACENTA_ID,
  ids: [MEMBER_ID, BACENTA_ID, CURRENT_BACENTA_ID],
  historyRecord:
    'John Doe moved from Old Bacenta Bacenta to Grace Bacenta Bacenta',
}

const SUCCESS_MOCK = {
  request: {
    query: UPDATE_MEMBER_BACENTA,
    variables: MUTATION_VARIABLES,
  },
  result: {
    data: {
      UpdateMemberBacenta: {
        id: MEMBER_ID,
        firstName: 'John',
        lastName: 'Doe',
        bacenta: { id: BACENTA_ID, name: 'Grace Bacenta' },
      },
      LogMemberHistory: [
        {
          id: MEMBER_ID,
          firstName: 'John',
          lastName: 'Doe',
          history: [],
        },
      ],
    },
  },
}

function renderSheet(
  props: Partial<typeof DEFAULT_PROPS> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mocks: any[] = []
) {
  const merged = { ...DEFAULT_PROPS, onClose: vi.fn(), ...props }
  return {
    ...render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TransferMemberSheet {...merged} />
      </MockedProvider>
    ),
    onClose: merged.onClose,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TransferMemberSheet', () => {
  it('does not render sheet content when open is false', () => {
    renderSheet({ open: false })
    expect(screen.queryByText('Transfer Member')).toBeNull()
    expect(screen.queryByTestId('search-bacenta-stub')).toBeNull()
  })

  it('renders the sheet title and SearchBacenta stub when open is true', () => {
    renderSheet()
    expect(screen.getByText('Transfer Member')).toBeInTheDocument()
    expect(screen.getByTestId('search-bacenta-stub')).toBeInTheDocument()
  })

  it('displays the current member and bacenta names in the description', () => {
    renderSheet()
    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    expect(screen.getByText(/Old Bacenta/)).toBeInTheDocument()
  })

  it('Transfer button is disabled when no bacenta has been selected', () => {
    renderSheet()
    expect(
      screen.getByRole('button', { name: 'Transfer' })
    ).toBeDisabled()
  })

  it('Transfer button is enabled after the user selects a bacenta', async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByTestId('search-bacenta-stub'))
    expect(
      screen.getByRole('button', { name: 'Transfer' })
    ).not.toBeDisabled()
  })

  it('calls UPDATE_MEMBER_BACENTA with the correct variables and calls onClose on success', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet({}, [SUCCESS_MOCK])
    // 1. Select a bacenta via the stub
    await user.click(screen.getByTestId('search-bacenta-stub'))
    // 2. Submit the form
    await user.click(screen.getByRole('button', { name: 'Transfer' }))
    // 3. The mutation resolves and onClose is called
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('Cancel button calls onClose immediately without submitting', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
