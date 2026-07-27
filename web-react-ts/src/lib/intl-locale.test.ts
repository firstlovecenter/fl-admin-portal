/**
 * Tests for `lib/intl-locale` — the single source of truth mapping the active
 * UI language onto a BCP 47 locale for Intl date formatting.
 *
 * Three dashboards each carried a private copy of this map before; the
 * behaviour worth pinning is that 'en' resolves to en-GB (day-first, the
 * shape this app has always shown) rather than the en-US default `Intl`
 * would pick from a bare 'en'.
 */
import { describe, it, expect, afterEach } from 'vitest'
import i18n, { SUPPORTED_LANGUAGES } from 'lib/i18n'
import {
  INTL_LOCALES,
  DEFAULT_INTL_LOCALE,
  intlLocaleFor,
  currentIntlLocale,
} from './intl-locale'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('intlLocaleFor', () => {
  it('maps every supported language to a region-tagged locale', () => {
    expect(intlLocaleFor('en')).toBe('en-GB')
    expect(intlLocaleFor('fr')).toBe('fr-FR')
    expect(intlLocaleFor('es')).toBe('es-ES')
    expect(intlLocaleFor('pt')).toBe('pt-PT')
    expect(intlLocaleFor('de')).toBe('de-DE')
  })

  it('strips a region subtag before looking the language up', () => {
    // i18next's `load: 'languageOnly'` hands back 'fr', but a stored
    // preference or navigator value can still arrive region-tagged.
    expect(intlLocaleFor('fr-CA')).toBe('fr-FR')
    expect(intlLocaleFor('pt-BR')).toBe('pt-PT')
  })

  it('falls back to the default for an unknown or missing language', () => {
    expect(intlLocaleFor('sw')).toBe(DEFAULT_INTL_LOCALE)
    expect(intlLocaleFor('')).toBe(DEFAULT_INTL_LOCALE)
    expect(intlLocaleFor(undefined)).toBe(DEFAULT_INTL_LOCALE)
  })

  it('defaults to en-GB, not en-US', () => {
    expect(DEFAULT_INTL_LOCALE).toBe('en-GB')
    expect(INTL_LOCALES.en).toBe('en-GB')
  })

  // Drift guard. INTL_LOCALES is structurally unrelated to
  // SUPPORTED_LANGUAGES, so adding a sixth language to `lib/i18n` and
  // forgetting this map compiles, lints and silently formats every date in
  // that language as en-GB. De-duplicating exactly this kind of copy-paste
  // is what this module exists for, so make it self-enforcing.
  it('covers every language i18n advertises as supported', () => {
    const uncovered = SUPPORTED_LANGUAGES.filter(
      (language) => !(language.code in INTL_LOCALES)
    ).map((language) => language.code)

    expect(uncovered).toEqual([])
  })

  it('maps each supported language to a distinct region-tagged locale', () => {
    SUPPORTED_LANGUAGES.forEach((language) => {
      expect(intlLocaleFor(language.code)).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
    })
  })
})

describe('currentIntlLocale', () => {
  it('tracks the live i18next language', async () => {
    expect(currentIntlLocale()).toBe('en-GB')

    await i18n.changeLanguage('de')
    expect(currentIntlLocale()).toBe('de-DE')

    await i18n.changeLanguage('pt')
    expect(currentIntlLocale()).toBe('pt-PT')
  })

  it('produces day-first English dates, matching the pre-i18n output', async () => {
    await i18n.changeLanguage('en')
    const formatted = new Date('2026-07-26T12:00:00Z').toLocaleDateString(
      currentIntlLocale(),
      { year: 'numeric', month: 'long', day: 'numeric' }
    )
    expect(formatted).toBe('26 July 2026')
  })
})
