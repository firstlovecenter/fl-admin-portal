/**
 * SYN-276 — the counter's attendance form must refuse an out-of-range count
 * itself. ConfirmVehicleByAdmin only accepts whole numbers 0–200; without the
 * matching Yup rule a count of 250 reached the API and came back as a server
 * error instead of a field message.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'

import FormAttendanceConfirmation from './FormAttendanceConfirmation'

const confirmVehicle = vi.fn()
const navigate = vi.fn()

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useQuery: () => ({
      data: {
        vehicleRecords: [
          {
            id: 'vr_1',
            vehicle: 'Sprinter',
            leaderDeclaration: 30,
            picture: '',
            createdAt: new Date().toISOString(),
            created_by: { fullName: 'Test Leader' },
          },
        ],
        bacentas: [{ id: 'b_1', name: 'Test', __typename: 'Bacenta' }],
      },
      loading: false,
      error: undefined,
    }),
    useMutation: () => [confirmVehicle],
  }
})

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => navigate }
})

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

vi.mock('components/base-component/ApolloWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('components/CloudinaryImage', () => ({
  default: () => null,
}))

const renderForm = () =>
  render(
    <MemoryRouter>
      <ChurchContext.Provider value={{ bacentaId: 'b_1' }}>
        <ServiceContext.Provider value={{ vehicleRecordId: 'vr_1' }}>
          <FormAttendanceConfirmation />
        </ServiceContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )

const submitAttendance = (attendance: string) => {
  fireEvent.change(screen.getByLabelText(/Attendance \(from Picture\)/), {
    target: { value: attendance },
  })
  fireEvent.change(screen.getByLabelText(i18n.t('arrivals.common.comments')), {
    target: { value: 'Counted from the picture' },
  })
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  confirmVehicle.mockResolvedValue({
    data: { ConfirmVehicleByAdmin: { id: 'vr_1' } },
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('FormAttendanceConfirmation — attendance range (SYN-276)', () => {
  it('refuses an attendance over 200 on the form and never calls the API', async () => {
    renderForm()
    submitAttendance('250')

    expect(
      await screen.findByText('Attendance cannot exceed 200')
    ).toBeInTheDocument()
    expect(confirmVehicle).not.toHaveBeenCalled()
  })

  it('refuses a negative attendance on the form and never calls the API', async () => {
    renderForm()
    submitAttendance('-3')

    expect(
      await screen.findByText('Please enter a valid number')
    ).toBeInTheDocument()
    expect(confirmVehicle).not.toHaveBeenCalled()
  })

  it('submits an attendance of exactly 200', async () => {
    renderForm()
    submitAttendance('200')

    await waitFor(() => expect(confirmVehicle).toHaveBeenCalledTimes(1))
    expect(confirmVehicle.mock.calls[0][0].variables).toMatchObject({
      vehicleRecordId: 'vr_1',
      attendance: 200,
      vehicle: 'Sprinter',
    })
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/bacenta/vehicle-details')
    )
  })
})
