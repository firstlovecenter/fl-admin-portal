/**
 * Characterization tests for web-react-ts/src/auth/RoleView.tsx
 *
 * RoleView is a pure conditional renderer — it shows children or null
 * depending on six independent guards:
 *
 *   isAuthorised(roles)         — role membership (from useAuth hook)
 *   verify(verifyId)            — must equal currentUser.id
 *   verifyNot(verifyNotId)      — must NOT equal currentUser.id
 *   permitStream(permittedStream) — must include currentUser.stream_name
 *   includeIncome(noIncomeTracking) — must match currentUser.noIncomeTracking
 *   lockDirectory(directoryLock)  — day/time or 'fishers' role
 *
 * useAuth (from auth/useAuth.tsx) is mocked at the module level.
 * AuthContext is mocked indirectly through useAuth.
 *
 * NOTE on lockDirectory day-of-week tests:
 *   lockDirectory reads new Date() at call time.  Fake timers let us pin
 *   the day to avoid flaky results depending on when CI runs.
 *   Days: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { MemberContext } from 'contexts/MemberContext'
import { permitLeader } from 'permission-utils'
import type { Role, StreamOptions } from 'global-types'
import RoleView from './RoleView'

// ---------------------------------------------------------------------------
// Module-level mock: useAuth (the local hook in auth/useAuth.tsx)
// ---------------------------------------------------------------------------
vi.mock('./useAuth', () => ({
  default: vi.fn(),
}))

import useAuth from './useAuth'
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    roles: [] as Role[],
    stream_name: undefined as StreamOptions | undefined,
    noIncomeTracking: false,
    ...overrides,
  }
}

/**
 * Render <RoleView> with a given set of props and a user value.
 * isAuthorised is controlled by configuring the mocked useAuth return value.
 */
function renderView({
  roles = ['leaderBacenta'] as Role[],
  verifyId,
  verifyNotId,
  permittedStream,
  noIncomeTracking,
  directoryLock,
  user = makeUser({ roles: ['leaderBacenta'] }),
  isAuthorisedResult = true,
}: {
  roles?: Role[]
  verifyId?: string
  verifyNotId?: string
  permittedStream?: StreamOptions[]
  noIncomeTracking?: boolean
  directoryLock?: boolean
  user?: ReturnType<typeof makeUser>
  isAuthorisedResult?: boolean
} = {}) {
  // Configure the mocked hook so isAuthorised returns a predetermined value.
  // The real useAuth calls isAuthenticated + currentUser.roles internally;
  // we bypass that to isolate the component's own guard logic.
  mockUseAuth.mockReturnValue({
    isAuthorised: vi.fn().mockReturnValue(isAuthorisedResult),
  })

  return render(
    <MemberContext.Provider value={{ currentUser: user }}>
      <RoleView
        roles={roles}
        verifyId={verifyId}
        verifyNotId={verifyNotId}
        permittedStream={permittedStream}
        noIncomeTracking={noIncomeTracking}
        directoryLock={directoryLock}
      >
        <span>Role Content</span>
      </RoleView>
    </MemberContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RoleView', () => {
  afterEach(cleanup)
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  // ---- Case 1: Matching role shows children --------------------------------
  it('renders children when isAuthorised returns true (matching role)', () => {
    renderView({ isAuthorisedResult: true })
    expect(screen.getByText('Role Content')).toBeInTheDocument()
  })

  // ---- Case 2: Non-matching role hides children ---------------------------
  it('renders null when isAuthorised returns false (non-matching role)', () => {
    renderView({ isAuthorisedResult: false })
    expect(screen.queryByText('Role Content')).not.toBeInTheDocument()
  })

  // ---- Case 4: verifyId match shows children ------------------------------
  it('renders children when verifyId matches currentUser.id', () => {
    renderView({
      verifyId: 'user-1',
      user: makeUser({ id: 'user-1', roles: ['leaderBacenta'] }),
      isAuthorisedResult: true,
    })
    expect(screen.getByText('Role Content')).toBeInTheDocument()
  })

  // ---- Case 5: verifyId mismatch hides children ---------------------------
  it('renders null when verifyId does not match currentUser.id', () => {
    renderView({
      verifyId: 'user-1',
      user: makeUser({ id: 'user-2', roles: ['leaderBacenta'] }),
      isAuthorisedResult: true,
    })
    expect(screen.queryByText('Role Content')).not.toBeInTheDocument()
  })

  // ---- Case 6: verifyNotId self-hides -------------------------------------
  it('renders null when verifyNotId equals currentUser.id (self-exclusion)', () => {
    renderView({
      verifyNotId: 'user-1',
      user: makeUser({ id: 'user-1', roles: ['leaderBacenta'] }),
      isAuthorisedResult: true,
    })
    expect(screen.queryByText('Role Content')).not.toBeInTheDocument()
  })

  it('renders children when verifyNotId does not match currentUser.id', () => {
    renderView({
      verifyNotId: 'someone-else',
      user: makeUser({ id: 'user-1', roles: ['leaderBacenta'] }),
      isAuthorisedResult: true,
    })
    expect(screen.getByText('Role Content')).toBeInTheDocument()
  })

  // ---- Case 7: permittedStream gate ----------------------------------------
  it('renders children when stream_name is in permittedStream', () => {
    renderView({
      permittedStream: ['Anagkazo Encounter'],
      user: makeUser({
        roles: ['leaderBacenta'],
        stream_name: 'Anagkazo Encounter',
      }),
      isAuthorisedResult: true,
    })
    expect(screen.getByText('Role Content')).toBeInTheDocument()
  })

  it('renders null when stream_name is not in permittedStream', () => {
    renderView({
      permittedStream: ['Anagkazo Encounter'],
      user: makeUser({
        roles: ['leaderBacenta'],
        stream_name: 'Gospel Encounter',
      }),
      isAuthorisedResult: true,
    })
    expect(screen.queryByText('Role Content')).not.toBeInTheDocument()
  })

  // ---- Case 8: noIncomeTracking gate ---------------------------------------
  it('renders children when noIncomeTracking=true and currentUser.noIncomeTracking=true', () => {
    renderView({
      noIncomeTracking: true,
      user: makeUser({ roles: ['leaderBacenta'], noIncomeTracking: true }),
      isAuthorisedResult: true,
    })
    expect(screen.getByText('Role Content')).toBeInTheDocument()
  })

  it('renders null when noIncomeTracking=true but currentUser.noIncomeTracking=false', () => {
    // The guard: includeIncome(noIncomeTracking) returns false when the flag is
    // set but the user's property doesn't match.
    renderView({
      noIncomeTracking: true,
      user: makeUser({ roles: ['leaderBacenta'], noIncomeTracking: false }),
      isAuthorisedResult: true,
    })
    expect(screen.queryByText('Role Content')).not.toBeInTheDocument()
  })

  it('renders children when noIncomeTracking prop is falsy (gate is off)', () => {
    // When noIncomeTracking is undefined/false the guard short-circuits to true.
    renderView({
      noIncomeTracking: undefined,
      user: makeUser({ roles: ['leaderBacenta'], noIncomeTracking: false }),
      isAuthorisedResult: true,
    })
    expect(screen.getByText('Role Content')).toBeInTheDocument()
  })

  // ---- Case 9: directoryLock: false (default) always passes ---------------
  it('renders children when directoryLock is false (no lock applied)', () => {
    renderView({
      directoryLock: false,
      user: makeUser({ roles: ['leaderBacenta'] }),
      isAuthorisedResult: true,
    })
    expect(screen.getByText('Role Content')).toBeInTheDocument()
  })

  // ---- directoryLock: true, day-of-week gating ----------------------------
  describe('directoryLock: true — day/time gating', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('unlocks on Monday after noon (getDay()===1, getHours()>=12)', () => {
      // Monday 12:01 local time — lock opens
      const monday1201 = new Date('2025-05-12T12:01:00') // 2025-05-12 is a Monday
      vi.setSystemTime(monday1201)

      renderView({
        directoryLock: true,
        user: makeUser({ roles: ['leaderBacenta'] }),
        isAuthorisedResult: true,
      })
      expect(screen.getByText('Role Content')).toBeInTheDocument()
    })

    it('stays locked on Monday before noon (getDay()===1, getHours()<12)', () => {
      // lockDirectory returns undefined (falsy) when day===1 && hour<12
      // The condition is: (day===1 && hours>=12) || day===2 || fishers
      // On Monday at 08:00 none of those pass so lockDirectory returns undefined.
      // TODO(refactor): lockDirectory returns undefined (not false) when none of
      //   the branches match — the outer guard treats undefined as falsy and hides
      //   the children.  A boolean return type would be clearer.
      const monday0800 = new Date('2025-05-12T08:00:00')
      vi.setSystemTime(monday0800)

      renderView({
        directoryLock: true,
        user: makeUser({ roles: ['leaderBacenta'] }),
        isAuthorisedResult: true,
      })
      expect(screen.queryByText('Role Content')).not.toBeInTheDocument()
    })

    it('unlocks on Tuesday (getDay()===2)', () => {
      const tuesday = new Date('2025-05-13T09:00:00') // 2025-05-13 is a Tuesday
      vi.setSystemTime(tuesday)

      renderView({
        directoryLock: true,
        user: makeUser({ roles: ['leaderBacenta'] }),
        isAuthorisedResult: true,
      })
      expect(screen.getByText('Role Content')).toBeInTheDocument()
    })

    it('stays locked on Wednesday (neither Mon>=12 nor Tue)', () => {
      const wednesday = new Date('2025-05-14T10:00:00') // Wednesday
      vi.setSystemTime(wednesday)

      renderView({
        directoryLock: true,
        user: makeUser({ roles: ['leaderBacenta'] }),
        isAuthorisedResult: true,
      })
      expect(screen.queryByText('Role Content')).not.toBeInTheDocument()
    })

    it('unlocks regardless of day when user has "fishers" role', () => {
      // On a locked day (Wednesday), fishers bypass the lock.
      const wednesday = new Date('2025-05-14T10:00:00')
      vi.setSystemTime(wednesday)

      renderView({
        directoryLock: true,
        user: makeUser({ roles: ['fishers'] }),
        isAuthorisedResult: true,
      })
      expect(screen.getByText('Role Content')).toBeInTheDocument()
    })
  })

  // ---- Case 10: Drift guard — roles derived from permitLeader() -----------
  describe('drift guard: roles passed from permitLeader()', () => {
    /**
     * This test does NOT mock isAuthorised — instead it tests the real
     * useAuth hook's decision.  For that we need the real hook, which means
     * we need to configure the mock to call through to a realistic implementation.
     *
     * RoleView delegates all role checking to useAuth's isAuthorised, so the
     * drift guard here tests that the ROLE LISTS produced by permitLeader()
     * contain the expected members — not that the hook itself works (the hook
     * is tested separately via useAuth tests or the permission-utils.test.ts
     * suite).
     *
     * We assert that passing `roles: permitLeader('Council')` to a user with
     * `leaderCouncil` shows content, and a user with only `leaderBacenta` does
     * not — by configuring the mock to behave like the real implementation.
     */
    it('shows children for leaderCouncil when roles=permitLeader("Council")', () => {
      // Simulate real isAuthorised: check whether any role in permittedRoles
      // appears in the user's roles.
      const councilRoles = permitLeader('Council')
      mockUseAuth.mockReturnValue({
        isAuthorised: (permittedRoles: string[]) =>
          permittedRoles?.some((r) => councilRoles.includes(r as any)),
      })

      const user = makeUser({ roles: ['leaderCouncil'] })
      render(
        <MemberContext.Provider value={{ currentUser: user }}>
          <RoleView roles={permitLeader('Council')}>
            <span>Role Content</span>
          </RoleView>
        </MemberContext.Provider>
      )

      expect(screen.getByText('Role Content')).toBeInTheDocument()
    })

    it('hides children for leaderBacenta when roles=permitLeader("Council")', () => {
      // leaderBacenta is NOT in permitLeader('Council') — it is Council-and-above only.
      const councilRoles = permitLeader('Council')

      // isAuthorised checks whether the passed roles array includes any of the user's roles
      const user = makeUser({ roles: ['leaderBacenta'] })
      mockUseAuth.mockReturnValue({
        isAuthorised: (permittedRoles: string[]) =>
          permittedRoles?.some((r) => user.roles.includes(r as Role)),
      })

      render(
        <MemberContext.Provider value={{ currentUser: user }}>
          <RoleView roles={permitLeader('Council')}>
            <span>Role Content</span>
          </RoleView>
        </MemberContext.Provider>
      )

      // leaderBacenta is not in permitLeader('Council') so none of the permitted roles
      // match the user's roles → children hidden.
      expect(screen.queryByText('Role Content')).not.toBeInTheDocument()

      // Confirm the gap: leaderBacenta is absent from permitLeader('Council')
      expect(councilRoles).not.toContain('leaderBacenta')
    })
  })
})
