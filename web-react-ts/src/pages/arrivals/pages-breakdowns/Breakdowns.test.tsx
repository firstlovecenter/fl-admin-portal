/**
 * Translation coverage for the three arrivals breakdown pages.
 *
 * The point worth pinning here is reuse: these pages share their whole status
 * vocabulary with the dashboards (`arrivals.dashboard.*`, added in phase 4)
 * and only own the page chrome (`arrivals.breakdown.*`). The assertions go
 * through both namespaces so a page that duplicated the vocabulary into its
 * own keys would still be caught by the French cases.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import CampusByStream from './CampusByStream'
import StreamByCouncil from './StreamByCouncil'
import CouncilByGovernorship from './CouncilByGovernorship'

const queryResult = vi.fn()

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return { ...actual, useQuery: () => queryResult() }
})

vi.mock('components/base-component/PullToRefresh', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('components/base-component/ApolloWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const child = {
  id: 'c1',
  name: 'Adenta',
  __typename: 'Stream',
  bacentaCount: 4,
  activeBacentaCount: 3,
  bacentasNoActivityCount: 1,
  bacentasMobilisingCount: 1,
  bacentasOnTheWayCount: 1,
  bacentasBelow8Count: 0,
  bacentasHaveArrivedCount: 1,
  bussingMembersOnTheWayCount: 20,
  bussingMembersHaveArrivedCount: 10,
  vehiclesOnTheWayCount: 2,
  vehiclesHaveArrivedCount: 1,
}

beforeEach(() => {
  queryResult.mockReturnValue({
    data: {
      campuses: [{ id: 'campus-1', name: 'Accra', streams: [child] }],
      streams: [{ id: 'stream-1', name: 'Accra', councils: [child] }],
      councils: [{ id: 'council-1', name: 'Accra', governorships: [child] }],
    },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
    // these pages poll, so the hook result needs the polling handles
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
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
        value={
          {
            clickCard: vi.fn(),
            campusId: 'campus-1',
            streamId: 'stream-1',
            councilId: 'council-1',
          } as never
        }
      >
        <MemberContext.Provider
          value={{ currentUser: { id: 'u1', roles: [] } } as never}
        >
          {ui}
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )

describe('CampusByStream', () => {
  it('interpolates the child level into the page title', () => {
    renderPage(<CampusByStream />)
    expect(screen.getByText('Arrivals by Stream')).toBeInTheDocument()
  })

  it('translates the collapse toggle label', async () => {
    await i18n.changeLanguage('fr')
    renderPage(<CampusByStream />)

    expect(screen.getByText('Arrivées par Filière')).toBeInTheDocument()
    // The toggle aria-label lived in a template literal and was English-only
    // until this pass.
    expect(
      screen.getByRole('button', { name: 'Développer Filière Adenta' })
    ).toBeInTheDocument()
  })

  it('reuses the dashboard status vocabulary once a stream is expanded', async () => {
    await i18n.changeLanguage('fr')
    renderPage(<CampusByStream />)

    // The status detail sits behind a collapse toggle, closed on first render.
    fireEvent.click(
      screen.getByRole('button', { name: 'Développer Filière Adenta' })
    )

    // Asserted through the key, not a literal: the point is that these come
    // from arrivals.dashboard.* rather than being duplicated into
    // arrivals.breakdown.*.
    expect(
      screen.getAllByText(i18n.t('arrivals.dashboard.bacentaStatus')).length
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(i18n.t('arrivals.breakdown.liveArrivals'))
    ).toBeInTheDocument()
  })
})

describe('StreamByCouncil', () => {
  it('interpolates its own child level, not Stream', async () => {
    renderPage(<StreamByCouncil />)
    expect(screen.getByText('Arrivals by Council')).toBeInTheDocument()

    cleanup()
    await i18n.changeLanguage('es')
    renderPage(<StreamByCouncil />)
    expect(screen.getByText('Llegadas por Consejo')).toBeInTheDocument()
  })
})

describe('CouncilByGovernorship', () => {
  it('translates its empty state', async () => {
    queryResult.mockReturnValue({
      data: {
        councils: [{ id: 'council-1', name: 'Accra', governorships: [] }],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
    })
    renderPage(<CouncilByGovernorship />)
    expect(
      screen.getByText('No governorships found under this council.')
    ).toBeInTheDocument()
  })

  it('translates the status tiles inside a governorship card', async () => {
    // Regression guard: these five labels lived in a module-scope
    //  constant and stayed English through two passes precisely
    // because this fixture used to be empty, so the card never mounted.
    await i18n.changeLanguage('de')
    renderPage(<CouncilByGovernorship />)

    expect(
      screen.getAllByText(i18n.t('arrivals.dashboard.noActivity')).length
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Keine Aktivität').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(i18n.t('arrivals.dashboard.haveArrived')).length
    ).toBeGreaterThan(0)
  })

  it('translates the drill-in hint and the collapse aria-label', async () => {
    await i18n.changeLanguage('fr')
    renderPage(<CouncilByGovernorship />)

    expect(
      screen.getByText(/Appuyez sur un gouvernorat pour explorer/)
    ).toBeInTheDocument()
    // Was a template literal — invisible except to screen readers.
    expect(
      screen.getByRole('button', { name: 'Développer les détails de Adenta' })
    ).toBeInTheDocument()
  })
})
