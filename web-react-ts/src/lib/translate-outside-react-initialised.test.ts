/**
 * The initialised half of `tOutsideReact`'s contract. Separate file because
 * importing `lib/i18n` boots the singleton for the whole module graph, which
 * would make the uninitialised branch in the sibling file unreachable.
 */
import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'
import { tOutsideReact } from './translate-outside-react'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('tOutsideReact — with i18next initialised', () => {
  it('resolves the key instead of the fallback', () => {
    expect(tOutsideReact('shared.errors.loginFailed', 'IGNORED')).toBe(
      'Login failed'
    )
  })

  it('follows the active language', async () => {
    await i18n.changeLanguage('fr')
    expect(tOutsideReact('shared.errors.loginFailed', 'IGNORED')).toBe(
      'Échec de la connexion'
    )

    await i18n.changeLanguage('de')
    expect(tOutsideReact('shared.errors.loginFailed', 'IGNORED')).toBe(
      'Anmeldung fehlgeschlagen'
    )
  })

  it('interpolates through i18next', async () => {
    await i18n.changeLanguage('es')
    expect(
      tOutsideReact('shared.errors.downloadFailed', 'IGNORED', { status: 500 })
    ).toBe('Error de descarga (500)')
  })

  it('falls back when the key is missing, rather than showing the key path', () => {
    expect(
      tOutsideReact('shared.errors.doesNotExist', 'A sensible fallback')
    ).toBe('A sensible fallback')
  })
})
