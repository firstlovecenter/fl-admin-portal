/**
 * Tests for LanguageCard — the Settings language picker.
 *
 * Behaviour worth pinning:
 *  - The card's own chrome is translated (it would be self-defeating for a
 *    language picker to render in a language the user can't read).
 *  - The option list is NOT translated — each language is listed under its
 *    own `nativeName`, so a user stranded in a language they don't read can
 *    still find their way back out.
 *  - Selecting applies immediately (no Save button) and i18next persists it;
 *    `flc-language` in localStorage is asserted directly rather than trusting
 *    the hook, since that key is the whole persistence contract.
 *
 * `sonner` is mocked so the confirmation toast lands on a spy.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import i18n, { LANGUAGE_STORAGE_KEY } from 'lib/i18n'
import LanguageCard from './LanguageCard'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

afterEach(async () => {
  cleanup()
  vi.mocked(toast.success).mockClear()
  await i18n.changeLanguage('en')
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY)
})

describe('LanguageCard', () => {
  it('renders its chrome translated, in English by default', () => {
    render(<LanguageCard />)

    expect(screen.getByText('Language')).toBeInTheDocument()
    expect(screen.getByText('Display language')).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: 'Select display language' })
    ).toBeInTheDocument()
  })

  it('re-renders its chrome in French once the language changes', async () => {
    await i18n.changeLanguage('fr')
    render(<LanguageCard />)

    expect(screen.getByText('Langue')).toBeInTheDocument()
    expect(screen.getByText("Langue d'affichage")).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', {
        name: "Sélectionner la langue d'affichage",
      })
    ).toBeInTheDocument()
  })

  it('lists every language under its own native name, never translated', async () => {
    render(<LanguageCard />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('combobox'))

    const listbox = await screen.findByRole('listbox')
    for (const nativeName of [
      'English',
      'Français',
      'Español',
      'Português',
      'Deutsch',
    ]) {
      expect(within(listbox).getByText(nativeName)).toBeInTheDocument()
    }
  })

  it('applies the chosen language immediately and persists it to localStorage', async () => {
    render(<LanguageCard />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('combobox'))
    await user.click(
      within(await screen.findByRole('listbox')).getByText('Français')
    )

    expect(i18n.language).toBe('fr')
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr')
  })

  it('confirms the change with a toast naming the new language', async () => {
    render(<LanguageCard />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('combobox'))
    await user.click(
      within(await screen.findByRole('listbox')).getByText('Deutsch')
    )

    expect(toast.success).toHaveBeenCalledWith('Language changed to Deutsch')
  })

  it('does nothing when the already-active language is re-selected', async () => {
    render(<LanguageCard />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('combobox'))
    await user.click(
      within(await screen.findByRole('listbox')).getByText('English')
    )

    expect(toast.success).not.toHaveBeenCalled()
    expect(i18n.language).toBe('en')
  })
})
