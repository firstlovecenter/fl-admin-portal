/**
 * Tests for the i18n conversion of UpdateStream.tsx.
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

describe('UpdateStream i18n keys', () => {
  it('resolves the English form title for Stream', () => {
    expect(
      i18n.t('directory.update.formTitle', {
        level: i18n.t('shared.churchLevel.Stream'),
      })
    ).toBe('Update Stream Form')
  })

  it('resolves the French form title for Stream', async () => {
    await i18n.changeLanguage('fr')

    expect(
      i18n.t('directory.update.formTitle', {
        level: i18n.t('shared.churchLevel.Stream'),
      })
    ).toBe('Formulaire de mise à jour : Filière')
  })

  it('resolves the leader-changed success message identically to the other Update*.tsx pages', () => {
    expect(i18n.t('directory.update.leaderChanged')).toBe(
      'Leader Changed Successfully'
    )
  })
})
