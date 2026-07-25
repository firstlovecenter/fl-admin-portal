/**
 * Tests for the i18n conversion of `useHourlyGreeting` in dashboard-shared.tsx.
 *
 * The hook now calls `useTranslation()` internally and depends on
 * `i18n.language` in its memo (in addition to `firstName`/`userKey`/`hourTick`)
 * so the greeting text re-selects when the active language changes, even
 * though the underlying hash-based index stays the same.
 *
 * `highlightName` is exported, pure, and unchanged by this pass; it had no
 * prior coverage, so a small set of cases is added here alongside the
 * `useHourlyGreeting` tests since both live in this file.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from 'lib/i18n'
import { highlightName, useHourlyGreeting } from './dashboard-shared'

// Fixed at an exact hour boundary (Africa/Accra === UTC, no DST) so
// `hourTick * HOUR_MS` round-trips to this same instant — see getHourlyGreeting's
// hourEpoch math. Chosen so the userKey below lands on a greeting bucket entry
// containing "{{name}}" for the "contains first name" assertion.
const FIXED_MORNING = new Date('2026-07-25T09:00:00.000Z')

const Harness = ({
  firstName,
  userKey,
}: {
  firstName: string
  userKey: string
}) => {
  const greeting = useHourlyGreeting(firstName, userKey)
  return <div data-testid="greeting">{greeting}</div>
}

describe('useHourlyGreeting', () => {
  beforeEach(async () => {
    // `shouldAdvanceTime` lets real time keep progressing so RTL's
    // `findByTestId` polling (and i18next's changeLanguage promise chain)
    // still resolve while the system clock stays pinned via `setSystemTime`
    // — same pattern as `hooks/useSelectedArrivalDate.test.tsx`.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(FIXED_MORNING)
    await i18n.changeLanguage('en')
  })

  afterEach(async () => {
    cleanup()
    vi.useRealTimers()
    await i18n.changeLanguage('en')
  })

  it('renders an English greeting containing the first name at a fixed time', () => {
    render(<Harness firstName="Ama" userKey="ama-key" />)

    expect(screen.getByTestId('greeting')).toHaveTextContent(
      'Ama, the joy of the Lord is your strength.'
    )
  })

  it('re-selects the French greeting text for the same inputs when the language changes', async () => {
    render(<Harness firstName="Ama" userKey="ama-key" />)

    const englishGreeting = screen.getByTestId('greeting').textContent

    await i18n.changeLanguage('fr')

    const frenchGreeting = await screen.findByTestId('greeting')
    expect(frenchGreeting).toHaveTextContent(
      "Ama, la joie de l'Éternel est ta force."
    )
    expect(frenchGreeting.textContent).not.toBe(englishGreeting)
  })
})

describe('highlightName', () => {
  it('returns the text unchanged when name is falsy', () => {
    expect(highlightName('Good morning, there.', '')).toBe(
      'Good morning, there.'
    )
  })

  it('returns the text unchanged when the name is not found in it', () => {
    expect(highlightName('Good morning.', 'Ama')).toBe('Good morning.')
  })

  it('splits the text around the first occurrence of the name for highlighting', () => {
    render(<>{highlightName('Welcome, Ama. Start small.', 'Ama')}</>)
    expect(screen.getByText('Ama')).toBeInTheDocument()
    expect(screen.getByText('Ama').tagName).toBe('SPAN')
  })
})
