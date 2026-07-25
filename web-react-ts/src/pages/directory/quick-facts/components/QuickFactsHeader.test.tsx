/**
 * Tests for the i18n conversion of QuickFactsHeader.tsx.
 *
 * The single hardcoded "Quick Facts" string moved to
 * `t('directory.quickFacts.title')`. `<QuickFactsSelect />` (a static,
 * unrelated `<select>` with a single "This Month" option — not part of
 * this i18n pass) is rendered as-is; it has no context/query dependencies
 * so no mocking is required to render this component.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from 'lib/i18n'
import QuickFactsHeader from './QuickFactsHeader'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('QuickFactsHeader i18n', () => {
  it('renders the default English title', () => {
    render(<QuickFactsHeader />)

    expect(screen.getByText('Quick Facts')).toBeInTheDocument()
  })

  it('renders the translated title in French', async () => {
    render(<QuickFactsHeader />)

    await i18n.changeLanguage('fr')

    expect(await screen.findByText('Faits rapides')).toBeInTheDocument()
  })
})
