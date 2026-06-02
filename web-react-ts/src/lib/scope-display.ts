export const formatChurchLevel = (churchType?: string): string => {
  if (!churchType) return ''
  return churchType.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export const getRoleRelationLabel = (
  authRole?: string,
  fallbackRoleName = ''
): string => {
  if (!authRole) return fallbackRoleName
  if (authRole.startsWith('leader')) return 'Leader'
  if (authRole.startsWith('admin')) return 'Admin'
  if (authRole.startsWith('arrivalsAdmin')) return 'Arrivals Admin'
  if (authRole.startsWith('arrivalsCounter')) return 'Arrivals Counter'
  if (authRole.startsWith('teller')) return 'Teller'
  return fallbackRoleName
}
