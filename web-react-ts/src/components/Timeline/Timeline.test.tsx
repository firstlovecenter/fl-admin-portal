/**
 * Timeline display-time i18n: historyRecord strings stay English in Neo4j;
 * Timeline rewrites known templates via translateHistoryRecord and passes
 * parseDate a locale/t for relative labels. Date title text is not asserted
 * in detail here — only that history copy localizes.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import Timeline from './Timeline'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const churchContextValue = { clickCard: vi.fn() }

const sampleEntries = [
  {
    id: 'h1',
    timeStamp: '2024-06-15T10:30:00.000Z',
    createdAt: { date: '2024-06-15' },
    historyRecord: 'Ghana Family Oversight History Begins',
    loggedBy: { id: 'u1', firstName: 'Ama', lastName: 'Mensah' },
  },
  {
    id: 'h2',
    timeStamp: '2024-06-16T11:00:00.000Z',
    createdAt: { date: '2024-06-16' },
    historyRecord:
      'Ghana Family Oversight was closed down under UO-FLC190 Denomination',
    loggedBy: null,
  },
]

function renderTimeline() {
  return render(
    <MemoryRouter>
      <ChurchContext.Provider value={churchContextValue as never}>
        <Timeline entries={sampleEntries as never} />
      </ChurchContext.Provider>
    </MemoryRouter>
  )
}

describe('Timeline i18n', () => {
  it('renders English history record text when language is en', () => {
    renderTimeline()

    expect(
      screen.getByText('Ghana Family Oversight History Begins')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Ghana Family Oversight was closed down under UO-FLC190 Denomination'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ama Mensah' })).toBeInTheDocument()
  })

  it('rewrites closed-down / history-begins strings when language is fr', async () => {
    await i18n.changeLanguage('fr')
    renderTimeline()

    expect(
      screen.getByText('Début de l’historique de Ghana Family (Supervision)')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Ghana Family (Supervision) a été fermé sous UO-FLC190 (Dénomination)'
      )
    ).toBeInTheDocument()
  })

  it('returns null when there are no entries and not fetching', () => {
    const { container } = render(
      <MemoryRouter>
        <ChurchContext.Provider value={churchContextValue as never}>
          <Timeline entries={[]} />
        </ChurchContext.Provider>
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })
})
