import type { TFunction } from 'i18next'
import {
  Church,
  ChurchLevel,
  MemberWithChurches,
  Role,
  Servant,
  UserJobs,
  VerbTypes,
} from 'global-types'
import { authorisedLink, plural } from 'global-utils'
import { churchLevels } from 'pages/directory/update/directory-utils'
import { formatChurchLevel } from 'lib/scope-display'
import {
  permitMe,
} from 'permission-utils'

// `t` optional, like `formatChurchLevel`/`getRoleRelationLabel` in
// lib/scope-display.ts — callers that don't pass it keep the exact English
// "<Level> Admin" / "<Level> Arrivals Admin" strings this always returned.
const roleDisplayName = (
  level: ChurchLevel,
  suffix?: 'admin' | 'arrivalsAdmin',
  t?: TFunction
): string => {
  const base = formatChurchLevel(level, t)
  if (!suffix) return base
  const englishSuffix = suffix === 'admin' ? 'Admin' : 'Arrivals Admin'
  const translatedSuffix = t
    ? t(`shared.roleLabel.${suffix}`, { defaultValue: englishSuffix })
    : englishSuffix
  return `${base} ${translatedSuffix}`
}

export const roles: {
  [key in ChurchLevel]: VerbTypes[]
} = {
  Bacenta: ['leads'],
  Governorship: ['leads', 'isAdminFor', 'isArrivalsAdminFor'],
  Council: ['leads', 'isAdminFor', 'isArrivalsAdminFor', 'isArrivalsPayerFor'],
  Stream: [
    'leads',
    'isAdminFor',
    'isArrivalsAdminFor',
    'isArrivalsCounterFor',
    'isTellerFor',
  ],
  Campus: ['leads', 'isAdminFor', 'isArrivalsAdminFor'],
  Oversight: ['leads', 'isAdminFor'],
  Denomination: ['leads', 'isAdminFor'],
}

export const parseRoles = (role: VerbTypes): VerbTypes => {
  switch (role) {
    case 'leader':
      return 'leads'
    case 'admin':
      return 'isAdminFor'
    case 'arrivalsAdmin':
      return 'isArrivalsAdminFor'
    case 'arrivalsCounter':
      return 'isArrivalsCounterFor'
    case 'arrivalsPayer':
      return 'isArrivalsPayerFor'
    case 'teller':
      return 'isTellerFor'

    case 'leads':
      return 'leader'
    case 'isAdminFor':
      return 'admin'
    case 'isArrivalsAdminFor':
      return 'arrivalsAdmin'
    case 'isArrivalsCounterFor':
      return 'arrivalsCounter'
    case 'isArrivalsPayerFor':
      return 'arrivalsPayer'
    case 'isTellerFor':
      return 'teller'

    default:
      return role
  }
}

type ServantRolesArgs = {
  servant?: any
  servantType: VerbTypes
  churchType: ChurchLevel
  verb: string
  authRoles: string
  userroles: UserJobs[]
}

const setServantRoles = (args: ServantRolesArgs) => {
  const { servant, servantType, churchType, verb, authRoles, userroles } = args
  if (!servant) return

  const permittedForLink = permitMe(churchType)

  if (
    servantType === 'isArrivalsPayerFor' ||
    servantType === 'isArrivalsCounterFor'
  ) {
    const adminsOneChurch = servant[`${verb}`]?.length === 1
    userroles.push({
      name: adminsOneChurch
        ? churchType + ' ' + parseRoles(servantType)
        : plural(churchType) + ' ' + parseRoles(servantType),
      authRoles,
      church: servant[`${verb}`],
      number: servant[`${verb}`]?.length,
      link: authorisedLink(servant, permittedForLink, `/arrivals`),
    })

    return
  }

  if (servantType === 'isTellerFor') {
    const adminsOneChurch = servant[`${verb}`]?.length === 1
    userroles.push({
      authRoles,
      name: adminsOneChurch
        ? churchType + ' ' + parseRoles(servantType)
        : plural(churchType) + ' ' + parseRoles(servantType),
      church: servant[`${verb}`],
      number: servant[`${verb}`]?.length,
      link: authorisedLink(servant, permittedForLink, `/services`),
    })

    return
  }

  if (servantType === 'isAdminFor' || servantType === 'isArrivalsAdminFor') {
    const adminsOneChurch = servant[`${verb}`]?.length === 1
    userroles.push({
      authRoles,
      name: adminsOneChurch
        ? churchType + ' ' + parseRoles(servantType)
        : plural(churchType) + ' ' + parseRoles(servantType),
      church: servant[`${verb}`],
      number: servant[`${verb}`]?.length,

      link: authorisedLink(
        servant,
        permittedForLink,
        `/${churchType.toLowerCase()}/displaydetails`
      ),
    })

    return
  }

  const leadsOneChurch = servant[`${verb}`]?.length === 1

  userroles.push({
    authRoles,
    name: leadsOneChurch ? churchType : plural(churchType),
    church: servant[`${verb}`],
    number: servant[`${verb}`]?.length,
    link: authorisedLink(
      servant,
      permittedForLink,
      `/${churchType.toLowerCase()}/displaydetails`
    ),
  })
}

// The `link` field below satisfies the UserJobs type but is never read for
// navigation — ChurchRoleScopeContext owns routing for multi-church users.
export const getUserServantRoles = (servant: Servant) => {
  let userroles: UserJobs[] = []

  churchLevels.forEach((level: ChurchLevel) => {
    roles[`${level}`].forEach((verb: VerbTypes) => {
      const servantRoles: string[] = servant?.roles

      const shouldSearch = (verb: VerbTypes, level: ChurchLevel) =>
        servantRoles.includes(`${parseRoles(verb)}${level}`)

      if (shouldSearch(verb, level)) {
        const args = {
          servant,
          servantType: verb,
          churchType: level,
          verb: verb + level,
          authRoles: `${parseRoles(verb)}${level}`,
          userroles,
        }
        setServantRoles(args)
      }
    })
  })

  return userroles
}

// Resolve the church a user holds a role on, from `userJobs`, by id.
//
// A user can hold several roles on the SAME church, and each job type is
// queried with a different field set (the arrivals-counter church carries
// only {id, name}; the teller church additionally carries isManualBanking /
// bankAccount / vacationStatus). Returning the first match — as every call
// site did before SYN-203 — is wrong: the fixed role ordering puts
// arrivals-counter before teller, so a teller who is also an arrivals counter
// gets the field-poor church and isManualBanking reads undefined. Merging
// every matching job (last defined value wins) surfaces a field present on
// ANY role regardless of order. Fields both queries select come from the same
// Neo4j node, so the merge can never surface a conflicting value. Returns
// null when no job matches, so callers keep their own fallback.
export const resolveChurchFromUserJobs = (
  userJobs: UserJobs[] | null | undefined,
  churchId: string | null | undefined
): Partial<Church> | null => {
  if (!churchId || !userJobs) return null
  let merged: Partial<Church> | null = null
  for (const job of userJobs) {
    const found = job.church?.find((c) => c?.id === churchId)
    if (!found) continue
    merged = merged ?? {}
    for (const [key, value] of Object.entries(found)) {
      if (value !== undefined) {
        ;(merged as Record<string, unknown>)[key] = value
      }
    }
  }
  return merged
}

export const getServantRoles = (servant: MemberWithChurches, t?: TFunction) => {
  const userroles: UserJobs[] = []
  const roleTitles: Role[] = []

  if (servant?.leadsBacenta?.length) {
    roleTitles.push('leaderBacenta')
    userroles.push({
      authRoles: 'leaderBacenta',
      name: roleDisplayName('Bacenta', undefined, t),
      church: servant?.leadsBacenta,
      number: servant?.leadsBacenta?.length,
      link: authorisedLink(
        servant,
        permitMe('Bacenta'),
        '/bacenta/displaydetails'
      ),
    })
  }

  if (servant?.leadsGovernorship?.length) {
    roleTitles.push('leaderGovernorship')
    userroles.push({
      authRoles: 'leaderGovernorship',
      name: roleDisplayName('Governorship', undefined, t),
      church: servant?.leadsGovernorship,
      number: servant?.leadsGovernorship?.length,
      link: authorisedLink(
        servant,
        permitMe('Governorship'),
        '/governorship/displaydetails'
      ),
    })
  }
  if (servant?.isAdminForGovernorship?.length) {
    roleTitles.push('adminGovernorship')
    userroles.push({
      authRoles: 'adminGovernorship',
      name: roleDisplayName('Governorship', 'admin', t),
      church: servant?.isAdminForGovernorship,
      number: servant?.isAdminForGovernorship?.length,
      link: authorisedLink(
        servant,
        permitMe('Governorship'),
        '/governorship/displaydetails'
      ),
    })
  }
  if (servant?.isArrivalsAdminForGovernorship?.length) {
    roleTitles.push('arrivalsAdminGovernorship')
    userroles.push({
      authRoles: 'arrivalsAdminGovernorship',
      name: roleDisplayName('Governorship', 'arrivalsAdmin', t),
      church: servant?.isArrivalsAdminForGovernorship,
      number: servant?.isArrivalsAdminForGovernorship?.length,
      link: authorisedLink(
        servant,
        permitMe('Governorship'),
        `/governorship/displaydetails`
      ),
    })
  }
  if (servant?.leadsCouncil?.length) {
    roleTitles.push('leaderCouncil')
    userroles.push({
      authRoles: 'leaderCouncil',
      name: roleDisplayName('Council', undefined, t),
      church: servant?.leadsCouncil,
      number: servant?.leadsCouncil?.length,
      link: authorisedLink(
        servant,
        permitMe('Council'),
        '/council/displaydetails'
      ),
    })
  }
  if (servant?.isAdminForCouncil?.length) {
    roleTitles.push('adminCouncil')
    userroles.push({
      authRoles: 'adminCouncil',
      name: roleDisplayName('Council', 'admin', t),
      church: servant?.isAdminForCouncil,
      number: servant?.isAdminForCouncil?.length,
      link: authorisedLink(
        servant,
        permitMe('Council'),
        '/council/displaydetails'
      ),
    })
  }
  if (servant?.isArrivalsAdminForCouncil?.length) {
    roleTitles.push('arrivalsAdminCouncil')
    userroles.push({
      authRoles: 'arrivalsAdminCouncil',
      name: roleDisplayName('Council', 'arrivalsAdmin', t),
      church: servant?.isArrivalsAdminForCouncil,
      number: servant?.isArrivalsAdminForCouncil?.length,
      link: authorisedLink(
        servant,
        permitMe('Council'),
        `/council/displaydetails`
      ),
    })
  }
  if (servant?.leadsStream?.length) {
    roleTitles.push('leaderStream')
    userroles.push({
      authRoles: 'leaderStream',
      name: roleDisplayName('Stream', undefined, t),
      church: servant?.leadsStream,
      number: servant?.leadsStream?.length,
      link: authorisedLink(
        servant,
        permitMe('Stream'),
        '/stream/displaydetails'
      ),
    })
  }
  if (servant?.isAdminForStream?.length) {
    roleTitles.push('adminStream')
    userroles.push({
      authRoles: 'adminStream',
      name: roleDisplayName('Stream', 'admin', t),
      church: servant?.isAdminForStream,
      number: servant?.isAdminForStream?.length,
      link: authorisedLink(
        servant,
        permitMe('Stream'),
        '/stream/displaydetails'
      ),
    })
  }
  if (servant?.isArrivalsAdminForStream?.length) {
    roleTitles.push('arrivalsAdminStream')
    userroles.push({
      authRoles: 'arrivalsAdminStream',
      name: roleDisplayName('Stream', 'arrivalsAdmin', t),
      church: servant?.isArrivalsAdminForStream,
      number: servant?.isArrivalsAdminForStream?.length,
      link: authorisedLink(
        servant,
        permitMe('Stream'),
        `/stream/displaydetails`
      ),
    })
  }
  if (servant?.leadsCampus?.length) {
    roleTitles.push('leaderCampus')
    userroles.push({
      authRoles: 'leaderCampus',
      name: roleDisplayName('Campus', undefined, t),
      church: servant?.leadsCampus,
      number: servant?.leadsCampus?.length,
      link: authorisedLink(
        servant,
        permitMe('Campus'),
        '/campus/displaydetails'
      ),
    })
  }
  if (servant?.isAdminForCampus?.length) {
    roleTitles.push('adminCampus')
    userroles.push({
      authRoles: 'adminCampus',
      name: roleDisplayName('Campus', 'admin', t),
      church: servant?.isAdminForCampus,
      number: servant?.isAdminForCampus?.length,
      link: authorisedLink(
        servant,
        permitMe('Campus'),
        '/campus/displaydetails'
      ),
    })
  }
  if (servant?.leadsOversight?.length) {
    roleTitles.push('leaderOversight')
    userroles.push({
      authRoles: 'leaderOversight',
      name: roleDisplayName('Oversight', undefined, t),
      church: servant?.leadsOversight,
      number: servant?.leadsOversight?.length,
      link: authorisedLink(
        servant,
        permitMe('Oversight'),
        '/oversight/displaydetails'
      ),
    })
  }
  if (servant?.isAdminForOversight?.length) {
    roleTitles.push('adminOversight')
    userroles.push({
      authRoles: 'adminOversight',
      name: roleDisplayName('Oversight', 'admin', t),
      church: servant?.isAdminForOversight,
      number: servant?.isAdminForOversight?.length,
      link: authorisedLink(
        servant,
        permitMe('Oversight'),
        '/oversight/displaydetails'
      ),
    })
  }
  if (servant?.leadsDenomination?.length) {
    roleTitles.push('leaderDenomination')
    userroles.push({
      authRoles: 'leaderDenomination',
      name: roleDisplayName('Denomination', undefined, t),
      church: servant?.leadsDenomination,
      number: servant?.leadsDenomination?.length,
      link: authorisedLink(
        servant,
        permitMe('Denomination'),
        '/denomination/displaydetails'
      ),
    })
  }
  if (servant?.isAdminForDenomination?.length) {
    roleTitles.push('adminDenomination')
    userroles.push({
      authRoles: 'adminDenomination',
      name: roleDisplayName('Denomination', 'admin', t),
      church: servant?.isAdminForDenomination,
      number: servant?.isAdminForDenomination?.length,
      link: authorisedLink(
        servant,
        permitMe('Denomination'),
        '/denomination/displaydetails'
      ),
    })
  }
  if (servant?.isArrivalsAdminForCampus?.length) {
    roleTitles.push('arrivalsAdminCampus')
    userroles.push({
      authRoles: 'arrivalsAdminCampus',
      name: roleDisplayName('Campus', 'arrivalsAdmin', t),
      church: servant?.isArrivalsAdminForCampus,
      number: servant?.isArrivalsAdminForCampus?.length,
      link: authorisedLink(
        servant,
        permitMe('Campus'),
        `/campus/displaydetails`
      ),
    })
  }

  return { userroles, roleTitles }
}
