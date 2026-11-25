import type { ReactNode } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApolloLink, ApolloProvider, Observable } from '@apollo/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChurchContext } from 'contexts/ChurchContext'
import { createApolloClient } from 'lib/createApolloClient'
import { alertSuccess, throwToSentry } from 'global-utils'
import 'lib/i18n'
import CreateMember from './create/CreateMember'
import UpdateBacenta from './update/UpdateBacenta'
import UpdateGovernorship from './update/UpdateGovernorship'
import UpdateCouncil from './update/UpdateCouncil'
import UpdateStream from './update/UpdateStream'
import UpdateCampus from './update/UpdateCampus'
import UpdateOversight from './update/UpdateOversight'
import UpdateDenomination from './update/UpdateDenomination'

const { navigate, resetForm, setSubmitting, edits } = vi.hoisted(() => ({
  navigate: vi.fn(),
  resetForm: vi.fn(),
  setSubmitting: vi.fn(),
  edits: {} as Record<string, unknown>,
}))

// Keep the real page submission handlers and Apollo mutation behavior. Bypass
// field entry/validation: these tests exercise what happens AFTER submission.
function SubmitForm({
  initialValues,
  onSubmit,
}: {
  initialValues: Record<string, unknown>
  onSubmit: (
    values: Record<string, unknown>,
    helpers: {
      resetForm: typeof resetForm
      setSubmitting: typeof setSubmitting
    }
  ) => Promise<void>
}) {
  return (
    <button
      onClick={() =>
        onSubmit({ ...initialValues, ...edits }, { resetForm, setSubmitting })
      }
    >
      Save
    </button>
  )
}

vi.mock('./reusable-forms/MemberForm', () => ({ default: SubmitForm }))
vi.mock('./reusable-forms/BacentaForm', () => ({ default: SubmitForm }))
vi.mock('./reusable-forms/GovernorshipForm', () => ({ default: SubmitForm }))
vi.mock('./reusable-forms/CouncilForm', () => ({ default: SubmitForm }))
vi.mock('./reusable-forms/StreamForm', () => ({ default: SubmitForm }))
vi.mock('./reusable-forms/CampusForm', () => ({ default: SubmitForm }))
vi.mock('./reusable-forms/OversightForm', () => ({ default: SubmitForm }))
vi.mock('./reusable-forms/DenominationForm', () => ({ default: SubmitForm }))
vi.mock('components/base-component/ApolloWrapper', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('react-router-dom', async (original) => ({
  ...(await original<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))
vi.mock('global-utils', async (original) => ({
  ...(await original<typeof import('global-utils')>()),
  throwToSentry: vi.fn(),
  alertSuccess: vi.fn(),
}))
vi.mock('@apollo/client', async (original) => ({
  ...(await original<typeof import('@apollo/client')>()),
  useQuery: () => ({ data: loadedChurches, loading: false }),
}))

const church = {
  id: 'church-1',
  name: 'Grace',
  vacationStatus: 'Active',
  bankAccount: '',
  leader: {
    id: 'old-leader',
    firstName: 'Old',
    lastName: 'Leader',
    fullName: 'Old Leader',
    email: 'old@example.test',
  },
  admin: { id: 'admin-1', firstName: 'Church', lastName: 'Admin' },
  deputyLeader: null,
  meetingDay: { day: 'Wednesday' },
  location: { latitude: 5.6, longitude: -0.1 },
  governorship: { id: 'parent' },
  council: { id: 'parent' },
  stream: { id: 'parent' },
  campus: { id: 'parent' },
  oversight: { id: 'parent' },
  denomination: { id: 'parent' },
  oversights: [],
  campuses: [],
  streams: [],
  noIncomeTracking: false,
  currency: 'GHS',
  conversionRateToDollar: 1,
}
const loadedChurches = {
  bacentas: [church],
  governorships: [church],
  councils: [church],
  streams: [church],
  campuses: [church],
  oversights: [church],
  denominations: [church],
}

const clients: ReturnType<typeof createApolloClient>[] = []
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.stop())
  for (const key of Object.keys(edits)) delete edits[key]
  vi.clearAllMocks()
})

function mount(
  page: ReactNode,
  failingOperation: string,
  message = 'Save refused'
) {
  const operations: string[] = []
  const client = createApolloClient({
    getAccessTokenSilently: async () => 'test-token',
  })
  client.setLink(
    new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          operations.push(operation.operationName)
          if (operation.operationName === failingOperation) {
            observer.next({
              errors: [
                {
                  message,
                  extensions: { code: 'BAD_USER_INPUT', errorRef: 'TESTREF1' },
                },
              ],
            })
          } else {
            const field = operation.operationName.startsWith('Update')
              ? `${operation.operationName}Details`
              : operation.operationName
            observer.next({
              data: {
                [field]: {
                  ...church,
                  firstName: 'Ama',
                  lastName: 'Mensah',
                  history: [],
                  title: [],
                  bacenta: {
                    id: 'bacenta-1',
                    governorship: {
                      id: 'governorship-1',
                      council: { id: 'council-1' },
                    },
                  },
                },
              },
            })
          }
          observer.complete()
        })
    )
  )
  clients.push(client)
  render(
    <ApolloProvider client={client}>
      <ChurchContext.Provider
        value={{
          bacentaId: 'church-1',
          governorshipId: 'church-1',
          councilId: 'church-1',
          streamId: 'church-1',
          campusId: 'church-1',
          oversightId: 'church-1',
          denominationId: 'church-1',
          clickCard: vi.fn(),
        }}
      >
        {page}
      </ChurchContext.Provider>
    </ApolloProvider>
  )
  return operations
}

describe('directory pages preserve failed submissions', () => {
  it('still resets and navigates after a successful registration', async () => {
    const user = userEvent.setup()
    mount(<CreateMember />, '')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/member/displaydetails')
    )
    expect(resetForm).toHaveBeenCalledTimes(1)
    expect(setSubmitting).toHaveBeenLastCalledWith(false)
  })

  it('keeps registration open and shows the duplicate-member dialog when the server refuses the contact details', async () => {
    const user = userEvent.setup()
    mount(
      <CreateMember />,
      'CreateMember',
      'There is a member with this whatsapp number'
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alertdialog')).toBeVisible()
    expect(navigate).not.toHaveBeenCalled()
    expect(resetForm).not.toHaveBeenCalled()
    expect(alertSuccess).not.toHaveBeenCalled()
    expect(setSubmitting).toHaveBeenLastCalledWith(false)
  })

  const editors = [
    ['Bacenta', UpdateBacenta],
    ['Governorship', UpdateGovernorship],
    ['Council', UpdateCouncil],
    ['Stream', UpdateStream],
    ['Campus', UpdateCampus],
    ['Oversight', UpdateOversight],
    ['Denomination', UpdateDenomination],
  ] as const

  it.each(editors)(
    'stops the %s editor before changing leaders when the details update fails',
    async (level, Page) => {
      const user = userEvent.setup()
      edits.leaderId = 'new-leader'
      const operations = mount(<Page />, `Update${level}`)
      await user.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(throwToSentry).toHaveBeenCalled())
      expect(operations).toEqual([`Update${level}`])
      expect(navigate).not.toHaveBeenCalled()
      expect(resetForm).not.toHaveBeenCalled()
      expect(alertSuccess).not.toHaveBeenCalled()
      expect(setSubmitting).toHaveBeenLastCalledWith(false)
    }
  )

  it.each(editors)(
    'keeps the %s editor open when the leader change fails',
    async (level, Page) => {
      const user = userEvent.setup()
      edits.leaderId = 'new-leader'
      mount(<Page />, `Make${level}Leader`)
      await user.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(throwToSentry).toHaveBeenCalled())
      expect(navigate).not.toHaveBeenCalled()
      expect(resetForm).not.toHaveBeenCalled()
      expect(alertSuccess).not.toHaveBeenCalled()
      expect(setSubmitting).toHaveBeenLastCalledWith(false)
    }
  )
})
