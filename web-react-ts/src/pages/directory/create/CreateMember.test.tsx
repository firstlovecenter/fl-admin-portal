/**
 * CreateMember.test.tsx — SYN-206
 *
 * Bug: registering a member whose email/WhatsApp number already belonged to
 * someone else silently "succeeded" client-side — the form reset and the app
 * navigated to /member/displaydetails for a member that was never created.
 *
 * Root cause: the same class of bug as SYN-205. Prod's Apollo Client is
 * configured with `errorPolicy: 'all'` (createApolloClient.tsx, SYN-178), so a
 * GraphQL error is attached to `result.errors` instead of rejecting the
 * mutate() promise. `onSubmit` only had a try/catch around
 * `await CreateMember(...)`, so the catch never ran on a duplicate and the
 * success path (resetForm + navigate) executed anyway.
 *
 * Fix: `onSubmit` now inspects `createResult.errors` and routes through
 * `handleFailure`, which opens the "Member already exists" AlertDialog for
 * email/WhatsApp collisions (and otherwise reports to Sentry) *before*
 * resetting or navigating.
 *
 * These tests render the real <CreateMember /> against a MockedProvider with
 * `errorPolicy: 'all'` (matching prod) so they fail against the pre-fix code
 * and pass against the fix.
 */

import React from 'react'
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import {
  render,
  screen,
  waitFor,
  cleanup,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { toast } from 'sonner'

import CreateMember from './CreateMember'
import { CREATE_MEMBER_MUTATION } from './CreateMutations'
import { GET_CAMPUS_BASONTAS } from 'queries/ListQueries'
import { MEMBER_BACENTA_SEARCH } from 'components/formik/SearchBacentaQueries'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'

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

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

// The avatar field is a real S3 upload (presigned URL + PUT). Stub the upload
// helper so the required `pictureUrl` can be satisfied without a network.
vi.mock('utils/s3Upload', () => ({
  uploadToS3: vi.fn(async () => 'https://example.com/pic.jpg'),
}))

const mockNavigate = vi.fn()
const mockClickCard = vi.fn()

beforeAll(() => {
  // jsdom has no ResizeObserver; the cmdk-powered bacenta search combobox
  // (SearchCombobox / SearchBacenta) requires one to mount.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).ResizeObserver = ResizeObserverStub

  // Radix (Select / AlertDialog) calls these Pointer Events + scroll APIs that
  // jsdom does not implement.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proto = Element.prototype as any
  proto.hasPointerCapture = () => false
  proto.setPointerCapture = () => {}
  proto.releasePointerCapture = () => {}
  proto.scrollIntoView = () => {}
})

afterEach(() => {
  cleanup()
  mockNavigate.mockClear()
  mockClickCard.mockClear()
  vi.mocked(toast.error).mockClear()
})

const BACENTA_ID = 'bacenta-1'
const CAMPUS_ID = 'campus-1'
const CURRENT_USER_ID = 'tester-1'

const basontasMock = {
  request: { query: GET_CAMPUS_BASONTAS, variables: { id: CAMPUS_ID } },
  result: {
    data: {
      campuses: [{ id: CAMPUS_ID, name: 'Main Campus', basontas: [] }],
    },
  },
}

// SearchBacenta debounces (DEBOUNCE_TIMER=500ms) then fires
// MEMBER_BACENTA_SEARCH on every keystroke-settled search string. Match on the
// query alone; `variableMatcher` only relaxes matching, it does not limit how
// many times the mock can be consumed — so several copies are supplied below.
const memberBacentaSearchMock = {
  request: { query: MEMBER_BACENTA_SEARCH },
  variableMatcher: () => true,
  result: {
    data: {
      members: [
        {
          id: CURRENT_USER_ID,
          bacentaSearch: [
            { id: BACENTA_ID, name: 'Grace Bacenta', governorship: null },
          ],
        },
      ],
    },
  },
}

// `maxUsageCount: Infinity` makes each read reusable instead of hand-counting
// copies. SearchBacenta re-fires its query on every debounce cycle, so a fixed
// number of copies is load-bearing on exact render counts and breaks in
// confusing ways when the component's timing changes.
const reusable = (mock: MockedResponse): MockedResponse => ({
  ...mock,
  maxUsageCount: Number.POSITIVE_INFINITY,
})

const readMocks = [reusable(basontasMock), reusable(memberBacentaSearchMock)]

const createVariables = (email: string) => ({
  firstName: 'Ama',
  middleName: '',
  lastName: 'Mensah',
  gender: 'Female',
  phoneNumber: '233241111111',
  whatsappNumber: '233241111111',
  email,
  dob: '1990-01-01',
  maritalStatus: 'Single',
  occupation: '',
  pictureUrl: 'https://example.com/pic.jpg',
  visitationArea: 'East Legon',
  bacenta: BACENTA_ID,
  basonta: '',
})

const duplicateEmailCreateMock = (variables: Record<string, unknown>) => ({
  request: { query: CREATE_MEMBER_MUTATION, variables },
  result: {
    data: { CreateMember: null },
    errors: [
      {
        message:
          'A member with this email already exists. Please use a different email',
      },
    ],
  },
})

const successCreateMock = (variables: Record<string, unknown>) => ({
  request: { query: CREATE_MEMBER_MUTATION, variables },
  result: {
    data: {
      CreateMember: {
        id: 'new-member-1',
        firstName: 'Ama',
        lastName: 'Mensah',
        bacenta: {
          id: BACENTA_ID,
          governorship: { id: 'gov-1', council: { id: 'council-1' } },
        },
      },
    },
  },
})

const renderCreateMember = (mocks: readonly MockedResponse[]) =>
  render(
    <MemoryRouter initialEntries={['/member/addmember']}>
      <MemberContext.Provider
        value={{
          memberId: '',
          setMemberId: vi.fn(),
          currentUser: { id: CURRENT_USER_ID, roles: ['adminGovernorship'] },
        }}
      >
        <ChurchContext.Provider
          value={{ campusId: CAMPUS_ID, clickCard: mockClickCard }}
        >
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
            <CreateMember />
          </MockedProvider>
        </ChurchContext.Provider>
      </MemberContext.Provider>
    </MemoryRouter>
  )

const chooseFromSelect = async (
  triggerName: RegExp,
  optionName: string | RegExp
) => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })
  const trigger = await screen.findByRole('combobox', { name: triggerName })
  await user.click(trigger)
  const option = await screen.findByRole('option', { name: optionName })
  await user.click(option)
}

/** Fills every field the Yup schema requires, leaving `email` to the caller. */
const fillRequiredFields = async (email: string) => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })

  // MemberForm renders a skeleton until GET_CAMPUS_BASONTAS resolves.
  await screen.findByRole('button', { name: /register member/i })

  await user.upload(
    screen.getByLabelText(/upload photo/i),
    new File(['x'], 'pic.jpg', { type: 'image/jpeg' })
  )
  await screen.findByLabelText(/change photo/i)

  await user.type(screen.getByLabelText(/first name/i), 'Ama')
  await user.type(screen.getByLabelText(/last name/i), 'Mensah')
  await chooseFromSelect(/gender/i, 'Female')
  await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01')
  await user.type(screen.getByLabelText(/phone number/i), '+233241111111')
  await user.type(screen.getByLabelText(/whatsapp number/i), '+233241111111')
  await user.type(screen.getByLabelText(/email address/i), email)
  await chooseFromSelect(/marital status/i, 'Single')
  await user.type(
    screen.getByLabelText(/home \/ campus location/i),
    'East Legon'
  )

  // SearchBacenta only writes to Formik's `bacenta` field via the dropdown's
  // onSelect, so the bacenta must be picked, not typed.
  const bacentaInput = screen.getByPlaceholderText(/start typing to search/i)
  await user.click(bacentaInput)
  await user.type(bacentaInput, 'Grace')
  // SearchBacenta debounces 500ms; RTL's default 1000ms findBy timeout leaves
  // too little headroom under parallel full-suite load (the known
  // UpdateMember.test.tsx flake mechanism).
  await user.click(
    await screen.findByText('Grace Bacenta', {}, { timeout: 3000 })
  )
}

const submitForm = async () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })
  await user.click(screen.getByRole('button', { name: /register member/i }))
}

describe('CreateMember — SYN-206 duplicate-member handling', () => {
  it('shows the "Member already exists" dialog and does NOT navigate when the create returns a duplicate-email error', async () => {
    const variables = createVariables('taken@example.com')

    renderCreateMember([...readMocks, duplicateEmailCreateMock(variables)])

    await fillRequiredFields('taken@example.com')
    await submitForm()

    const dialog = await screen.findByRole('alertdialog')
    expect(
      within(dialog).getByText(/member already exists/i)
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(/A member with this email already exists/i)
    ).toBeInTheDocument()

    // The whole point of the bug: the app used to navigate to the details page
    // of a member that was never created.
    expect(mockNavigate).not.toHaveBeenCalled()
    // onCompleted still fires under errorPolicy: 'all', but `CreateMember` is
    // null — clicking a null card would blank out ChurchContext.
    expect(mockClickCard).not.toHaveBeenCalled()
  })

  it('navigates to /member/displaydetails on a genuine successful create', async () => {
    const variables = createVariables('brandnew@example.com')

    renderCreateMember([...readMocks, successCreateMock(variables)])

    await fillRequiredFields('brandnew@example.com')
    await submitForm()

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/member/displaydetails')
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(mockClickCard).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-member-1' })
    )
  })
})
