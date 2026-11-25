/**
 * SYN-283: the pay-vehicle page could not load a vehicle record.
 *
 * 1. DISPLAY_VEHICLE_PAYMENT_RECORDS selected `vehicleCost`, which the API
 *    declared non-null although modern records never store one, so the whole
 *    query failed. The page never reads it, so it is no longer selected.
 * 2. It never selected `vehicleTopUp`, which the page shows and prefills, and
 *    the form called `vehicle?.vehicleTopUp.toString()` — a bare `.toString()`
 *    on undefined that crashed the page once the query did succeed. The same
 *    applied to `momoNumber` / `momoName` on records without momo details.
 *
 * Apollo hooks are mocked (as in CountAndPayPages.test.tsx) so the test can
 * hand the component the exact record shapes the API returns.
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
import { FieldNode, OperationDefinitionNode } from 'graphql'
import 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { DISPLAY_VEHICLE_PAYMENT_RECORDS } from '../arrivalsQueries'
import FormPayVehicleRecord from './FormPayVehicleRecord'

const queryResult = vi.fn()
const sendVehicleSupport = vi.fn()

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useQuery: () => queryResult(),
    useMutation: () => [sendVehicleSupport, { loading: false }],
  }
})

vi.mock('components/base-component/ApolloWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('components/CloudinaryImage', () => ({
  default: () => null,
}))

vi.mock('global-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('global-utils')>()
  return { ...actual, alertMsg: vi.fn(), alertSuccess: vi.fn() }
})

// Input and Placeholder read useAuth for their skeletons; auth is out of scope.
vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

const bacenta = {
  id: 'bacenta-1',
  name: 'Test Bacenta',
  leader: {
    id: 'leader-1',
    firstName: 'Ama',
    lastName: 'Serwaa',
    fullName: 'Ama Serwaa',
    pictureUrl: '',
  },
  governorship: {
    id: 'gov-1',
    name: 'Test Governorship',
    council: {
      id: 'council-1',
      name: 'Test Council',
      leader: {
        id: 'cl-1',
        firstName: 'Kofi',
        lastName: 'Mensah',
        fullName: 'Kofi Mensah',
      },
    },
  },
  stream: { id: 'stream-1', name: 'Test Stream' },
}

// The shape a modern record comes back in: no cost, no top-up yet, no momo.
const bareVehicle = {
  id: 'vehicle-1',
  createdAt: new Date().toISOString(),
  created_by: null,
  counted_by: null,
  leaderDeclaration: 20,
  attendance: 18,
  vehicleTopUp: null,
  picture: '',
  momoNumber: null,
  momoName: null,
  vehicle: 'Urvan',
  arrivalTime: null,
  outbound: false,
  paystackTransferCode: null,
  transactionStatus: null,
}

const renderPage = (vehicle: Record<string, unknown>) => {
  queryResult.mockReturnValue({
    data: { vehicleRecords: [vehicle], bacentas: [bacenta] },
    loading: false,
    error: undefined,
  })

  return render(
    <MemoryRouter>
      <ChurchContext.Provider value={{ bacentaId: 'bacenta-1' } as never}>
        <MemberContext.Provider
          value={{ currentUser: { currency: 'GHS' } } as never}
        >
          <ServiceContext.Provider
            value={{ vehicleRecordId: 'vehicle-1' } as never}
          >
            <FormPayVehicleRecord />
          </ServiceContext.Provider>
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  queryResult.mockReset()
  sendVehicleSupport.mockReset()
  sendVehicleSupport.mockResolvedValue({
    data: { SendVehicleSupport: { momoName: 'Test Payee' } },
  })
})

afterEach(() => {
  cleanup()
})

describe('FormPayVehicleRecord (SYN-283)', () => {
  it('renders a record with no top-up or momo details instead of crashing', () => {
    renderPage(bareVehicle)

    expect(screen.getByText('Test Council')).toBeTruthy()
    const topUp = screen.getByLabelText(/Vehicle Top Up Amount/i)
    expect(topUp.getAttribute('placeholder')).toBeNull()
    expect(
      screen.getByLabelText(/Momo Number/i).getAttribute('placeholder')
    ).toBeNull()
    expect(
      screen.getByLabelText(/Momo Name/i).getAttribute('placeholder')
    ).toBeNull()
  })

  it('seeds empty strings, not null, so the inputs stay controlled', () => {
    renderPage(bareVehicle)

    const value = (label: RegExp) =>
      (screen.getByLabelText(label) as HTMLInputElement).value
    expect(value(/Vehicle Top Up Amount/i)).toBe('')
    expect(value(/Momo Number/i)).toBe('')
    expect(value(/Momo Name/i)).toBe('')
  })

  it('renders a record whose top-up and momo fields are absent from the payload', () => {
    const {
      vehicleTopUp: _t,
      momoNumber: _n,
      momoName: _m,
      ...absent
    } = bareVehicle
    renderPage(absent)

    expect(screen.getByLabelText(/Vehicle Top Up Amount/i)).toBeTruthy()
  })

  it('shows the stored top-up and momo details as placeholders when present', () => {
    renderPage({
      ...bareVehicle,
      vehicleTopUp: 150,
      momoNumber: '0240000000',
      momoName: 'Test Payee',
    })

    expect(
      screen
        .getByLabelText(/Vehicle Top Up Amount/i)
        .getAttribute('placeholder')
    ).toBe('150')
    expect(
      screen.getByLabelText(/Momo Number/i).getAttribute('placeholder')
    ).toBe('0240000000')
    expect(
      screen.getByLabelText(/Momo Name/i).getAttribute('placeholder')
    ).toBe('Test Payee')
    expect(
      (screen.getByLabelText(/Vehicle Top Up Amount/i) as HTMLInputElement)
        .value
    ).toBe('150')
  })
})

describe('FormPayVehicleRecord submit with the new initial values (SYN-283)', () => {
  const submit = () =>
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

  it('does not send a payment when the record has no top-up or momo details', async () => {
    renderPage(bareVehicle)
    submit()

    await waitFor(() =>
      expect(screen.getAllByText(/required/i).length).toBeGreaterThanOrEqual(3)
    )
    expect(sendVehicleSupport).not.toHaveBeenCalled()
  })

  it('sends the stored top-up as a number when the record already has one', async () => {
    renderPage({
      ...bareVehicle,
      vehicleTopUp: 150,
      momoNumber: '0240000000',
      momoName: 'Test Payee',
    })
    submit()

    await waitFor(() => expect(sendVehicleSupport).toHaveBeenCalledTimes(1))
    expect(sendVehicleSupport.mock.calls[0][0].variables).toMatchObject({
      vehicleRecordId: 'vehicle-1',
      vehicleTopUp: 150,
      momoNumber: '0240000000',
      momoName: 'Test Payee',
      outbound: false,
    })
  })
})

describe('DISPLAY_VEHICLE_PAYMENT_RECORDS selection (SYN-283)', () => {
  const vehicleRecordFields = () => {
    const op = DISPLAY_VEHICLE_PAYMENT_RECORDS
      .definitions[0] as OperationDefinitionNode
    const vehicleRecords = op.selectionSet.selections.find(
      (s) => (s as FieldNode).name.value === 'vehicleRecords'
    ) as FieldNode
    return vehicleRecords.selectionSet!.selections.map(
      (s) => (s as FieldNode).name.value
    )
  }

  it('selects vehicleTopUp, which the page displays and prefills', () => {
    expect(vehicleRecordFields()).toContain('vehicleTopUp')
  })

  it('does not select the retired vehicleCost field', () => {
    expect(vehicleRecordFields()).not.toContain('vehicleCost')
  })
})
