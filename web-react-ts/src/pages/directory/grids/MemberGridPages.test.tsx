/** Translation coverage for the seven thin directory member-grid wrappers. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import BacentaMembers from './BacentaMembers'
import CampusMembers from './CampusMembers'
import ChurchLevelMembers from './ChurchLevelMembers'
import CouncilMembers from './CouncilMembers'
import GovernorshipMembers from './GovernorshipMembers'
import OversightMembers from './OversightMembers'
import StreamMembers from './StreamMembers'

vi.mock('components/members-grids/MembersGrid', () => ({
  default: ({ parentTypename, getHeading }: { parentTypename: string; getHeading: (parent: { name: string }) => React.ReactNode }) => (
    <section data-testid={`grid-${parentTypename}`}>{getHeading({ name: 'Test church' })}</section>
  ),
}))

vi.mock('contexts/ChurchRoleScopeContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('contexts/ChurchRoleScopeContext')>()
  return { ...actual, useChurchRoleScope: vi.fn() }
})

const mockedUseChurchRoleScope = vi.mocked(useChurchRoleScope)

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const churchContextValue = {
  bacentaId: 'bacenta-1', campusId: 'campus-1', councilId: 'council-1',
  governorshipId: 'governorship-1', oversightId: 'oversight-1', streamId: 'stream-1',
}

function renderPages() {
  return render(
    <ChurchContext.Provider value={churchContextValue as never}>
      <BacentaMembers />
      <CampusMembers />
      <CouncilMembers />
      <GovernorshipMembers />
      <OversightMembers />
      <StreamMembers />
      <ChurchLevelMembers />
    </ChurchContext.Provider>
  )
}

describe('directory member-grid wrappers i18n', () => {
  it('renders each localized English grid heading', () => {
    mockedUseChurchRoleScope.mockReturnValue({ selectedScope: { churchId: 'campus-1', churchType: 'Campus' } } as never)
    renderPages()

    expect(screen.getByTestId('grid-Bacenta')).toHaveTextContent('Test church Bacenta')
    expect(screen.getAllByTestId('grid-Campus')).toHaveLength(2)
    expect(screen.getAllByTestId('grid-Campus')[0]).toHaveTextContent('Test church Members')
    expect(screen.getByTestId('grid-Council')).toHaveTextContent('Test church Council')
    expect(screen.getByTestId('grid-Governorship')).toHaveTextContent('Test church Governorship')
    expect(screen.getByTestId('grid-Oversight')).toHaveTextContent('Test church Members')
    expect(screen.getByTestId('grid-Stream')).toHaveTextContent('Test church Stream')
  })

  it('uses the active locale for the shared scope-aware heading and unsupported-level notice', async () => {
    await i18n.changeLanguage('fr')
    mockedUseChurchRoleScope.mockReturnValue({ selectedScope: { churchId: 'campus-1', churchType: 'Campus' } } as never)
    const { rerender } = renderPages()

    expect(screen.getAllByTestId('grid-Campus')[0]).toHaveTextContent(
      `Test church ${i18n.t('directory.detailsStats.members')}`
    )

    mockedUseChurchRoleScope.mockReturnValue({ selectedScope: { churchId: 'unknown-1', churchType: 'Unknown' } } as never)
    rerender(
      <ChurchContext.Provider value={churchContextValue as never}>
        <ChurchLevelMembers />
      </ChurchContext.Provider>
    )

    expect(screen.getByText('shared.churchLevel.Unknown').parentElement).toHaveTextContent(
      `${i18n.t('directory.churchLevelMembers.notAvailablePrefix')} shared.churchLevel.Unknown${i18n.t('directory.churchLevelMembers.notAvailableSuffix')}`
    )
  })
})
