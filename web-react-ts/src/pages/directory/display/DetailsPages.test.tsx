/**
 * Regression coverage for the translation-owned props in the seven directory
 * detail-page wrappers. DisplayChurchDetails has its own behaviour tests; this
 * suite keeps these thin query/context wrappers honest without duplicating it.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import DetailsBacenta from './DetailsBacenta'
import DetailsCampus from './DetailsCampus'
import DetailsCouncil from './DetailsCouncil'
import DetailsDenomination from './DetailsDenomination'
import DetailsGovernorship from './DetailsGovernorship'
import DetailsOversight from './DetailsOversight'
import DetailsStream from './DetailsStream'

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return { ...actual, useQuery: vi.fn(() => ({ data: undefined, loading: false })) }
})

vi.mock('components/base-component/ApolloWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('components/DisplayChurchDetails/DisplayChurchDetails', () => ({
  default: ({ churchId, details, leaderTitle }: { churchId: string; details: { title: string }[]; leaderTitle: string }) => (
    <section data-testid={churchId}>
      <p>{leaderTitle}</p>
      {details.map((detail) => <p key={detail.title}>{detail.title}</p>)}
    </section>
  ),
}))

vi.mock('hooks/useClickCard', () => ({ default: () => ({ setChurch: vi.fn() }) }))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const churchContextValue = {
  bacentaId: 'bacenta-details',
  campusId: 'campus-details',
  councilId: 'council-details',
  denominationId: 'denomination-details',
  governorshipId: 'governorship-details',
  oversightId: 'oversight-details',
  streamId: 'stream-details',
  setFilters: vi.fn(),
}

function renderPages() {
  return render(
    <MemoryRouter>
      <ChurchContext.Provider value={churchContextValue as never}>
        <MemberContext.Provider value={{ currentUser: { currency: 'GHS' } } as never}>
          <DetailsBacenta />
          <DetailsCampus />
          <DetailsCouncil />
          <DetailsDenomination />
          <DetailsGovernorship />
          <DetailsOversight />
          <DetailsStream />
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )
}

describe('directory detail-page wrappers i18n', () => {
  it('passes English stat labels and leader titles to the shared detail view', () => {
    renderPages()

    expect(screen.getByTestId('bacenta-details')).toHaveTextContent('Bacenta Leader')
    expect(screen.getByTestId('campus-details')).toHaveTextContent('Members')
    expect(screen.getByTestId('council-details')).toHaveTextContent('Governorships')
    expect(screen.getByTestId('denomination-details')).toHaveTextContent('Lead Pastor')
    expect(screen.getByTestId('governorship-details')).toHaveTextContent('Governor')
    expect(screen.getByTestId('oversight-details')).toHaveTextContent('Oversight Leader')
    expect(screen.getByTestId('stream-details')).toHaveTextContent('Stream Leader')
  })

  it('passes French labels rather than English fallback text', async () => {
    await i18n.changeLanguage('fr')
    renderPages()

    expect(screen.getByTestId('bacenta-details')).toHaveTextContent(i18n.t('directory.leaderTitle.bacentaLeader'))
    expect(screen.getByTestId('campus-details')).toHaveTextContent(i18n.t('shared.churchLevelPlural.Stream'))
    expect(screen.getByTestId('council-details')).toHaveTextContent(i18n.t('shared.churchLevelPlural.Governorship'))
    expect(screen.getByTestId('denomination-details')).toHaveTextContent(i18n.t('directory.leaderTitle.leadPastor'))
    expect(screen.getByTestId('governorship-details')).toHaveTextContent(i18n.t('directory.leaderTitle.governor'))
    expect(screen.getByTestId('oversight-details')).toHaveTextContent(i18n.t('directory.leaderTitle.oversightLeader'))
    expect(screen.getByTestId('stream-details')).toHaveTextContent(i18n.t('directory.leaderTitle.streamLeader'))
  })
})
