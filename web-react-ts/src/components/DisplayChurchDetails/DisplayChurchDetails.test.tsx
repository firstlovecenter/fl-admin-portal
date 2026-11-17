import { afterEach, describe, expect, it, vi } from 'vitest'
import type React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { MemberWithoutBioData } from 'global-types'
import DisplayChurchDetails from './DisplayChurchDetails'

vi.mock('auth/useAuth', () => ({ default: () => ({ isAuthorised: () => false }) }))
vi.mock('components/LeaderAvatar/LeaderAvatar', () => ({ default: () => <div /> }))
vi.mock('components/LeaderAvatar/MemberAvatarWithName', () => ({ default: () => <div /> }))
vi.mock('components/Last3WeeksCard', () => ({
  default: () => <div data-testid="last-three-weeks" />,
  shouldFill: () => true,
}))
vi.mock('components/Timeline/Timeline', () => ({ default: () => <div /> }))
vi.mock('./Breadcrumb', () => ({ default: () => <div /> }))
vi.mock('pages/directory/update/UpdateBusPaymentDialog', () => ({ default: () => <div /> }))

// SYN-233 — the header's edit actions sit behind directoryLock (weekday-
// dependent) and RoleView. `headerActionsOpen` lets one test open both and
// inspect what reaches CloseDownBacentaButton; every other test keeps the
// real gates.
const gates = vi.hoisted(() => ({ headerActionsOpen: false }))
vi.mock('global-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('global-utils')>()
  return {
    ...actual,
    directoryLock: (...args: Parameters<typeof actual.directoryLock>) =>
      gates.headerActionsOpen || actual.directoryLock(...args),
  }
})
vi.mock('auth/RoleView', async (importOriginal) => {
  const actual = await importOriginal<typeof import('auth/RoleView')>()
  const RealRoleView = actual.default
  return {
    default: (roleViewProps: React.ComponentProps<typeof RealRoleView>) =>
      gates.headerActionsOpen ? (
        <>{roleViewProps.children}</>
      ) : (
        <RealRoleView {...roleViewProps} />
      ),
  }
})
vi.mock('components/buttons/CloseDownBacentaButton', () => ({
  default: ({ memberCount }: { memberCount?: number }) => (
    <div data-testid="close-down" data-member-count={String(memberCount)} />
  ),
}))

afterEach(async () => {
  cleanup()
  gates.headerActionsOpen = false
  await i18n.changeLanguage('en')
})

const churchContextValue = { clickCard: vi.fn() }
const memberContextValue = { currentUser: { id: 'user-1', roles: [] } }
const props = {
  details: [
    { title: 'Members', number: 12, link: '#' },
    { title: 'Status', number: 'Active', link: '#' },
    { title: 'Meeting day', number: 'Sunday', link: '#' },
  ],
  loading: false,
  name: 'Test Bacenta',
  leaderTitle: 'Bacenta Leader',
  leader: {
    __typename: 'Member',
    id: 'leader-1',
    firstName: 'Ama',
    lastName: 'Mensah',
    fullName: 'Ama Mensah',
    nameWithTitle: 'Ama Mensah',
    pictureUrl: '',
    currentTitle: 'Pastor',
    phoneNumber: '',
    whatsappNumber: '',
  } as MemberWithoutBioData,
  churchId: 'bacenta-1',
  churchType: 'Bacenta' as const,
  editlink: '/bacenta/editbacenta',
  editPermitted: [],
  history: [],
  breadcrumb: [],
  buttons: [],
  last3Weeks: [],
}

function renderPage(extraProps: Record<string, unknown> = {}) {
  return render(
    <MemoryRouter>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={churchContextValue as never}>
          <MemberContext.Provider value={memberContextValue as never}>
            <DisplayChurchDetails {...props} {...extraProps} />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('DisplayChurchDetails i18n', () => {
  it('renders the translated church level and service-form dialog content', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Test Bacenta Bacenta' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Fill Service Form' })).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Fill Service Form' })[0])
    expect(screen.getByRole('heading', { name: i18n.t('dashboard.userDashboard.dialog.title') })).toBeInTheDocument()
    expect(screen.getByText(i18n.t('dashboard.userDashboard.dialog.recordService.title'))).toBeInTheDocument()
    expect(screen.getByText(i18n.t('dashboard.userDashboard.dialog.cancelService.title'))).toBeInTheDocument()
  })

  it('renders the same shared content in French', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(screen.getByRole('heading', { name: `Test Bacenta ${i18n.t('shared.churchLevel.Bacenta')}` })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: i18n.t('directory.displayChurchDetails.fillServiceForm') })).toHaveLength(2)
  })
})

describe('SYN-233 — close-down button receives the member count', () => {
  it('SYN-233: passes church.memberCount so the dialog can block a non-empty bacenta', () => {
    gates.headerActionsOpen = true
    renderPage({ church: { memberCount: 7 } })

    expect(screen.getByTestId('close-down')).toHaveAttribute(
      'data-member-count',
      '7'
    )
  })

  it('SYN-233: leaves memberCount undefined (button default) when the church is not loaded', () => {
    gates.headerActionsOpen = true
    renderPage()

    expect(screen.getByTestId('close-down')).toHaveAttribute(
      'data-member-count',
      'undefined'
    )
  })
})
