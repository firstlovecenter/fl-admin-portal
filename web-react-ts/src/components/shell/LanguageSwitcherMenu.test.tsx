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
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByText('Language'))
    await user.click(await screen.findByText('Français'))

    expect(i18n.language).toBe('fr')
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr')
  })
})
