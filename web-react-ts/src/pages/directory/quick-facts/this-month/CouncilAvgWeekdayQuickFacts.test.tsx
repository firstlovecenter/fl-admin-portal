/**
 * Tests for the i18n conversion of CouncilAvgWeekdayQuickFacts.tsx.
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
import CouncilAvgWeekdayQuickFacts from './CouncilAvgWeekdayQuickFacts'
import { COUNCIL_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const churchContextValue = { councilId: 'council-1' }
const memberContextValue = { currentUser: { currency: 'GHS' } }

const mockData = {
  councils: [
    {
      id: 'council-1',
      name: 'Kaneshie Council',
      avgBussingAttendance: 30,
      leader: {
        id: 'leader-1',
        firstName: 'Kojo',
        lastName: 'Mensah',
        nameWithTitle: 'Kojo Mensah',
        pictureUrl: null,
      },
      avgWeekdayStats: { income: 1200, attendance: 60 },
      stream: {
        id: 'stream-1',
        name: 'Kaneshie Stream',
        avgCouncilBussingAttendance: 25,
        avgCouncilWeekdayStats: { income: 1000, attendance: 55 },
      },
    },
  ],
}

const mocks = [
  {
    request: {
      query: COUNCIL_AVG_WEEKDAY_STATS,
      variables: { councilId: 'council-1', days: 30 },
    },
    result: { data: mockData },
  },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/council/quick-facts']}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <CouncilAvgWeekdayQuickFacts />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('CouncilAvgWeekdayQuickFacts i18n', () => {
  it('renders the default English heading, description, leader title, and benchmark labels', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Kaneshie Council Quick Facts' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'How this Council compares against the average Council in Kaneshie Stream.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Council Leader')).toBeInTheDocument()
    expect(screen.getAllByText('Stream avg')).toHaveLength(3)
  })

  it('re-renders the heading, description, leader title, and benchmark labels in French', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Kaneshie Council Faits rapides',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Chef de Conseil')).toBeInTheDocument()
    expect(screen.getAllByText('Moyenne Filière')).toHaveLength(3)
  })
})
