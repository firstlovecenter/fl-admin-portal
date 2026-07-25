/**
 * Tests for the i18n conversion of CouncilHistory.tsx.
 *
 * Same pattern as BacentaHistory.tsx — see BacentaHistory.test.tsx for the
 * full-render scaffolding and the rationale for using a lighter
 * key-resolution test here instead of duplicating it.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('CouncilHistory i18n keys', () => {
  it('resolves the English heading suffix', () => {
    expect(i18n.t('directory.churchHistory.headingSuffix')).toBe('History')
  })

  it('resolves the French heading suffix', async () => {
    await i18n.changeLanguage('fr')

    expect(i18n.t('directory.churchHistory.headingSuffix')).toBe('Historique')
  })

  it('resolves "Council" via shared.churchLevel for the audit-trail sentence', async () => {
    await i18n.changeLanguage('fr')

    expect(i18n.t('shared.churchLevel.Council')).toBe('Conseil')
  })
})
