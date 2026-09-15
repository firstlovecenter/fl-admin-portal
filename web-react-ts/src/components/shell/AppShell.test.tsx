import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import i18n from 'lib/i18n'
import { AppShell } from './AppShell'

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}))

vi.mock('./MobileNav', () => ({
  MobileNav: () => <div data-testid="mobile-nav" />,
}))

vi.mock('./BackButton', () => ({
  BackButton: () => <div data-testid="back-button" />,
}))

vi.mock('./SearchPalette', () => ({
  default: () => <div data-testid="search-palette" />,
}))

vi.mock('./LanguageSwitcher', () => ({
  LanguageSwitcher: () => (
    <button type="button" aria-label="Change language">
      Language
    </button>
  ),
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('AppShell', () => {
  it('keeps the mobile nav toggle and does not float a language switcher', () => {
    render(
      <AppShell>
        <div>page</div>
      </AppShell>
    )

    expect(
      screen.getByRole('button', { name: 'Open navigation' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Change language' })
    ).not.toBeInTheDocument()
  })
})
