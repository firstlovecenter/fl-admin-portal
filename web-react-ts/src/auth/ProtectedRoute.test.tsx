/**
 * Characterization tests for web-react-ts/src/auth/ProtectedRoute.tsx
 *
 * Covers the auth-gate logic: loading state, unauthenticated state, empty-roles
 * state, authorized access, unauthorized access, and a drift-guard test that
 * ties the gate directly to the real permitLeader helper (ADR-001).
 *
 * NOTE: ProtectedRoute imports useAuth from 'contexts/AuthContext' — the AuthContext
 * itself is mocked so no real network or token parsing happens.
 *
 * Architecture note (captured from reading the source):
 *   Lines 37–48 of ProtectedRoute.tsx are UNREACHABLE:
 *     - The `atHome && !isAuthenticated` branch is shadowed by the guard at line 29–35.
 *     - The `placeholder && !isAuthenticated` branch is similarly dead code because
 *       !isAuthenticated is caught and returns <LoadingScreen /> before reaching it.
 *   Tests do not cover unreachable branches — they document the live paths only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import { permitLeader } from 'permission-utils'
import type { Role } from 'global-types'
import ProtectedRoute from './ProtectedRoute'

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

// useAuth: intercept before ProtectedRoute imports it.
vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Login: ProtectedRoute imports Login (used in an unreachable branch).
// Login transitively imports react-slick → enquire.js, which calls
// window.matchMedia at module load time.  jsdom does not implement matchMedia,
// so we stub Login to prevent the import chain from running.
vi.mock('components/Login', () => ({
  default: () => null,
}))

// Bring in the mocked function so individual tests can configure it.
import { useAuth } from 'contexts/AuthContext'
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal currentUser shape that satisfies ProtectedRoute's access to
 * `currentUser.roles` and the optional church-ID setters used in the
 * (unreachable) placeholder branch.
 */
function makeUser(roles: Role[] = [], extras: Record<string, unknown> = {}) {
  return { id: 'user-1', roles, ...extras }
}

/** Minimal ChurchContext value — the real component only calls setters in
 *  unreachable branches but ChurchContext is still read via useContext. */
const stubChurch = {
  setBacentaId: vi.fn(),
  setGovernorshipId: vi.fn(),
  setCouncilId: vi.fn(),
  setStreamId: vi.fn(),
  setCampusId: vi.fn(),
}

/**
 * Render ProtectedRoute with configurable auth state, user, and route roles.
 * Wraps in MemoryRouter (provides useLocation) and both context providers.
 */
function renderRoute({
  isAuthenticated = true,
  isLoading = false,
  roles = [] as Role[],
  userRoles = [] as Role[],
  path = '/dashboard',
} = {}) {
  mockUseAuth.mockReturnValue({ isAuthenticated, isLoading })

  const user = makeUser(userRoles)

  return render(
    <MemoryRouter initialEntries={[path]}>
      <ChurchContext.Provider value={stubChurch}>
        <MemberContext.Provider value={{ currentUser: user }}>
          <ProtectedRoute roles={roles}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  afterEach(cleanup)
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  // ---- Case 1: Loading state -----------------------------------------------
  it('renders LoadingScreen (not children) when isLoading is true', () => {
    renderRoute({ isLoading: true, isAuthenticated: false, userRoles: [] })

    // The child must not render
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    // LoadingScreen renders a "Loading…" paragraph by default
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  // ---- Case 2: Unauthenticated --------------------------------------------
  it('renders LoadingScreen (not children) when isAuthenticated is false', () => {
    // NOTE: the comment in the source says "Not Authenticated means Authentication
    // is still happening", so LoadingScreen is intentionally shown — not UnauthMsg.
    renderRoute({
      isLoading: false,
      isAuthenticated: false,
      userRoles: [],
      roles: ['leaderBacenta'],
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    // UnauthMsg would render "You don't have access to this page" — verify it doesn't
    expect(
      screen.queryByText(/you don't have access/i)
    ).not.toBeInTheDocument()
    // LoadingScreen renders instead
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  // ---- Case 3: Authenticated but no roles populated yet -------------------
  it('renders LoadingScreen when currentUser.roles is empty', () => {
    // isAuthenticated=true but roles array is still empty (SetPermissions has
    // not populated currentUser yet).
    renderRoute({
      isLoading: false,
      isAuthenticated: true,
      userRoles: [],          // <-- triggers !currentUser.roles.length
      roles: ['leaderBacenta'],
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  // ---- Case 4: Authorized — matching role ---------------------------------
  it('renders children when user holds a permitted role', () => {
    renderRoute({
      isLoading: false,
      isAuthenticated: true,
      userRoles: ['leaderBacenta'],
      roles: ['leaderBacenta'],
    })

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
  })

  // ---- Case 5: Unauthorized — wrong role ----------------------------------
  it('renders UnauthMsg when user role does not match required roles', () => {
    renderRoute({
      isLoading: false,
      isAuthenticated: true,
      userRoles: ['leaderBacenta'],
      roles: ['leaderCouncil'],
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    // UnauthMsg renders this heading
    expect(
      screen.getByText(/you don't have access to this page/i)
    ).toBeInTheDocument()
  })

  // ---- Case 6: Drift guard — permitLeader links the gate to real helpers --
  describe('drift guard: roles list derived from permitLeader()', () => {
    // permitLeader('Bacenta') includes 'leaderBacenta' — this test fails if
    // permitLeader or ProtectedRoute's isAuthorised logic drift apart.
    it('allows a user with leaderBacenta when roles = permitLeader("Bacenta")', () => {
      renderRoute({
        isLoading: false,
        isAuthenticated: true,
        userRoles: ['leaderBacenta'],
        roles: permitLeader('Bacenta'),
      })

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    // permitLeader('Bacenta') does NOT include 'leaderBacenta' when we strip it —
    // but that would change the helper.  Instead, test the boundary: a user who only
    // has a role that is NOT in permitLeader('Bacenta') is denied.
    it('denies a user whose role is not in permitLeader("Bacenta")', () => {
      // 'fishers' is a valid Role but is not in any permitLeader() result.
      renderRoute({
        isLoading: false,
        isAuthenticated: true,
        userRoles: ['fishers'],
        roles: permitLeader('Bacenta'),
      })

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      expect(
        screen.getByText(/you don't have access to this page/i)
      ).toBeInTheDocument()
    })

    // Stronger drift guard: with roles = permitLeader('Council'), only Council-and-above
    // leaders should pass.  leaderBacenta is NOT in that set.
    it('denies leaderBacenta when roles = permitLeader("Council")', () => {
      renderRoute({
        isLoading: false,
        isAuthenticated: true,
        userRoles: ['leaderBacenta'],
        roles: permitLeader('Council'),
      })

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      expect(
        screen.getByText(/you don't have access to this page/i)
      ).toBeInTheDocument()
    })

    // And leaderCouncil IS in permitLeader('Council').
    it('allows leaderCouncil when roles = permitLeader("Council")', () => {
      renderRoute({
        isLoading: false,
        isAuthenticated: true,
        userRoles: ['leaderCouncil'],
        roles: permitLeader('Council'),
      })

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})
