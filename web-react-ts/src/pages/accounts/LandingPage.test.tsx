/**
 * i18n key-guard tests for accounts LandingPage.
 *
 * Full-render coverage needs ChurchRoleScope + Apollo stream councils and
 * is disproportionate for locking translation keys; this matches the
 * CreateMember / ArrivalsCounterDashboard pattern of asserting EN + FR
 * resolution via `i18n.t(...)`.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('Accounts LandingPage i18n', () => {
  it('resolves landing and common keys in English', () => {
    expect(i18n.t('accounts.common.title')).toBe('Accounts')
    expect(i18n.t('accounts.landing.chooseCouncil')).toBe(
      'Choose a council to continue.'
    )
    expect(i18n.t('accounts.landing.switchScopeHint')).toBe(
      'Switch to a Stream, Council, or Campus scope to view accounts.'
    )
    expect(i18n.t('accounts.landing.noCouncilsYet')).toBe('No councils yet')
    expect(i18n.t('accounts.landing.noCouncilsBody')).toBe(
      'This stream has no councils.'
    )
    expect(
      i18n.t('accounts.landing.councilAccountsTitle', { name: 'Accra' })
    ).toBe('Accra Council')
    expect(i18n.t('accounts.landing.councilAccountsFallback')).toBe('Council')
    expect(i18n.t('accounts.common.noLeader')).toBe('No leader')
  })

  it('resolves landing and common keys in French', async () => {
    await i18n.changeLanguage('fr')

    expect(i18n.t('accounts.common.title')).toBe('Comptes')
    expect(i18n.t('accounts.landing.chooseCouncil')).toBe(
      'Choisissez un conseil pour continuer.'
    )
    expect(i18n.t('accounts.landing.noCouncilsYet')).toBe(
      'Aucun conseil pour le moment'
    )
    expect(i18n.t('accounts.landing.noCouncilsBody')).toBe(
      "Cette filière n'a aucun conseil."
    )
    expect(
      i18n.t('accounts.landing.councilAccountsTitle', { name: 'Accra' })
    ).toBe('Conseil Accra')
    expect(i18n.t('accounts.common.noLeader')).toBe('Pas de responsable')
    expect(i18n.t('accounts.common.title')).not.toBe('Accounts')
  })
})
