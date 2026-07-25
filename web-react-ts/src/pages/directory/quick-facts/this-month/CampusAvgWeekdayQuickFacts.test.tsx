/**
 * Tests for the i18n conversion of CampusAvgWeekdayQuickFacts.tsx.
 *
 * Same conversion/testing approach as BacentaAvgWeekdayQuickFacts.test.tsx —
 * see that file for the rationale on ApolloWrapper's `placeholder` prop and
 * why `addTypename={false}` is used (matches this repo's established
 * MockedProvider convention).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import CampusAvgWeekdayQuickFacts from './CampusAvgWeekdayQuickFacts'
import { CAMPUS_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const churchContextValue = { campusId: 'campus-1' }
const memberContextValue = { currentUser: { currency: 'GHS' } }

const mockData = {
  campuses: [
    {
      id: 'campus-1',
      name: 'Achimota Campus',
      avgBussingAttendance: 15,
      leader: {
        id: 'leader-1',
        firstName: 'Ama',
        lastName: 'Boateng',
        nameWithTitle: 'Ama Boateng',
        pictureUrl: null,
      },
      avgWeekdayStats: { income: 600, attendance: 25 },
      oversight: {
        id: 'oversight-1',
        name: 'Achimota Oversight',
        avgCampusBussingAttendance: 12,
        avgCampusWeekdayStats: { income: 500, attendance: 22 },
      },
    },
  ],
}

const mocks = [
  {
    request: {
      query: CAMPUS_AVG_WEEKDAY_STATS,
      variables: { campusId: 'campus-1', days: 30 },
    },
    result: { data: mockData },
  },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/campus/quick-facts']}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <CampusAvgWeekdayQuickFacts />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('CampusAvgWeekdayQuickFacts i18n', () => {
  it('renders the default English heading, description, leader title, and metric labels', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Achimota Campus Quick Facts' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'How this Campus compares against the average Campus in Achimota Oversight.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Campus Leader')).toBeInTheDocument()
    expect(screen.getAllByText('Oversight avg')).toHaveLength(3)
  })

  it('re-renders the heading, description, leader title, and benchmark labels in French', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Achimota Campus Faits rapides',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Chef de Campus')).toBeInTheDocument()
    expect(screen.getAllByText('Moyenne Supervision')).toHaveLength(3)
  })
})
