import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BulkActionBar from './BulkActionBar'
import type { BulkAction } from './BulkActionBar'

afterEach(cleanup)

function makeActions(overrides: Partial<BulkAction>[] = [{}]): BulkAction[] {
  return overrides.map((o) => ({
    label: 'Transfer',
    onClick: vi.fn(),
    ...o,
  }))
}

describe('BulkActionBar', () => {
  describe('visibility classes', () => {
    it('outer wrapper has translate-y-full class when count === 0 (bar hidden)', () => {
      const { container } = render(
        <BulkActionBar count={0} actions={makeActions()} />
      )
      expect(container.firstChild).toHaveClass('translate-y-full')
    })

    it('outer wrapper has translate-y-0 class when count > 0 (bar visible)', () => {
      const { container } = render(
        <BulkActionBar count={3} actions={makeActions()} />
      )
      expect(container.firstChild).toHaveClass('translate-y-0')
      expect(container.firstChild).not.toHaveClass('translate-y-full')
    })

    it('outer wrapper is aria-hidden when count === 0', () => {
      const { container } = render(
        <BulkActionBar count={0} actions={makeActions()} />
      )
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    })

    it('outer wrapper is NOT aria-hidden when count > 0', () => {
      const { container } = render(
        <BulkActionBar count={2} actions={makeActions()} />
      )
      // React removes aria-hidden={false} → no attribute present
      expect(container.firstChild).not.toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('count text', () => {
    it('renders the numeric count in bold and the default label', () => {
      render(<BulkActionBar count={5} actions={makeActions()} />)
      const countSpan = screen.getByText('5')
      expect(countSpan.closest('p')).toHaveTextContent('5 selected')
    })

    it('renders a custom label when provided', () => {
      render(
        <BulkActionBar
          count={2}
          label="members selected"
          actions={makeActions()}
        />
      )
      const countSpan = screen.getByText('2')
      expect(countSpan.closest('p')).toHaveTextContent('2 members selected')
    })
  })

  describe('action buttons', () => {
    it('renders all action buttons when count > 0', () => {
      render(
        <BulkActionBar
          count={2}
          actions={makeActions([{ label: 'Transfer' }, { label: 'Delete' }])}
        />
      )
      expect(
        screen.getByRole('button', { name: 'Transfer' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Delete' })
      ).toBeInTheDocument()
    })

    it('calls the action onClick handler when the button is clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(
        <BulkActionBar
          count={1}
          actions={[{ label: 'Export', onClick: handleClick }]}
        />
      )
      await user.click(screen.getByRole('button', { name: 'Export' }))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('action button is disabled when disabled flag is set', () => {
      render(
        <BulkActionBar
          count={1}
          actions={[{ label: 'Export', onClick: vi.fn(), disabled: true }]}
        />
      )
      expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
    })

    it('action button is disabled when loading flag is set', () => {
      render(
        <BulkActionBar
          count={1}
          actions={[{ label: 'Export', onClick: vi.fn(), loading: true }]}
        />
      )
      expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
    })

    it('shows Loader2 spinner instead of icon when loading', () => {
      render(
        <BulkActionBar
          count={1}
          actions={[
            {
              label: 'Export',
              onClick: vi.fn(),
              loading: true,
              icon: <span data-testid="custom-icon">icon</span>,
            },
          ]}
        />
      )
      // Custom icon is NOT rendered when loading
      expect(screen.queryByTestId('custom-icon')).toBeNull()
    })
  })
})
