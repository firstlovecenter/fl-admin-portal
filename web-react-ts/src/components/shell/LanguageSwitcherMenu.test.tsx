import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DropdownMenu, DropdownMenuContent } from 'components/ui/dropdown-menu'
import i18n, { LANGUAGE_STORAGE_KEY } from 'lib/i18n'
import { LanguageSwitcherMenu } from './LanguageSwitcherMenu'

const renderMenu = () =>
  render(
    <DropdownMenu open>
      <DropdownMenuContent>
        <LanguageSwitcherMenu />
      </DropdownMenuContent>
    </DropdownMenu>
  )

describe('LanguageSwitcherMenu', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  afterEach(async () => {
    cleanup()
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('renders the Language submenu trigger with all 5 native-name options behind it', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByText('Language'))

    expect(await screen.findByText('English')).toBeInTheDocument()
    expect(screen.getByText('Français')).toBeInTheDocument()
    expect(screen.getByText('Español')).toBeInTheDocument()
    expect(screen.getByText('Português')).toBeInTheDocument()
    expect(screen.getByText('Deutsch')).toBeInTheDocument()
  })

  it('switches the active language and persists it to localStorage when a language is selected', async () => {
    // jsdom never computes real layout, so Radix's submenu "pointer grace
    // area" (the polygon that lets the cursor travel diagonally from the
    // trigger into the submenu without closing it) degenerates and the
    // submenu closes mid-interaction under a simulated pointer click.
    // Keyboard selection exercises the same onSelect/onValueChange wiring
    // without going through that pointer geometry, and is worth covering
    // in its own right for a11y.
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByText('Language'))
    expect(await screen.findByText('Français')).toBeInTheDocument()

    // ArrowRight moves focus from the (already-open) sub-trigger into the
    // submenu's own roving-focus group, landing on the first item
    // (English); ArrowDown then advances to French.
    await user.keyboard('{ArrowRight}{ArrowDown}{Enter}')

    expect(i18n.language).toBe('fr')
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr')
  })
})
