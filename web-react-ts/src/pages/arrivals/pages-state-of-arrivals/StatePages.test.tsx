/**
 * Translation coverage for the five Bacenta-status pages.
 *
 * They are structural clones sharing one chrome key set (`arrivals.state.*`)
 * plus a per-status sub-namespace, so this file asserts each page's own copy
 * rather than only the shared parts — a page wired to the wrong sub-namespace
 * would otherwise pass.
 *
 * `useArrivalsScopedQuery` is mocked so no Apollo document is needed; it is
 * the single seam every one of these pages reads its data through.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import StateBacentasArrived from './StateBacentasArrived'
import StateBacentasOnTheWay from './StateBacentasOnTheWay'
import StateBacentasMobilising from './StateBacentasMobilising'
import StateBacentasNoActivity from './StateBacentasNoActivity'
import StateBacentasBelow8 from './StateBacentasBelow8'

const scopedQuery = vi.fn()

vi.mock('./useArrivalsScopedQuery', () => ({
  useArrivalsScopedQuery: (...args: unknown[]) => scopedQuery(...args),
}))

vi.mock('components/base-component/PullToRefresh', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('components/base-component/ApolloWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// The five pages read different collections off `church`; give them all so a
// single fixture drives every page.
const emptyChurch = {
  __typename: 'Council',
  name: 'Adenta',
  bacentasArrived: [],
  bacentasOnTheWay: [],
  bacentasMobilising: [],
  bacentasNoActivity: [],
  bacentasBelow8: [],
  bacentasDidNotBus: [],
}

beforeEach(() => {
  scopedQuery.mockReturnValue({
    church: emptyChurch,
    churchType: 'Council',
    churchName: 'Adenta',
    loading: false,
    error: undefined,
    refetch: vi.fn(),
    isScopeSupported: true,
    hasScope: true,
  })
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const renderPage = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <ChurchContext.Provider value={{ clickCard: vi.fn() } as never}>
        {/* MemberDisplayCard (rendered once a bacenta row exists) reads
            currentUser off MemberContext. */}
        <MemberContext.Provider
          value={{ currentUser: { id: 'u1', roles: [] } } as never}
        >
          {ui}
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )

const PAGES = [
  ['Arrived', <StateBacentasArrived key="a" />, 'arrived'],
  ['OnTheWay', <StateBacentasOnTheWay key="o" />, 'onTheWay'],
  ['Mobilising', <StateBacentasMobilising key="m" />, 'mobilising'],
  ['NoActivity', <StateBacentasNoActivity key="n" />, 'noActivity'],
  ['Below8', <StateBacentasBelow8 key="b" />, 'below8'],
] as const

describe('Bacenta status pages — English', () => {
  it.each(PAGES)(
    '%s renders its own subtitle and empty state',
    (_n, ui, ns) => {
      renderPage(ui)

      expect(
        screen.getByText(i18n.t(`arrivals.state.${ns}.subtitle`))
      ).toBeInTheDocument()
      expect(
        screen.getByText(i18n.t(`arrivals.state.${ns}.emptyTitle`))
      ).toBeInTheDocument()
    }
  )

  it('renders literal English copy, not raw keys', () => {
    renderPage(<StateBacentasOnTheWay />)

    expect(
      screen.getByText('Bacentas en route to the centre.')
    ).toBeInTheDocument()
    expect(screen.getByText('Nothing on the road')).toBeInTheDocument()
    expect(
      screen.getByText('No bacentas are currently on their way.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back/ })).toBeInTheDocument()
  })
})

describe('Bacenta status pages — translated', () => {
  it('renders the shared chrome in French', async () => {
    await i18n.changeLanguage('fr')
    renderPage(<StateBacentasArrived />)

    expect(screen.getByText('Bacentas arrivées au centre.')).toBeInTheDocument()
    expect(screen.getByText('Personne pour le moment')).toBeInTheDocument()
    expect(screen.queryByText('Nobody yet')).not.toBeInTheDocument()
  })

  it('translates the per-status accent in the heading', async () => {
    await i18n.changeLanguage('de')
    renderPage(<StateBacentasMobilising />)

    // `arrivals.dashboard.mobilising` is reused from phase 4 rather than
    // duplicated into arrivals.state.*.
    expect(
      screen.getByText(i18n.t('arrivals.dashboard.mobilising'))
    ).toBeInTheDocument()
  })

  it('translates the out-of-scope warning', async () => {
    scopedQuery.mockReturnValue({
      church: undefined,
      churchType: undefined,
      churchName: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      isScopeSupported: false,
      hasScope: true,
    })
    await i18n.changeLanguage('es')
    renderPage(<StateBacentasOnTheWay />)

    expect(screen.getByText('Elija una iglesia superior')).toBeInTheDocument()
    expect(
      screen.getByText(i18n.t('arrivals.state.trackedAtLevels'))
    ).toBeInTheDocument()
  })

  it('falls back to the "pick a church" branch when there is no scope at all', async () => {
    scopedQuery.mockReturnValue({
      church: undefined,
      churchType: undefined,
      churchName: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      isScopeSupported: false,
      hasScope: false,
    })
    renderPage(<StateBacentasOnTheWay />)

    expect(screen.getByText('Pick a church in focus')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Choose a church from the Church in Focus selector to view bacenta status.'
      )
    ).toBeInTheDocument()
  })
})

describe('count label pluralisation', () => {
  it('uses the singular form for one bacenta and the plural otherwise', async () => {
    const one = {
      ...emptyChurch,
      bacentasOnTheWay: [{ id: 'b1', name: 'One' }],
    }
    scopedQuery.mockReturnValue({
      church: one,
      churchType: 'Governorship',
      churchName: 'Adenta',
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      isScopeSupported: true,
      hasScope: true,
    })
    renderPage(<StateBacentasOnTheWay />)
    expect(screen.getByText('bacenta on the way')).toBeInTheDocument()

    cleanup()
    const two = {
      ...emptyChurch,
      bacentasOnTheWay: [
        { id: 'b1', name: 'One' },
        { id: 'b2', name: 'Two' },
      ],
    }
    scopedQuery.mockReturnValue({
      church: two,
      churchType: 'Governorship',
      churchName: 'Adenta',
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      isScopeSupported: true,
      hasScope: true,
    })
    renderPage(<StateBacentasOnTheWay />)
    expect(screen.getByText('bacentas on the way')).toBeInTheDocument()
  })
})
