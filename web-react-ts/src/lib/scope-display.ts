import type { TFunction } from 'i18next'

// `t` is optional so callers on pages not yet migrated to i18n (per ADR-017's
// incremental page-by-page rollout) keep today's English-only behavior
// unchanged; localized pages pass their `t` to get the translated label.
export const formatChurchLevel = (churchType?: string, t?: TFunction): string => {
  if (!churchType) return ''
  const spaced = churchType.replace(/([a-z])([A-Z])/g, '$1 $2')
  if (!t) return spaced
  return t(`shared.churchLevel.${churchType}`, { defaultValue: spaced })
}

export const getRoleRelationLabel = (
  authRole?: string,
  fallbackRoleName = '',
  t?: TFunction
): string => {
  if (!authRole) return fallbackRoleName
  const key = authRole.startsWith('leader')
    ? 'leader'
    : authRole.startsWith('arrivalsAdmin')
    ? 'arrivalsAdmin'
    : authRole.startsWith('arrivalsCounter')
    ? 'arrivalsCounter'
    : authRole.startsWith('admin')
    ? 'admin'
    : authRole.startsWith('teller')
    ? 'teller'
    : undefined
  if (!key) return fallbackRoleName
  const englishLabels: Record<string, string> = {
    leader: 'Leader',
    admin: 'Admin',
    arrivalsAdmin: 'Arrivals Admin',
    arrivalsCounter: 'Arrivals Counter',
    teller: 'Teller',
  }
  if (!t) return englishLabels[key]
  return t(`shared.roleLabel.${key}`, { defaultValue: englishLabels[key] })
}
