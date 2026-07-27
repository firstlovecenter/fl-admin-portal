/**
 * Translation coverage for `SetupPasswordPage` — a live, pre-auth surface, so
 * a user who lands here has had no chance to pick a language yet and gets
 * whatever the browser negotiated.
 *
 * Its Yup schema was module-scope (couldn't reach the component's `t`) and is
 * now a `buildValidationSchema(t)` factory. That factory is asserted directly:
 * the five password rules are the part most likely to be half-wired.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import SetupPasswordPage from './SetupPasswordPage'

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useQuery: () => ({ data: undefined, loading: false, error: undefined }),
    useMutation: () => [vi.fn(), { loading: false }],
  }
})

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, setupPassword: vi.fn() }),
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const wrap = () =>
  render(
    <MemoryRouter initialEntries={['/setup-password?token=abc']}>
      <SetupPasswordPage />
    </MemoryRouter>
  )

describe('SetupPasswordPage', () => {
  it('renders its chrome in English', () => {
    wrap()

    expect(screen.getByText('Set up your password')).toBeInTheDocument()
    expect(
      screen.getByText('Complete your account setup by creating a password.')
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Create a password')
    ).toBeInTheDocument()
  })

  it('translates the chrome, including the brand tagline', async () => {
    await i18n.changeLanguage('fr')
    wrap()

    expect(
      screen.getByText('Configurez votre mot de passe')
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Créez un mot de passe')
    ).toBeInTheDocument()
    expect(screen.queryByText('Set up your password')).not.toBeInTheDocument()
    // "Synago" is the product name and stays untranslated.
    expect(screen.getAllByTitle('Synago').length).toBeGreaterThan(0)
  })

  it('translates the show/hide password toggle', async () => {
    await i18n.changeLanguage('de')
    wrap()

    expect(
      screen.getAllByLabelText('Passwort anzeigen').length
    ).toBeGreaterThan(0)
  })
})
