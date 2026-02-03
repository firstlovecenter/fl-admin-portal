import { ApolloError } from '@apollo/client'
import { last3Weeks } from '@jaedag/admin-portal-types'
import {
  ChurchLevel,
  CurrentUser,
  Member,
  MemberWithChurches,
  Role,
} from 'global-types'
import { GraphTypes } from 'pages/services/graphs/graphs-utils'

//Global Constants
export const PHONE_NUM_REGEX = /^[+][(]{0,1}[1-9]{1,4}[)]{0,1}[-\s/0-9]*$/
export const MOMO_NUM_REGEX = /^(0[1-9]\d{8}|[1-9]\d{9})$/
export const DECIMAL_NUM_REGEX = /^-?\d*\.{1}\d*$/
export const DECIMAL_NUM_REGEX_POSITIVE_ONLY = /^\d*\.{1}\d*$/
export const USER_PLACEHOLDER = 'v1627893621/user_qvwhs7webp'
export const DEBOUNCE_TIMER = 500
export const LONG_POLL_INTERVAL = 60000
export const SHORT_POLL_INTERVAL = 30000
export const isIncomeGraph = (graphs: GraphTypes, currentUser: any) => {
  const noIncomeGraphLevels = [
    'onStageAttendance',
    'onStageAttendanceAggregate',
    'bussing',
    'bussingAggregate',
  ]

  return !currentUser.noIncomeTracking && !noIncomeGraphLevels.includes(graphs)
}

export type FormikSelectOptions = {
  key: string
  value: string
}[]

export const YES_NO_OPTIONS: FormikSelectOptions = [
  { key: 'Yes', value: 'Yes' },
  { key: 'No', value: 'No' },
]

export const GENDER_OPTIONS: FormikSelectOptions = [
  { key: 'Male', value: 'Male' },
  { key: 'Female', value: 'Female' },
]
export const MARITAL_STATUS_OPTIONS: FormikSelectOptions = [
  { key: 'Single', value: 'Single' },
  { key: 'Married', value: 'Married' },
  { key: 'Widowed', value: 'Widowed' },
]
export const VACATION_OPTIONS: FormikSelectOptions = [
  { key: 'Active', value: 'Active' },
  { key: 'Vacation', value: 'Vacation' },
]
export const VACATION_ONLINE_OPTIONS: FormikSelectOptions = [
  { key: 'Active', value: 'Active' },
  { key: 'Vacation', value: 'Vacation' },
  { key: 'Online', value: 'Online' },
]

export const TITLE_OPTIONS: FormikSelectOptions = [
  { key: 'Pastor', value: 'Pastor' },
  { key: 'Reverend', value: 'Reverend' },
  { key: 'Bishop', value: 'Bishop' },
]

export const SERVICE_DAY_OPTIONS: FormikSelectOptions = [
  { key: 'Tuesday', value: 'Tuesday' },
  { key: 'Wednesday', value: 'Wednesday' },
  { key: 'Thursday', value: 'Thursday' },
  { key: 'Friday', value: 'Friday' },
  { key: 'Saturday', value: 'Saturday' },
]

export const STREAM_SERVICE_DAY_OPTIONS: FormikSelectOptions = [
  { key: 'Tuesday', value: 'Tuesday' },
  { key: 'Wednesday', value: 'Wednesday' },
  { key: 'Thursday', value: 'Thursday' },
  { key: 'Friday', value: 'Friday' },
  { key: 'Saturday', value: 'Saturday' },
  { key: 'Sunday', value: 'Sunday' },
]

export const CURRENCY_OPTIONS: FormikSelectOptions = [
  { key: 'Ghanaian Cedis (GHS)', value: 'GHS' },
  { key: 'Zambian Kwacha (ZMW)', value: 'ZMW' },
  { key: 'Bangladesh Taka (BDT)', value: 'BDT' },
  { key: 'Madagascar Ariary (MGA)', value: 'MGA' },
  { key: 'Gambia Dalasi (GMD)', value: 'GMD' },
  { key: 'US Dollars (USD)', value: 'USD' },
  { key: 'Sierra Leone Leone (SLL)', value: 'SLL' },
  { key: 'Cameroon Franc (XAF)', value: 'XAF' },
]

export const DELETE_MEMBER_CATEGORY_OPTIONS: FormikSelectOptions = [
  { key: 'Moved Cities', value: 'Moved Cities' },
  {
    key: 'Left the Church In Spite of Calls and Visits',
    value: 'Left the Church In Spite of Calls and Visits',
  },
  {
    key: 'Deceased',
    value: 'Deceased',
  },
  {
    key: 'Duplicate Member',
    value: 'Duplicate Member',
  },
  {
    key: 'Finished Anagkazo School',
    value: 'Finished Anagkazo School',
  },
]

export const HOW_YOU_JOINED_OPTIONS: FormikSelectOptions = [
  {
    key: 'I Joined After Attending A Weekday Fellowship Meeting',
    value: 'Weekday Fellowship Meeting',
  },
  {
    key: 'I Was Invited By A Friend Or Family Member',
    value: 'Invitation By Friend Or Family',
  },
  {
    key: 'A Person I Had Never Met Spoke To Me And Invited Me',
    value: 'Invitation By Stranger',
  },
  {
    key: 'I Joined After Attending A Service With A Bishop Or Pastor',
    value: 'Service With A Pastor',
  },
  { key: 'I Joined After Attending An Area Crusade', value: 'Area Crusade' },
  { key: 'I Joined After Attending A Campus Crusade', value: 'Campus Crusade' },
  {
    key: 'I Joined After Attending A Creative Arts Outreach (Choir Concert, Boogie King, Stage Play)',
    value: 'Creative Arts Outreach',
  },
  {
    key: 'I Was Born Into The Church',
    value: 'Born Into The Church',
  },
  {
    key: 'I Saw A Flyer And Came To A Service',
    value: 'Social Media',
  },
]

export const BUSSING_STATUS_OPTIONS: FormikSelectOptions = [
  { key: 'IC', value: 'IC' },
  { key: 'Graduated', value: 'Graduated' },
]

export const STREAM_ACCOUNT_OPTIONS: FormikSelectOptions = [
  { key: 'Manual Finances', value: 'manual' },
  { key: 'FLE Account', value: 'fle_account' },
  { key: 'Accra FLOC', value: 'acc_floc' },
  { key: 'BJosh Special', value: 'bjosh_special' },
  { key: 'AES Account', value: 'aes_account' },
  { key: 'Kumasi Account', value: 'oa_kumasi' },
  { key: 'OA GH North', value: 'oa_ghnorth' },
  { key: 'OA GH South', value: 'oa_ghsouth' },
  { key: 'OA GH East', value: 'oa_gheast' },
  { key: 'OA GH West', value: 'oa_ghwest' },
  { key: 'OA Tarkwa', value: 'oa_tarkwa' },
  { key: 'OA Sunyani', value: 'oa_sunyani' },
]

export const MINISTRY_ACCOUNT_OPTIONS: FormikSelectOptions = [
  { key: 'Accra Greater Love Choir', value: 'accra_greater_love_choir' },
  { key: 'Accra Dancing Stars', value: 'accra_dancing_stars' },
  { key: 'Accra Film Stars', value: 'accra_film_stars' },
]

export const throwToSentry = (
  message: string,
  error?: Error | ApolloError | unknown
) => {
  if (!message && !error) {
    return
  }

  if (!error) {
    console.error(message)
    return
  }

  if (!message) {
    console.error(error)
    return
  }

  console.error(message, error)
}

export const showUserReportDialog = () => {
  // Sentry removed - this is a no-op now
}

export const alertMsg = (message: string) => {
  // eslint-disable-next-line no-alert
  alert(message)
}

export const isAuthorised = (permittedRoles: Role[], userRoles: Role[]) => {
  if (permittedRoles?.includes('all')) {
    return true
  }

  return permittedRoles?.some((r) => userRoles.includes(r))
}

export const authorisedLink = (
  currentUser: CurrentUser | MemberWithChurches,
  permittedRoles: Role[],
  link: string
): string => {
  if (isAuthorised(permittedRoles, currentUser?.roles || [])) {
    return link
  }
  return '#'
}

export const convertNeoWeekdayToJSWeekday = (neoWeekday: number): number => {
  return neoWeekday === 7 ? 0 : neoWeekday
}

export const capitalise = (str: string) => {
  switch (str) {
    case 'first love experience':
      return 'First Love Experience'
    case 'gospel encounter':
      return 'Gospel Encounter'
    case 'holy ghost encounter':
      return 'Holy Ghost Encounter'
    case 'anagkazo encounter':
      return 'Anagkazo Encounter'
    default:
      return str?.charAt(0).toUpperCase() + str?.slice(1)
  }
}
export const plural = (church: ChurchLevel | string) => {
  switch (church) {
    case 'stream':
      return 'streams'
    case 'Stream':
      return 'Streams'
    case 'council':
      return 'councils'
    case 'Council':
      return 'Councils'
    case 'town':
      return 'towns'
    case 'Town':
      return 'Towns'
    case 'campus':
      return 'campuses'
    case 'Campus':
      return 'Campuses'
    case 'Governorship':
      return 'Governorships'
    case 'governorship':
      return 'governorships'
    case 'senior high school':
      return 'senior high schools'
    case 'Senior High School':
      return 'Senior High Schools'
    case 'bacenta':
      return 'bacentas'
    case 'Bacenta':
      return 'Bacentas'
    case 'hub':
      return 'hubs'
    case 'Hub':
      return 'Hubs'
    case 'HubCouncil':
      return 'Hub Councils'
    case 'hubCouncil':
      return 'hub councils'
    case 'ministry':
      return 'ministries'
    case 'Ministry':
      return 'Ministries'
    case 'CreativeArts':
      return 'Creative Arts'
    case 'fellowship':
      return 'fellowships'
    case 'Fellowship':
      return 'Fellowships'
    default:
      return church
  }
}

export const parsePhoneNum = (phoneNumber: string) => {
  let rawNumber = phoneNumber
  if (rawNumber.includes('+2330')) {
    rawNumber = rawNumber.replace('+2330', '+233')
  }

  return rawNumber
    .replace(/\s/g, '')
    .replace('+', '')
    .replace('(', '')
    .replace(')', '')
    .replace('-', '')
}

export const repackDecimals = (decimal: string | number) => {
  if (!decimal) return
  if (decimal === 0 || decimal === '0.0') {
    return '0.0'
  }

  return parseFloat(decimal.toString())
}

export const arrayOr = (array: []) => {
  return array.some((element) => element)
}

export const makeSelectOptions = (
  initialArray: { id: string; name: string; fullName: string }[]
): FormikSelectOptions => {
  if (!initialArray) {
    return []
  }

  return initialArray.map((data) => ({
    value: data.id,
    key: data.name ? data.name : data.fullName,
  }))
}

// debouncing function
export const debounce = (callback: () => void, delay = 500) => {
  let timeout: any

  return (...args: []) => {
    clearTimeout(timeout)
    // Clears timer if code haskk not yet executed

    timeout = setTimeout(() => {
      callback(...args) // pass in the arguments to the function and the scope
    }, delay)
  }
}

export const average = (array: number[]) => {
  let i = 0
  let sum = 0
  const len = array.length
  while (i < len) {
    sum += array[i++]
  }
  return sum / len
}

export const parseMemberCount = (number: number) => {
  if (number === 1) {
    return `${number} Member`
  }
  return `${number} Members`
}
interface MemberWithChurchCount extends Member {
  memberCount: number
  basontaMembershipCount: number
  leadsFellowshipCount: number
  leadsBacentaCount: number
  leadsAdminsCouncilCount: number
  leadsAdminsGovernorshipCount: number
  leadsAdminsCampusCount: number
  leadsAdminsOversightCount: number

  //sonta
  leadsHubCount: number
  leadsAdminsMinistryCount: number
  leadsAdminsCreativeArtsCount: number
}
export const getMemberCount = (servant: MemberWithChurchCount) => {
  if (!servant?.memberCount) {
    return
  }
  return `${parseMemberCount(servant?.memberCount)}, ${
    servant?.basontaMembershipCount
  } in Ministries`
}

export const getChurchCount = (servant: MemberWithChurchCount) => {
  let churchesCount = ''

  if (servant?.leadsAdminsOversightCount) {
    if (churchesCount) {
      churchesCount += ','
    }

    if (servant.leadsAdminsOversightCount === 1) {
      churchesCount = `${servant.leadsAdminsOversightCount} Oversight`
    } else {
      churchesCount = `${servant.leadsAdminsOversightCount} Oversight`
    }
  }

  if (servant?.leadsAdminsCampusCount) {
    if (churchesCount) {
      churchesCount += ','
    }

    if (servant.leadsAdminsCampusCount === 1) {
      churchesCount = `${servant.leadsAdminsCampusCount} Campus`
    } else {
      churchesCount = `${servant.leadsAdminsCampusCount} Campuses`
    }
  }

  if (servant?.leadsAdminsCouncilCount) {
    if (churchesCount) {
      churchesCount += ','
    }

    if (servant.leadsAdminsCouncilCount === 1) {
      churchesCount = `${churchesCount} ${servant.leadsAdminsCouncilCount} Council`
    } else {
      churchesCount = `${churchesCount} ${servant.leadsAdminsCouncilCount} Councils`
    }
  }

  if (servant?.leadsAdminsGovernorshipCount) {
    if (churchesCount) {
      churchesCount += ','

      if (servant.leadsAdminsGovernorshipCount === 1) {
        churchesCount = `${churchesCount} ${servant.leadsAdminsGovernorshipCount} Governorship`
      } else {
        churchesCount = `${churchesCount} ${servant.leadsAdminsGovernorshipCount} Governorships`
      }
    } else if (servant.leadsAdminsGovernorshipCount === 1) {
      churchesCount = `${servant.leadsAdminsGovernorshipCount} Governorship`
    } else {
      churchesCount = `${servant.leadsAdminsGovernorshipCount} Governorships`
    }
  }

  if (servant?.leadsBacentaCount) {
    if (churchesCount) {
      churchesCount += ','

      if (servant.leadsBacentaCount === 1) {
        churchesCount = `${churchesCount} ${servant.leadsBacentaCount} Bacenta`
      } else {
        churchesCount = `${churchesCount} ${servant.leadsBacentaCount} Bacentas`
      }
    } else if (servant.leadsBacentaCount === 1) {
      churchesCount = `${servant.leadsBacentaCount} Bacenta`
    } else {
      churchesCount = `${servant.leadsBacentaCount} Bacentas`
    }
  }

  if (servant?.leadsFellowshipCount) {
    if (churchesCount) {
      churchesCount += ','

      if (servant.leadsFellowshipCount === 1) {
        churchesCount = `${churchesCount} ${servant.leadsFellowshipCount} Fellowship`
      } else {
        churchesCount = `${churchesCount} ${servant.leadsFellowshipCount} Fellowships`
      }
    } else if (servant.leadsFellowshipCount === 1) {
      churchesCount = `${servant.leadsFellowshipCount} Fellowship`
    } else {
      churchesCount = `${servant.leadsFellowshipCount} Fellowships`
    }
  }

  if (servant?.leadsHubCount) {
    if (churchesCount) {
      churchesCount += ','

      if (servant.leadsHubCount === 1) {
        churchesCount = `${churchesCount} ${servant.leadsHubCount} Hub`
      } else {
        churchesCount = `${churchesCount} ${servant.leadsHubCount} Hubs`
      }
    } else if (servant.leadsHubCount === 1) {
      churchesCount = `${servant.leadsHubCount} Hub`
    } else {
      churchesCount = `${servant.leadsHubCount} Hubs`
    }
  }

  if (servant?.leadsAdminsMinistryCount) {
    if (churchesCount) {
      churchesCount += ','

      if (servant.leadsAdminsMinistryCount === 1) {
        churchesCount = `${churchesCount} ${servant.leadsAdminsMinistryCount} Ministry`
      } else {
        churchesCount = `${churchesCount} ${servant.leadsAdminsMinistryCount} Ministries`
      }
    } else if (servant.leadsAdminsMinistryCount === 1) {
      churchesCount = `${servant.leadsAdminsMinistryCount} Ministry`
    } else {
      churchesCount = `${servant.leadsAdminsMinistryCount} Ministries`
    }
  }

  if (servant?.leadsAdminsCreativeArtsCount) {
    if (churchesCount) {
      churchesCount += ','

      if (servant.leadsAdminsCreativeArtsCount === 1) {
        churchesCount = `${churchesCount} ${servant.leadsAdminsCreativeArtsCount} Creative Arts`
      } else {
        churchesCount = `${churchesCount} ${servant.leadsAdminsCreativeArtsCount} Creative Arts`
      }
    } else if (servant.leadsAdminsCreativeArtsCount === 1) {
      churchesCount = `${servant.leadsAdminsCreativeArtsCount} Creative Arts`
    } else {
      churchesCount = `${servant.leadsAdminsCreativeArtsCount} Creative Arts`
    }
  }

  return churchesCount
}

export const getSubChurchLevel = (churchType: ChurchLevel) => {
  switch (churchType) {
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
    case 'CreativeArts':
      return 'Ministry'
    case 'Ministry':
      return 'HubCouncil'
    case 'HubCouncil':
      return 'Hub'

    default:
      return 'Bacenta'
  }
}

export const randomOTPGenerator = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  const charactersLength = characters.length

  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

export const parseForeignCurrency = (string: string) => {
  const nonOptions = [
    0,
    '',
    'o',
    '0',
    '00',
    '0.0',
    '0.00',
    'Gh',
    'ghana cedis',
    'No',
    'None',
    'none',
    'n/a',
    'N/A',
    'NA',
    '-',
  ]

  if (nonOptions.includes(string.toLowerCase().trim())) {
    return null
  }

  return string
}

export const checkIfArrayHasRepeatingValues = (array: any[]) => {
  const sortedArray = array.sort()
  for (let i = 0; i < sortedArray.length - 1; i++) {
    if (sortedArray[i + 1] === sortedArray[i]) {
      return true
    }
  }
  return false
}

export const getFirstLetterInEveryWord = (string?: string) => {
  if (string === null || string === undefined || string === '') return ''

  const words = string.split(' ')
  let initials = ''
  words.forEach((word) => {
    initials += word.charAt(0) + '. '
  })
  return initials
}

export const PIE_CHART_COLORS = [
  '#FF5733', // Coral
  '#FFC300', // Sunflower
  '#FF6384', // Hot Pink
  '#FFB6C1', // Light Pink
  '#E763FA', // Purple
  '#C7E7FF', // Baby Blue
  '#00CED1', // Dark Turquoise
  '#7CFC00', // Lawn Green
  '#FFD700', // Gold
  '#FF69B4', // Hot Pink
  '#6495ED', // Cornflower Blue
  '#FF8C00', // Dark Orange
  '#8A2BE2', // Blue Violet
  '#3CB371', // Medium Sea Green
  '#DA70D6', // Orchid
  '#FF1493', // Deep Pink
  '#1E90FF', // Dodger Blue
  '#FF4500', // Orange Red
  '#48D1CC', // Medium Turquoise
  '#FF00FF', // Magenta
]

export const directoryLock = (
  currentUser: CurrentUser | MemberWithChurches,
  churchType: ChurchLevel
) => {
  if (
    (new Date().getDay() === 1 && new Date().getHours() >= 12) ||
    new Date().getDay() === 2 ||
    ['fishers']?.some((r) => currentUser?.roles?.includes(r as Role)) ||
    (churchType === 'Bacenta' &&
      currentUser?.roles?.includes('leaderBacenta' as Role))
  ) {
    return true
  }

  return false
}

export const firstDayOfThisYear = new Date(new Date().getFullYear(), 0, 1)

export const check = (bacenta: any) => {
  let serviceType: 'services' | 'rehearsals' = 'services'
  if (bacenta.__typename === 'Hub') serviceType = 'rehearsals'

  const lastFilled = bacenta?.[serviceType].map(
    ({
      bankingProof,
      noServiceReason,
      week,
    }: {
      bankingProof: boolean
      noServiceReason: string
      week: number
    }) => ({
      bankingProof,
      noServiceReason,
      week,
    })
  )

  return last3Weeks()?.map((number) => {
    if (lastFilled?.some((service: any) => service.week === number)) {
      const service = lastFilled?.find(
        ({ week }: { week: number }) => week === number
      )

      if (!service?.noServiceReason) {
        return {
          number,
          filled: true,
          banked: !!service?.bankingProof,
        }
      }
      if (service?.noServiceReason) {
        return {
          number,
          filled: true,
          banked: 'No Service',
        }
      }

      return null
    }
    return {
      number,
      filled: false,
      banked: 'No Service',
    }
  })
}
