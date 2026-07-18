/**
 * EditPage.test.tsx — SYN-206
 *
 * Bug: saving your own profile from /user-profile/edit navigated back to
 * `/user-profile` as though the write had succeeded even when the backend
 * rejected it.
 *
 * Root cause: the same class of bug as SYN-205. Prod's Apollo Client is
 * configured with `errorPolicy: 'all'` (createApolloClient.tsx, SYN-178), so a
 * GraphQL error is attached to `result.errors` instead of rejecting the
 * mutate() promise. `onSubmit` only wrapped `await UpdateMember(...)` in a
 * try/catch, so the catch never ran and execution fell straight through to
 * `navigate('/user-profile')`.
 *
 * Fix: `onSubmit` now inspects `updateResult.errors` explicitly, surfaces a
 * toast via displayError, and returns *before* navigating.
 *
 * These tests render the real <UserProfileEditPage /> against a MockedProvider
 * with `errorPolicy: 'all'` (matching prod) so they fail against the pre-fix
 * code and pass against the fix.
 */

import React from 'react'
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { toast } from 'sonner'

import UserProfileEditPage from './EditPage'
import { UPDATE_MEMBER_MUTATION } from '../update/UpdateMutations'
import {
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
} from '../display/ReadQueries'
import { GET_CAMPUS_BASONTAS } from 'queries/ListQueries'
import { MEMBER_BACENTA_SEARCH } from 'components/formik/SearchBacentaQueries'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'

// Mock sonner so displayError's toast.error calls land on a spy, matching the
// pattern in UpdateMember.test.tsx / lib/createApolloClient.test.tsx.
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

// RoleView (rendered by MemberForm) → useAuth (auth/useAuth) → useAuth
// (contexts/AuthContext). Mock the context so isAuthorised gates purely on
// currentUser.roles.
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
// MEMBER_BACENTA_SEARCH. Match on the query alone (any variables) — the exact
// key isn't the point of this test.
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

const updateVariables = (email: string) => ({
  id: MEMBER_ID,
  firstName: 'Ama',
  middleName: '',
  lastName: 'Mensah',
  gender: 'Female',
  phoneNumber: '233241111111',
  whatsappNumber: '233241111111',
  email,
  dob: '1990-01-01',
  maritalStatus: 'Single',
  occupation: 'Teacher',
  pictureUrl: 'https://example.com/pic.jpg',
  bacenta: BACENTA_ID,
  basonta: '',
})

const errorUpdateMock = (variables: Record<string, unknown>) => ({
  request: { query: UPDATE_MEMBER_MUTATION, variables },
  result: {
    data: { UpdateMemberDetails: null },
    errors: [{ message: 'This email already belongs to another member' }],
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

/**
 * EditPage re-reads DISPLAY_MEMBER_BIO / DISPLAY_MEMBER_CHURCH on the render
 * cycle triggered when SearchBacenta's useSearchInitialValue re-seeds its
 * search string (which also restarts its debounce and re-fires the bacenta
 * search). MockedProvider consumes a mock per request, so a single copy of
 * each read leads to "No more mocked responses" → memberError → ApolloWrapper
 * swaps the whole form for <ErrorScreen /> mid-test.
 *
 * `maxUsageCount: Infinity` makes each read reusable instead of hand-counting
 * copies — otherwise these mocks are load-bearing on the exact number of
 * render cycles, and any change to the debounce or to useSearchInitialValue
 * surfaces as a confusing <ErrorScreen /> failure rather than a real one.
 */
const reusable = (mock: MockedResponse): MockedResponse => ({
  ...mock,
  maxUsageCount: Number.POSITIVE_INFINITY,
})

const readMocks = [
  reusable(memberBioMock),
  reusable(memberChurchMock),
  reusable(memberBacentaSearchMock),
  reusable(basontasMock),
]

const renderEditPage = (mocks: readonly MockedResponse[]) =>
  render(
    <MemoryRouter initialEntries={['/user-profile/edit']}>
      <MemberContext.Provider
        value={{
          memberId: MEMBER_ID,
          setMemberId: vi.fn(),
          // canChangeUniques() in MemberForm gates the Basic Info / Contact
          // sections (where the email field lives) on
          // isAuthorised(permitAdmin('Governorship'), currentUser.roles).
          currentUser: { id: MEMBER_ID, roles: ['adminGovernorship'] },
        }}
      >
        <ChurchContext.Provider value={{ campusId: CAMPUS_ID }}>
          <MockedProvider
            mocks={mocks}
            addTypename={false}
            defaultOptions={{
              // Mirrors prod's createApolloClient defaultOptions: GraphQL
              // errors land in `result.errors`, they do not reject mutate().
              mutate: { errorPolicy: 'all' },
              watchQuery: { errorPolicy: 'all' },
              query: { errorPolicy: 'all' },
            }}
          >
            <UserProfileEditPage />
          </MockedProvider>
        </ChurchContext.Provider>
      </MemberContext.Provider>
    </MemoryRouter>
  )

// SearchBacenta only writes to Formik's `bacenta` field via the dropdown's
// onSelect — the initial value seeds display text only. A real user
// re-confirms by picking from the dropdown; do the same.
const selectBacentaFromDropdown = async (bacentaName = 'Grace Bacenta') => {
  const user = userEvent.setup()
  const bacentaInput = await screen.findByPlaceholderText(
    /start typing to search/i
  )
  await user.click(bacentaInput)
  await user.clear(bacentaInput)
  await user.type(bacentaInput, bacentaName.split(' ')[0])
  // SearchBacenta debounces 500ms before firing; RTL's default findBy timeout
  // is 1000ms, which leaves too little headroom under parallel full-suite CPU
  // load. Widen it — this is the flake mechanism that already affects
  // UpdateMember.test.tsx.
  const option = await screen.findByText(bacentaName, {}, { timeout: 3000 })
  await user.click(option)
}

const submitForm = async () => {
  const user = userEvent.setup()
  const submitButton = await screen.findByRole('button', { name: /save/i })
  await user.click(submitButton)
}

describe('UserProfileEditPage — SYN-206 self-profile save error handling', () => {
  it('surfaces an error toast and does NOT navigate away when the update returns a GraphQL error', async () => {
    const variables = updateVariables('taken@example.com')

    renderEditPage([...readMocks, errorUpdateMock(variables)])

    await screen.findByDisplayValue('ama@example.com')
    await selectBacentaFromDropdown()

    const emailInput = screen.getByLabelText(/email address/i)
    await userEvent.setup().clear(emailInput)
    await userEvent.setup().type(emailInput, 'taken@example.com')

    await submitForm()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'There was an error updating your profile',
        expect.objectContaining({
          description: 'This email already belongs to another member',
        })
      )
    )

    // The whole point of the bug: the page used to navigate back to the
    // profile as though the save had worked.
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates back to /user-profile on a genuine successful update', async () => {
    const variables = updateVariables('newemail@example.com')

    renderEditPage([...readMocks, successUpdateMock(variables)])

    await screen.findByDisplayValue('ama@example.com')
    await selectBacentaFromDropdown()

    const emailInput = screen.getByLabelText(/email address/i)
    await userEvent.setup().clear(emailInput)
    await userEvent.setup().type(emailInput, 'newemail@example.com')

    await submitForm()

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/user-profile')
    )
    expect(toast.error).not.toHaveBeenCalled()
  })
})
