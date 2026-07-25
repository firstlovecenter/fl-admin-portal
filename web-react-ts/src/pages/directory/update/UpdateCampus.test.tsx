/**
 * Tests for the i18n conversion of UpdateCampus.tsx.
 *
 * The only strings this wrapper owns are the `title` prop
 * (`t('directory.update.formTitle', {level: t('shared.churchLevel.Campus')})`)
 * and the `alertSuccess(t('directory.update.leaderChanged'))` toast on a
 * successful leader change. Form field content is covered by
 * CampusForm.test.tsx (phase 3a). `throwToSentry(...)` calls are
 * deliberately left as raw English literals (Sentry diagnostics aren't
 * user-facing — established precedent from phase 3b/3d/3e).
 *
 * This is the representative full-render test for the six near-identical
 * "Update{Level}" wrapper pages (Bacenta/Campus/Council/Governorship/
 * Oversight/Stream) — validates the `MockedProvider` + `DISPLAY_CAMPUS`
 * query pattern end to end. The other five use a lighter
 * translation-key-resolution test instead of duplicating this same
 * scaffolding six times (see UpdateCouncil.test.tsx etc. for the
 * rationale).
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { DISPLAY_CAMPUS } from 'pages/directory/display/ReadQueries'
import UpdateCampus from './UpdateCampus'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}

    unobserve() {}

    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).ResizeObserver = ResizeObserverStub
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const CAMPUS_ID = 'campus-1'
const churchContextValue = { campusId: CAMPUS_ID, clickCard: vi.fn() }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

const displayCampusMock: MockedResponse = {
  request: { query: DISPLAY_CAMPUS, variables: { id: CAMPUS_ID } },
  result: {
    data: {
      campuses: [
        {
          id: CAMPUS_ID,
          name: 'Achimota Campus',
          noIncomeTracking: false,
          currency: 'GHS',
          conversionRateToDollar: 12,
          streamCount: 1,
          councilCount: 1,
          governorshipCount: 1,
          bacentaCount: 1,
          vacationBacentaCount: 0,
          memberCount: 10,
          pastorCount: 1,
          oversight: { id: 'oversight-1', name: 'Achimota Oversight' },
          streams: [],
          admin: null,
          leader: {
            id: 'leader-1',
            firstName: 'Ama',
            lastName: 'Boateng',
            fullName: 'Ama Boateng',
            currentTitle: null,
            nameWithTitle: 'Ama Boateng',
            pictureUrl: null,
          },
          history: [],
        },
      ],
    },
  },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/campus/update']}>
      <MockedProvider mocks={[displayCampusMock]} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <UpdateCampus />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('UpdateCampus i18n', () => {
  it('renders the English "Update Campus Form" title once the query resolves', async () => {
    renderPage()

    expect(
      await screen.findByText('Update Campus Form', undefined, {
        timeout: 3000,
      })
    ).toBeInTheDocument()
  })

  it('renders the French-translated title', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      await screen.findByText('Formulaire de mise à jour : Campus', undefined, {
        timeout: 3000,
      })
    ).toBeInTheDocument()
  })
})
