/**
 * Translation coverage for the two arrivals pages that are not clones of the
 * five status pages: `StateBacentasToCount` (vehicle-class filters + stream
 * switcher) and `StateVehiclesToBePaid` (paid/unpaid toggle).
 *
 * Both branch their copy on state — the payment page shows entirely different
 * subtitles, empty states and count labels depending on the toggle — so the
 * toggled branch is exercised, not just the default render.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import StateBacentasToCount from './StateBacentasToCount'
import StateVehiclesToBePaid from './StateVehiclesToBePaid'

const scopedQuery = vi.fn()
const councilData = vi.fn()

// StateVehiclesToBePaid queries COUNCIL_VEHICLES_TO_BE_PAID directly rather
// than going through useArrivalsScopedQuery, so its data comes from here.
vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useQuery: () => councilData(),
    useMutation: () => [vi.fn(), { loading: false }],
  }
})

vi.mock('./useArrivalsScopedQuery', () => ({
  useArrivalsScopedQuery: (...args: unknown[]) => scopedQuery(...args),
}))

vi.mock('components/base-component/PullToRefresh', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('components/base-component/ApolloWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Both pages read the scope picker directly (the stream switcher on one, the
// church badge on the other) rather than only through useArrivalsScopedQuery.
vi.mock('contexts/ChurchRoleScopeContext', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('contexts/ChurchRoleScopeContext')
  >()
  return {
    ...actual,
    useChurchRoleScope: () => ({
      selectedScope: {
        churchId: 'stream-1',
        churchType: 'Stream',
        churchName: 'Adenta',
      },
      roleChurchOptions: [],
      setSelectedScope: vi.fn(),
    }),
  }
})

const church = {
  __typename: 'Stream',
  name: 'Adenta',
  bacentasToCount: [],
  bacentasToBePaid: [],
}

const scopeResult = (overrides: Record<string, unknown> = {}) => ({
  church,
  churchType: 'Stream',
  churchName: 'Adenta',
  loading: false,
  error: undefined,
  refetch: vi.fn(),
  isScopeSupported: true,
  hasScope: true,
  ...overrides,
})

beforeEach(() => {
  scopedQuery.mockReturnValue(scopeResult())
  councilData.mockReturnValue({
    data: {
      councils: [
        { __typename: 'Council', name: 'Adenta', bacentasToBePaid: [] },
      ],
    },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  })
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const renderPage = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <ChurchContext.Provider
        value={{ clickCard: vi.fn(), councilId: 'council-1' } as never}
      >
        <MemberContext.Provider
          value={{ currentUser: { id: 'u1', roles: [] } } as never}
        >
          {ui}
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )

describe('StateBacentasToCount', () => {
  it('renders its chrome and vehicle-class filters in English', () => {
    renderPage(<StateBacentasToCount />)

    expect(
      screen.getByText('Vehicles awaiting confirmation at the centre.')
    ).toBeInTheDocument()
    expect(screen.getByText('Sprinter & Urvan')).toBeInTheDocument()
    expect(screen.getByText('Car & Uber')).toBeInTheDocument()
    expect(screen.getByText('Nothing to count')).toBeInTheDocument()
    expect(
      screen.getByText('Every vehicle has been confirmed.')
    ).toBeInTheDocument()
  })

  it('translates the filters, empty state and search affordances', async () => {
    await i18n.changeLanguage('pt')
    renderPage(<StateBacentasToCount />)

    expect(
      screen.getByText('Veículos a aguardar confirmação no centro.')
    ).toBeInTheDocument()
    expect(screen.getByText('Nada a contar')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Pesquisar bacentas ou líderes')
    ).toBeInTheDocument()
    expect(screen.queryByText('Nothing to count')).not.toBeInTheDocument()
  })

  it('translates the counting-specific scope warning, not the bacenta-status one', async () => {
    scopedQuery.mockReturnValue(
      scopeResult({
        isScopeSupported: false,
        hasScope: false,
        church: undefined,
      })
    )
    renderPage(<StateBacentasToCount />)

    expect(
      screen.getByText(
        'Choose a church from the Church in Focus selector to start counting.'
      )
    ).toBeInTheDocument()
    // the sibling pages' wording must not leak in
    expect(
      screen.queryByText(
        'Choose a church from the Church in Focus selector to view bacenta status.'
      )
    ).not.toBeInTheDocument()
  })
})

describe('StateVehiclesToBePaid', () => {
  it('defaults to the unpaid branch in English', () => {
    renderPage(<StateVehiclesToBePaid />)

    expect(screen.getByText('Vehicle Payments')).toBeInTheDocument()
    expect(screen.getByText('Vehicles To Be Paid')).toBeInTheDocument()
    expect(
      screen.getByText('Vehicles awaiting top-up payment.')
    ).toBeInTheDocument()
    expect(screen.getByText('Nothing to pay')).toBeInTheDocument()
  })

  it('swaps to the paid branch copy when the toggle is pressed', () => {
    renderPage(<StateVehiclesToBePaid />)

    fireEvent.click(screen.getByRole('tab', { name: 'Paid' }))

    expect(screen.getByText('Paid Vehicles')).toBeInTheDocument()
    expect(
      screen.getByText('Vehicles that have been paid out for today.')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Vehicles awaiting top-up payment.')
    ).not.toBeInTheDocument()
  })

  it('translates both branches', async () => {
    await i18n.changeLanguage('fr')
    renderPage(<StateVehiclesToBePaid />)

    expect(screen.getByText('Paiements des véhicules')).toBeInTheDocument()
    expect(
      screen.getByText('Véhicules en attente de paiement complémentaire.')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Payé' }))
    expect(screen.getByText('Véhicules payés')).toBeInTheDocument()
  })

  it('interpolates the tap-a-vehicle hint rather than splitting the sentence', () => {
    renderPage(<StateVehiclesToBePaid />)

    expect(
      screen.getByText('Tap a vehicle to process payment.')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Paid' }))
    expect(
      screen.getByText('Tap a vehicle to view its payout.')
    ).toBeInTheDocument()
  })
})
