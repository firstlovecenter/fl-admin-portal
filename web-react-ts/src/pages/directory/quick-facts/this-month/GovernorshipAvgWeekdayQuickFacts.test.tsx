/**
 * Tests for the i18n conversion of GovernorshipAvgWeekdayQuickFacts.tsx.
 *
 * Same conversion/testing approach as BacentaAvgWeekdayQuickFacts.test.tsx —
 * see that file for the rationale on ApolloWrapper's `placeholder` prop and
 * why `addTypename={false}` is used (matches this repo's established
 * MockedProvider convention).
 *
 * This page's `leaderTitle` is intentionally "Governorship Leader"
 * (`directory.leaderTitle.governorshipLeader`), distinct from the "Governor"
 * label (`directory.leaderTitle.governor`) used on `DetailsGovernorship.tsx`
 * — a pre-existing inconsistency in the source, preserved faithfully rather
 * than merged (see plan.md phase 3b notes).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import GovernorshipAvgWeekdayQuickFacts from './GovernorshipAvgWeekdayQuickFacts'
import { GOVERNORSHIP_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const churchContextValue = { governorshipId: 'governorship-1' }
const memberContextValue = { currentUser: { currency: 'GHS' } }

const mockData = {
  governorships: [
    {
      id: 'governorship-1',
      name: 'Kaneshie Governorship',
      avgBussingAttendance: 8,
      leader: {
        id: 'leader-1',
        firstName: 'Yaw',
        lastName: 'Asante',
        nameWithTitle: 'Yaw Asante',
        pictureUrl: null,
      },
      avgWeekdayStats: { income: 300, attendance: 15 },
      council: {
        id: 'council-1',
        name: 'Kaneshie Council',
        avgGovernorshipBussingAttendance: 7,
        avgGovernorshipWeekdayStats: { income: 280, attendance: 14 },
      },
    },
  ],
}

const mocks = [
  {
    request: {
      query: GOVERNORSHIP_AVG_WEEKDAY_STATS,
      variables: { governorshipId: 'governorship-1', days: 30 },
    },
    result: { data: mockData },
  },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/governorship/quick-facts']}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <GovernorshipAvgWeekdayQuickFacts />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('GovernorshipAvgWeekdayQuickFacts i18n', () => {
  it('renders the default English heading, description, leader title, and benchmark labels', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Kaneshie Governorship Quick Facts',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'How this Governorship compares against the average Governorship in Kaneshie Council.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Governorship Leader')).toBeInTheDocument()
    expect(screen.getAllByText('Council avg')).toHaveLength(3)
  })

  it('re-renders the heading, description, leader title, and benchmark labels in French', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Kaneshie Governorship Faits rapides',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Chef de Gouvernorat')).toBeInTheDocument()
    expect(screen.getAllByText('Moyenne Conseil')).toHaveLength(3)
  })
})
