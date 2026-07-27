/**
 * Translation coverage for the maps page group.
 *
 * The interesting risk here is the two module-scope config objects
 * (`VenuePanel`'s `CONFIG`, `AddVenueSheet`'s `VENUE_CONFIG`). They can't
 * call the component's `t`, so their display fields became key paths
 * (`label` -> `labelKey`) resolved at render. That indirection is easy to
 * half-wire — a page rendering the raw key path would look plausible in a
 * screenshot — so every case below asserts the resolved copy, and the
 * category cases check that each of the four venue kinds resolves its *own*
 * entry rather than sharing one.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'

import VenuePanel from './components/VenuePanel'
import AddVenueSheet from './components/AddVenueSheet'
import InfoWindowCard from './components/InfoWindowCard'

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

beforeEach(() => {
  queryResult.mockReturnValue({
    data: {
      indoorVenues: [],
      outdoorVenues: [],
      hostels: [],
      highSchools: [],
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

const wrap = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      {/* VenuePanel renders member cards that read currentUser. */}
      <MemberContext.Provider
        value={{ currentUser: { id: 'u1', roles: [] } } as never}
      >
        {/* MemberInfo navigates via clickCard. */}
        <ChurchContext.Provider value={{ clickCard: vi.fn() } as never}>
          {ui}
        </ChurchContext.Provider>
      </MemberContext.Provider>
    </MemoryRouter>
  )

describe('VenuePanel — config key paths resolve', () => {
  const KINDS = [
    ['indoor', 'Indoor venues', 'Lieux intérieurs'],
    ['outdoor', 'Outdoor venues', 'Lieux extérieurs'],
    ['hostel', 'Hostels', 'Résidences'],
    ['school', 'Senior high schools', 'Lycées'],
  ] as const

  it.each(KINDS)('%s resolves its own English title', (kind, english) => {
    wrap(<VenuePanel kind={kind} setCentre={vi.fn()} />)
    expect(screen.getByText(english)).toBeInTheDocument()
  })

  it.each(KINDS)(
    '%s resolves its own French title',
    async (kind, _en, french) => {
      await i18n.changeLanguage('fr')
      wrap(<VenuePanel kind={kind} setCentre={vi.fn()} />)
      expect(screen.getByText(french)).toBeInTheDocument()
    }
  )

  it('never renders a raw key path', async () => {
    await i18n.changeLanguage('de')
    wrap(<VenuePanel kind="indoor" setCentre={vi.fn()} />)
    expect(screen.queryByText(/^maps\./)).not.toBeInTheDocument()
    expect(screen.getByText('Innenorte')).toBeInTheDocument()
  })

  it('translates the sort pills and the empty hint', async () => {
    await i18n.changeLanguage('es')
    wrap(<VenuePanel kind="hostel" setCentre={vi.fn()} />)

    expect(screen.getByText('Ordenar por')).toBeInTheDocument()
    expect(
      screen.getByText('Aún no hay residencias: añada una para empezar.')
    ).toBeInTheDocument()
  })
})

describe('AddVenueSheet', () => {
  it('resolves its own title and description per kind', () => {
    wrap(<AddVenueSheet kind="indoor" open onOpenChange={vi.fn()} />)
    expect(screen.getByText('Add indoor outreach venue')).toBeInTheDocument()

    cleanup()
    wrap(<AddVenueSheet kind="school" open onOpenChange={vi.fn()} />)
    expect(screen.getByText('Add senior high school')).toBeInTheDocument()
  })

  it('translates the form labels and placeholders', async () => {
    await i18n.changeLanguage('pt')
    wrap(<AddVenueSheet kind="indoor" open onOpenChange={vi.fn()} />)

    expect(screen.getByText('Nome do local')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Introduza o nome do local')
    ).toBeInTheDocument()
    expect(screen.getByText('Localização')).toBeInTheDocument()
    expect(screen.queryByText('Venue name')).not.toBeInTheDocument()
  })

  it('shows the School field only for kinds that have one', async () => {
    await i18n.changeLanguage('fr')
    wrap(<AddVenueSheet kind="hostel" open onOpenChange={vi.fn()} />)
    expect(screen.getByText('École')).toBeInTheDocument()

    cleanup()
    wrap(<AddVenueSheet kind="indoor" open onOpenChange={vi.fn()} />)
    expect(screen.queryByText('École')).not.toBeInTheDocument()
  })
})

describe('InfoWindowCard', () => {
  // Detail fields come out of a JSON `description` blob, not top-level props.
  const place = {
    id: 'v1',
    name: 'Adenta Hall',
    typename: 'IndoorVenue' as const,
    latitude: 5.6,
    longitude: -0.2,
    description: JSON.stringify({
      venue: { capacity: 250, school: 'Adenta SHS' },
      category: 'Indoor',
    }),
  }

  it('translates its detail labels', async () => {
    await i18n.changeLanguage('de')
    wrap(<InfoWindowCard place={place as never} />)

    expect(screen.getByText('Kapazität:')).toBeInTheDocument()
    expect(screen.queryByText('Capacity:')).not.toBeInTheDocument()
  })

  it('reuses the shared Call / WhatsApp labels rather than its own copies', async () => {
    await i18n.changeLanguage('fr')
    const member = {
      id: 'm1',
      name: 'Ama Mensah',
      typename: 'Member' as const,
      latitude: 5.6,
      longitude: -0.2,
      description: JSON.stringify({
        member: { id: 'm1', firstName: 'Ama', lastName: 'Mensah' },
        council: { id: 'c1', name: 'Adenta' },
        pastor: { id: 'p1', firstName: 'Kofi', lastName: 'Boateng' },
        phoneNumber: '0201234567',
        whatsappNumber: '0201234567',
      }),
    }
    wrap(<InfoWindowCard place={member as never} />)

    expect(screen.getByText(i18n.t('shared.actions.call'))).toBeInTheDocument()
    expect(i18n.t('shared.actions.call')).toBe('Appeler')
  })
})
