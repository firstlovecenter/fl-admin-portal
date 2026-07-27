/**
 * i18n key-guard for TransactionHistoryView chrome strings.
 * Complements LandingPage.test.tsx so both landing and history namespaces
 * are covered under the accounts test filter.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('TransactionHistoryView i18n', () => {
  it('resolves history chrome keys in English', () => {
    expect(i18n.t('accounts.history.titleHighlight')).toBe(
      'Transaction History'
    )
    expect(i18n.t('accounts.history.downloadCsv')).toBe('Download CSV')
    expect(i18n.t('accounts.history.empty')).toBe('No transactions yet.')
    expect(i18n.t('accounts.history.transactionCount', { count: 1 })).toBe(
      '1 transaction recorded.'
    )
    expect(i18n.t('accounts.history.transactionCount', { count: 3 })).toBe(
      '3 transactions recorded.'
    )
  })

  it('resolves history chrome keys in French', async () => {
    await i18n.changeLanguage('fr')

    expect(i18n.t('accounts.history.titleHighlight')).toBe(
      'Historique des transactions'
    )
    expect(i18n.t('accounts.history.downloadCsv')).toBe('Télécharger le CSV')
    expect(i18n.t('accounts.history.empty')).toBe(
      'Aucune transaction pour le moment.'
    )
    expect(i18n.t('accounts.history.transactionCount', { count: 1 })).toBe(
      '1 transaction enregistrée.'
    )
    expect(i18n.t('accounts.history.titleHighlight')).not.toBe(
      'Transaction History'
    )
  })
})
