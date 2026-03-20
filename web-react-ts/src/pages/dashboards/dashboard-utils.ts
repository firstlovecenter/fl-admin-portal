import {
  ChurchLevel,
  MemberWithChurches,
  Role,
  Servant,
  UserJobs,
  VerbTypes,
} from 'global-types'
import { authorisedLink, plural } from 'global-utils'
import { churchLevels } from 'pages/directory/update/directory-utils'
import {
  permitArrivals,
  permitArrivalsHelpers,
  permitAdmin,
  permitLeaderAdmin,
  permitLeaderAdminArrivals,
  permitMe,
  permitTellerStream,
} from 'permission-utils'

type MenuItem = {
  name: string
  to: string
  roles: Role[]
  exact?: 'true'
}

export const arrayDiff = (membersIn: any[], notIn: any[]) => {
  return membersIn.filter((i) => notIn.indexOf(i) < 0)
}

export const menuItems: MenuItem[] = [
  { name: 'Home', to: '/', roles: ['all'] },
  {
    name: 'Directory',
    exact: 'true',
    to: '/directory',
    roles: [...permitMe('Bacenta'), ...permitMe('Hub')],
  },
  {
    name: 'Services',
    to: '/services/church-list',
    roles: [
      ...permitLeaderAdmin('Bacenta'),
      ...permitTellerStream(),
      ...permitLeaderAdmin('Hub'),
    ],
  },
  {
    name: 'Arrivals',
    to: '/arrivals',
    roles: arrayDiff(
      [
        ...permitLeaderAdmin('Bacenta'),
        ...permitArrivals('Bacenta'),
        ...permitArrivalsHelpers('Stream'),
      ],
      [...permitLeaderAdminArrivals('Oversight')]
    ),
  },
  {
    name: 'Accounts',
    to: '/accounts',
    roles: [
      'fishers',
      'adminOversight',
      'adminCampus',
      'leaderCouncil',
      'leaderStream',
      'leaderCampus',
    ],
  },
  {
    name: 'Maps',
    to: '/maps',
    roles: [
      ...permitLeaderAdminArrivals('Bacenta'),
      ...permitLeaderAdmin('Hub'),
    ],
  },
  {
    name: 'Check-Ins',
    to: '/checkins',
    roles: [
      'leaderBacenta',
      'leaderGovernorship',
      ...permitAdmin('Governorship'),
      ...permitLeaderAdmin('Council'),
      ...permitLeaderAdmin('Stream'),
      ...permitLeaderAdmin('Campus'),
      ...permitLeaderAdmin('Oversight'),
      ...permitLeaderAdmin('Denomination'),
    ],
  },
]

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
  Hub: ['leads'],
  HubCouncil: ['leads'],
  Ministry: ['leads', 'isAdminFor'],
  CreativeArts: ['leads', 'isAdminFor'],
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
    const adminsOneChurch = servant[`${verb}`]?.length === 1 ?? false
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
    const adminsOneChurch = servant[`${verb}`]?.length === 1 ?? false
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
    const adminsOneChurch = servant[`${verb}`]?.length === 1 ?? false
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
        adminsOneChurch
          ? `/${churchType.toLowerCase()}/displaydetails`
          : `/servants/church-list`
      ),
    })

    return
  }

  const leadsOneChurch = servant[`${verb}`]?.length === 1 ?? false

  userroles.push({
    authRoles,
    name: leadsOneChurch ? churchType : plural(churchType),
    church: servant[`${verb}`],
    number: servant[`${verb}`]?.length,
    link: authorisedLink(
      servant,
      permittedForLink,
      leadsOneChurch
        ? `/${churchType.toLowerCase()}/displaydetails`
        : `/servants/church-list`
    ),
  })
}

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

export const getServantRoles = (servant: MemberWithChurches) => {
  const userroles: UserJobs[] = []
  const roleTitles: Role[] = []

  if (servant?.leadsFellowship?.length) {
    roleTitles.push('leaderFellowship')
    userroles.push({
      authRoles: 'leaderFellowship',
      name: 'Fellowship',
      church: servant?.leadsFellowship,
      number: servant?.leadsFellowship?.length,
      link: authorisedLink(
        servant,
        permitMe('Bacenta'),
        '/fellowship/displaydetails'
      ),
    })
  }
  if (servant?.leadsBacenta?.length) {
    roleTitles.push('leaderBacenta')
    userroles.push({
      authRoles: 'leaderBacenta',
      name: 'Bacenta',
      church: servant?.leadsBacenta,
      number: servant?.leadsBacenta?.length,
      link: authorisedLink(
        servant,
        permitMe('Bacenta'),
        '/bacenta/displaydetails'
      ),
    })
  }

  if (servant?.leadsHub?.length) {
    roleTitles.push('leaderHub')
    userroles.push({
      authRoles: 'leaderHub',
      name: 'Hub',
      church: servant?.leadsHub,
      number: servant?.leadsHub?.length,
      link: authorisedLink(servant, permitMe('Hub'), '/hub/displaydetails'),
    })
  }
  if (servant?.leadsMinistry?.length) {
    roleTitles.push('leaderMinistry')
    userroles.push({
      authRoles: 'leaderMinistry',
      name: 'Ministry',
      church: servant?.leadsMinistry,
      number: servant?.leadsMinistry?.length,
      link: authorisedLink(
        servant,
        permitMe('Ministry'),
        '/ministry/displaydetails'
      ),
    })
  }
  if (servant?.isAdminForMinistry?.length) {
    roleTitles.push('adminMinistry')
    userroles.push({
      authRoles: 'adminMinistry',
      name: 'Ministry Admin',
      church: servant?.isAdminForMinistry,
      number: servant?.isAdminForMinistry?.length,
      link: authorisedLink(
        servant,
        permitMe('Ministry'),
        '/ministry/displaydetails'
      ),
    })
  }
  if (servant?.leadsCreativeArts?.length) {
    roleTitles.push('leaderCreativeArts')
    userroles.push({
      authRoles: 'leaderCreativeArts',
      name: 'Creative Arts',
      church: servant?.leadsCreativeArts,
      number: servant?.leadsCreativeArts?.length,
      link: authorisedLink(
        servant,
        permitMe('CreativeArts'),
        '/creativearts/displaydetails'
      ),
    })
  }
  if (servant?.isAdminForCreativeArts?.length) {
    roleTitles.push('adminCreativeArts')
    userroles.push({
      authRoles: 'adminCreativeArts',
      name: 'Creative Arts Admin',
      church: servant?.isAdminForCreativeArts,
      number: servant?.isAdminForCreativeArts?.length,
      link: authorisedLink(
        servant,
        permitMe('CreativeArts'),
        '/creativearts/displaydetails'
      ),
    })
  }

  if (servant?.leadsGovernorship?.length) {
    roleTitles.push('leaderGovernorship')
    userroles.push({
      authRoles: 'leaderGovernorship',
      name: 'Governorship',
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
      name: 'Governorship Admin',
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
      name: 'Governorship Arrivals Admin',
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
      name: 'Council',
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
      name: 'Council Admin',
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
      name: 'Council Arrivals Admin',
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
      name: 'Stream',
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
      name: 'Stream Admin',
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
      name: 'Stream Arrivals Admin',
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
      name: 'Campus',
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
      name: 'Campus Admin',
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
      name: 'Oversight',
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
      name: 'Oversight Admin',
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
      name: 'Denomination',
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
      name: 'Denomination Admin',
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
      name: 'Campus Arrivals Admin',
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
