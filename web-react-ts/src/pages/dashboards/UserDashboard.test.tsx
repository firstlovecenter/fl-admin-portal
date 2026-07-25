/**
 * Tests for the i18n conversion of UserDashboard.tsx (dashboards page group).
 *
 * Every visible string in `FullUserDashboard` / `BacentaWeeklyTasks` /
 * `WeeklyTaskCard` moved from a hardcoded English literal to
 * `t('dashboard.userDashboard.*')` / `t('dashboard.weeklyTasks.*')`. This
 * file does not attempt full business-logic coverage of the dashboard (that
 * is a much larger surface driven by Apollo + several contexts) — it focuses
 * on the i18n change itself: default English render, French re-render, and
 * the record-service dialog's translated option cards.
 *
 * Heavy dependencies are mocked to keep the fixtures minimal:
 *  - `useComponentQuery` (Apollo-backed church resolution) is mocked to
 *    return `{ assessmentChurch: undefined }` unless a test needs otherwise.
 *  - `contexts/ChurchRoleScopeContext`'s `useChurchRoleScope` is mocked to a
 *    fixed scope, following the pattern in
 *    `pages/services/menus/ServicesMenu.test.tsx`.
 *  - `MemberContext` / `ChurchContext` are supplied via their real
 *    `.Provider`s with minimal values, matching the same test file's pattern.
 *  - `WeeklyTipCard` still fires a real `useQuery` even when skipped, so the
 *    tree is wrapped in `MockedProvider` with no mocks — every fixture below
 *    keeps the query skipped (`churchId` undefined, or a non leader/admin
 *    `authRole`) so no network mock is required.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import type { RoleChurchScopeOption } from 'contexts/ChurchRoleScopeContext'
import UserDashboard from './UserDashboard'

const STREAM_ID = 'stream-passion-weekday'

vi.mock('./useComponentQuery', () => ({
  default: vi.fn(() => ({ assessmentChurch: undefined })),
}))

// eslint-disable-next-line import/first
import useComponentQuery from './useComponentQuery'

const mockUseComponentQuery = vi.mocked(useComponentQuery)

vi.mock('contexts/ChurchRoleScopeContext', () => ({
  useChurchRoleScope: vi.fn(),
}))

// eslint-disable-next-line import/first
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'

const mockUseChurchRoleScope = vi.mocked(useChurchRoleScope)

const churchContextValue = {
  clickCard: vi.fn(),
}

const noScopeMemberContextValue = {
  currentUser: { id: 'user-1', fullName: 'Ama Mensah', roles: [] as string[] },
  userJobs: [],
  setCurrentUser: vi.fn(),
}

const populatedScope: RoleChurchScopeOption = {
  key: 'arrivalsAdminStream:stream-passion-weekday',
  authRole: 'arrivalsAdminStream',
  churchId: STREAM_ID,
  churchName: 'Passion Weekday',
  churchType: 'Stream',
  roleName: 'Arrivals Admin',
  roleDisplayName: 'Stream Arrivals Admin',
}

const populatedMemberContextValue = {
  currentUser: {
    id: 'user-2',
    fullName: 'Kofi Boateng',
    roles: ['arrivalsAdminStream'],
  },
  userJobs: [],
  setCurrentUser: vi.fn(),
}

function renderDashboard(memberContextValue: unknown) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <UserDashboard />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('UserDashboard i18n', () => {
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
    mockUseComponentQuery.mockReset()
    mockUseComponentQuery.mockReturnValue({ assessmentChurch: undefined } as never)
    mockUseChurchRoleScope.mockReset()
  })

  it('renders the default English strings on mount with no scope selected', () => {
    mockUseChurchRoleScope.mockReturnValue({
      selectedScope: undefined,
      roleChurchOptions: [],
      selectedScopeKey: '',
      setSelectedScopeKey: vi.fn(),
    })

    renderDashboard(noScopeMemberContextValue)

    expect(screen.getByText('No roles assigned yet.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Weekly trend' })
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('Quick actions').length
    ).toBeGreaterThan(0)
    // "Current focus" only renders when a scope is selected.
    expect(screen.queryByText('Current focus')).not.toBeInTheDocument()
  })

  it('renders quick action labels driven by dashboard.userDashboard.quickActions.*', () => {
    mockUseChurchRoleScope.mockReturnValue({
      selectedScope: undefined,
      roleChurchOptions: [],
      selectedScopeKey: '',
      setSelectedScopeKey: vi.fn(),
    })

    renderDashboard(noScopeMemberContextValue)

    // Rendered twice (mobile grid + desktop list) — both dual-renders are
    // fine, we're only asserting the translated label text exists.
    expect(screen.getAllByText('Record service').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Fill bussing').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Add member').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bank service').length).toBeGreaterThan(0)
  })

  it('renders the "Current focus" card with translated labels when a scope is selected', () => {
    mockUseChurchRoleScope.mockReturnValue({
      selectedScope: populatedScope,
      roleChurchOptions: [populatedScope],
      selectedScopeKey: populatedScope.key,
      setSelectedScopeKey: vi.fn(),
    })

    renderDashboard(populatedMemberContextValue)

    const currentFocusHeading = screen.getByText('Current focus')
    expect(currentFocusHeading).toBeInTheDocument()
    const currentFocusSection = currentFocusHeading.closest('section')
    expect(currentFocusSection).not.toBeNull()
    const withinFocus = within(currentFocusSection as HTMLElement)
    expect(withinFocus.getByText('Church')).toBeInTheDocument()
    expect(withinFocus.getByText('Level')).toBeInTheDocument()
    expect(withinFocus.getByText('Role')).toBeInTheDocument()
    expect(withinFocus.getByText('Stream')).toBeInTheDocument()
    expect(withinFocus.getByText('Arrivals Admin')).toBeInTheDocument()
  })

  it('re-renders translated strings when the active language changes to French', async () => {
    mockUseChurchRoleScope.mockReturnValue({
      selectedScope: undefined,
      roleChurchOptions: [],
      selectedScopeKey: '',
      setSelectedScopeKey: vi.fn(),
    })

    renderDashboard(noScopeMemberContextValue)

    await i18n.changeLanguage('fr')

    expect(
      await screen.findByText('Aucun rôle attribué pour le moment.')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Tendance hebdomadaire' })
    ).toBeInTheDocument()
    expect(screen.getAllByText('Actions rapides').length).toBeGreaterThan(0)
  })

  it('shows translated title+subtitle on the record-service dialog option cards for a Bacenta scope', async () => {
    // authRole stays a non leader/admin role (arrivalsAdminStream, as in
    // `populatedScope`) so `WeeklyTipCard`'s `isLeaderOrAdminRole` gate stays
    // false and its `useQuery` stays skipped — only `churchType` changes to
    // 'Bacenta' to exercise the record-service dialog's routing branch.
    const bacentaScope = {
      ...populatedScope,
      key: 'arrivalsAdminStream:bacenta-1',
      churchType: 'Bacenta',
    }
    mockUseChurchRoleScope.mockReturnValue({
      selectedScope: bacentaScope,
      roleChurchOptions: [bacentaScope],
      selectedScopeKey: bacentaScope.key,
      setSelectedScopeKey: vi.fn(),
    })

    renderDashboard({
      currentUser: {
        id: 'user-3',
        fullName: 'Yaw Owusu',
        roles: ['arrivalsAdminStream'],
      },
      userJobs: [],
      setCurrentUser: vi.fn(),
    })

    // Radix's Dialog only mounts DialogContent into the DOM once `open` is
    // true, so drive it open via the "Record service" quick action — for a
    // Bacenta scope this sets `recordDialogOpen` rather than navigating
    // straight to the record-service route. This is a plain button click
    // (not a Radix submenu), so it doesn't hit the pointer-grace-area jsdom
    // quirk documented in LanguageSwitcherMenu.test.tsx.
    const user = userEvent.setup()
    const [recordServiceQuickAction] = screen.getAllByRole('button', {
      name: 'Record service',
    })
    await user.click(recordServiceQuickAction)

    expect(
      await screen.findByText("Record this week's service")
    ).toBeInTheDocument()
    expect(
      screen.getByText('Did the service take place this week?')
    ).toBeInTheDocument()
    expect(screen.getByText('Record Service')).toBeInTheDocument()
    expect(
      screen.getByText('We met this week — fill the service form')
    ).toBeInTheDocument()
    expect(screen.getByText('I Cancelled My Service')).toBeInTheDocument()
    expect(
      screen.getByText('No service this week — give a reason')
    ).toBeInTheDocument()
  })
})
