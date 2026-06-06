/**
 * useSelectedArrivalDate.test.tsx — SYN-158
 *
 * Characterization tests locking in the date-resolution behaviour of
 * useSelectedArrivalDate.
 *
 * THE BUG (now fixed, guarded here): the no-`?date=`-param case used to
 * resolve to ChurchContext.arrivalDate (a value re-synced on every chip tap),
 * while `navigateToDate` DROPS the `?date` param whenever the chosen date
 * equals the canonical default. The two disagreed, so resetting/selecting the
 * default produced a no-param URL that silently reverted to a stale day.
 *
 * THE FIX: the canonical default is `todayYmd()`, and the no-param resolution,
 * the param-drop sentinel, `resetToCurrent`, `linkWith`, and the current-week
 * anchor all key on it in lockstep. So the dashboard opens on today / the
 * current week, and dropping the param round-trips back to today rather than a
 * stale value. (Defaulting to the most recent *Sunday* — the first SYN-158
 * fix — instead opened the dashboard on the *previous* church week on any
 * non-Sunday, hiding today; that regression is what these tests now pin shut.)
 *
 * "Today" is pinned with fake timers to Saturday 2026-06-06, so the default is
 * deterministically 2026-06-06 and the current church week is 2026-06-01 (Mon)
 * → 2026-06-07 (Sun). 2026-05-31 is the previous week's Sunday — reachable via
 * `?date=` but no longer the default and no longer "current".
 *
 * Out of scope (documented):
 *   - prevWeek / nextWeek / jumpToNearest / daysInWeek snapping and the
 *     bussingDates-driven branches — these depend on GET_BUSSING_DATES data
 *     and are a separate concern from the SYN-158 date-resolution fix.
 *   - linkWith — pure string assembly, tested transitively via arrivalDate.
 */

import React from 'react'
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter, useSearchParams } from 'react-router-dom'

import { ChurchContext } from 'contexts/ChurchContext'
import useSelectedArrivalDate from './useSelectedArrivalDate'
import { GET_BUSSING_DATES } from './useSelectedArrivalDateQueries'

// ---------------------------------------------------------------------------
// Deterministic dates (system time pinned to Saturday 2026-06-06T12:00:00Z)
// ---------------------------------------------------------------------------

const TODAY = '2026-06-06' // Saturday — the canonical default
const CURRENT_WEEK_START = '2026-06-01' // Monday of the current church week
const PREV_SUNDAY = '2026-05-31' // previous week's Sunday — reachable, not current

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

type Ctx = {
  arrivalDate?: string
  setArrivalDate?: (next: string) => void
}

// GET_BUSSING_DATES is fired with `cache-and-network`, so the hook issues
// network requests on each render pass. Returning an empty list keeps the
// bussingDates-driven branches inert (they are out of scope here) and silences
// the "no more mocked responses" noise. Provide several copies because
// MockedProvider consumes a mock per request.
const bussingDatesMock = () => ({
  request: { query: GET_BUSSING_DATES },
  result: { data: { bussingDates: [] } },
})
// MockedProvider consumes one mock per request; `cache-and-network` plus
// re-renders can fire it a few times, so hand over a small pool.
const bussingDatesMocks = () => Array.from({ length: 6 }, bussingDatesMock)

/**
 * Render the hook wrapped in MemoryRouter (controls `?date=`), a
 * ChurchContext.Provider (controls ctx arrivalDate + spies setArrivalDate),
 * and an empty MockedProvider (GET_BUSSING_DATES tolerates no data — the
 * hook defaults bussingDates to []).
 */
const renderArrivalDate = (opts: {
  initialEntry?: string
  ctx?: Ctx
}) => {
  const { initialEntry = '/arrivals', ctx = {} } = opts
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>
      <MockedProvider mocks={bussingDatesMocks()} addTypename={false}>
        <ChurchContext.Provider value={ctx as never}>
          {children}
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )

  return renderHook(() => useSelectedArrivalDate(), { wrapper })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`))
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// 1. No `?date=` param → today, independent of context (SYN-158)
// ---------------------------------------------------------------------------

describe('useSelectedArrivalDate — no `?date=` param resolution (SYN-158)', () => {
  it('resolves to today with no param and no context value', () => {
    const { result } = renderArrivalDate({ initialEntry: '/arrivals' })

    expect(result.current.arrivalDate).toBe(TODAY)
  })

  it('resolves to today even when context holds a stale earlier day (the stale-context bug)', () => {
    // Before the fix, the no-param case adopted whatever ChurchContext last
    // held (re-synced on every chip tap). It must now ignore it and resolve
    // to today regardless.
    const setArrivalDate = vi.fn()
    const { result } = renderArrivalDate({
      initialEntry: '/arrivals',
      ctx: { arrivalDate: PREV_SUNDAY, setArrivalDate },
    })

    expect(result.current.arrivalDate).toBe(TODAY)
    expect(result.current.arrivalDate).not.toBe(PREV_SUNDAY)
  })

  it('ignores an arbitrary stale weekday in context for the no-param case', () => {
    const { result } = renderArrivalDate({
      initialEntry: '/arrivals',
      ctx: { arrivalDate: '2026-04-15' }, // some earlier Wednesday
    })

    expect(result.current.arrivalDate).toBe(TODAY)
  })
})

// ---------------------------------------------------------------------------
// 2 & 3. `?date=` param resolution (valid wins, invalid falls back)
// ---------------------------------------------------------------------------

describe('useSelectedArrivalDate — `?date=` param resolution', () => {
  it('uses a valid `?date=YYYY-MM-DD` param verbatim', () => {
    const { result } = renderArrivalDate({
      initialEntry: '/arrivals?date=2026-05-20',
    })

    expect(result.current.arrivalDate).toBe('2026-05-20')
  })

  it('reaches the previous week’s Sunday via an explicit `?date=` param', () => {
    // The whole point of SYN-158: a past Sunday must stay reachable.
    const { result } = renderArrivalDate({
      initialEntry: `/arrivals?date=${PREV_SUNDAY}`,
    })

    expect(result.current.arrivalDate).toBe(PREV_SUNDAY)
  })

  it('falls back to today for a malformed `?date=` param', () => {
    const { result } = renderArrivalDate({
      initialEntry: '/arrivals?date=not-a-date',
    })

    expect(result.current.arrivalDate).toBe(TODAY)
  })

  it('takes a well-formed-but-impossible date verbatim', () => {
    // 2026-02-30 matches the regex but `new Date` normalises it → still passes
    // isValidIsoDate (getTime is not NaN). TODO(refactor): isValidIsoDate only
    // checks the regex + parseability, not calendar validity, so 2026-02-30 is
    // accepted and round-trips as-is rather than falling back. Asserting the
    // ACTUAL (buggy-ish) behaviour: the param is taken verbatim.
    const { result } = renderArrivalDate({
      initialEntry: '/arrivals?date=2026-02-30',
    })

    expect(result.current.arrivalDate).toBe('2026-02-30')
  })

  it('falls back to today for an empty `?date=` param', () => {
    const { result } = renderArrivalDate({
      initialEntry: '/arrivals?date=',
    })

    expect(result.current.arrivalDate).toBe(TODAY)
  })
})

// ---------------------------------------------------------------------------
// 4. Sync effect writes resolved arrivalDate back into ChurchContext
// ---------------------------------------------------------------------------

describe('useSelectedArrivalDate — ChurchContext sync effect', () => {
  it('writes the resolved arrivalDate to context once when it differs', async () => {
    const setArrivalDate = vi.fn()
    renderArrivalDate({
      initialEntry: '/arrivals',
      ctx: { arrivalDate: PREV_SUNDAY, setArrivalDate },
    })

    await waitFor(() => {
      expect(setArrivalDate).toHaveBeenCalledWith(TODAY)
    })
    // One write, no render loop.
    expect(setArrivalDate).toHaveBeenCalledTimes(1)
  })

  it('does not call setArrivalDate when context already matches the resolved date', async () => {
    const setArrivalDate = vi.fn()
    renderArrivalDate({
      initialEntry: '/arrivals',
      ctx: { arrivalDate: TODAY, setArrivalDate },
    })

    // Give effects a chance to flush.
    await act(async () => {
      await Promise.resolve()
    })
    expect(setArrivalDate).not.toHaveBeenCalled()
  })

  it('tolerates a missing setArrivalDate on context (no throw)', () => {
    expect(() =>
      renderArrivalDate({ initialEntry: '/arrivals', ctx: {} })
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 5. isCurrent — based on the church week (Mon→Sun) containing today
// ---------------------------------------------------------------------------

describe('useSelectedArrivalDate — isCurrent', () => {
  it('is true for today (the current week default)', () => {
    const { result } = renderArrivalDate({ initialEntry: '/arrivals' })

    expect(result.current.arrivalDate).toBe(TODAY)
    expect(result.current.isCurrent).toBe(true)
  })

  it('is true for the Monday that starts the current church week', () => {
    const { result } = renderArrivalDate({
      initialEntry: `/arrivals?date=${CURRENT_WEEK_START}`,
    })

    expect(result.current.isCurrent).toBe(true)
  })

  it('is true for this week’s upcoming Sunday (last day of the church week)', () => {
    // 2026-06-07 is the Sunday closing the 2026-06-01 → 2026-06-07 week.
    const { result } = renderArrivalDate({
      initialEntry: '/arrivals?date=2026-06-07',
    })

    expect(result.current.isCurrent).toBe(true)
  })

  it('is false for the previous week’s Sunday', () => {
    // 2026-05-31 is the Sunday of the prior week (Mon 2026-05-25 → Sun 2026-05-31).
    const { result } = renderArrivalDate({
      initialEntry: `/arrivals?date=${PREV_SUNDAY}`,
    })

    expect(result.current.isCurrent).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 6. Label formatting (cheap + stable for the pinned dates)
// ---------------------------------------------------------------------------

describe('useSelectedArrivalDate — labels', () => {
  it('formats dateLabel and weekLabel for the default (today)', () => {
    const { result } = renderArrivalDate({ initialEntry: '/arrivals' })

    expect(result.current.dateLabel).toBe('Sat, 6 Jun 2026')
    expect(result.current.weekLabel).toBe('Week of 1–7 Jun 2026')
  })

  it('formats dateLabel for a date in a previous week', () => {
    const { result } = renderArrivalDate({
      initialEntry: `/arrivals?date=${PREV_SUNDAY}`,
    })

    expect(result.current.dateLabel).toBe('Sun, 31 May 2026')
    expect(result.current.weekLabel).toBe('Week of 25–31 May 2026')
  })
})

// ---------------------------------------------------------------------------
// 7. navigateToDate via public methods — the SYN-158 param-drop regression guard
// ---------------------------------------------------------------------------

describe('useSelectedArrivalDate — selectDate / resetToCurrent navigation', () => {
  it('resetToCurrent drops the `?date` param yet still resolves to today', async () => {
    // Start on an earlier date so there IS a param to drop.
    const { result } = renderArrivalDate({
      initialEntry: '/arrivals?date=2026-05-20',
    })
    expect(result.current.arrivalDate).toBe('2026-05-20')

    act(() => {
      result.current.resetToCurrent()
    })

    // Param is dropped, BUT arrivalDate resolves back to today (the fix).
    await waitFor(() => {
      expect(result.current.arrivalDate).toBe(TODAY)
    })
  })

  it('selectDate(today) drops the param but still resolves to today', async () => {
    const { result } = renderArrivalDate({
      initialEntry: '/arrivals?date=2026-05-20',
    })

    act(() => {
      result.current.selectDate(TODAY)
    })

    await waitFor(() => {
      expect(result.current.arrivalDate).toBe(TODAY)
    })
  })

  it('selectDate(otherDate) sets the param and resolves to that date', async () => {
    const { result } = renderArrivalDate({ initialEntry: '/arrivals' })
    expect(result.current.arrivalDate).toBe(TODAY)

    act(() => {
      result.current.selectDate('2026-05-13')
    })

    await waitFor(() => {
      expect(result.current.arrivalDate).toBe('2026-05-13')
    })
  })
})

// ---------------------------------------------------------------------------
// 7b. The URL actually loses the `date` param on the today default — proves
//     the param-drop is real and the resolution is what keeps arrivalDate
//     correct (the heart of the SYN-158 regression).
// ---------------------------------------------------------------------------

describe('useSelectedArrivalDate — param drop is observable on the URL', () => {
  it('removes `date` from the search string when resetting to the today default', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/arrivals?date=2026-05-20']}>
        <MockedProvider mocks={bussingDatesMocks()} addTypename={false}>
          <ChurchContext.Provider value={{} as never}>
            {children}
          </ChurchContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    )

    const { result } = renderHook(
      () => {
        const [params] = useSearchParams()
        const arrival = useSelectedArrivalDate()
        return { params, arrival }
      },
      { wrapper }
    )

    expect(result.current.params.get('date')).toBe('2026-05-20')

    act(() => {
      result.current.arrival.resetToCurrent()
    })

    await waitFor(() => {
      expect(result.current.params.get('date')).toBeNull()
    })
    // And the resolved arrivalDate survives the param drop.
    expect(result.current.arrival.arrivalDate).toBe(TODAY)
  })
})
