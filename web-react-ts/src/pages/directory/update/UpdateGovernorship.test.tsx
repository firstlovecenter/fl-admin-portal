/**
 * Tests for the i18n conversion of UpdateGovernorship.tsx.
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

describe('UpdateGovernorship i18n keys', () => {
  it('resolves the English form title for Governorship', () => {
    expect(
      i18n.t('directory.update.formTitle', {
        level: i18n.t('shared.churchLevel.Governorship'),
      })
    ).toBe('Update Governorship Form')
  })

  it('resolves the French form title for Governorship', async () => {
    await i18n.changeLanguage('fr')

    expect(
      i18n.t('directory.update.formTitle', {
        level: i18n.t('shared.churchLevel.Governorship'),
      })
    ).toBe('Formulaire de mise à jour : Gouvernorat')
  })

  it('resolves the leader-changed success message identically to the other Update*.tsx pages', () => {
    expect(i18n.t('directory.update.leaderChanged')).toBe(
      'Leader Changed Successfully'
    )
  })
})
