/**
 * Tests for the i18n conversion of StreamAvgWeekdayQuickFacts.tsx.
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
import StreamAvgWeekdayQuickFacts from './StreamAvgWeekdayQuickFacts'
import { STREAM_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const churchContextValue = { streamId: 'stream-1' }
const memberContextValue = { currentUser: { currency: 'GHS' } }

const mockData = {
  streams: [
    {
      id: 'stream-1',
      name: 'Kaneshie Stream',
      avgBussingAttendance: 40,
      leader: {
        id: 'leader-1',
        firstName: 'Abena',
        lastName: 'Darko',
        nameWithTitle: 'Abena Darko',
        pictureUrl: null,
      },
      avgWeekdayStats: { income: 2000, attendance: 90 },
      campus: {
        id: 'campus-1',
        name: 'Kaneshie Campus',
        avgStreamBussingAttendance: 35,
        avgStreamWeekdayStats: { income: 1800, attendance: 85 },
      },
    },
  ],
}

const mocks = [
  {
    request: {
      query: STREAM_AVG_WEEKDAY_STATS,
      variables: { streamId: 'stream-1', days: 30 },
    },
    result: { data: mockData },
  },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/stream/quick-facts']}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <StreamAvgWeekdayQuickFacts />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('StreamAvgWeekdayQuickFacts i18n', () => {
  it('renders the default English heading, description, leader title, and benchmark labels', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Kaneshie Stream Quick Facts' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'How this Stream compares against the average Stream in Kaneshie Campus.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Stream Leader')).toBeInTheDocument()
    expect(screen.getAllByText('Campus avg')).toHaveLength(3)
  })

  it('re-renders the heading, description, leader title, and benchmark labels in French', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Kaneshie Stream Faits rapides',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Chef de Filière')).toBeInTheDocument()
    expect(screen.getAllByText('Moyenne Campus')).toHaveLength(3)
  })
})
