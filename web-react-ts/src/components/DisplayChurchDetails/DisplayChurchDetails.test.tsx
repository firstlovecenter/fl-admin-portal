import { afterEach, describe, expect, it, vi } from 'vitest'
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

afterEach(async () => {
  cleanup()
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

function renderPage() {
  return render(
    <MemoryRouter>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={churchContextValue as never}>
          <MemberContext.Provider value={memberContextValue as never}>
            <DisplayChurchDetails {...props} />
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
