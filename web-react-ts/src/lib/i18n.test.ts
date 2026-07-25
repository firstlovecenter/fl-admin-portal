/**
 * Covers the i18n resource wiring added for multi-language support: every
 * locale file must expose the exact same key set as English (a silent
 * missing key falls back to English at runtime and is easy to miss in
 * review), values must be non-empty, and lookups for an unsupported
 * language must fall back to English rather than rendering raw keys.
 */
import { describe, it, expect, afterEach } from 'vitest'
import en from 'locales/en.json'
import fr from 'locales/fr.json'
import es from 'locales/es.json'
import pt from 'locales/pt.json'
import de from 'locales/de.json'
import i18n, { SUPPORTED_LANGUAGES } from './i18n'

type JsonTree = { [key: string]: string | JsonTree }

const flattenKeys = (tree: JsonTree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'string' ? [path] : flattenKeys(value, path)
  })

const getAtPath = (tree: JsonTree, path: string): string => {
  const value = path
    .split('.')
    .reduce<JsonTree | string>((acc, part) => (acc as JsonTree)[part], tree)
  return value as string
}

const locales: Record<string, JsonTree> = { en, fr, es, pt, de }

describe('i18n locale resources', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('declares exactly the 5 supported languages', () => {
    expect(SUPPORTED_LANGUAGES.map((language) => language.code).sort()).toEqual(
      ['de', 'en', 'es', 'fr', 'pt']
    )
  })

  it('every locale file has the exact same set of translation keys as English', () => {
    const englishKeys = flattenKeys(en).sort()

    Object.entries(locales).forEach(([code, resource]) => {
      expect(flattenKeys(resource).sort(), `locale "${code}" key mismatch`).toEqual(
        englishKeys
      )
    })
  })

  it('no locale has a blank translation value', () => {
    Object.entries(locales).forEach(([code, resource]) => {
      flattenKeys(resource).forEach((key) => {
        expect(
          getAtPath(resource, key).trim(),
          `locale "${code}" key "${key}" is blank`
        ).not.toBe('')
      })
    })
  })

  it('falls back to English when an unsupported language is requested', async () => {
    await i18n.changeLanguage('xx')
    expect(i18n.t('auth.signIn.title')).toBe(en.auth.signIn.title)
  })

  it('syncs document.documentElement.lang to the active language', async () => {
    await i18n.changeLanguage('fr')
    expect(document.documentElement.lang).toBe('fr')
  })
})
