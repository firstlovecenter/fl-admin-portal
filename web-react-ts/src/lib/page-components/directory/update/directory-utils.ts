import { Church, ChurchLevel, Role, VerbTypes } from 'global-types'

export const churchLevels: ChurchLevel[] = [
  'Hub',
  'Bacenta',
  'Governorship',
  'HubCouncil',
  'Ministry',
  'CreativeArts',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'Denomination',
]

export const getHighestRole = (roles: Role[]) => {
  let highestRole

  let highestLevel: ChurchLevel = 'Bacenta'
  let highestVerb: VerbTypes = 'leader'

  for (let i = churchLevels.length; i >= 0; i--) {
    const churchLevelLower = churchLevels[i]
      ?.toLowerCase()
      .replace('leader', '')
      .replace('admin', '')
      .replace('arrivalsadmin', '')
    let breakCheck = false

    for (let j = 0; j < roles.length; j++) {
      const roleLower = roles[j]
        ?.toLowerCase()
        .replace('leader', '')
        .replace('admin', '')
        .replace('arrivals', '')

      if (roleLower === churchLevelLower) {
        breakCheck = true
        highestRole = roles[j]
        highestLevel = churchLevels[i]
        // @ts-ignore
        highestVerb = highestRole?.replace(highestLevel, '')
        break
      }
    }

    if (breakCheck) break
  }

  return {
    highestRole,
    highestLevel,
    highestVerb,
  }
}

export const nextHigherChurch = (churchLevel: ChurchLevel): ChurchLevel => {
  switch (churchLevel) {
    case 'Bacenta':
      return 'Governorship'
    case 'Governorship':
      return 'Council'
    case 'Council':
      return 'Stream'
    case 'Stream':
      return 'Campus'
    case 'Campus':
      return 'Oversight'
    default:
      return 'Bacenta'
  }
}

export const nextLowerChurch = (churchLevel: ChurchLevel) => {
  switch (churchLevel) {
    case 'Bacenta':
      return 'Bacenta'
    case 'Governorship':
      return 'Bacenta'
    case 'Council':
      return 'Governorship'
    case 'Stream':
      return 'Council'
    case 'Campus':
      return 'Stream'
    case 'Oversight':
      return 'Campus'
    default:
      break
  }
}

export const getChurchIdsFromObject = (churchList: Church[]) => {
  const newArray = churchList.map((churchList) => churchList.id)

  return newArray
}
