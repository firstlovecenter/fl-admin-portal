/**
 * i18n smoke test for DefaultersDashboard.tsx.
 *
 * Asserts the page title renders "Defaulters" in English and the French
 * equivalent after `changeLanguage('fr')`. Heavy Apollo / week / sonta-level
 * dependencies are mocked; MemberContext / ChurchContext use real Providers
 * (same pattern as ServantsDashboard / UserDashboard tests).
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import DefaultersDashboard from './DefaultersDashboard'

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useLazyQuery: vi.fn(() => [vi.fn(), { refetch: vi.fn() }]),
  }
})

vi.mock('contexts/ChurchRoleScopeContext', () => ({
  useChurchRoleScope: vi.fn(() => ({
    selectedScope: undefined,
    roleChurchOptions: [],
    selectedScopeKey: '',
    setSelectedScopeKey: vi.fn(),
  })),
}))

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

vi.mock('hooks/useSelectedWeek', () => ({
  default: () => ({
    weekStart: '2026-07-20',
    isCurrent: true,
    weekLabel: 'Week 30 · 20–26 Jul 2026',
    linkWith: (path: string) => path,
  }),
}))

vi.mock('hooks/useSontaLevel', () => ({
  default: vi.fn(() => ({
    church: {
      id: 'council-1',
      name: 'Test Council',
      __typename: 'Council',
      servicesThisWeekCount: 4,
      bankedThisWeekCount: 2,
      formDefaultersThisWeekCount: 1,
      bankingDefaultersThisWeekCount: 1,
      cancelledServicesThisWeekCount: 0,
      activeBacentaCount: 10,
      governorshipCount: 2,
    },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  })),
}))

vi.mock('components/base-component/PullToRefresh', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('components/WeekSelector/WeekSelector', () => ({
  default: () => null,
}))

vi.mock('./DownloadDefaultersButton', () => ({
  default: () => null,
}))

const churchContextValue = {
  clickCard: vi.fn(),
}

const memberContextValue = {
  currentUser: {
    id: 'user-1',
    roles: ['leaderCouncil'] as string[],
    currentChurch: {
      __typename: 'Council',
      id: 'council-1',
      name: 'Test Council',
    },
  },
  userJobs: [],
  setCurrentUser: vi.fn(),
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/services/defaulters']}>
      <ChurchContext.Provider value={churchContextValue as never}>
        <MemberContext.Provider value={memberContextValue as never}>
          <DefaultersDashboard />
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )
}

describe('DefaultersDashboard i18n', () => {
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
  })

  it('renders an English title containing "Defaulters"', async () => {
    await i18n.changeLanguage('en')
    renderDashboard()

    const heading = await screen.findByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(/Defaulters/)
  })

  it('renders the French title equivalent after changeLanguage("fr")', async () => {
    await i18n.changeLanguage('fr')
    renderDashboard()

    const heading = await screen.findByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(/Défaillants/)
    expect(heading.textContent).not.toMatch(/Defaulters/)
  })
})
