/**
 * Characterization for display-only account/category/status enum mappers.
 * API wire values stay English; these helpers only change what users see.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'
import {
  translateAccountLabel,
  translateCategoryLabel,
  translateStatusLabel,
} from './accounts-i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('accounts-i18n enum labels', () => {
  it('maps API enums to English display labels', () => {
    const t = i18n.t.bind(i18n)
    expect(translateAccountLabel(t, 'Weekday Account')).toBe('Weekday Account')
    expect(translateAccountLabel(t, 'Bussing Society')).toBe('Bussing Society')
    expect(translateCategoryLabel(t, 'Deposit')).toBe('Deposit')
    expect(translateCategoryLabel(t, 'Bussing')).toBe('Bussing')
    expect(translateStatusLabel(t, 'pending approval')).toBe(
      'pending approval'
    )
  })

  it('maps API enums to French display labels', async () => {
    await i18n.changeLanguage('fr')
    const t = i18n.t.bind(i18n)

    expect(translateAccountLabel(t, 'Weekday Account')).toBe(
      'Compte de semaine'
    )
    expect(translateAccountLabel(t, 'Bussing Society')).toBe('Société de bus')
    expect(translateCategoryLabel(t, 'Deposit')).toBe('Dépôt')
    expect(translateCategoryLabel(t, 'Bussing')).toBe('Bus')
    expect(translateStatusLabel(t, 'pending approval')).toBe(
      "en attente d'approbation"
    )
    expect(translateCategoryLabel(t, 'Bussing')).not.toBe('Bussing')
  })
})
