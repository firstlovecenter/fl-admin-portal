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
