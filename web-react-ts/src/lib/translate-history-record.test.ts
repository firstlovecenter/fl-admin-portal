/**
 * Display-time translation of persisted HistoryLog.historyRecord strings.
 * Records stay English in Neo4j; known templates are rewritten via i18n.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'
import { translateHistoryRecord } from './translate-history-record'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('translateHistoryRecord', () => {
  it('leaves unrecognized English audit text unchanged', () => {
    const raw = 'Some one-off migration note from 2019'
    expect(translateHistoryRecord(raw, i18n.t.bind(i18n))).toBe(raw)
  })

  it('translates “History Begins” and “closed down” templates into French', async () => {
    await i18n.changeLanguage('fr')
    const t = i18n.t.bind(i18n)

    expect(
      translateHistoryRecord('Ghana Family Oversight History Begins', t)
    ).toBe('Début de l’historique de Ghana Family (Supervision)')

    expect(
      translateHistoryRecord(
        'Ghana Family Oversight was closed down under UO-FLC190 Denomination',
        t
      )
    ).toBe(
      'Ghana Family (Supervision) a été fermé sous UO-FLC190 (Dénomination)'
    )
  })

  it('keeps Bacenta untranslated in every locale (glossary)', async () => {
    await i18n.changeLanguage('fr')
    const t = i18n.t.bind(i18n)
    expect(
      translateHistoryRecord('Sunrise Bacenta History Begins', t)
    ).toBe('Début de l’historique de Sunrise (Bacenta)')
  })

  it('prefers specific bussing/bus-payment templates over generic detailsUpdated', async () => {
    await i18n.changeLanguage('fr')
    const t = i18n.t.bind(i18n)
    expect(
      translateHistoryRecord('Sunrise Bacenta Bussing Details were updated', t)
    ).toBe('Les détails de bussing de Sunrise Bacenta ont été mis à jour')
    expect(
      translateHistoryRecord(
        'Sunrise Bacenta Bus Payment Details were updated',
        t
      )
    ).toBe(
      'Les détails de paiement bus de Sunrise Bacenta ont été mis à jour'
    )
  })

  it('returns empty string for nullish input', () => {
    expect(translateHistoryRecord(null, i18n.t.bind(i18n))).toBe('')
    expect(translateHistoryRecord(undefined, i18n.t.bind(i18n))).toBe('')
  })

  it('rewrites servant appointment / removal templates into French', async () => {
    await i18n.changeLanguage('fr')
    const t = i18n.t.bind(i18n)

    expect(
      translateHistoryRecord(
        'Kwame became the Leader of Sunrise Bacenta',
        t
      )
    ).toBe('Kwame est devenu Leader de Sunrise Bacenta')

    expect(
      translateHistoryRecord(
        'Ama became the Leader of Sunrise Bacenta replacing Kwame',
        t
      )
    ).toBe(
      'Ama est devenu Leader de Sunrise Bacenta en remplacement de Kwame'
    )

    expect(
      translateHistoryRecord(
        'Kwame was removed as the Bacenta Leader for Sunrise Bacenta',
        t
      )
    ).toBe(
      'Kwame a été retiré en tant que Leader Bacenta pour Sunrise Bacenta'
    )
  })

  it('rewrites name-change templates and translates Stream level into French', async () => {
    await i18n.changeLanguage('fr')
    const t = i18n.t.bind(i18n)

    expect(
      translateHistoryRecord(
        'Stream name has been changed from Alpha to Beta',
        t
      )
    ).toBe('Le nom de Filière a été changé de Alpha à Beta')

    expect(
      translateHistoryRecord(
        'Bacenta name has been changed from Old Name to New Name',
        t
      )
    ).toBe('Le nom de Bacenta a été changé de Old Name à New Name')
  })

  it('leaves well-formed English servant / name-change records unchanged in en', () => {
    const t = i18n.t.bind(i18n)
    const samples = [
      'Kwame became the Leader of Sunrise Bacenta',
      'Ama became the Leader of Sunrise Bacenta replacing Kwame',
      'Kwame was removed as the Bacenta Leader for Sunrise Bacenta',
      'Stream name has been changed from Alpha to Beta',
    ]
    for (const raw of samples) {
      expect(translateHistoryRecord(raw, t)).toBe(raw)
    }
  })
})
