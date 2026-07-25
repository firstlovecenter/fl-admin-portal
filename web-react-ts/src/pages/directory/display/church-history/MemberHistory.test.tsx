/**
 * Tests for the i18n conversion of MemberHistory.tsx.
 *
 * Same pattern as BacentaHistory.tsx — see BacentaHistory.test.tsx for the
 * full-render scaffolding and the rationale for using a lighter
 * key-resolution test here instead of duplicating it. `parentTypename` here
 * is `"Member"`, which is not a `ChurchLevel` — `ChurchHistoryView.test.tsx`
 * covers the special-cased `directory.churchHistory.memberTypeName` lookup
 * for that value end to end.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('MemberHistory i18n keys', () => {
  it('resolves the English heading suffix', () => {
    expect(i18n.t('directory.churchHistory.headingSuffix')).toBe('History')
  })

  it('resolves the French heading suffix', async () => {
    await i18n.changeLanguage('fr')

    expect(i18n.t('directory.churchHistory.headingSuffix')).toBe('Historique')
  })

  it('resolves the French memberTypeName used for the audit-trail sentence', async () => {
    await i18n.changeLanguage('fr')

    expect(i18n.t('directory.churchHistory.memberTypeName')).toBe('Membre')
  })
})
