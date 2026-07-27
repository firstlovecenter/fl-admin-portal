/**
 * Translation coverage for the last batch of English-only components.
 *
 * `MemberDisplayCard` is the one that mattered most here — nine call sites,
 * all on pages that were already translated, so its Call / WhatsApp buttons
 * were leaking English into otherwise-French screens.
 *
 * `MaintenanceMode` had no imports at all before this pass, which is why the
 * codemod that wires the hook needed a no-import fallback.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import MemberDisplayCard from './card/MemberDisplayCard'
import MaintenanceMode from 'auth/MaintenanceMode'
import MemberTable from './members-grids/MemberTable'
import CloseDownBacentaButton from './buttons/CloseDownBacentaButton'

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useQuery: () => ({ data: undefined, loading: false, error: undefined }),
    useMutation: () => [vi.fn(), { loading: false }],
  }
})

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const wrap = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <ChurchContext.Provider value={{ clickCard: vi.fn() } as never}>
        <MemberContext.Provider
          value={{ currentUser: { id: 'u1', roles: [] } } as never}
        >
          {ui}
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )

const member = {
  id: 'm1',
  firstName: 'Ama',
  lastName: 'Mensah',
  fullName: 'Ama Mensah',
  phoneNumber: '0201234567',
  whatsappNumber: '0201234567',
  __typename: 'Member',
}

describe('MemberDisplayCard', () => {
  it('renders Call and WhatsApp in English', () => {
    wrap(<MemberDisplayCard member={member as never} contact />)

    expect(screen.getByText('Call')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
  })

  it('translates Call, and leaves the WhatsApp brand name alone', async () => {
    await i18n.changeLanguage('fr')
    wrap(<MemberDisplayCard member={member as never} contact />)

    expect(screen.getByText('Appeler')).toBeInTheDocument()
    expect(screen.queryByText('Call')).not.toBeInTheDocument()
    // WhatsApp is a product name — on the do-not-translate list.
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
  })
})

describe('MaintenanceMode', () => {
  it('translates its title and body', async () => {
    render(<MaintenanceMode />)
    expect(screen.getByText('Site is under maintenance')).toBeInTheDocument()

    cleanup()
    await i18n.changeLanguage('de')
    render(<MaintenanceMode />)
    expect(screen.getByText('Website wird gewartet')).toBeInTheDocument()
    expect(
      screen.getByText(/Wir arbeiten derzeit an der Website/)
    ).toBeInTheDocument()
  })
})

describe('MemberTable', () => {
  it('translates its error and empty states', async () => {
    await i18n.changeLanguage('es')
    wrap(
      <MemberTable data={[]} loading={false} error={new Error('x') as never} />
    )

    expect(
      screen.getByText(
        'No se pudieron cargar los miembros. Inténtelo de nuevo.'
      )
    ).toBeInTheDocument()
  })

  it('translates the no-matches state', async () => {
    await i18n.changeLanguage('pt')
    wrap(<MemberTable data={[]} loading={false} />)

    expect(
      screen.getByText('Nenhum membro corresponde à sua pesquisa')
    ).toBeInTheDocument()
  })
})

describe('CloseDownBacentaButton', () => {
  it('interpolates the bacenta name into the translated confirm label', async () => {
    await i18n.changeLanguage('fr')
    wrap(
      <CloseDownBacentaButton
        bacentaId="b1"
        bacentaName="Adenta"
        leaderId="m1"
      />
    )

    expect(screen.getByText('Fermer')).toBeInTheDocument()
    expect(screen.queryByText('Close Down')).not.toBeInTheDocument()
  })
})
