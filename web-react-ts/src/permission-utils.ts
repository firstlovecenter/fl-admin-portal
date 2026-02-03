import { ChurchLevel, Role } from 'global-types'

// Permissions Things
export const permitLeader = (churchLevel: ChurchLevel) => {
  let permittedFor: Role[] = []
  switch (churchLevel.toLowerCase()) {
    case 'bacenta':
      permittedFor = [
        'leaderDenomination',
        'leaderOversight',
        'leaderCampus',
        'leaderStream',
        'leaderCouncil',
        'leaderGovernorship',
        'leaderBacenta',
        'adminMinistry',
        'adminCreativeArts',
      ]
      break
    case 'governorship':
      permittedFor = [
        'leaderDenomination',
        'leaderOversight',
        'leaderCampus',
        'leaderStream',
        'leaderCouncil',
        'leaderGovernorship',
        'adminMinistry',
        'adminCreativeArts',
      ]
      break
    case 'council':
      permittedFor = [
        'leaderDenomination',
        'leaderOversight',
        'leaderCampus',
        'leaderStream',
        'leaderCouncil',
        'leaderHubCouncil',
        'adminMinistry',
        'adminCreativeArts',
      ]
      break
    case 'stream':
      permittedFor = [
        'leaderDenomination',
        'leaderOversight',
        'leaderCampus',
        'leaderStream',
        'leaderMinistry',
        'adminMinistry',
        'adminCreativeArts',
      ]
      break
    case 'campus':
      permittedFor = [
        'leaderDenomination',
        'leaderOversight',
        'leaderCampus',
        'leaderCreativeArts',
        'adminCreativeArts',
      ]
      break
    case 'oversight':
      permittedFor = ['leaderDenomination', 'leaderOversight']
      break
    case 'denomination':
      permittedFor = ['leaderDenomination']
      break
    case 'creativearts':
      permittedFor = ['leaderCampus', 'leaderCreativeArts']
      break
    case 'ministry':
      permittedFor = [
        'leaderCampus',
        'leaderStream',
        'leaderCreativeArts',
        'leaderMinistry',
      ]
      break
    case 'hubcouncil':
      permittedFor = [
        'leaderCampus',
        'leaderCreativeArts',
        'leaderStream',
        'leaderMinistry',
        'leaderHubCouncil',
        'leaderHub',
      ]
      break
    case 'hub':
      permittedFor = [
        'leaderCampus',
        'leaderCreativeArts',
        'leaderStream',
        'leaderMinistry',
        'leaderHubCouncil',
        'leaderHub',
      ]
      break
    default:
      permittedFor = []
      break
  }

  return permittedFor
}

export const permitAdmin = (churchLevel: ChurchLevel) => {
  let permittedFor: Role[] = []
  switch (churchLevel) {
    case 'Bacenta':
    case 'Hub':
      permittedFor = [
        'adminMinistry',
        'adminCreativeArts',
        'adminGovernorship',
        'adminCouncil',
        'adminStream',
        'adminCampus',
        'adminDenomination',
        'adminOversight',
      ]
      break
    case 'Governorship':
      permittedFor = [
        'adminDenomination',
        'adminOversight',
        'adminCampus',
        'adminStream',
        'adminCouncil',
        'adminGovernorship',
      ]
      break

    case 'Council':
      permittedFor = [
        'adminDenomination',
        'adminOversight',
        'adminCampus',
        'adminStream',
        'adminCouncil',
      ]
      break
    case 'Stream':
      permittedFor = [
        'adminDenomination',
        'adminOversight',
        'adminCampus',
        'adminStream',
      ]
      break
    case 'Campus':
      permittedFor = ['adminDenomination', 'adminOversight', 'adminCampus']
      break
    case 'Oversight':
      permittedFor = ['adminDenomination', 'adminOversight']
      break
    case 'Denomination':
      permittedFor = ['adminDenomination']
      break
    case 'CreativeArts':
      permittedFor = [
        'adminDenomination',
        'adminOversight',
        'adminCampus',
        'adminCreativeArts',
      ]
      break
    case 'Ministry':
      permittedFor = [
        'adminDenomination',
        'adminOversight',
        'adminCampus',
        'adminStream',
        'adminCreativeArts',
        'adminMinistry',
      ]
      break
    case 'HubCouncil':
      permittedFor = [
        'adminDenomination',
        'adminOversight',
        'adminCampus',
        'adminStream',
        'adminCouncil',
        'adminCreativeArts',
        'adminMinistry',
      ]
      break

    default:
      permittedFor = []
      break
  }

  return permittedFor
}

export const permitLeaderAdmin = (churchLevel: ChurchLevel): Role[] => {
  return [...permitLeader(churchLevel), ...permitAdmin(churchLevel)]
}

export const permitMe = (churchLevel: ChurchLevel): Role[] => {
  return [
    ...permitLeaderAdmin(churchLevel),
    ...permitArrivals(churchLevel),
    ...permitArrivalsHelpers(churchLevel),
    ...permitTellerStream(),
    ...permitSheepSeeker(),
  ]
}

export const permitArrivals = (churchLevel: ChurchLevel): Role[] => {
  let permittedFor: Role[] = []
  switch (churchLevel) {
    case 'Bacenta':
      permittedFor = [
        'arrivalsAdminCampus',
        'arrivalsAdminStream',
        'arrivalsAdminCouncil',
        'arrivalsAdminGovernorship',
      ]
      break
    case 'Governorship':
      permittedFor = [
        'arrivalsAdminCampus',
        'arrivalsAdminStream',
        'arrivalsAdminCouncil',
        'arrivalsAdminGovernorship',
      ]
      break
    case 'Council':
      permittedFor = [
        'arrivalsAdminCampus',
        'arrivalsAdminStream',
        'arrivalsAdminCouncil',
      ]
      break
    case 'Stream':
      permittedFor = ['arrivalsAdminCampus', 'arrivalsAdminStream']
      break
    case 'Campus':
      permittedFor = ['arrivalsAdminCampus']
      break
    default:
      permittedFor = []
      break
  }

  if (churchLevel === 'Stream') {
    return [...permitAdmin(churchLevel), ...permittedFor]
  }
  return permittedFor
}

export const permitArrivalsCounter = (): Role[] => {
  return ['arrivalsCounterStream']
}
export const permitArrivalsPayer = (): Role[] => {
  return ['arrivalsPayerCouncil']
}

export const permitArrivalsHelpers = (churchLevel: ChurchLevel): Role[] => {
  if (churchLevel === 'Stream') {
    return ['arrivalsCounterStream', 'arrivalsPayerCouncil']
  }
  return []
}
export const permitLeaderAdminArrivals = (churchLevel: ChurchLevel): Role[] => {
  return [...permitLeaderAdmin(churchLevel), ...permitArrivals(churchLevel)]
}

export const permitAdminArrivals = (churchLevel: ChurchLevel): Role[] => {
  return [...permitAdmin(churchLevel), ...permitArrivals(churchLevel)]
}

export const permitTellerStream = (): Role[] => {
  return ['tellerStream']
}

export const permitSheepSeeker = (): Role[] => {
  return ['sheepseekerStream']
}
