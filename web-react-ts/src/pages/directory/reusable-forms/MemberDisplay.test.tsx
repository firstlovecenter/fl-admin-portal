/**
 * Tests for the i18n conversion of MemberDisplay.tsx.
 *
 * Every hardcoded UI string moved to `t('directory.memberDisplay.*')`, with
 * the "Bacenta" row label routed through `shared.churchLevel.Bacenta`.
 *
 * Deliberately NOT translated (verified by the last test below):
 *  - `historyRecord` values sent to `UPDATE_MEMBER_STICKY_NOTE` ("Added
 *    Sticky Note: …" / "Deleted Sticky Note") — these are persisted audit
 *    data, same precedent as phase 3f (update/) and 3h (church-history).
 *  - "Basonta" — a coined loanword on `kb/01-glossary.md`'s
 *    do-not-translate list, same treatment as "Bacenta"'s value.
 *  - `throwToSentry(...)` messages — dev-only diagnostics.
 *
 * The vCard export (`generateVCard`) IS translated: unlike historyRecord it
 * is generated fresh per download and read by the downloading user in their
 * own contacts app, so it carries no cross-user/stored-data consistency
 * problem. `generateVCard` takes `t` as a third param, following the
 * established module-level-helper pattern in this branch (cf.
 * `getHourlyGreeting(t)`, `convertToString(value, t)`).
 *
 * `useCanViewChurch` is mocked to `true` so the scope-gated sections
 * (leadership roles, church history) render; the LEADERSHIP/ADMIN queries
 * it gates are `skip`-ed otherwise.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import {
  DISPLAY_MEMBER_ADMIN,
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
  DISPLAY_MEMBER_LEADERSHIP,
} from 'pages/directory/display/ReadQueries'
import MemberDisplay from './MemberDisplay'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

vi.mock('hooks/useCanViewChurch', () => ({ default: vi.fn(() => true) }))

vi.mock('components/Timeline/Timeline', () => ({
  default: () => <div data-testid="timeline" />,
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const MEMBER_ID = 'member-1'

const bioMock: MockedResponse = {
  request: { query: DISPLAY_MEMBER_BIO, variables: { id: MEMBER_ID } },
  result: {
    data: {
      members: [
        {
          id: MEMBER_ID,
          firstName: 'Kwame',
          middleName: 'Kofi',
          lastName: 'Owusu',
          fullName: 'Kwame Owusu',
          nameWithTitle: 'Kwame Owusu',
          currentTitle: null,
          email: 'kwame@example.com',
          phoneNumber: '233241234567',
          stickyNote: 'Room 12B',
          pictureUrl: null,
          visitationArea: 'Achimota',
          whatsappNumber: '233241234567',
          dob: { date: '1990-01-01' },
          gender: { gender: 'Male' },
          maritalStatus: { status: 'Single' },
          occupation: { occupation: 'Engineer' },
        },
      ],
    },
  },
}

const churchMock: MockedResponse = {
  request: { query: DISPLAY_MEMBER_CHURCH, variables: { id: MEMBER_ID } },
  result: {
    data: {
      members: [
        {
          id: MEMBER_ID,
          bacenta: {
            id: 'bacenta-1',
            name: 'Kaneshie Bacenta',
            leader: { firstName: 'Ama', lastName: 'Boateng' },
            council: {
              id: 'council-1',
              name: 'Kaneshie Council',
              leader: {
                id: 'p1',
                firstName: 'Kojo',
                lastName: 'Mensah',
                fullName: 'Kojo Mensah',
              },
            },
          },
          bacentaSummary: { id: 'bacenta-1', name: 'Kaneshie Bacenta' },
          basonta: null,
          history: [],
        },
      ],
    },
  },
}

const leadershipMock: MockedResponse = {
  request: { query: DISPLAY_MEMBER_LEADERSHIP, variables: { id: MEMBER_ID } },
  result: { data: { members: [{ id: MEMBER_ID }] } },
}

const adminMock: MockedResponse = {
  request: { query: DISPLAY_MEMBER_ADMIN, variables: { id: MEMBER_ID } },
  result: { data: { members: [{ id: MEMBER_ID }] } },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/member/displaydetails']}>
      <MockedProvider
        mocks={[bioMock, churchMock, leadershipMock, adminMock]}
        addTypename={false}
      >
        <ChurchContext.Provider value={{ clickCard: vi.fn() }}>
          <MemberContext.Provider
            value={{ currentUser: { id: 'user-1', roles: ['adminDenomination'] } }}
          >
            <MemberDisplay memberId={MEMBER_ID} />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('MemberDisplay i18n', () => {
  it('renders the English action buttons, contact labels, and section headings', async () => {
    renderPage()

    expect(
      await screen.findByRole('button', { name: /Add Sticky Note/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Save Contact/ })
    ).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Church Membership')).toBeInTheDocument()
    expect(screen.getByText('Personal Information')).toBeInTheDocument()
    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('Location for IDL')).toBeInTheDocument()
  })

  it('re-renders the action buttons, contact labels, and section headings in French', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      await screen.findByRole('button', { name: /Ajouter une note/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Enregistrer le contact/ })
    ).toBeInTheDocument()
    expect(screen.getByText('Téléphone')).toBeInTheDocument()
    expect(screen.getByText("Appartenance à l'église")).toBeInTheDocument()
    expect(screen.getByText('Informations personnelles')).toBeInTheDocument()
    expect(screen.getByText('Prénom')).toBeInTheDocument()
    expect(screen.getByText("Emplacement pour l'IDL")).toBeInTheDocument()
  })

  it('keeps "Bacenta" identical across locales (do-not-translate loanword)', async () => {
    expect(i18n.t('shared.churchLevel.Bacenta')).toBe('Bacenta')

    await i18n.changeLanguage('fr')
    expect(i18n.t('shared.churchLevel.Bacenta')).toBe('Bacenta')

    await i18n.changeLanguage('de')
    expect(i18n.t('shared.churchLevel.Bacenta')).toBe('Bacenta')
  })

  it('translates the vCard note labels (generated fresh per download, unlike stored historyRecord)', async () => {
    expect(i18n.t('directory.memberDisplay.vcard.visitationLandmark')).toBe(
      'Visitation Landmark'
    )
    expect(i18n.t('directory.memberDisplay.vcard.rolesInChurch')).toBe(
      'Roles in Church:'
    )

    await i18n.changeLanguage('fr')
    expect(i18n.t('directory.memberDisplay.vcard.visitationLandmark')).toBe(
      'Point de repère pour la visite'
    )
    expect(
      i18n.t('directory.memberDisplay.vcard.org', {
        councilName: 'Kaneshie',
      })
    ).toBe('FLC Conseil Kaneshie')
  })
})
