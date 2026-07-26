/**
 * ViewAll default label comes from
 * `directory.displayChurchDetails.viewAll` when `label` is omitted.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import ViewAll from './ViewAll'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

function renderViewAll() {
  return render(
    <MemoryRouter>
      <ViewAll to="/directory/history" />
    </MemoryRouter>
  )
}

describe('ViewAll i18n', () => {
  it('shows “View All” in English by default', () => {
    renderViewAll()
    expect(screen.getByRole('link', { name: /View All/i })).toBeInTheDocument()
  })

  it('shows “Tout voir” when language is French', async () => {
    await i18n.changeLanguage('fr')
    renderViewAll()
    expect(screen.getByRole('link', { name: /Tout voir/i })).toBeInTheDocument()
  })
})
