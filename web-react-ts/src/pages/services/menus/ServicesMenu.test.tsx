/**
 * Regression test for SYN-203 — ServicesMenu.tsx `churchDetails` merge.
 *
 * The bug: `ServicesMenuInner` resolves `isManualBanking` from `userJobs` by
 * scanning each job's `church[]` for the selected `churchId`. A user can hold
 * MULTIPLE roles on the SAME stream, and each job type is queried with a
 * DIFFERENT field set:
 *   - arrivals-counter job church → { __typename, id, name }  (NO isManualBanking)
 *   - teller job church          → { __typename, id, name, bankAccount,
 *                                     isManualBanking, vacationStatus }
 * The job build order puts the arrivals-counter job BEFORE the teller job, so
 * the OLD code (first-match-wins) returned the arrivals-counter church whose
 * `isManualBanking` is undefined → `!!undefined === false` → the menu showed
 * "Self Banking"/"Banking Slips" and hid "Receive Midweek Offering".
 *
 * The FIX merges every matching job's church (a defined value on ANY role
 * wins), so `isManualBanking: true` from the teller job is picked up
 * regardless of ordering.
 *
 * These tests render the component and assert the observable menu:
 *   - manual-banking stream → "Receive Midweek Offering" shown; banking-self
 *     cards hidden.
 *   - non-manual stream    → "Self Banking" shown; "Receive Midweek Offering"
 *     hidden.
 *
 * How it is driven (see the inline notes on each mock):
 *   - `useChurchRoleScope` is mocked to a fixed Stream scope — simpler than
 *     driving the real provider (which resolves the scope asynchronously from
 *     userJobs + sessionStorage).
 *   - `contexts/AuthContext` `useAuth` is mocked to `isAuthenticated: true` so
 *     `RoleView`'s `isAuthorised` returns true for `tellerStream`.
 *   - `hooks/useSetUserChurch` is stubbed so no context writes fire.
 *   - Apollo `LATEST_SERVICE_FOR_STREAM` is mocked (the Stream service toggle
 *     fires it); its result is not asserted.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { LATEST_SERVICE_FOR_STREAM } from 'pages/services/ServicesQueries'
import ServicesMenu from './ServicesMenu'

const STREAM_ID = 'stream-passion-weekday'

// useChurchRoleScope drives the selected church. Mock it to a fixed Stream
// scope so the component reads churchId/churchType deterministically.
vi.mock('contexts/ChurchRoleScopeContext', () => ({
  useChurchRoleScope: () => ({
    selectedScope: {
      churchId: STREAM_ID,
      churchType: 'Stream',
      churchName: 'Passion Weekday',
    },
  }),
}))

// RoleView → useAuth (auth/useAuth) → useAuth (contexts/AuthContext). Mock the
// context so isAuthorised gates purely on currentUser.roles.
vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

// useSetUserChurch touches MemberContext.setCurrentUser + sessionStorage on
// Defaulters navigation. Stub it — no card is clicked in these tests.
vi.mock('hooks/useSetUserChurch', () => ({
  default: () => ({ setUserChurch: vi.fn(), setUserFinancials: vi.fn() }),
}))

// The Stream service toggle fires LATEST_SERVICE_FOR_STREAM. Provide a mock so
// Apollo doesn't warn about an unmatched request; the result is not asserted.
const latestServiceMock = {
  request: {
    query: LATEST_SERVICE_FOR_STREAM,
    variables: { streamId: STREAM_ID },
  },
  result: {
    data: {
      streams: [{ id: STREAM_ID, services: [] }],
    },
  },
}

// A teller job church carries the full banking field set (isManualBanking).
const tellerJobChurch = (isManualBanking: boolean, bankAccount: string) => ({
  __typename: 'Stream',
  id: STREAM_ID,
  name: 'Passion Weekday',
  vacationStatus: 'No',
  bankAccount,
  isManualBanking,
})

// An arrivals-counter job church carries ONLY {id, name} — no isManualBanking.
const arrivalsCounterJobChurch = () => ({
  __typename: 'Stream',
  id: STREAM_ID,
  name: 'Passion Weekday',
})

const makeMemberContextValue = (userJobs: unknown[]) => ({
  currentUser: {
    id: 'user-1',
    roles: ['tellerStream', 'arrivalsCounterStream'],
    currentChurch: {
      __typename: 'Stream',
      id: STREAM_ID,
      name: 'Passion Weekday',
    },
  },
  userJobs,
  setCurrentUser: vi.fn(),
  setUserJobs: vi.fn(),
})

const churchContextValue = {
  clickCard: vi.fn(),
}

function renderMenu(userJobs: unknown[]) {
  return render(
    <MemoryRouter initialEntries={['/services']}>
      <MockedProvider mocks={[latestServiceMock]} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={makeMemberContextValue(userJobs)}>
            <ServicesMenu />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('ServicesMenu — SYN-203 churchDetails merge', () => {
  afterEach(cleanup)

  it('shows "Receive Midweek Offering" (not Self/Slips) for a teller+arrivals-counter user on a manual-banking stream — arrivals-counter job FIRST', () => {
    // The arrivals-counter job (no isManualBanking) is intentionally FIRST.
    // Pre-fix: first-match-wins → isManualBanking undefined → false. Post-fix:
    // the teller job's isManualBanking:true is merged in and wins.
    const userJobs = [
      {
        name: 'Arrivals Counter',
        authRoles: 'arrivalsCounterStream',
        number: 0,
        church: [arrivalsCounterJobChurch()],
      },
      {
        name: 'Teller',
        authRoles: 'tellerStream',
        number: 1,
        church: [tellerJobChurch(true, 'manual')],
      },
    ]

    renderMenu(userJobs)

    expect(screen.getByText('Receive Midweek Offering')).toBeInTheDocument()
    expect(screen.queryByText('Self Banking')).not.toBeInTheDocument()
    expect(screen.queryByText('Banking Slips')).not.toBeInTheDocument()
  })

  it('shows "Self Banking" (not Receive Midweek Offering) for a non-manual stream', () => {
    const userJobs = [
      {
        name: 'Teller',
        authRoles: 'tellerStream',
        number: 0,
        church: [tellerJobChurch(false, 'fle_account')],
      },
    ]

    renderMenu(userJobs)

    expect(screen.getByText('Self Banking')).toBeInTheDocument()
    expect(screen.getByText('Banking Slips')).toBeInTheDocument()
    expect(
      screen.queryByText('Receive Midweek Offering')
    ).not.toBeInTheDocument()
  })

  it('is order-independent: teller job FIRST, arrivals-counter SECOND still shows "Receive Midweek Offering"', () => {
    const userJobs = [
      {
        name: 'Teller',
        authRoles: 'tellerStream',
        number: 0,
        church: [tellerJobChurch(true, 'manual')],
      },
      {
        name: 'Arrivals Counter',
        authRoles: 'arrivalsCounterStream',
        number: 1,
        church: [arrivalsCounterJobChurch()],
      },
    ]

    renderMenu(userJobs)

    expect(screen.getByText('Receive Midweek Offering')).toBeInTheDocument()
    expect(screen.queryByText('Self Banking')).not.toBeInTheDocument()
  })
})
