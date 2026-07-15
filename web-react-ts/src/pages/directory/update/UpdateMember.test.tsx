/**
 * UpdateMember.test.tsx — SYN-205
 *
 * Bug: submitting an email-address change on a member's profile silently
 * "succeeded" client-side (form closed, navigated away) even when the
 * backend rejected the write for a duplicate email/whatsapp collision.
 *
 * Root cause: the Apollo Client used by this app is configured with
 * `errorPolicy: 'all'` (see createApolloClient.tsx, SYN-178) so that GraphQL
 * errors are attached to `result.errors` instead of rejecting the mutation
 * promise. `onSubmit` only had a `try/catch` around `await UpdateMember(...)`
 * to detect the collision and route to <MemberCollisionDialog>. Since the
 * promise never rejected, that catch block never ran — the code fell
 * straight through to the "success" path (bacenta/basonta follow-up
 * mutations, resetForm, navigate away) while nothing had actually been
 * saved.
 *
 * Fix: `onSubmit` now inspects `updateResult.errors` explicitly. A
 * collision routes to <MemberCollisionDialog> exactly like the (still
 * present, now effectively a fallback) catch block did before; a
 * non-collision GraphQL error surfaces a toast via displayError and stops
 * before the follow-up mutations/navigation run.
 *
 * These tests render the real <UpdateMember /> against a MockedProvider
 * with `errorPolicy: 'all'` on the mutate default (matching prod config)
 * so they fail against the pre-fix code and pass against the fix.
 */

import React from 'react'
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { toast } from 'sonner'

import UpdateMember from './UpdateMember'
import { UPDATE_MEMBER_MUTATION } from './UpdateMutations'
import {
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
} from '../display/ReadQueries'
import { GET_CAMPUS_BASONTAS } from 'queries/ListQueries'
import { MEMBER_BACENTA_SEARCH } from 'components/formik/SearchBacentaQueries'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'

// Mock sonner so displayError's toast.error calls land on a spy, matching
// the pattern in lib/createApolloClient.test.tsx. vi.mock is hoisted above
// all imports, so import order above doesn't matter.
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// RoleView (rendered by MemberForm for the Add Title / Delete buttons) →
// useAuth (auth/useAuth) → useAuth (contexts/AuthContext). Mock the context
// so isAuthorised gates purely on currentUser.roles, matching the
// ServicesMenu.test.tsx pattern elsewhere in this repo.
vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

const mockNavigate = vi.fn()

// jsdom has no ResizeObserver; the cmdk-powered bacenta search combobox
// (SearchCombobox / SearchBacenta) requires one to mount.
beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).ResizeObserver = ResizeObserverStub
})

afterEach(() => {
  cleanup()
  mockNavigate.mockClear()
  vi.mocked(toast.error).mockClear()
})

const MEMBER_ID = 'member-1'
const BACENTA_ID = 'bacenta-1'
const CAMPUS_ID = 'campus-1'

const memberBioMock = {
  request: { query: DISPLAY_MEMBER_BIO, variables: { id: MEMBER_ID } },
  result: {
    data: {
      members: [
        {
          id: MEMBER_ID,
          firstName: 'Ama',
          middleName: '',
          lastName: 'Mensah',
          fullName: 'Ama Mensah',
          nameWithTitle: 'Ama Mensah',
          currentTitle: null,
          email: 'ama@example.com',
          phoneNumber: '233241111111',
          stickyNote: '',
          pictureUrl: 'https://example.com/pic.jpg',
          visitationArea: 'no-location',
          whatsappNumber: '233241111111',
          dob: { date: '1990-01-01' },
          gender: { gender: 'Female' },
          maritalStatus: { status: 'Single' },
          occupation: { occupation: 'Teacher' },
        },
      ],
    },
  },
}

const memberChurchMock = {
  request: { query: DISPLAY_MEMBER_CHURCH, variables: { id: MEMBER_ID } },
  result: {
    data: {
      members: [
        {
          id: MEMBER_ID,
          bacenta: {
            id: BACENTA_ID,
            name: 'Grace Bacenta',
            leader: { firstName: 'Kofi', lastName: 'Boateng' },
            council: {
              id: 'council-1',
              name: 'Central Council',
              leader: {
                id: 'leader-1',
                firstName: 'Kwame',
                lastName: 'Owusu',
                fullName: 'Kwame Owusu',
              },
            },
          },
          bacentaSummary: { id: BACENTA_ID, name: 'Grace Bacenta' },
          basonta: null,
          history: [],
        },
      ],
    },
  },
}

const basontasMock = {
  request: { query: GET_CAMPUS_BASONTAS, variables: { id: CAMPUS_ID } },
  result: {
    data: {
      campuses: [{ id: CAMPUS_ID, name: 'Main Campus', basontas: [] }],
    },
  },
}

// SearchBacenta debounces (DEBOUNCE_TIMER=500ms) then always fires
// MEMBER_BACENTA_SEARCH for the initial bacenta name value seeded from
// memberChurchMock ('Grace Bacenta'). Match on the query alone (any
// variables) since the exact key/id aren't the point of this test and
// MockedProvider's default requires an exact variables match otherwise.
const memberBacentaSearchMock = {
  request: { query: MEMBER_BACENTA_SEARCH },
  variableMatcher: () => true,
  result: {
    data: {
      members: [
        {
          id: MEMBER_ID,
          bacentaSearch: [
            { id: BACENTA_ID, name: 'Grace Bacenta', governorship: null },
          ],
        },
      ],
    },
  },
}

const collisionUpdateMock = (variables: Record<string, unknown>) => ({
  request: { query: UPDATE_MEMBER_MUTATION, variables },
  result: {
    data: { UpdateMemberDetails: null },
    errors: [
      {
        message: 'This email already belongs to another member',
        extensions: {
          collision: {
            field: 'email',
            status: 'active',
            memberId: 'other-member-1',
            firstName: 'Kofi',
            lastName: 'Asante',
            bacentaName: 'Faith Bacenta',
          },
        },
      },
    ],
  },
})

const genericErrorUpdateMock = (variables: Record<string, unknown>) => ({
  request: { query: UPDATE_MEMBER_MUTATION, variables },
  result: {
    data: { UpdateMemberDetails: null },
    errors: [
      {
        message: 'Something went wrong saving this member',
      },
    ],
  },
})

const successUpdateMock = (variables: Record<string, unknown>) => ({
  request: { query: UPDATE_MEMBER_MUTATION, variables },
  result: {
    data: {
      UpdateMemberDetails: {
        firstName: 'Ama',
        middleName: '',
        lastName: 'Mensah',
        fullName: 'Ama Mensah',
        email: (variables.email as string) ?? 'ama@example.com',
        phoneNumber: '233241111111',
        pictureUrl: 'https://example.com/pic.jpg',
        whatsappNumber: '233241111111',
        dob: { date: '1990-01-01' },
        gender: { gender: 'Female' },
        maritalStatus: { status: 'Single' },
        occupation: { occupation: 'Teacher' },
      },
    },
  },
})

const baseUpdateVariables = (email: string) => ({
  id: MEMBER_ID,
  firstName: 'Ama',
  middleName: '',
  lastName: 'Mensah',
  email,
  gender: 'Female',
  phoneNumber: '233241111111',
  whatsappNumber: '233241111111',
  dob: '1990-01-01',
  maritalStatus: 'Single',
  occupation: 'Teacher',
  pictureUrl: 'https://example.com/pic.jpg',
  bacenta: BACENTA_ID,
})

const renderUpdateMember = (mocks: readonly MockedResponse[]) =>
  render(
    <MemoryRouter initialEntries={['/member/edit']}>
      <MemberContext.Provider
        value={{
          memberId: MEMBER_ID,
          setMemberId: vi.fn(),
          // canChangeUniques() in MemberForm gates the Basic Info/Contact
          // sections (where the email field lives) on
          // isAuthorised(permitAdmin('Governorship'), currentUser.roles).
          currentUser: { id: 'tester-1', roles: ['adminGovernorship'] },
        }}
      >
        <ChurchContext.Provider value={{ campusId: CAMPUS_ID }}>
          <MockedProvider
            mocks={mocks}
            addTypename={false}
            defaultOptions={{
              // Mirrors prod's createApolloClient defaultOptions.mutate:
              // GraphQL errors land in `result.errors`, they do not reject
              // the mutate() promise.
              mutate: { errorPolicy: 'all' },
              watchQuery: { errorPolicy: 'all' },
              query: { errorPolicy: 'all' },
            }}
          >
            <UpdateMember />
          </MockedProvider>
        </ChurchContext.Provider>
      </MemberContext.Provider>
    </MemoryRouter>
  )

// SearchBacenta only writes to Formik's `bacenta` field via the search
// dropdown's onSelect — the initial value only seeds the *display text*,
// not formik.values.bacenta. A real user re-confirms the bacenta by
// picking it from the dropdown; do the same here so submission has a
// valid `bacenta` object regardless of query-resolution timing.
const selectBacentaFromDropdown = async () => {
  const user = userEvent.setup()
  const bacentaInput = await screen.findByPlaceholderText(
    /start typing to search/i
  )
  await user.click(bacentaInput)
  await user.clear(bacentaInput)
  await user.type(bacentaInput, 'Grace')
  const option = await screen.findByText('Grace Bacenta')
  await user.click(option)
}

const submitForm = async () => {
  const user = userEvent.setup()
  const submitButton = await screen.findByRole('button', { name: /save/i })
  await user.click(submitButton)
}

describe('UpdateMember — SYN-205 email-collision handling', () => {
  it('shows the collision dialog (does not navigate away) when the update returns a collision error', async () => {
    const variables = baseUpdateVariables('taken@example.com')

    renderUpdateMember([
      memberBioMock,
      memberChurchMock,
      basontasMock,
      memberBacentaSearchMock,
      collisionUpdateMock(variables),
      // UpdateMember's useMutation always sets refetchQueries for these two
      // queries. Since errorPolicy: 'all' means mutate() resolves (rather
      // than rejects) even on a collision error, Apollo still runs the
      // refetch — so a second copy of each read is needed here too.
      memberBioMock,
      memberChurchMock,
    ])

    await screen.findByDisplayValue('ama@example.com')
    await selectBacentaFromDropdown()

    const emailInput = screen.getByLabelText(/email address/i)
    await userEvent.setup().clear(emailInput)
    await userEvent.setup().type(emailInput, 'taken@example.com')

    await submitForm()

    const description = await screen.findByText(
      (_, element) =>
        element?.getAttribute('data-slot') === 'dialog-description' &&
        (element?.textContent ?? '').includes('already belongs to')
    )
    expect(description).toBeInTheDocument()
    expect(screen.getByText(/Kofi Asante/)).toBeInTheDocument()

    // The whole point of the bug: this must NOT have fired.
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates away on a genuine successful update', async () => {
    const variables = baseUpdateVariables('newemail@example.com')

    renderUpdateMember([
      memberBioMock,
      memberChurchMock,
      basontasMock,
      memberBacentaSearchMock,
      successUpdateMock(variables),
      memberBioMock,
      memberChurchMock,
    ])

    await screen.findByDisplayValue('ama@example.com')
    await selectBacentaFromDropdown()

    const emailInput = screen.getByLabelText(/email address/i)
    await userEvent.setup().clear(emailInput)
    await userEvent.setup().type(emailInput, 'newemail@example.com')

    await submitForm()

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/member/displaydetails')
    )
  })

  it('shows a real error toast (does not navigate away) for a non-collision GraphQL error', async () => {
    const variables = baseUpdateVariables('newemail@example.com')

    renderUpdateMember([
      memberBioMock,
      memberChurchMock,
      basontasMock,
      memberBacentaSearchMock,
      genericErrorUpdateMock(variables),
      memberBioMock,
      memberChurchMock,
    ])

    await screen.findByDisplayValue('ama@example.com')
    await selectBacentaFromDropdown()

    const emailInput = screen.getByLabelText(/email address/i)
    await userEvent.setup().clear(emailInput)
    await userEvent.setup().type(emailInput, 'newemail@example.com')

    await submitForm()

    // This is the branch that used to render "[object Object]" — displayError
    // must be passed the real GraphQLFormattedError message, not the raw object.
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'There was an error updating the member profile',
        expect.objectContaining({
          description: 'Something went wrong saving this member',
        })
      )
    )

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
