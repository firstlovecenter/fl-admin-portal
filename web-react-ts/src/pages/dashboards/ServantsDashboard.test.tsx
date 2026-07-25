/**
 * Tests for the i18n conversion of ServantsDashboard.tsx.
 *
 * "Welcome to" / "{{name}}'s Dashboard" / "Avg Weekly Attendance" /
 * "Avg Weekly Income ({{currency}})" moved from hardcoded English literals to
 * `t('dashboard.servantsDashboard.*')`, and `ChurchGraph`'s `secondaryTitle`
 * now runs the church `__typename` through `formatChurchLevel(typename, t)`
 * instead of raw string concatenation. This file focuses on that i18n change
 * — default English render, French re-render, and the translated
 * `secondaryTitle` — not a full characterization of the dashboard's role-card
 * / graph business logic.
 *
 * Heavy dependencies are mocked:
 *  - `useQuery(SERVANT_CHURCH_LIST)` is satisfied via `MockedProvider` with a
 *    single matching mock (result data carries `__typename: 'Member'` so the
 *    cache normalizes it without warnings) so `ApolloWrapper` renders its
 *    children.
 *  - `./useComponentQuery` is mocked directly (same pattern as
 *    `UserDashboard.test.tsx`) to avoid exercising its internal
 *    `useLazyQuery` fan-out; it returns a fixed `assessmentChurch` so
 *    `ChurchGraph`'s `secondaryTitle` has a `name` + `__typename` to format.
 *  - `MemberContext` / `ChurchContext` are supplied via their real
 *    `.Provider`s with minimal values, matching `UserDashboard.test.tsx`.
 *  - `contexts/AuthContext`'s `useAuth` is mocked to `isAuthenticated: true`
 *    (matching `ServicesMenu.test.tsx`) so `Placeholder` — used to gate the
 *    welcome text / dashboard title while `servant?.fullName` is loading —
 *    renders its children immediately instead of a skeleton.
 *  - `currentUser.roles` is kept out of `permitMe('Governorship')` so
 *    `servantId` resolves to `currentUser.id` (not `memberId`), keeping the
 *    member context minimal.
 *  - The servant fixture has no `leadsBacenta` / `leadsGovernorship` / etc.
 *    arrays, so `getServantRoles` returns an empty role list and
 *    `ServantsDashboard` renders its single "no roles yet" `RoleCard`
 *    fallback rather than a role-card list — that branch is not part of this
 *    i18n pass and is left uncovered here.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { SERVANT_CHURCH_LIST } from './DashboardQueries'
import ServantsDashboard from './ServantsDashboard'

const SERVANT_ID = 'servant-1'

// Placeholder (used for the welcome text / dashboard title loading gate) →
// useAuth (contexts/AuthContext). Mock the context so it always renders its
// children rather than a loading skeleton.
vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

vi.mock('./useComponentQuery', () => ({
  default: vi.fn(() => ({
    assessmentChurch: {
      __typename: 'Governorship',
      name: 'Test Governorship',
    },
  })),
}))

// eslint-disable-next-line import/first
import useComponentQuery from './useComponentQuery'

const mockUseComponentQuery = vi.mocked(useComponentQuery)

const churchContextValue = {
  clickCard: vi.fn(),
}

const memberContextValue = {
  memberId: 'assessor-1',
  currentUser: {
    id: SERVANT_ID,
    fullName: 'Ama Mensah',
    // Kept out of permitMe('Governorship') so servantId resolves to
    // currentUser.id rather than memberId.
    roles: ['leaderBacenta'] as string[],
  },
  userJobs: [],
  setCurrentUser: vi.fn(),
}

// No leadsBacenta / leadsGovernorship / etc. arrays — getServantRoles
// resolves to an empty role list, so ServantsDashboard renders its single
// "no roles yet" RoleCard fallback rather than a role-card list.
const servantMock = {
  request: {
    query: SERVANT_CHURCH_LIST,
    variables: { id: SERVANT_ID },
  },
  result: {
    data: {
      members: [
        {
          __typename: 'Member',
          id: SERVANT_ID,
          firstName: 'Ama',
          lastName: 'Mensah',
          fullName: 'Ama Mensah',
          leadsBacenta: [],
          leadsGovernorship: [],
          leadsCouncil: [],
          leadsStream: [],
          leadsCampus: [],
          leadsOversight: [],
          leadsDenomination: [],
          isAdminForGovernorship: [],
          isAdminForCouncil: [],
          isAdminForStream: [],
          isAdminForCampus: [],
          isAdminForOversight: [],
          isAdminForDenomination: [],
          isArrivalsAdminForGovernorship: [],
          isArrivalsAdminForStream: [],
          isArrivalsAdminForCampus: [],
          isArrivalsCounterForStream: [],
          isArrivalsAdminForCouncil: [],
          isTellerForStream: [],
          isArrivalsPayerForCouncil: [],
        },
      ],
    },
  },
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <MockedProvider mocks={[servantMock]}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <ServantsDashboard />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('ServantsDashboard i18n', () => {
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
    mockUseComponentQuery.mockReset()
    mockUseComponentQuery.mockReturnValue({
      assessmentChurch: {
        __typename: 'Governorship',
        name: 'Test Governorship',
      },
    } as never)
  })

  it('renders the default English welcome text, dashboard title, and stat titles', async () => {
    renderDashboard()

    expect(await screen.findByText('Welcome to')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: "Ama Mensah's Dashboard" })
    ).toBeInTheDocument()
    expect(screen.getByText('Avg Weekly Attendance')).toBeInTheDocument()
    expect(screen.getByText('Avg Weekly Income (GHS)')).toBeInTheDocument()
  })

  it('renders the translated secondaryTitle on the ChurchGraph via formatChurchLevel(typename, t)', async () => {
    renderDashboard()

    expect(
      await screen.findByText('Test Governorship Governorship')
    ).toBeInTheDocument()
  })

  it('re-renders the welcome text, dashboard title, and stat titles in French', async () => {
    renderDashboard()

    await screen.findByText('Welcome to')

    await i18n.changeLanguage('fr')

    expect(await screen.findByText('Bienvenue sur')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Tableau de bord de Ama Mensah',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Fréquentation hebdomadaire moyenne')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Revenu hebdomadaire moyen (GHS)')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Test Governorship Gouvernorat')
    ).toBeInTheDocument()
  })
})
