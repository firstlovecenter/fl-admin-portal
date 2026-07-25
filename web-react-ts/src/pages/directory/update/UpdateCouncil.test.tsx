/**
 * Tests for the i18n conversion of UpdateCouncil.tsx.
 *
 * Same pattern as UpdateBacenta.tsx / UpdateCampus.tsx — see
 * UpdateCampus.test.tsx for the full-render scaffolding and the rationale
 * for using a lighter key-resolution test here instead of duplicating it.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('UpdateCouncil i18n keys', () => {
  it('resolves the English form title for Council', () => {
    expect(
      i18n.t('directory.update.formTitle', {
        level: i18n.t('shared.churchLevel.Council'),
      })
    ).toBe('Update Council Form')
  })

  it('resolves the French form title for Council', async () => {
    await i18n.changeLanguage('fr')

    expect(
      i18n.t('directory.update.formTitle', {
        level: i18n.t('shared.churchLevel.Council'),
      })
    ).toBe('Formulaire de mise à jour : Conseil')
  })

  it('resolves the leader-changed success message identically to the other Update*.tsx pages', () => {
    expect(i18n.t('directory.update.leaderChanged')).toBe(
      'Leader Changed Successfully'
    )
  })
})
