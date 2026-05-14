/**
 * Characterization tests for:
 *   web-react-ts/src/auth/Sabbath.tsx      — the pure display component
 *   web-react-ts/src/auth/SabbathGate.tsx  — the extracted date gate
 *
 * SabbathGate was extracted from the commented block in index.tsx
 * (lines 139–141) to give the date-check logic a testable seam.  The
 * component is otherwise not used in the running app yet — that wiring is
 * the next step after this PR.
 *
 * Gate rule (from the original comment):
 *   new Date().getDay() === 1 && new Date().getHours() > 4
 *   Monday = getDay() 1.  Africa/Accra is UTC+0 (no DST).
 *   "after 4 am" means getHours() > 4, i.e. 05:00 and later fires the gate.
 *   At exactly 04:00 (getHours() === 4) the gate does NOT fire.
 *
 * IMPORTANT: getDay() and getHours() return LOCAL time (not UTC).  Tests use
 * local-time ISO strings (no trailing Z) so the hour values are predictable
 * and timezone-agnostic across developer machines and CI.
 *
 * All time-sensitive tests pass a `now` prop directly to SabbathGate.
 * vi.useFakeTimers() tests are included but use the `now` prop override too
 * so they remain timezone-agnostic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import Sabbath from './Sabbath'
import SabbathGate from './SabbathGate'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a local Date for Monday 2025-05-12 at the given local hour.
 * Uses a local-time ISO string (no Z) so getDay() === 1 and getHours() === hour
 * regardless of the machine's timezone offset.
 */
function mondayLocal(hour: number): Date {
  return new Date(`2025-05-12T${String(hour).padStart(2, '0')}:00:00`)
}

/** Sunday 2025-05-11 at 10:00 local. getDay() === 0. */
const sundayLocal = new Date('2025-05-11T10:00:00')

/** Tuesday 2025-05-13 at 10:00 local. getDay() === 2. */
const tuesdayLocal = new Date('2025-05-13T10:00:00')

// ---------------------------------------------------------------------------
// Part 1 — Sabbath display component (smoke tests)
// ---------------------------------------------------------------------------

describe('Sabbath', () => {
  afterEach(cleanup)

  it('renders the heading "Today is the Sabbath!"', () => {
    render(<Sabbath />)
    expect(
      screen.getByRole('heading', { name: /today is the sabbath!/i })
    ).toBeInTheDocument()
  })

  it('renders the scripture reference "Exodus 20:8-10"', () => {
    render(<Sabbath />)
    expect(screen.getByText('Exodus 20:8-10')).toBeInTheDocument()
  })

  it('renders the scripture passage opening phrase', () => {
    render(<Sabbath />)
    expect(
      screen.getByText(/remember the sabbath day, to keep it holy/i)
    ).toBeInTheDocument()
  })

  it('renders the bolded "thou shalt not do any work..." phrase', () => {
    render(<Sabbath />)
    const bold = screen.getByText(/thou shalt not do any work\.\.\./i)
    expect(bold).toBeInTheDocument()
    // The source wraps this in a <b> element
    expect(bold.tagName).toBe('B')
  })

  it('renders the Dag Heward-Mills attribution', () => {
    render(<Sabbath />)
    expect(screen.getByText(/- Dag Heward-Mills/i)).toBeInTheDocument()
  })

  it('renders the "born again" advisory text', () => {
    render(<Sabbath />)
    expect(
      screen.getByText(/after you are born again/i)
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Part 2 — SabbathGate (extracted gate component)
// ---------------------------------------------------------------------------

describe('SabbathGate', () => {
  afterEach(cleanup)

  describe('now() prop override — timezone-agnostic tests', () => {
    /**
     * These tests pass a `now` prop so getDay() and getHours() are fully
     * deterministic regardless of the test runner's timezone.
     */

    // ---- Monday AFTER 04:00 — gate fires -----------------------------------
    it('renders <Sabbath /> on Monday at 05:00 local (getDay===1, getHours>4)', () => {
      render(
        <SabbathGate now={() => mondayLocal(5)}>
          <div>App Children</div>
        </SabbathGate>
      )

      expect(
        screen.getByRole('heading', { name: /today is the sabbath!/i })
      ).toBeInTheDocument()
      expect(screen.queryByText('App Children')).not.toBeInTheDocument()
    })

    it('renders <Sabbath /> on Monday at 12:00 local (well after 04:00)', () => {
      render(
        <SabbathGate now={() => mondayLocal(12)}>
          <div>App Children</div>
        </SabbathGate>
      )

      expect(
        screen.getByRole('heading', { name: /today is the sabbath!/i })
      ).toBeInTheDocument()
      expect(screen.queryByText('App Children')).not.toBeInTheDocument()
    })

    it('renders <Sabbath /> on Monday at 23:00 local (late evening)', () => {
      render(
        <SabbathGate now={() => mondayLocal(23)}>
          <div>App Children</div>
        </SabbathGate>
      )

      expect(
        screen.getByRole('heading', { name: /today is the sabbath!/i })
      ).toBeInTheDocument()
      expect(screen.queryByText('App Children')).not.toBeInTheDocument()
    })

    // ---- Monday AT 04:00 — gate must NOT fire (hours > 4, not >= 4) --------
    it('renders children on Monday at exactly 04:00 local (getHours === 4, boundary)', () => {
      // The gate condition is getHours() > 4, so 04:00 does NOT trigger it.
      render(
        <SabbathGate now={() => mondayLocal(4)}>
          <div>App Children</div>
        </SabbathGate>
      )

      expect(screen.getByText('App Children')).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: /today is the sabbath!/i })
      ).not.toBeInTheDocument()
    })

    // ---- Monday BEFORE 04:00 — gate must NOT fire --------------------------
    it('renders children on Monday at 00:00 local (midnight, before 04:00)', () => {
      render(
        <SabbathGate now={() => mondayLocal(0)}>
          <div>App Children</div>
        </SabbathGate>
      )

      expect(screen.getByText('App Children')).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: /today is the sabbath!/i })
      ).not.toBeInTheDocument()
    })

    // ---- Non-Monday days — gate must NOT fire -------------------------------
    it('renders children on Sunday (getDay === 0)', () => {
      render(
        <SabbathGate now={() => sundayLocal}>
          <div>App Children</div>
        </SabbathGate>
      )

      expect(screen.getByText('App Children')).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: /today is the sabbath!/i })
      ).not.toBeInTheDocument()
    })

    it('renders children on Tuesday (getDay === 2)', () => {
      render(
        <SabbathGate now={() => tuesdayLocal}>
          <div>App Children</div>
        </SabbathGate>
      )

      expect(screen.getByText('App Children')).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: /today is the sabbath!/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('vi.useFakeTimers() — verifies default now() path reads system clock', () => {
    /**
     * vi.setSystemTime() patches the global Date constructor.  These tests
     * verify that SabbathGate's default `() => new Date()` reads the faked
     * clock.  We still use local-time Date objects so getHours() stays
     * predictable across timezones.
     *
     * Africa/Accra = UTC+0 so these dates represent real Accra times.
     */

    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('renders <Sabbath /> when system clock is set to Monday 10:00 local', () => {
      vi.setSystemTime(mondayLocal(10))

      render(
        <SabbathGate>
          <div>App Children</div>
        </SabbathGate>
      )

      expect(
        screen.getByRole('heading', { name: /today is the sabbath!/i })
      ).toBeInTheDocument()
      expect(screen.queryByText('App Children')).not.toBeInTheDocument()
    })

    it('renders children when system clock is set to Wednesday 10:00 local', () => {
      vi.setSystemTime(new Date('2025-05-14T10:00:00')) // local Wednesday

      render(
        <SabbathGate>
          <div>App Children</div>
        </SabbathGate>
      )

      expect(screen.getByText('App Children')).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: /today is the sabbath!/i })
      ).not.toBeInTheDocument()
    })
  })
})
