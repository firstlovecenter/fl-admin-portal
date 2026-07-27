/**
 * i18n smoke test for GraphDropdown.tsx.
 *
 * Trigger label is derived from the current `graphs` value + language, so it
 * updates when the locale changes without caching translated strings in state.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from 'lib/i18n'
import GraphDropdown from './GraphDropdown'

vi.mock('./graphs-utils', () => ({
  getServiceGraphData: vi.fn(() => []),
}))

describe('GraphDropdown i18n', () => {
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
  })

  it('renders Bacenta Services trigger in English', () => {
    render(
      <GraphDropdown
        setChurchData={vi.fn()}
        setGraphs={vi.fn()}
        graphs="services"
        data={{ __typename: 'Bacenta' }}
      />
    )

    expect(screen.getByText('Bacenta Services')).toBeInTheDocument()
  })

  it('renders Bacenta Services trigger in French', async () => {
    await i18n.changeLanguage('fr')
    render(
      <GraphDropdown
        setChurchData={vi.fn()}
        setGraphs={vi.fn()}
        graphs="services"
        data={{ __typename: 'Bacenta' }}
      />
    )

    expect(screen.getByText('Services Bacenta')).toBeInTheDocument()
  })
})
