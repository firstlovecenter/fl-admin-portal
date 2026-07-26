/**
 * Characterization tests for CancelledServiceForm i18n surface.
 * Ensures English default strings still render after useTranslation wiring.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { ChurchContext } from 'contexts/ChurchContext'
import 'lib/i18n'
import CancelledServiceForm from './CancelledServiceForm'
import type { Church } from 'global-types'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

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

describe('CancelledServiceForm', () => {
  afterEach(cleanup)

  it('renders cancelled-service heading and form labels in English', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <ChurchContext.Provider value={{ clickCard: vi.fn() }}>
            <CancelledServiceForm
              church={stubChurch}
              churchId="church-1"
              churchType="bacenta"
            />
          </ChurchContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.getByText('Service')).toBeInTheDocument()
    expect(screen.getByText('Cancellation Details')).toBeInTheDocument()
    expect(screen.getByLabelText(/date of service/i)).toBeInTheDocument()
    expect(
      screen.getByLabelText(/reason for cancellation/i)
    ).toBeInTheDocument()
    expect(screen.getByText('No Service This Week')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /submit cancellation/i })
    ).toBeInTheDocument()
  })
})
