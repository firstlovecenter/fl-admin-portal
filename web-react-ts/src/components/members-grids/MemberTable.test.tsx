/**
 * MemberTable.test.tsx
 *
 * Covers:
 *  - normal mode: clicking a row calls clickCard and navigates to
 *    /member/displaydetails
 *  - selectMode: clicking a row calls onToggle with the member ID and does
 *    NOT trigger navigation
 *  - selectMode + selectedIds: selected row gets the bg-primary/5 class
 *  - selectMode: checkboxes are present (one per member per viewport layout)
 *  - empty state renders the i18n "no members" message
 *  - error state renders the i18n error message
 *
 * Both the mobile MemberRow and the desktop MemberCard are always present in
 * the DOM in jsdom (CSS is not applied). Tests that need to click a specific
 * member use getAllByText(name) and pick index [0] (the MemberRow).
 */
import React from 'react'
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ApolloError } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
// Initialise i18n so t() returns real English strings instead of raw keys.
import 'lib/i18n'
import MemberTable from './MemberTable'
import type { GridMember } from './MemberTable'

// ── Mock react-router-dom useNavigate ────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Radix Checkbox uses ResizeObserver ───────────────────────────────────────
// setup.ts already adds this, but guard in case the test file is run in
// isolation without the setup file.
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).ResizeObserver = ResizeObserverStub
  }
})

afterEach(() => {
  cleanup()
  mockNavigate.mockClear()
})

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MEMBERS: GridMember[] = [
  {
    id: 'member-1',
    firstName: 'Ama',
    lastName: 'Mensah',
    bacenta: { name: 'Grace Bacenta' },
  },
  {
    id: 'member-2',
    firstName: 'Kofi',
    lastName: 'Boateng',
  },
]

const mockClickCard = vi.fn()

function renderTable(
  props: Partial<React.ComponentProps<typeof MemberTable>> = {}
) {
  return render(
    <ChurchContext.Provider value={{ clickCard: mockClickCard }}>
      <MemoryRouter>
        <MemberTable data={MEMBERS} loading={false} {...props} />
      </MemoryRouter>
    </ChurchContext.Provider>
  )
}

// Helper: find the <p> that shows a member's full name and walk up to the
// enclosing <button>. Returns the FIRST match (the mobile MemberRow).
function getMemberRowButton(fullName: string): HTMLElement {
  const nameEls = screen.getAllByText(fullName)
  const btn = nameEls[0].closest('button')
  if (!btn) throw new Error(`No button parent found for text "${fullName}"`)
  return btn as HTMLElement
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MemberTable — normal mode', () => {
  afterEach(() => mockClickCard.mockClear())

  it('clicking a member row calls clickCard with the full member object', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(getMemberRowButton('Ama Mensah'))
    expect(mockClickCard).toHaveBeenCalledWith(MEMBERS[0])
  })

  it('clicking a member row navigates to /member/displaydetails', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(getMemberRowButton('Ama Mensah'))
    expect(mockNavigate).toHaveBeenCalledWith('/member/displaydetails')
  })
})

describe('MemberTable — selectMode', () => {
  afterEach(() => mockClickCard.mockClear())

  it('clicking a row calls onToggle with the member ID', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    renderTable({ selectMode: true, onToggle })
    await user.click(getMemberRowButton('Ama Mensah'))
    expect(onToggle).toHaveBeenCalledWith('member-1')
  })

  it('clicking a row does NOT call navigate in selectMode', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    renderTable({ selectMode: true, onToggle })
    await user.click(getMemberRowButton('Ama Mensah'))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('clicking a row does NOT call clickCard in selectMode', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    renderTable({ selectMode: true, onToggle })
    await user.click(getMemberRowButton('Ama Mensah'))
    expect(mockClickCard).not.toHaveBeenCalled()
  })

  it('selected row (member-1) gets the bg-primary/5 class in selectMode', () => {
    renderTable({
      selectMode: true,
      selectedIds: new Set(['member-1']),
      onToggle: vi.fn(),
    })
    const btn = getMemberRowButton('Ama Mensah')
    expect(btn).toHaveClass('bg-primary/5')
  })

  it('unselected row does NOT get the bg-primary/5 class in selectMode', () => {
    renderTable({
      selectMode: true,
      selectedIds: new Set(['member-1']),
      onToggle: vi.fn(),
    })
    // member-2 is not selected
    const btn = getMemberRowButton('Kofi Boateng')
    expect(btn).not.toHaveClass('bg-primary/5')
  })

  it('checkboxes are present for each member in selectMode', () => {
    renderTable({ selectMode: true, onToggle: vi.fn() })
    // Each member produces 2 checkboxes: one in MemberRow, one in MemberCard
    // (both rendered in jsdom since CSS breakpoints are not applied).
    const checkboxes = screen.getAllByLabelText('Select Ama Mensah')
    expect(checkboxes.length).toBeGreaterThanOrEqual(1)
  })

  it('checkboxes are NOT present in normal mode', () => {
    renderTable()
    expect(
      screen.queryAllByLabelText(/^Select Ama Mensah/)
    ).toHaveLength(0)
  })
})

describe('MemberTable — empty and error states', () => {
  it('shows the "no members" message when data is empty and not loading', () => {
    renderTable({ data: [] })
    expect(
      screen.getByText('No members match your search')
    ).toBeInTheDocument()
  })

  it('shows the load-error message when error prop is provided', () => {
    renderTable({ error: new ApolloError({ errorMessage: 'Network error' }) })
    expect(
      screen.getByText('Could not load members. Please try again.')
    ).toBeInTheDocument()
  })
})
