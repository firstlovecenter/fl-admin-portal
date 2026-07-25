/**
 * Tests for the i18n conversion of ChurchHistoryView.tsx.
 *
 * Every hardcoded string moved to `t('directory.churchHistory.*')`. The
 * "Audit trail... for this {level}" sentence now routes `parentTypename`
 * through `shared.churchLevel.*` — except the special-cased `"Member"`
 * value (not a `ChurchLevel`), which resolves via the new
 * `directory.churchHistory.memberTypeName` key instead. No markup or
 * pagination/query logic changed.
 *
 * `hooks/useInfiniteScroll` is mocked (matches the established pattern for
 * heavy hooks in this branch, e.g. `ArrivalsCounterDashboard.test.tsx`
 * mocking `useComponentQuery`) — this component's real behavior depends on
 * Apollo + IntersectionObserver internals that are out of scope for an
 * i18n-only change; the mock lets these tests drive `loading`/`items`/
 * `totalCount` directly.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from 'lib/i18n'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import ChurchHistoryView from './ChurchHistoryView'

vi.mock('hooks/useInfiniteScroll')

vi.mock('components/Timeline/Timeline', () => ({
  default: () => <div data-testid="timeline" />,
}))

const mockedUseInfiniteScroll = vi.mocked(useInfiniteScroll)

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const baseHookResult = {
  data: { bacentas: [{ id: 'b1', name: 'Kaneshie Bacenta', historyCount: 2 }] },
  loading: false,
  error: undefined,
  fetchingMore: false,
  hasMore: false,
  sentinelRef: () => {},
  reset: async () => {},
}

function pluckParent(d: unknown) {
  const data = d as { bacentas?: Array<{ name: string; historyCount: number }> }
  const b = data?.bacentas?.[0]
  if (!b) return undefined
  return { displayName: b.name, historyCount: b.historyCount, history: [] }
}

describe('ChurchHistoryView i18n', () => {
  it('renders the English audit-trail sentence, empty state, and sidebar labels for a church level', () => {
    mockedUseInfiniteScroll.mockReturnValue({
      ...baseHookResult,
      items: [],
      totalCount: 0,
    })

    render(
      <ChurchHistoryView
        parentTypename="Bacenta"
        parentId="b1"
        query={{} as never}
        pluckParent={pluckParent}
        headingSuffix="History"
      />
    )

    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'Audit trail of leadership and status changes for this bacenta.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('No history yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Leadership changes and major events will appear here as they happen.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getByText('recorded entries')).toBeInTheDocument()
    expect(screen.getByText('About this log')).toBeInTheDocument()
  })

  it('uses the singular "recorded entry" when there is exactly one', () => {
    mockedUseInfiniteScroll.mockReturnValue({
      ...baseHookResult,
      items: [
        {
          id: 'h1',
          timeStamp: '2024-01-01',
          createdAt: { date: '2024-01-01' },
          loggedBy: { id: 'u1', firstName: 'A', lastName: 'B' },
          historyRecord: 'Something happened',
        },
      ],
      totalCount: 1,
    })

    render(
      <ChurchHistoryView
        parentTypename="Bacenta"
        parentId="b1"
        query={{} as never}
        pluckParent={pluckParent}
        headingSuffix="History"
      />
    )

    expect(screen.getByText('recorded entry')).toBeInTheDocument()
  })

  it('shows the "Showing X of Y" counter when fewer items are loaded than the total', () => {
    mockedUseInfiniteScroll.mockReturnValue({
      ...baseHookResult,
      items: [
        {
          id: 'h1',
          timeStamp: '2024-01-01',
          createdAt: { date: '2024-01-01' },
          loggedBy: { id: 'u1', firstName: 'A', lastName: 'B' },
          historyRecord: 'Something happened',
        },
      ],
      totalCount: 5,
    })

    render(
      <ChurchHistoryView
        parentTypename="Bacenta"
        parentId="b1"
        query={{} as never}
        pluckParent={pluckParent}
        headingSuffix="History"
      />
    )

    expect(screen.getByText('recorded entries')).toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 5')).toBeInTheDocument()
  })

  it('resolves "Member" (not a ChurchLevel) via the dedicated memberTypeName key', () => {
    mockedUseInfiniteScroll.mockReturnValue({
      ...baseHookResult,
      data: { members: [{ id: 'm1', firstName: 'A', lastName: 'B', historyCount: 0 }] },
      items: [],
      totalCount: 0,
    })

    render(
      <ChurchHistoryView
        parentTypename="Member"
        parentId="m1"
        query={{} as never}
        pluckParent={() => ({ displayName: 'A B', historyCount: 0, history: [] })}
        headingSuffix="History"
      />
    )

    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'Audit trail of leadership and status changes for this member.'
      )
    ).toBeInTheDocument()
  })

  it('re-renders the audit-trail sentence and sidebar labels in French', async () => {
    mockedUseInfiniteScroll.mockReturnValue({
      ...baseHookResult,
      items: [],
      totalCount: 0,
    })
    await i18n.changeLanguage('fr')

    render(
      <ChurchHistoryView
        parentTypename="Campus"
        parentId="c1"
        query={{} as never}
        pluckParent={() => ({ displayName: 'Achimota Campus', historyCount: 0, history: [] })}
        headingSuffix="Historique"
      />
    )

    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          "Journal d'audit des changements de responsables et de statut pour ce campus."
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Aucun historique pour le moment')).toBeInTheDocument()
    expect(screen.getByText('Résumé')).toBeInTheDocument()
  })
})
