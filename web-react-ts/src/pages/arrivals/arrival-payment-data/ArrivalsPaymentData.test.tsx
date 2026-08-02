/**
 * Regression coverage for the `topUp` / `vehicleCost` null-guard fix.
 *
 * DISPLAY_ARRIVALS_PAYMENT_DATA (../arrivalsQueries) can legitimately return
 * `null` for `topUp` and `vehicleCost` — e.g. a bacenta arrives before its
 * vehicle cost has been recorded. The two `columnHelper.accessor` cell
 * renderers around line 203-226 used to call
 * `info.getValue().toLocaleString(i18n.language)` unconditionally, which
 * threw `TypeError: Cannot read properties of null (reading
 * 'toLocaleString')` and crashed the whole page. The fix null-guards the
 * value and renders an empty string instead.
 *
 * `hooks/useInfiniteScroll` is mocked rather than driven through MSW/Apollo —
 * this matches the established pattern for every other consumer of this
 * hook (`ChurchHistoryView.test.tsx`, `MembersGrid.test.tsx`): the hook's own
 * Apollo + IntersectionObserver plumbing is out of scope, and mocking it lets
 * the test drive `items`/`data` directly to reproduce the exact null-payload
 * shape the API can return.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import ArrivalsPaymentData from './ArrivalsPaymentData'

vi.mock('hooks/useInfiniteScroll')

vi.mock('contexts/ChurchRoleScopeContext', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('contexts/ChurchRoleScopeContext')
  >()
  return {
    ...actual,
    useChurchRoleScope: () => ({
      selectedScope: undefined,
      selectedScopeKey: '',
      setSelectedScopeKey: vi.fn(),
      roleChurchOptions: [],
    }),
  }
})

const mockedUseInfiniteScroll = vi.mocked(useInfiniteScroll)

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

// Column order rendered by the table: # | bacenta | code | leader | council |
// attendance | confirmed | vehicle | in/out | topUp | vehicleCost | momo
const TOP_UP_CELL_INDEX = 9
const VEHICLE_COST_CELL_INDEX = 10

const nullRow = {
  stream: 'Adenta',
  bacenta: 'Kaneshie Bacenta',
  council: 'Accra Council',
  councilHead: 'Councillor',
  governorship: 'Accra Governorship',
  leader: 'Kofi Mensah',
  bacentaCode: 'KB01',
  attendance: 12,
  confirmedAttendance: 10,
  vehicle: 'Sprinter',
  outbound: 'In',
  topUp: null,
  vehicleCost: null,
  momoNumber: '0244000000',
  momoName: 'Kofi Mensah',
  comments: '',
  society: 'Main',
  date: '2026-08-02',
  arrivalTime: '09:00',
}

const numericRow = {
  ...nullRow,
  bacenta: 'Adenta Bacenta',
  leader: 'Ama Serwaa',
  bacentaCode: 'AB02',
  topUp: 1234.5,
  vehicleCost: 200,
}

const renderPage = (items: unknown[]) => {
  mockedUseInfiniteScroll.mockReturnValue({
    data: {
      streams: [
        {
          id: 'stream-1',
          name: 'Adenta',
          arrivalsPaymentCount: items.length,
          arrivalsPaymentData: items,
        },
      ],
    },
    items,
    totalCount: items.length,
    loading: false,
    error: undefined,
    fetchingMore: false,
    hasMore: false,
    sentinelRef: () => {},
    reset: async () => {},
  } as never)

  return render(
    <MemoryRouter>
      <ChurchContext.Provider
        value={{ arrivalDate: '2026-08-02', clickCard: vi.fn() } as never}
      >
        <MemberContext.Provider
          value={
            {
              currentUser: {
                id: 'u1',
                roles: [],
                stream: 'stream-1',
                currentChurch: { id: 'stream-1', name: 'Adenta' },
              },
            } as never
          }
        >
          <ArrivalsPaymentData />
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )
}

describe('ArrivalsPaymentData', () => {
  it('renders empty cells (not a crash) when topUp and vehicleCost are null', () => {
    renderPage([nullRow])

    const bacentaCell = screen.getByText('Kaneshie Bacenta')
    const row = bacentaCell.closest('tr')
    expect(row).not.toBeNull()

    const cells = within(row as HTMLTableRowElement).getAllByRole('cell')
    expect(cells[TOP_UP_CELL_INDEX]).toHaveTextContent('')
    expect(cells[VEHICLE_COST_CELL_INDEX]).toHaveTextContent('')
  })

  it('renders locale-formatted values when topUp and vehicleCost are numeric', () => {
    renderPage([numericRow])

    const bacentaCell = screen.getByText('Adenta Bacenta')
    const row = bacentaCell.closest('tr')
    expect(row).not.toBeNull()

    const cells = within(row as HTMLTableRowElement).getAllByRole('cell')
    expect(cells[TOP_UP_CELL_INDEX]).toHaveTextContent(
      (1234.5).toLocaleString('en')
    )
    expect(cells[VEHICLE_COST_CELL_INDEX]).toHaveTextContent(
      (200).toLocaleString('en')
    )
  })

  it('renders a mix of null and numeric rows without throwing, and shows both bacentas', () => {
    renderPage([nullRow, numericRow])

    expect(screen.getByText('Kaneshie Bacenta')).toBeInTheDocument()
    expect(screen.getByText('Adenta Bacenta')).toBeInTheDocument()
    // sanity: the page header rendered too, proving the whole tree mounted.
    expect(screen.getByText('Arrivals Payment')).toBeInTheDocument()
  })
})
