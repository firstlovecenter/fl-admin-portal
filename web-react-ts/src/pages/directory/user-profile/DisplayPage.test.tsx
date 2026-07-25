/**
 * Tests for the i18n conversion of DisplayPage.tsx (user-profile).
 *
 * Every hardcoded string moved to `t('directory.userProfile.*')`, plus the
 * "Bacenta" field label routed through `t('shared.churchLevel.Bacenta')`
 * (identity translation per the glossary's do-not-translate list, but kept
 * consistent with how every other church-level label in this branch is
 * looked up). No markup or query logic changed.
 *
 * `EditPage.tsx` (the sibling `/user-profile/edit` route) was checked and
 * has no hardcoded strings of its own — it's a thin `<MemberForm>` wrapper,
 * untouched here, tracked as part of the still-pending MemberForm.tsx pass.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { MemberContext } from 'contexts/MemberContext'
import {
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
} from 'pages/directory/display/ReadQueries'
import DisplayPage from './DisplayPage'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true, logout: vi.fn() })),
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const MEMBER_ID = 'member-1'
const memberContextValue = { currentUser: { id: MEMBER_ID } }

const displayMemberBioMock: MockedResponse = {
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
          stickyNote: null,
          pictureUrl: null,
          visitationArea: null,
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

const displayMemberChurchMock: MockedResponse = {
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
                id: 'pastor-1',
                firstName: 'Kojo',
                lastName: 'Mensah',
                fullName: 'Kojo Mensah',
              },
            },
          },
          bacentaSummary: { id: 'bacenta-1', name: 'Kaneshie Bacenta' },
          basonta: null,
          history: [],
          ministry: { name: 'Ushers' },
        },
      ],
    },
  },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/user-profile']}>
      <MockedProvider
        // Each query mock is duplicated: React re-renders around the
        // accordion-open interaction below can cause useQuery to re-execute
        // once more than a bare single-consumption MockedProvider mock
        // allows ("No more mocked responses" otherwise).
        mocks={[
          displayMemberBioMock,
          displayMemberBioMock,
          displayMemberChurchMock,
          displayMemberChurchMock,
        ]}
        addTypename={false}
      >
        <MemberContext.Provider value={memberContextValue}>
          <DisplayPage />
        </MemberContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('DisplayPage (user-profile) i18n', () => {
  it('renders the English edit button and accordion section triggers once the query resolves', async () => {
    renderPage()

    expect(
      await screen.findByRole('button', { name: 'Edit Your Profile' })
    ).toBeInTheDocument()
    expect(screen.getByText('Bio')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Church Groups')).toBeInTheDocument()
  })

  it('renders the English field labels once the Bio and Church Groups accordion sections are opened', async () => {
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByText('Bio'))
    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp No.')).toBeInTheDocument()

    await user.click(screen.getByText('Church Groups'))
    expect(screen.getByText('Overseeing Pastor')).toBeInTheDocument()
    expect(screen.getByText('Bacenta')).toBeInTheDocument()
    expect(screen.getByText('Ministry')).toBeInTheDocument()
  })

  it('re-renders the edit button and accordion section triggers in French', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      await screen.findByRole('button', { name: 'Modifier votre profil' })
    ).toBeInTheDocument()
    expect(screen.getByText('Historique')).toBeInTheDocument()
    expect(screen.getByText("Groupes d'église")).toBeInTheDocument()
  })

  it('renders the French field labels once the Bio and Church Groups accordion sections are opened', async () => {
    await i18n.changeLanguage('fr')
    renderPage()
    const user = userEvent.setup()

    await user.click(await screen.findByText('Bio'))
    expect(screen.getByText('Prénom')).toBeInTheDocument()

    await user.click(screen.getByText("Groupes d'église"))
    expect(screen.getByText('Pasteur superviseur')).toBeInTheDocument()
    // "Bacenta" is an untranslated loanword per kb/01-glossary.md — same
    // text in every locale.
    expect(screen.getByText('Bacenta')).toBeInTheDocument()
  })
})
