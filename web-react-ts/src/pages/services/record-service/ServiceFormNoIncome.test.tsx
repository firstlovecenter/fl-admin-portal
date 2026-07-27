/**
 * Smoke tests for ServiceFormNoIncome i18n surface (English default).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { ChurchContext } from 'contexts/ChurchContext'
import 'lib/i18n'
import ServiceFormNoIncome from './ServiceFormNoIncome'
import type { Church } from 'global-types'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

vi.mock('components/formik/ImageUpload', () => ({
  default: ({ placeholder }: { placeholder?: string }) => (
    <button type="button">{placeholder ?? 'Choose'}</button>
  ),
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

describe('ServiceFormNoIncome', () => {
  afterEach(cleanup)

  it('renders service form labels in English', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]}>
          <ChurchContext.Provider value={{ clickCard: vi.fn() }}>
            <ServiceFormNoIncome
              church={stubChurch}
              churchId="church-1"
              churchType="Bacenta"
              RecordServiceMutation={vi.fn()}
            />
          </ChurchContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Test Bacenta')).toBeInTheDocument()
    expect(screen.getByText('Service')).toBeInTheDocument()
    expect(screen.getByText('Service Details')).toBeInTheDocument()
    expect(screen.getByLabelText(/attendance/i)).toBeInTheDocument()
    expect(screen.getByText('Service / Family Picture')).toBeInTheDocument()
  })
})
