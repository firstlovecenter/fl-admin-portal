/**
 * TransferChurchSheet.test.tsx
 *
 * Covers:
 *  - renders SearchGovernorship when churchLevel="Bacenta"
 *  - renders SearchCouncil when churchLevel="Governorship"
 *  - renders SearchStream when churchLevel="Council"
 *  - renders SearchCampus when churchLevel="Stream"
 *  - shows the correct transfer title for each transferable level
 *  - Transfer button is disabled before a destination is selected
 *
 * All four Search* components are mocked with identifiable stubs so we can
 * assert which one is rendered without pulling in MemberContext / GraphQL
 * query machinery.
 */
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import TransferChurchSheet from './TransferChurchSheet'
import type { TransferableLevel } from './TransferChurchSheet'

// ── Search component stubs ───────────────────────────────────────────────────

vi.mock('components/formik/SearchGovernorship', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createElement } = require('react')
  return {
    default: () =>
      createElement(
        'div',
        { 'data-testid': 'search-governorship-stub' },
        'SearchGovernorship'
      ),
  }
})

vi.mock('components/formik/SearchCouncil', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createElement } = require('react')
  return {
    default: () =>
      createElement(
        'div',
        { 'data-testid': 'search-council-stub' },
        'SearchCouncil'
      ),
  }
})

vi.mock('components/formik/SearchStream', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createElement } = require('react')
  return {
    default: () =>
      createElement(
        'div',
        { 'data-testid': 'search-stream-stub' },
        'SearchStream'
      ),
  }
})

vi.mock('components/formik/SearchCampus', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createElement } = require('react')
  return {
    default: () =>
      createElement(
        'div',
        { 'data-testid': 'search-campus-stub' },
        'SearchCampus'
      ),
  }
})

// Mock sonner to suppress error toasts in test output.
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}))

afterEach(cleanup)

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_PROPS = {
  open: true,
  onClose: vi.fn(),
  churchId: 'church-1',
  churchName: 'Grace Church',
  oldParentId: 'old-parent-1',
}

function renderSheet(churchLevel: TransferableLevel) {
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <TransferChurchSheet {...BASE_PROPS} churchLevel={churchLevel} />
    </MockedProvider>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TransferChurchSheet — search component routing', () => {
  it('renders SearchGovernorship (and only SearchGovernorship) when churchLevel="Bacenta"', () => {
    renderSheet('Bacenta')
    expect(screen.getByTestId('search-governorship-stub')).toBeInTheDocument()
    expect(screen.queryByTestId('search-council-stub')).toBeNull()
    expect(screen.queryByTestId('search-stream-stub')).toBeNull()
    expect(screen.queryByTestId('search-campus-stub')).toBeNull()
  })

  it('renders SearchCouncil (and only SearchCouncil) when churchLevel="Governorship"', () => {
    renderSheet('Governorship')
    expect(screen.getByTestId('search-council-stub')).toBeInTheDocument()
    expect(screen.queryByTestId('search-governorship-stub')).toBeNull()
    expect(screen.queryByTestId('search-stream-stub')).toBeNull()
    expect(screen.queryByTestId('search-campus-stub')).toBeNull()
  })

  it('renders SearchStream (and only SearchStream) when churchLevel="Council"', () => {
    renderSheet('Council')
    expect(screen.getByTestId('search-stream-stub')).toBeInTheDocument()
    expect(screen.queryByTestId('search-governorship-stub')).toBeNull()
    expect(screen.queryByTestId('search-council-stub')).toBeNull()
    expect(screen.queryByTestId('search-campus-stub')).toBeNull()
  })

  it('renders SearchCampus (and only SearchCampus) when churchLevel="Stream"', () => {
    renderSheet('Stream')
    expect(screen.getByTestId('search-campus-stub')).toBeInTheDocument()
    expect(screen.queryByTestId('search-governorship-stub')).toBeNull()
    expect(screen.queryByTestId('search-council-stub')).toBeNull()
    expect(screen.queryByTestId('search-stream-stub')).toBeNull()
  })
})

describe('TransferChurchSheet — title for each level', () => {
  // SheetTitle is a Radix Dialog.Title (h2). The text is split across a text
  // node ("Transfer ") and a <span> child (the level name), so getByText with
  // a plain string fails. Use getByRole so RTL computes the accessible name
  // from the full text content, which correctly joins the text node and span.

  it('shows "Transfer Bacenta" for churchLevel="Bacenta"', () => {
    renderSheet('Bacenta')
    expect(
      screen.getByRole('heading', { name: /Transfer Bacenta/i })
    ).toBeInTheDocument()
  })

  it('shows "Transfer Governorship" for churchLevel="Governorship"', () => {
    renderSheet('Governorship')
    expect(
      screen.getByRole('heading', { name: /Transfer Governorship/i })
    ).toBeInTheDocument()
  })

  it('shows "Transfer Council" for churchLevel="Council"', () => {
    renderSheet('Council')
    expect(
      screen.getByRole('heading', { name: /Transfer Council/i })
    ).toBeInTheDocument()
  })

  it('shows "Transfer Stream" for churchLevel="Stream"', () => {
    renderSheet('Stream')
    expect(
      screen.getByRole('heading', { name: /Transfer Stream/i })
    ).toBeInTheDocument()
  })
})

describe('TransferChurchSheet — form state', () => {
  it('Transfer button is disabled before a destination is selected', () => {
    renderSheet('Bacenta')
    expect(
      screen.getByRole('button', { name: 'Transfer' })
    ).toBeDisabled()
  })

  it('does not render content when open is false', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <TransferChurchSheet
          {...BASE_PROPS}
          open={false}
          churchLevel="Bacenta"
        />
      </MockedProvider>
    )
    expect(screen.queryByText('Transfer Bacenta')).toBeNull()
  })
})
