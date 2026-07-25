/**
 * `formatChurchLevel` and `getRoleRelationLabel` both gained an optional
 * trailing `t?: TFunction` param when this pass added translations for the
 * dashboards page group. ~10 other callers (ChurchRoleScopePicker,
 * ChurchScopeNavItem, StateBacentasToCount, ArrivalsCounterDashboard,
 * StreamTellerDashboard, ConfirmManualBanking, ServicesMenu, Settings, ...)
 * do NOT pass `t`, so the no-`t` path must stay byte-identical to the
 * pre-i18n behavior — covered first and most thoroughly below. The `t`-path
 * (used by dashboard-shared.tsx / UserDashboard.tsx) is covered against the
 * real `lib/i18n.ts` instance in both English and French.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'
import { formatChurchLevel, getRoleRelationLabel } from './scope-display'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('formatChurchLevel — no `t` (backward-compat majority path)', () => {
  it('returns the churchType unchanged when there is no camelCase boundary', () => {
    expect(formatChurchLevel('Bacenta')).toBe('Bacenta')
    expect(formatChurchLevel('Campus')).toBe('Campus')
    expect(formatChurchLevel('Stream')).toBe('Stream')
  })

  it('space-separates a camelCase churchType via regex, untranslated', () => {
    expect(formatChurchLevel('Governorship')).toBe('Governorship')
    // Actual camelCase boundary case, e.g. a hypothetical "SomeLevel" type —
    // exercises the /([a-z])([A-Z])/ regex path directly.
    expect(formatChurchLevel('someLevelType')).toBe('some Level Type')
  })

  it('returns an empty string for an undefined/empty churchType', () => {
    expect(formatChurchLevel(undefined)).toBe('')
    expect(formatChurchLevel('')).toBe('')
  })
})

describe('getRoleRelationLabel — no `t` (backward-compat majority path)', () => {
  it('maps each known authRole prefix to its English label', () => {
    expect(getRoleRelationLabel('leaderBacenta')).toBe('Leader')
    expect(getRoleRelationLabel('adminStream')).toBe('Admin')
    expect(getRoleRelationLabel('arrivalsAdminStream')).toBe('Arrivals Admin')
    expect(getRoleRelationLabel('arrivalsCounterStream')).toBe(
      'Arrivals Counter'
    )
    expect(getRoleRelationLabel('tellerStream')).toBe('Teller')
  })

  it('falls back to fallbackRoleName when authRole is undefined', () => {
    expect(getRoleRelationLabel(undefined, 'fallback')).toBe('fallback')
    expect(getRoleRelationLabel(undefined)).toBe('')
  })

  it('falls back to fallbackRoleName when authRole matches no known prefix', () => {
    expect(getRoleRelationLabel('arrivalsPayerCouncil', 'Payer')).toBe(
      'Payer'
    )
    expect(getRoleRelationLabel('someUnknownRole' as never, 'Custom')).toBe(
      'Custom'
    )
  })
})

describe('formatChurchLevel — with `t` (dashboard callers)', () => {
  it('returns the English translation, matching the untranslated string', () => {
    expect(formatChurchLevel('Bacenta', i18n.t)).toBe('Bacenta')
    expect(formatChurchLevel('Stream', i18n.t)).toBe('Stream')
  })

  it('returns the French translation once the language is switched', async () => {
    await i18n.changeLanguage('fr')
    expect(formatChurchLevel('Stream', i18n.t)).toBe('Filière')
    expect(formatChurchLevel('Governorship', i18n.t)).toBe('Gouvernorat')
    expect(formatChurchLevel('Council', i18n.t)).toBe('Conseil')
  })

  it('falls back to the regex-spaced value for a churchType with no translation key', () => {
    // "Oversight"/"Denomination" are valid ChurchLevels but are not present
    // in shared.churchLevel.* — the `defaultValue` fallback applies.
    expect(formatChurchLevel('Oversight', i18n.t)).toBe('Oversight')
    expect(formatChurchLevel('Denomination', i18n.t)).toBe('Denomination')
  })
})

describe('getRoleRelationLabel — with `t` (dashboard callers)', () => {
  it('returns the English translation, matching the untranslated label', () => {
    expect(getRoleRelationLabel('leaderBacenta', '', i18n.t)).toBe('Leader')
    expect(getRoleRelationLabel('arrivalsAdminStream', '', i18n.t)).toBe(
      'Arrivals Admin'
    )
  })

  it('returns the French translation once the language is switched', async () => {
    await i18n.changeLanguage('fr')
    expect(getRoleRelationLabel('leaderBacenta', '', i18n.t)).toBe(
      'Responsable'
    )
    expect(getRoleRelationLabel('adminStream', '', i18n.t)).toBe(
      'Administrateur'
    )
    expect(getRoleRelationLabel('tellerStream', '', i18n.t)).toBe('Caissier')
  })

  it('still falls back to fallbackRoleName when `t` is passed but authRole is unmapped', () => {
    expect(
      getRoleRelationLabel('arrivalsPayerCouncil', 'Payer', i18n.t)
    ).toBe('Payer')
  })
})
