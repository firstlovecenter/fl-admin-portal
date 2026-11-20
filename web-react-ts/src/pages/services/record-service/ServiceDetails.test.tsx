/**
 * Smoke tests for ServiceDetails / ServiceDetailsNoIncome loading + empty i18n.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import { MemberContext } from 'contexts/MemberContext'
import 'lib/i18n'
import ServiceDetails from './ServiceDetails'
import ServiceDetailsNoIncome from './ServiceDetailsNoIncome'
import type { Church } from 'global-types'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

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

// SYN-266: ManuallyConfirmOfferingPayment refuses every record below Stream,
// so the Confirm Offering button must not be offered there. Upload Banking
// Slip and the warning are unaffected.
describe('ServiceDetails — manual offering confirmation (SYN-266)', () => {
  afterEach(cleanup)

  const unbankedService = {
    id: 'sr-unbanked',
    attendance: 40,
    cash: 250,
    serviceDate: { date: '2026-07-20' },
    createdAt: '2026-07-20T10:00:00.000Z',
    created_by: { fullName: 'Leader One' },
  } as never

  const renderFor = (
    churchType: string,
    roles: string[],
    service = unbankedService
  ) =>
    render(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <MemberContext.Provider
            value={{
              currentUser: { id: 'user-1', roles, noIncomeTracking: false },
              userJobs: [],
            }}
          >
            <ServiceDetails
              service={service}
              church={
                {
                  id: 'church-1',
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

  it.each(['Bacenta', 'Governorship', 'Council'])(
    'hides Confirm Offering on a %s record, even for fishers',
    (churchType) => {
      renderFor(churchType, ['fishers'])

      expect(
        screen.getByText(
          'Cash was recorded but no banking proof has been submitted yet.'
        )
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /confirm offering/i })
      ).not.toBeInTheDocument()
    }
  )

  it.each(['Stream', 'Campus', 'Oversight', 'Denomination'])(
    'shows Confirm Offering to fishers on a %s record',
    (churchType) => {
      renderFor(churchType, ['fishers'])

      expect(
        screen.getByRole('button', { name: /confirm offering/i })
      ).toBeInTheDocument()
    }
  )

  it('shows Confirm Offering to a Stream teller on a Stream record', () => {
    renderFor('Stream', ['tellerStream'])

    expect(
      screen.getByRole('button', { name: /confirm offering/i })
    ).toBeInTheDocument()
  })

  it('keeps Upload Banking Slip for a Stream admin on a Council record', () => {
    renderFor('Council', ['adminStream'])

    expect(
      screen.getByRole('button', { name: /upload banking slip/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /confirm offering/i })
    ).not.toBeInTheDocument()
  })

  it('hides Confirm Offering on a Stream record that is already banked', () => {
    renderFor('Stream', ['fishers'], {
      ...(unbankedService as object),
      tellerConfirmationTime: '2026-07-21T10:00:00.000Z',
    } as never)

    expect(
      screen.queryByRole('button', { name: /confirm offering/i })
    ).not.toBeInTheDocument()
  })
})
