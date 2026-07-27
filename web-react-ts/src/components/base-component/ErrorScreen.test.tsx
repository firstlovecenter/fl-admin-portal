/**
 * ErrorScreen is the app-wide failure surface — it renders above every route,
 * including the fully-localized ones, and was entirely English until this
 * branch. The `<Trans>` tip line is asserted explicitly because it is the one
 * string here that interpolates markup rather than a plain value.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from 'lib/i18n'
import ErrorScreen, { type ApolloError } from './ErrorScreen'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const apolloError = {
  name: 'ApolloError',
  message: 'Something broke',
  graphQLErrors: [
    {
      message: 'Member not found',
      locations: [{ line: 3, column: 7 }],
      path: ['member', 'bacenta'],
      extensions: { code: 'NOT_FOUND', exception: { message: '', stacktrace: [] } },
    },
  ],
  protocolErrors: [],
  clientErrors: [],
  networkError: null,
} as unknown as ApolloError

describe('ErrorScreen', () => {
  it('renders its chrome in English by default', () => {
    render(<ErrorScreen error={apolloError} />)

    expect(screen.getByText("We couldn't load this page")).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Show details/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Reload page/ })
    ).toBeInTheDocument()
  })

  it('translates the chrome, including the interpolated subtitle', async () => {
    await i18n.changeLanguage('fr')
    render(<ErrorScreen error={apolloError} />)

    expect(
      screen.getByText('Impossible de charger cette page')
    ).toBeInTheDocument()
    // The error's own name is interpolated, not translated.
    expect(screen.getByText(/^ApolloError —/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Afficher les détails/ })
    ).toBeInTheDocument()
  })

  it('translates the GraphQL path/location metadata line', () => {
    render(<ErrorScreen error={apolloError} />)

    expect(
      screen.getByText('Path: member › bacenta • Location: line 3, column 7')
    ).toBeInTheDocument()
  })

  it('renders the <Trans> tip with its emphasised segment intact', async () => {
    await i18n.changeLanguage('de')
    render(<ErrorScreen error={apolloError} />)

    // The whole sentence is translated and "Details anzeigen" survives as its
    // own <span>, so the tip still points at the button by name.
    expect(screen.getByText(/^Tipp: Tippen Sie auf/)).toBeInTheDocument()
    expect(
      screen.getAllByText('Details anzeigen').length
    ).toBeGreaterThanOrEqual(2)
  })

  it('falls back to translated copy when there is no error object at all', async () => {
    await i18n.changeLanguage('es')
    render(<ErrorScreen error={undefined} />)

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(screen.getByText('Error inesperado')).toBeInTheDocument()
    // No `name` to interpolate, so the subtitle uses the translated fallback.
    expect(screen.getByText(/^Error —/)).toBeInTheDocument()
  })
})
