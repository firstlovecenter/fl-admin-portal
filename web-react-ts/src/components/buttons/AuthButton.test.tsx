/**
 * AuthButton owns the log-out affordance in the app shell — including the
 * confirmation popup, which is the single most consequential English-only
 * string left in the chrome (a user who can't read "Are you sure you want to
 * Log Out?" is being asked to confirm something they can't read).
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import i18n from 'lib/i18n'
import AuthButton from './AuthButton'

const logout = vi.fn()
let isAuthenticated = true

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ logout, isAuthenticated }),
}))

// The component short-circuits to a "logging you in" splash while
// authenticated on '/', which is jsdom's default path — push a real route
// first so the log-out branch is the one under test.
beforeEach(() => {
  window.history.pushState({}, '', '/directory/members')
})

afterEach(async () => {
  cleanup()
  logout.mockReset()
  isAuthenticated = true
  window.history.pushState({}, '', '/')
  await i18n.changeLanguage('en')
})

describe('AuthButton — authenticated', () => {
  it('translates the log-out button and its icon-only aria-label', async () => {
    render(<AuthButton />)
    expect(
      screen.getByRole('button', { name: 'Log Out' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Log out' })
    ).toBeInTheDocument()

    cleanup()
    await i18n.changeLanguage('de')
    render(<AuthButton />)
    expect(screen.getAllByRole('button', { name: 'Abmelden' })).toHaveLength(2)
  })

  it('translates the confirmation popup', async () => {
    await i18n.changeLanguage('fr')
    render(<AuthButton />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Se déconnecter' })[0])

    expect(screen.getByText('Confirmer la déconnexion')).toBeInTheDocument()
    expect(
      screen.getByText('Êtes-vous sûr de vouloir vous déconnecter ?')
    ).toBeInTheDocument()
  })

  it('still calls logout from the confirmation button', () => {
    render(<AuthButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }))
    const confirm = screen
      .getAllByRole('button', { name: 'Log Out' })
      .at(-1) as HTMLElement
    fireEvent.click(confirm)

    expect(logout).toHaveBeenCalledTimes(1)
  })
})

describe('AuthButton — mid-login splash', () => {
  it('translates the "please wait" copy shown on the root path', async () => {
    window.history.pushState({}, '', '/')
    await i18n.changeLanguage('es')
    render(<AuthButton />)

    expect(
      screen.getByText('Espere mientras iniciamos su sesión')
    ).toBeInTheDocument()
  })
})

describe('AuthButton — unauthenticated', () => {
  it('translates the log-in button and its icon-only aria-label', async () => {
    isAuthenticated = false
    await i18n.changeLanguage('pt')
    render(<AuthButton />)

    expect(
      screen.getAllByRole('button', { name: 'Iniciar sessão' })
    ).toHaveLength(2)
  })
})
