/**
 * Smoke tests for ServiceDetails / ServiceDetailsNoIncome loading + empty i18n,
 * plus who can confirm an offering by hand (SYN-266).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing'
import { GraphQLError } from 'graphql'
import { MemoryRouter } from 'react-router-dom'
import { MemberContext } from 'contexts/MemberContext'
import { alertSuccess, throwToSentry } from 'global-utils'
import 'lib/i18n'
import ServiceDetails from './ServiceDetails'
import ServiceDetailsNoIncome from './ServiceDetailsNoIncome'
import { MANUALLY_CONFIRM_OFFERING_PAYMENT } from './RecordServiceMutations'
import type { Church, ServantTree } from 'global-types'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

vi.mock('global-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('global-utils')>()
  return { ...actual, alertSuccess: vi.fn(), throwToSentry: vi.fn() }
})

const stubChurch = {
  id: 'church-1',
  name: 'Test Bacenta',
  __typename: 'Bacenta',
} as Church

describe('ServiceDetails i18n smoke', () => {
  afterEach(cleanup)

  it('shows not-found copy when service is missing', () => {
    // ServiceDetails calls useMutation at the top of its body (offering
    // confirmation / record deletion), so it needs an Apollo client in
    // context even on the not-found path that never fires either one.
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter>
          <MemberContext.Provider
            value={{
              currentUser: {
                id: 'user-1',
                roles: ['leaderBacenta'],
                noIncomeTracking: false,
              },
              userJobs: [],
            }}
          >
            <ServiceDetails
              service={undefined as never}
              church={stubChurch}
              loading={false}
            />
          </MemberContext.Provider>
        </MemoryRouter>
      </MockedProvider>
    )

    expect(screen.getByText('Service record not found')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /back to services/i })
    ).toBeInTheDocument()
  })

  it('ServiceDetailsNoIncome renders service details title', () => {
    render(
      <MemoryRouter>
        <ServiceDetailsNoIncome
          service={
            {
              id: 'sr-1',
              attendance: 40,
              serviceDate: { date: '2026-07-20' },
              createdAt: '2026-07-20T10:00:00.000Z',
              created_by: { fullName: 'Leader One' },
            } as never
          }
          church={stubChurch}
          loading={false}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('Service Details')).toBeInTheDocument()
    expect(screen.getByText(/Recorded by Leader One/)).toBeInTheDocument()
    expect(screen.getByText('Service Record')).toBeInTheDocument()
    expect(screen.getByText('Attendance')).toBeInTheDocument()
  })
})

// SYN-266: Confirm Offering works on a service at any church level for a
// Stream teller or a Stream-and-higher admin whose role covers that church —
// the per-church check (useCan) mirrors the server's assertCan.
describe('ServiceDetails — manual offering confirmation (SYN-266)', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  const CHURCH_ID = 'church-1'

  const tree = (
    type: ServantTree['type'],
    level: ServantTree['level'],
    reach: string[]
  ): ServantTree => ({
    type,
    level,
    churchId: reach[0],
    churchName: reach[0],
    reach,
  })

  // A Stream teller whose Stream holds the service's church — or, for a
  // Stream-level service, whose Stream is that church.
  const tellerFor = (churchType = 'Bacenta') => [
    tree(
      'IS_TELLER_FOR',
      'Stream',
      churchType === 'Stream' ? [CHURCH_ID] : ['stream-1', CHURCH_ID]
    ),
  ]
  const tellerHere = tellerFor()

  const unbankedService = {
    id: 'sr-unbanked',
    attendance: 40,
    cash: 250,
    serviceDate: { date: '2026-07-20' },
    createdAt: '2026-07-20T10:00:00.000Z',
    created_by: { fullName: 'Leader One' },
  } as never

  const confirmRequest = {
    query: MANUALLY_CONFIRM_OFFERING_PAYMENT,
    variables: { serviceRecordId: 'sr-unbanked' },
  }

  const confirmed: MockedResponse = {
    request: confirmRequest,
    result: {
      data: {
        ManuallyConfirmOfferingPayment: {
          __typename: 'ServiceRecord',
          id: 'sr-unbanked',
          createdAt: '2026-07-20T10:00:00.000Z',
          noServiceReason: null,
          attendance: 40,
          income: 250,
          numberOfTithers: null,
          foreignCurrency: null,
          treasurerSelfie: null,
          familyPicture: null,
          bankingProof: null,
          bankingSlip: null,
          transactionId: null,
          bankingConfirmer: null,
        },
      },
    },
  }

  const renderFor = ({
    churchType = 'Bacenta',
    roles,
    servantTrees,
    service = unbankedService,
    mocks = [],
    errorPolicyAll = false,
  }: {
    churchType?: string
    roles: string[]
    servantTrees?: ServantTree[]
    service?: never
    mocks?: MockedResponse[]
    errorPolicyAll?: boolean
  }) =>
    render(
      <MockedProvider
        mocks={mocks}
        // Production's client uses errorPolicy 'all', so a refusal arrives
        // in res.errors rather than as a rejected promise.
        defaultOptions={
          errorPolicyAll ? { mutate: { errorPolicy: 'all' } } : undefined
        }
      >
        <MemoryRouter>
          <MemberContext.Provider
            value={{
              currentUser: {
                id: 'user-1',
                roles,
                noIncomeTracking: false,
                authority: servantTrees
                  ? { servantTrees, allowedChurchIds: [] }
                  : undefined,
              },
              userJobs: [],
            }}
          >
            <ServiceDetails
              service={service}
              church={
                {
                  id: CHURCH_ID,
                  name: `Test ${churchType}`,
                  __typename: churchType,
                } as Church
              }
              loading={false}
            />
          </MemberContext.Provider>
        </MemoryRouter>
      </MockedProvider>
    )

  const confirmButton = () =>
    screen.queryByRole('button', { name: /confirm offering/i })

  const confirmInDialog = async () => {
    fireEvent.click(screen.getByRole('button', { name: /confirm offering/i }))
    const dialog = await screen.findByRole('alertdialog')
    expect(
      within(dialog).getByText('Confirm offering banking?')
    ).toBeInTheDocument()
    fireEvent.click(
      within(dialog).getByRole('button', { name: /confirm offering/i })
    )
  }

  it.each(['Bacenta', 'Governorship', 'Council', 'Stream'])(
    'shows Confirm Offering to a Stream teller on a %s service in their Stream',
    (churchType) => {
      renderFor({
        churchType,
        roles: ['tellerStream'],
        servantTrees: tellerFor(churchType),
      })

      expect(
        screen.getByText(
          'Cash was recorded but no banking proof has been submitted yet.'
        )
      ).toBeInTheDocument()
      expect(confirmButton()).toBeInTheDocument()
    }
  )

  it.each([
    ['adminStream', 'Stream'],
    ['adminCampus', 'Campus'],
    ['adminOversight', 'Oversight'],
    ['adminDenomination', 'Denomination'],
  ] as const)(
    'shows Confirm Offering to %s whose %s holds the Bacenta',
    (role, level) => {
      renderFor({
        roles: [role],
        servantTrees: [tree('IS_ADMIN_FOR', level, [`${level}-1`, CHURCH_ID])],
      })

      expect(confirmButton()).toBeInTheDocument()
    }
  )

  it('shows Confirm Offering to a Campus admin on their Campus service', () => {
    renderFor({
      churchType: 'Campus',
      roles: ['adminCampus'],
      servantTrees: [tree('IS_ADMIN_FOR', 'Campus', [CHURCH_ID])],
    })

    expect(confirmButton()).toBeInTheDocument()
  })

  // The role must be held AT this church: a teller of another Stream who
  // merely leads this Bacenta is refused by the server, so no button.
  it('hides Confirm Offering from a teller of another Stream who leads this Bacenta', () => {
    renderFor({
      roles: ['tellerStream', 'leaderBacenta'],
      servantTrees: [
        tree('IS_TELLER_FOR', 'Stream', ['stream-2', 'bacenta-elsewhere']),
        tree('LEADS', 'Bacenta', [CHURCH_ID]),
      ],
    })

    expect(confirmButton()).not.toBeInTheDocument()
  })

  it.each([
    ['fishers', 'fishers', []],
    [
      'the Bacenta leader',
      'leaderBacenta',
      [tree('LEADS', 'Bacenta', [CHURCH_ID])],
    ],
    [
      'a Council admin over the Bacenta',
      'adminCouncil',
      [tree('IS_ADMIN_FOR', 'Council', ['council-1', CHURCH_ID])],
    ],
  ] as const)('hides Confirm Offering from %s', (_who, role, servantTrees) => {
    renderFor({ roles: [role], servantTrees: [...servantTrees] })

    expect(confirmButton()).not.toBeInTheDocument()
  })

  it('hides Confirm Offering until the per-church authority has loaded', () => {
    renderFor({ roles: ['tellerStream'] })

    expect(confirmButton()).not.toBeInTheDocument()
  })

  // Upload Banking Slip is a Campus-admin action (route + SubmitBankingSlip).
  it('keeps Upload Banking Slip beside Confirm Offering for a Campus admin', () => {
    renderFor({
      churchType: 'Council',
      roles: ['adminCampus'],
      servantTrees: [tree('IS_ADMIN_FOR', 'Campus', ['campus-1', CHURCH_ID])],
    })

    expect(
      screen.getByRole('button', { name: /upload banking slip/i })
    ).toBeInTheDocument()
    expect(confirmButton()).toBeInTheDocument()
  })

  it('hides Confirm Offering on a service that is already banked', () => {
    renderFor({
      roles: ['tellerStream'],
      servantTrees: tellerHere,
      service: {
        ...(unbankedService as object),
        tellerConfirmationTime: '2026-07-21T10:00:00.000Z',
      } as never,
    })

    expect(confirmButton()).not.toBeInTheDocument()
  })

  it('a Stream teller confirms a Bacenta service and sees the success message', async () => {
    renderFor({
      roles: ['tellerStream'],
      servantTrees: tellerHere,
      mocks: [confirmed],
    })

    await confirmInDialog()

    await waitFor(() =>
      expect(alertSuccess).toHaveBeenCalledWith(
        'Offering Payment has been confirmed. Thank you!'
      )
    )
    expect(throwToSentry).not.toHaveBeenCalled()
  })

  it("shows the server's refusal, not the success message", async () => {
    renderFor({
      roles: ['tellerStream'],
      servantTrees: tellerHere,
      errorPolicyAll: true,
      mocks: [
        {
          request: confirmRequest,
          result: {
            errors: [
              new GraphQLError(
                'You do not hold a required role at this church.'
              ),
            ],
          },
        },
      ],
    })

    await confirmInDialog()

    await waitFor(() =>
      expect(throwToSentry).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          message: 'You do not hold a required role at this church.',
        })
      )
    )
    expect(alertSuccess).not.toHaveBeenCalled()
  })
})
