/**
 * Translation coverage for the two arrivals-admin helper screens.
 *
 * The fixtures come in an empty and a populated flavour on purpose. An
 * empty-only fixture is what let the destructive-dialog copy and both the
 * Remove/Delete buttons stay English through two passes — those branches
 * simply never mounted. The populated cases below render them.
 *
 * Assertions on translated copy use literals, not `i18n.t(key)`: a computed
 * assertion cannot catch a wrong translation, and the French subtitle here had
 * a real article-agreement bug ("ce filière" for the feminine "filière") that
 * only a literal would have caught.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import ArrivalsCounters from './ArrivalsCounters'
import ArrivalsPayers from './ArrivalsPayers'

const queryResult = vi.fn()

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useQuery: () => queryResult(),
    useMutation: () => [vi.fn(), { loading: false }],
  }
})

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

vi.mock('components/base-component/ApolloWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const COUNTER = {
  id: 'm1',
  fullName: 'Ama Mensah',
  firstName: 'Ama',
  lastName: 'Mensah',
}

const PAYER = {
  id: 'm2',
  fullName: 'Kofi Boateng',
  firstName: 'Kofi',
  lastName: 'Boateng',
}

type Fixture = { counters?: unknown[]; payers?: unknown[] }

const mockData = ({ counters = [], payers = [] }: Fixture = {}) => ({
  data: {
    streams: [
      {
        id: 'stream-1',
        name: 'Adenta',
        activeBacentaCount: 7,
        arrivalsCounters: counters,
      },
    ],
    councils: [
      {
        id: 'council-1',
        name: 'Adenta',
        activeBacentaCount: 7,
        arrivalsPayers: payers,
      },
    ],
  },
  loading: false,
  error: undefined,
  refetch: vi.fn(),
})

beforeEach(() => {
  queryResult.mockReturnValue(mockData())
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

describe('ArrivalsCounters — empty', () => {
  it('renders its chrome and empty state in English', () => {
    renderPage(<ArrivalsCounters />)

    expect(screen.getByText('Arrivals Counters')).toBeInTheDocument()
    expect(
      screen.getByText('Manage the team that counts arrivals for this stream.')
    ).toBeInTheDocument()
    expect(screen.getByText('No arrivals counters yet')).toBeInTheDocument()
  })

  it('translates the chrome and empty state', async () => {
    await i18n.changeLanguage('fr')
    renderPage(<ArrivalsCounters />)

    expect(screen.getByText('Compteurs d’arrivées')).toBeInTheDocument()
    // Literal on purpose — "filière" is feminine, so this is where the
    // article-agreement bug lived.
    expect(
      screen.getByText(
        'Gérez l’équipe qui compte les arrivées pour cette filière.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Arrivals Counters')).not.toBeInTheDocument()
  })

  it('uses the established church-level word rather than a second translation', async () => {
    await i18n.changeLanguage('de')
    renderPage(<ArrivalsCounters />)

    // `Zweig` is shared.churchLevel.Stream; an independent rendering of
    // "Stream" here would mean the copy drifted from it.
    expect(
      screen.getByText(
        'Verwalten Sie das Team, das die Ankünfte für diesen Zweig zählt.'
      )
    ).toBeInTheDocument()
  })
})

describe('ArrivalsCounters — populated', () => {
  beforeEach(() => {
    queryResult.mockReturnValue(mockData({ counters: [COUNTER] }))
  })

  it('pluralises the counter headcount', () => {
    renderPage(<ArrivalsCounters />)
    expect(screen.getByText(/^1 person$/)).toBeInTheDocument()

    cleanup()
    queryResult.mockReturnValue(
      mockData({ counters: [COUNTER, { ...COUNTER, id: 'm3' }] })
    )
    renderPage(<ArrivalsCounters />)
    expect(screen.getByText(/^2 people$/)).toBeInTheDocument()
  })

  it('translates the remove aria-label and the confirmation dialog', async () => {
    await i18n.changeLanguage('de')
    renderPage(<ArrivalsCounters />)

    // Was a template literal — invisible except to screen readers.
    fireEvent.click(screen.getByRole('button', { name: 'Ama Mensah entfernen' }))

    expect(screen.getByText('Zähler entfernen?')).toBeInTheDocument()
    // <Trans> keeps the name bolded inside the translated sentence.
    expect(
      screen.getByText(/wirklich als Ankunftszähler entfernen/)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entfernen' })).toBeInTheDocument()
  })
})

describe('ArrivalsPayers', () => {
  it('renders the interpolated heading and active-bacenta count in English', () => {
    renderPage(<ArrivalsPayers />)

    expect(
      screen.getByText(
        'Select Adenta Council Arrivals Payment Governorship Members'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Number of Active Bacentas: 7')).toBeInTheDocument()
  })

  it('translates the interpolated heading, keeping the council name verbatim', async () => {
    await i18n.changeLanguage('es')
    renderPage(<ArrivalsPayers />)

    expect(
      screen.getByText(
        'Seleccionar los miembros de gobernación para el pago de llegadas del consejo Adenta'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Número de bacentas activas: 7')).toBeInTheDocument()
  })

  it('translates the empty-list message', async () => {
    await i18n.changeLanguage('pt')
    renderPage(<ArrivalsPayers />)

    expect(
      screen.getByText(
        'Não tem membros da governadoria para o pagamento de chegadas neste momento'
      )
    ).toBeInTheDocument()
  })

  it('translates the Delete affordance once a payer exists', async () => {
    queryResult.mockReturnValue(mockData({ payers: [PAYER] }))
    await i18n.changeLanguage('fr')
    renderPage(<ArrivalsPayers />)

    expect(screen.getAllByText('Supprimer').length).toBeGreaterThan(0)
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })
})
