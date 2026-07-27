/**
 * Characterization tests for BankingHistorySection i18n surface.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import 'lib/i18n'
import BankingHistorySection from './BankingHistorySection'
import type { BankingHistoryLog } from 'global-types'

// Radix Accordion animations can hang in jsdom; stub as always-open markup.
vi.mock('components/ui/accordion', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AccordionItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  AccordionContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

const sampleHistory: BankingHistoryLog[] = [
  {
    id: 'log-1',
    ts: '2026-07-20T10:00:00.000Z',
    method: 'self',
    fromStatus: 'pending',
    toStatus: 'success',
    message: 'Payment confirmed',
    loggedBy: { fullName: 'Jane Doe' } as BankingHistoryLog['loggedBy'],
  },
  {
    id: 'log-2',
    ts: '2026-07-19T09:00:00.000Z',
    method: 'teller',
    fromStatus: null,
    toStatus: 'teller-confirmed',
    message: null,
    loggedBy: { fullName: 'Teller One' } as BankingHistoryLog['loggedBy'],
  },
]

describe('BankingHistorySection', () => {
  afterEach(cleanup)

  it('returns null when bankingHistory is empty', () => {
    const { container } = render(
      <BankingHistorySection bankingHistory={[]} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders title, method labels, and actor in English', () => {
    render(<BankingHistorySection bankingHistory={sampleHistory} />)

    expect(screen.getByText('Banking history')).toBeInTheDocument()
    expect(screen.getByText('Self-banking')).toBeInTheDocument()
    expect(screen.getByText('Teller')).toBeInTheDocument()
    expect(screen.getByText(/by Jane Doe/)).toBeInTheDocument()
    expect(screen.getByText('Payment confirmed')).toBeInTheDocument()
  })
})
