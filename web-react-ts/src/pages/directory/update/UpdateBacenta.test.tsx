/**
 * Tests for the i18n conversion of UpdateBacenta.tsx.
 *
 * UpdateBacenta.tsx follows the exact same pattern as UpdateCampus.tsx
 * (translated `title` prop via `directory.update.formTitle` +
 * `alertSuccess(t('directory.update.leaderChanged'))`) — see
 * UpdateCampus.test.tsx for the full-render `MockedProvider` +
 * `DISPLAY_BACENTA` scaffolding and the rationale for not repeating that
 * scaffolding six times for six structurally-identical wrapper pages.
 * This file verifies the actual keys this page's `t()` calls resolve to,
 * in English and French, which is what's specific to this file (the
 * `directory.update.*` namespace itself is exercised end-to-end by
 * UpdateCampus.test.tsx).
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('UpdateBacenta i18n keys', () => {
  it('resolves the English form title for Bacenta', () => {
    expect(
      i18n.t('directory.update.formTitle', {
        level: i18n.t('shared.churchLevel.Bacenta'),
      })
    ).toBe('Update Bacenta Form')
  })

  it('resolves the French form title for Bacenta', async () => {
    await i18n.changeLanguage('fr')

    expect(
      i18n.t('directory.update.formTitle', {
        level: i18n.t('shared.churchLevel.Bacenta'),
      })
    ).toBe('Formulaire de mise à jour : Bacenta')
  })

  it('resolves the leader-changed success message identically to the other Update*.tsx pages', () => {
    expect(i18n.t('directory.update.leaderChanged')).toBe(
      'Leader Changed Successfully'
    )
  })
})
