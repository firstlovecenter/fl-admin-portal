/**
 * Characterization tests for:
 *   web-react-ts/src/auth/MaintenanceMode.tsx — the pure display component
 *   web-react-ts/src/auth/MaintenanceGate.tsx — the extracted maintenance gate
 *
 * MaintenanceGate was extracted from the commented block in index.tsx
 * (lines 143–149).  The original code used a hardcoded `if (true)` which
 * made the flag impossible to parameterise.  The extracted gate accepts an
 * `active: boolean` prop.
 *
 * TODO(refactor): The original commented-out gate in index.tsx used
 *   `if (true)` — a hardcoded literal that permanently blocks the app
 *   whenever it is uncommented.  The `active` prop on MaintenanceGate must
 *   be wired to an env var or remote flag before re-enabling the gate in
 *   production:
 *     <MaintenanceGate active={import.meta.env.VITE_MAINTENANCE === 'true'}>
 */
import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import MaintenanceMode from './MaintenanceMode'
import MaintenanceGate from './MaintenanceGate'

// ---------------------------------------------------------------------------
// Part 1 — MaintenanceMode display component (smoke tests)
// ---------------------------------------------------------------------------

describe('MaintenanceMode', () => {
  afterEach(cleanup)

  it('renders the heading "Site is under maintenance"', () => {
    render(<MaintenanceMode />)
    expect(
      screen.getByRole('heading', { name: /site is under maintenance/i })
    ).toBeInTheDocument()
  })

  it('renders the "back shortly" message body', () => {
    render(<MaintenanceMode />)
    expect(
      screen.getByText(
        /we are currently working on the site and will be back shortly/i
      )
    ).toBeInTheDocument()
  })

  it('renders the "thank you for your patience" phrase', () => {
    render(<MaintenanceMode />)
    expect(
      screen.getByText(/thank you for your patience/i)
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Part 2 — MaintenanceGate (extracted gate component)
// ---------------------------------------------------------------------------

describe('MaintenanceGate', () => {
  afterEach(cleanup)

  it('renders <MaintenanceMode /> when active is true', () => {
    render(
      <MaintenanceGate active>
        <div>App Children</div>
      </MaintenanceGate>
    )

    expect(
      screen.getByRole('heading', { name: /site is under maintenance/i })
    ).toBeInTheDocument()
    expect(screen.queryByText('App Children')).not.toBeInTheDocument()
  })

  it('renders children (not maintenance screen) when active is false', () => {
    render(
      <MaintenanceGate active={false}>
        <div>App Children</div>
      </MaintenanceGate>
    )

    expect(screen.getByText('App Children')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /site is under maintenance/i })
    ).not.toBeInTheDocument()
  })

  it('renders complex children when active is false', () => {
    render(
      <MaintenanceGate active={false}>
        <header>App Header</header>
        <main>App Main</main>
      </MaintenanceGate>
    )

    expect(screen.getByText('App Header')).toBeInTheDocument()
    expect(screen.getByText('App Main')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /site is under maintenance/i })
    ).not.toBeInTheDocument()
  })

  it('renders <MaintenanceMode /> (not children) regardless of children content when active is true', () => {
    render(
      <MaintenanceGate active>
        <div>Secret App Content</div>
      </MaintenanceGate>
    )

    // Maintenance message is shown
    expect(
      screen.getByText(/we are currently working on the site/i)
    ).toBeInTheDocument()
    // Children are suppressed
    expect(screen.queryByText('Secret App Content')).not.toBeInTheDocument()
  })
})
