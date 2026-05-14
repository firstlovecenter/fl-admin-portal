import { ChurchLevel, Role, ServantEdgeType, ServantTree } from 'global-types'

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
      ]
      break
    case 'council':
      permittedFor = [
        'leaderDenomination',
        'leaderOversight',
        'leaderCampus',
        'leaderStream',
        'leaderCouncil',
      ]
      break
    case 'stream':
      permittedFor = [
        'leaderDenomination',
        'leaderOversight',
        'leaderCampus',
        'leaderStream',
      ]
      break
    case 'campus':
      permittedFor = [
        'leaderDenomination',
        'leaderOversight',
        'leaderCampus',
      ]
      break
    case 'oversight':
      permittedFor = ['leaderDenomination', 'leaderOversight']
      break
    case 'denomination':
      permittedFor = ['leaderDenomination']
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
      permittedFor = [
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
  } else {
    return permittedFor
  }
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
  } else {
    return []
  }
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

export const permitShepherdingControl = (): Role[] => [
  'leaderGovernorship',
  'leaderCouncil',
  'leaderStream',
  'leaderCampus',
  'leaderOversight',
  'leaderDenomination',
  'adminGovernorship',
  'adminCouncil',
  'adminStream',
  'adminCampus',
  'adminOversight',
  'adminDenomination',
]

// ─────────────────────────────────────────────────────────────────────────
// Per-instance authority helpers.
//
// These mirror `api/src/resolvers/permissions.ts` exactly (ADR-001). Any
// change here MUST land in the BE file in the same PR and vice-versa.
//
// The flat `currentUser.roles` claim is coarse and unbound — holding
// `adminStream` says nothing about WHICH stream. The per-instance helpers
// answer "at THIS church, does the user hold a role that satisfies this
// permitX(level) set?" by walking the user's servant trees, populated at
// login by `GET_LOGGED_IN_USER { myAuthority { servantTrees } }`.
// ─────────────────────────────────────────────────────────────────────────

// Maps a servant edge `(type, level)` to the coarse Role name produced by
// the auth service. Pairing follows the existing permitX helpers:
//   LEADS / DEPUTY_LEADS  →  leader<Level>
//   IS_ADMIN_FOR          →  admin<Level>
//   DOES_ARRIVALS_FOR     →  arrivalsAdmin<Level>
//   COUNTS_ARRIVALS_FOR   →  arrivalsCounterStream
//   IS_TELLER_FOR         →  tellerStream
//   IS_ARRIVALS_PAYER_FOR →  arrivalsPayerCouncil
//
// Returns `null` for combinations the Role enum does not cover (e.g.
// IS_ADMIN_FOR + Bacenta — Bacenta has no admin edge in the SDL).
export const edgeToRole = (
  type: ServantEdgeType,
  level: ChurchLevel
): Role | null => {
  switch (type) {
    case 'LEADS':
    case 'DEPUTY_LEADS': {
      switch (level) {
        case 'Bacenta':
          return 'leaderBacenta'
        case 'Governorship':
          return 'leaderGovernorship'
        case 'Council':
          return 'leaderCouncil'
        case 'Stream':
          return 'leaderStream'
        case 'Campus':
          return 'leaderCampus'
        case 'Oversight':
          return 'leaderOversight'
        case 'Denomination':
          return 'leaderDenomination'
        default:
          return null
      }
    }
    case 'IS_ADMIN_FOR': {
      switch (level) {
        case 'Governorship':
          return 'adminGovernorship'
        case 'Council':
          return 'adminCouncil'
        case 'Stream':
          return 'adminStream'
        case 'Campus':
          return 'adminCampus'
        case 'Oversight':
          return 'adminOversight'
        case 'Denomination':
          return 'adminDenomination'
        default:
          return null
      }
    }
    case 'DOES_ARRIVALS_FOR': {
      switch (level) {
        case 'Governorship':
          return 'arrivalsAdminGovernorship'
        case 'Council':
          return 'arrivalsAdminCouncil'
        case 'Stream':
          return 'arrivalsAdminStream'
        case 'Campus':
          return 'arrivalsAdminCampus'
        default:
          return null
      }
    }
    case 'COUNTS_ARRIVALS_FOR':
      return level === 'Stream' ? 'arrivalsCounterStream' : null
    case 'IS_TELLER_FOR':
      return level === 'Stream' ? 'tellerStream' : null
    case 'IS_ARRIVALS_PAYER_FOR':
      return level === 'Council' ? 'arrivalsPayerCouncil' : null
    default:
      return null
  }
}

// Returns the coarse roles the user holds AT this specific church. Because
// each tree's `reach` already contains the tree root plus every spine
// descendant, a higher-level edge cascades down by construction — e.g.
// `LEADS` on Oversight X yields `leaderOversight` for every Bacenta below X.
export const rolesAt = (
  trees: ServantTree[] | undefined | null,
  churchId: string | undefined | null
): Role[] => {
  if (!churchId || !trees || trees.length === 0) return []
  const hits: Role[] = []
  for (const tree of trees) {
    if (!tree.reach.includes(churchId)) continue
    const role = edgeToRole(tree.type, tree.level)
    if (role && !hits.includes(role)) hits.push(role)
  }
  return hits
}

// True iff the user holds any role at `churchId` that satisfies a
// permitX(level) set.
export const canDoAt = (
  trees: ServantTree[] | undefined | null,
  permittedRoles: Role[],
  churchId: string | undefined | null
): boolean => {
  if (!permittedRoles || permittedRoles.length === 0) return false
  const held = rolesAt(trees, churchId)
  return held.some((r) => permittedRoles.includes(r))
}

// Spine visibility — separate from action authority. A user can see a
// crumb's ancestors so the breadcrumb chain renders, but holds no role
// there.
export const isViewable = (
  viewable: string[] | undefined | null,
  churchId: string | undefined | null
): boolean => !!churchId && !!viewable && viewable.includes(churchId)
