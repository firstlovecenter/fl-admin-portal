/**
 * Tests for the i18n conversion of BacentaAvgWeekdayQuickFacts.tsx.
 *
 * Every hardcoded English string moved to `t('directory.quickFacts.*')` /
 * `t('directory.leaderTitle.bacentaLeader')` / `t('shared.churchLevel.*')`.
 * No markup, layout, or query logic changed. `ApolloWrapper` is rendered
 * with `placeholder` set, so it renders `children` immediately regardless
 * of `data`/`loading` — these tests await the mocked query resolving via
 * `findByText` rather than relying on the placeholder gate.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import BacentaAvgWeekdayQuickFacts from './BacentaAvgWeekdayQuickFacts'
import { BACENTA_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const churchContextValue = { bacentaId: 'bacenta-1' }
const memberContextValue = { currentUser: { currency: 'GHS' } }

const mockData = {
  bacentas: [
    {
      id: 'bacenta-1',
      name: 'Kaneshie Bacenta',
      avgBussingAttendance: 12,
      leader: {
        id: 'leader-1',
        firstName: 'Kwame',
        lastName: 'Owusu',
        nameWithTitle: 'Kwame Owusu',
        pictureUrl: null,
      },
      avgWeekdayStats: { income: 500, attendance: 20 },
      council: {
        id: 'council-1',
        name: 'Kaneshie Council',
        avgBacentaBussingAttendance: 10,
        avgBacentaWeekdayStats: { income: 400, attendance: 18 },
      },
    },
  ],
}

const mocks = [
  {
    request: {
      query: BACENTA_AVG_WEEKDAY_STATS,
      variables: { bacentaId: 'bacenta-1', days: 30 },
    },
    result: { data: mockData },
  },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bacenta/quick-facts']}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <BacentaAvgWeekdayQuickFacts />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('BacentaAvgWeekdayQuickFacts i18n', () => {
  it('renders the default English heading, description, leader title, and metric labels', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Kaneshie Bacenta Quick Facts' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'How this Bacenta compares against the average Bacenta in Kaneshie Council.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Bacenta Leader')).toBeInTheDocument()
    expect(screen.getByText('Weekday Attendance')).toBeInTheDocument()
    expect(screen.getByText('Sunday Bussing')).toBeInTheDocument()
    expect(screen.getByText('Weekday Income')).toBeInTheDocument()
    expect(screen.getAllByText('Council avg')).toHaveLength(3)
  })

  it('re-renders the heading, description, leader title, and metric labels in French', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Kaneshie Bacenta Faits rapides',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'Comparaison de Bacenta par rapport à la moyenne des Bacenta de Kaneshie Council.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Chef de Bacenta')).toBeInTheDocument()
    expect(screen.getByText('Fréquentation en semaine')).toBeInTheDocument()
    expect(screen.getAllByText('Moyenne Conseil')).toHaveLength(3)
  })
})
