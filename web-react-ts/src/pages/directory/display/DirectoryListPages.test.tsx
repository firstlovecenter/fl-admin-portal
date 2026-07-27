/**
 * Translation coverage for the eleven directory list pages.
 *
 * These share one `directory.list.*` namespace with the church level
 * interpolated in, so the risk this file guards against is a page passing the
 * wrong level — "All Councils" rendering on the Streams page would pass any
 * assertion that only checked the shared chrome. Every case therefore pins
 * the level-specific output.
 *
 * `useQuery` is mocked rather than driven through MockedProvider: these pages
 * each use a different document and the query shape is not what is under
 * test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import AllBacentas from './AllBacentas'
import AllCampuses from './AllCampuses'
import AllCouncils from './AllCouncils'
import AllStreams from './AllStreams'
import AllGovernorships from './AllGovernorships'
import AllCampusCouncils from './AllCampusCouncils'
import AllCampusGovernorships from './AllCampusGovernorships'
import AllStreamGovernorships from './AllStreamGovernorships'
import AllStreamBacentas from './AllStreamBacentas'
import AllOversights from './AllOversights'
import CouncilBacentas from './CouncilBacentas'

const queryResult = vi.fn()

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return { ...actual, useQuery: () => queryResult() }
})

vi.mock('components/base-component/ApolloWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('auth/RoleView', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// AllOversights renders ChurchSearch, whose formik Input reads useAuth to
// decide whether to show a skeleton.
vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

// One fixture serving every page: each reads only the collection it needs and
// ignores the rest, so the empty-state branch is what renders throughout.
const emptyParent = {
  id: 'p1',
  name: 'Accra',
  memberCount: 0,
  bacentas: [],
  campuses: [],
  councils: [],
  streams: [],
  governorships: [],
}

beforeEach(() => {
  queryResult.mockReturnValue({
    data: {
      governorships: [emptyParent],
      oversights: [emptyParent],
      streams: [emptyParent],
      campuses: [emptyParent],
      councils: [emptyParent],
      denominations: [{ ...emptyParent, oversights: [] }],
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
        value={
          {
            clickCard: vi.fn(),
            governorshipId: 'g1',
            oversightId: 'o1',
            streamId: 's1',
            campusId: 'ca1',
            councilId: 'co1',
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

describe('directory list pages — English', () => {
  it('renders the shared eyebrow and add button', () => {
    renderPage(<AllBacentas />)

    expect(screen.getByText('Directory')).toBeInTheDocument()
    expect(screen.getByText('Add Bacenta')).toBeInTheDocument()
    expect(screen.getByText('Add')).toBeInTheDocument()
  })

  it('interpolates each page own church level, not a shared one', () => {
    renderPage(<AllBacentas />)
    expect(screen.getByText('All Bacentas')).toBeInTheDocument()
    cleanup()

    renderPage(<AllCampuses />)
    expect(screen.getByText('Add Campus')).toBeInTheDocument()
    cleanup()

    renderPage(<AllCouncils />)
    expect(screen.getByText('Add Council')).toBeInTheDocument()
    cleanup()

    renderPage(<AllStreams />)
    expect(screen.getByText('Add Stream')).toBeInTheDocument()
    cleanup()

    renderPage(<AllGovernorships />)
    expect(screen.getByText('Add Governorship')).toBeInTheDocument()
  })

  it('renders the level-specific empty state', () => {
    renderPage(<AllBacentas />)

    expect(screen.getByText('No Bacentas found')).toBeInTheDocument()
    expect(
      screen.getByText('This Governorship has no Bacentas yet.')
    ).toBeInTheDocument()
  })
})

describe('directory list pages — translated', () => {
  it('translates the chrome and the interpolated level together', async () => {
    await i18n.changeLanguage('fr')
    renderPage(<AllBacentas />)

    expect(screen.getByText('Répertoire')).toBeInTheDocument()
    expect(screen.getByText('Ajouter Bacenta')).toBeInTheDocument()
    expect(screen.getByText('Liste des Bacentas')).toBeInTheDocument()
    expect(screen.queryByText('Directory')).not.toBeInTheDocument()
  })

  it('pulls the level word from shared.churchLevel, so it matches elsewhere', async () => {
    await i18n.changeLanguage('de')
    renderPage(<AllStreams />)

    // shared.churchLevel.Stream is "Zweig" — the add button must use it
    // rather than a second, independently-translated "Stream".
    expect(screen.getByText('Zweig hinzufügen')).toBeInTheDocument()
    // pins the reuse: the button must use shared.churchLevel.Stream, not a
    // second independently-translated 'Stream'
    expect(i18n.t('shared.churchLevel.Stream')).toBe('Zweig')
  })

  it('translates the search placeholder and its aria-label', async () => {
    await i18n.changeLanguage('es')
    renderPage(<AllCouncils />)

    expect(
      screen.getAllByPlaceholderText('Buscar consejos').length
    ).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Buscar Consejos').length).toBeGreaterThan(
      0
    )
  })

  it('translates the empty state with both level and parent interpolated', async () => {
    await i18n.changeLanguage('pt')
    renderPage(<AllBacentas />)

    // Literal, so a wrong translation fails too — not just a wrong level.
    // The construction is deliberately article-free: an interpolated level
    // noun cannot agree with a preceding determiner across five languages.
    expect(
      screen.getByText('Governadoria — ainda não há Bacentas.')
    ).toBeInTheDocument()
  })
})

describe('directory list pages — the six nested pages', () => {
  // These have two or three separate `useTranslation()` scopes each
  // (GovernorshipCard / CouncilSection / StreamSection), which makes them the
  // highest-risk of the eleven and the ones a codemod is most likely to have
  // half-wired. One level-pinning assertion each.
  const NESTED = [
    ['AllCampusCouncils', <AllCampusCouncils key="acc" />, 'Add Council'],
    [
      'AllCampusGovernorships',
      <AllCampusGovernorships key="acg" />,
      'Add Governorship',
    ],
    [
      'AllStreamGovernorships',
      <AllStreamGovernorships key="asg" />,
      'Add Governorship',
    ],
    ['AllOversights', <AllOversights key="ao" />, 'Add Oversight'],
  ] as const

  it.each(NESTED)('%s renders its own English add label', (_n, ui, label) => {
    renderPage(ui)
    expect(screen.getAllByText(label).length).toBeGreaterThan(0)
  })

  it.each(NESTED)('%s translates that label', async (_n, ui) => {
    await i18n.changeLanguage('fr')
    renderPage(ui)
    // Whatever the level, the label must be the French template, never the
    // English one.
    expect(screen.queryByText(/^Add /)).not.toBeInTheDocument()
    expect(screen.getAllByText(/^Ajouter /).length).toBeGreaterThan(0)
  })

  it('AllStreamBacentas renders its stream summary translated', async () => {
    await i18n.changeLanguage('de')
    renderPage(<AllStreamBacentas />)

    // The page composes its summary from shared.churchLevel.Stream, which is
    // 'Zweig' in German.
    expect(screen.getAllByText(/Zweig/).length).toBeGreaterThan(0)
  })

  it('CouncilBacentas renders its council summary translated', async () => {
    await i18n.changeLanguage('es')
    renderPage(<CouncilBacentas />)

    expect(screen.getAllByText(/Consejo/).length).toBeGreaterThan(0)
  })
})
