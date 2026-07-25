/**
 * Tests for the i18n conversion of BacentaHistory.tsx.
 *
 * The only string this wrapper owns is the `headingSuffix` prop passed to
 * `ChurchHistoryView` (now `t('directory.churchHistory.headingSuffix')`).
 * This is the representative full-render test for the six near-identical
 * `*History.tsx` wrapper pages — the other five use a lighter
 * translation-key-resolution test instead of repeating this same
 * `useInfiniteScroll` mock six times (see CampusHistory.test.tsx etc.).
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import BacentaHistory from './BacentaHistory'

vi.mock('hooks/useInfiniteScroll')
vi.mock('components/Timeline/Timeline', () => ({
  default: () => <div data-testid="timeline" />,
}))

const mockedUseInfiniteScroll = vi.mocked(useInfiniteScroll)

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

function renderPage() {
  mockedUseInfiniteScroll.mockReturnValue({
    data: {
      bacentas: [{ id: 'b1', name: 'Kaneshie Bacenta', historyCount: 0 }],
    },
    items: [],
    totalCount: 0,
    loading: false,
    error: undefined,
    fetchingMore: false,
    hasMore: false,
    sentinelRef: () => {},
    reset: async () => {},
  })

  return render(
    <ChurchContext.Provider value={{ bacentaId: 'b1' }}>
      <BacentaHistory />
    </ChurchContext.Provider>
  )
}

describe('BacentaHistory i18n', () => {
  it('renders the English heading suffix', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Kaneshie Bacenta History' })
    ).toBeInTheDocument()
  })

  it('renders the French-translated heading suffix', async () => {
    await i18n.changeLanguage('fr')
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Kaneshie Bacenta Historique' })
    ).toBeInTheDocument()
  })
})
