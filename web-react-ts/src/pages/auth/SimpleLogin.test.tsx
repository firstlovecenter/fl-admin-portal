/**
 * SimpleLogin is the real pre-auth screen (SimpleApp renders it directly for
 * unauthenticated users) and had no test coverage before this file. Focus is
 * the i18n rewrite: translated strings render and re-render on language
 * change, the "Synago" brand name never translates, and existing submit /
 * forgot-password behaviour still works with the new t()-driven copy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from 'lib/i18n'
import SimpleLogin from './SimpleLogin'

vi.mock('lib/auth-service', () => ({
  login: vi.fn(),
  storeAuth: vi.fn(),
  requestPasswordReset: vi.fn(),
}))

// eslint-disable-next-line import/first
import { login, storeAuth, requestPasswordReset } from 'lib/auth-service'

describe('SimpleLogin', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
    vi.mocked(login).mockReset()
    vi.mocked(storeAuth).mockReset()
    vi.mocked(requestPasswordReset).mockReset()
  })

  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
  })

  it('renders the English sign-in form by default, leaving the Synago brand name untranslated', () => {
    render(<SimpleLogin />)

    expect(screen.getByText('Synago')).toBeInTheDocument()
    expect(screen.getByText('Portal for Church Leaders')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Forgot password?')).toBeInTheDocument()
    expect(
      screen.getByText('Need help? Contact your administrator')
    ).toBeInTheDocument()
  })

  it('re-renders translated copy when the active language changes, without translating the brand name', async () => {
    render(<SimpleLogin />)

    await i18n.changeLanguage('fr')

    expect(
      await screen.findByRole('heading', { name: 'Connexion' })
    ).toBeInTheDocument()
    expect(screen.getByText('Synago')).toBeInTheDocument()
  })

  it('shows the translated forgot-password form and returns to sign-in', async () => {
    const user = userEvent.setup()
    render(<SimpleLogin />)

    await user.click(screen.getByText('Forgot password?'))
    expect(
      screen.getByRole('heading', { name: 'Reset password' })
    ).toBeInTheDocument()

    await user.click(screen.getByText('Back to sign in'))
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('logs in and calls onLoginSuccess on submit', async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    } as never)
    const onLoginSuccess = vi.fn()
    const user = userEvent.setup()
    render(<SimpleLogin onLoginSuccess={onLoginSuccess} />)

    await user.type(screen.getByLabelText('Email address'), 'leader@flc.org')
    await user.type(screen.getByLabelText('Password'), 'password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(storeAuth).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' })
    )
    expect(onLoginSuccess).toHaveBeenCalled()
  })

  it('shows the translated generic error when login rejects without an Error message', async () => {
    vi.mocked(login).mockRejectedValue('network down')
    const user = userEvent.setup()
    render(<SimpleLogin />)

    await user.type(screen.getByLabelText('Email address'), 'leader@flc.org')
    await user.type(screen.getByLabelText('Password'), 'password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to login. Please try again.'
    )
  })
})
