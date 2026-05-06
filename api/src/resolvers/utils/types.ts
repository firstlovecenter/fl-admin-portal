import { Integer } from 'neo4j-driver'

export type neonumber = Integer
export type RearragedCypherResponse = {
  record: {
    identity: number
    lables: string[]
    properties: any
  }
}
export type ChurchLevel =
  | 'Bacenta'
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'
  | 'Oversight'
  | 'Denomination'

export type ChurchLevelWithClosed = 'ClosedBacenta'

export type Role =
  | 'leaderBacenta'
  | 'leaderGovernorship'
  | 'leaderCouncil'
  | 'leaderStream'
  | 'leaderCampus'
  | 'leaderOversight'
  | 'leaderDenomination'
  | 'adminGovernorship'
  | 'adminCouncil'
  | 'adminStream'
  | 'adminCampus'
  | 'adminOversight'
  | 'adminDenomination'
  | 'arrivalsAdminCampus'
  | 'arrivalsAdminStream'
  | 'arrivalsAdminCouncil'
  | 'arrivalsAdminGovernorship'
  | 'arrivalsCounterStream'
  | 'arrivalsPayerCouncil'
  | 'tellerStream'
  | 'fishers'
  | 'all'

export type VerbTypes =
  | 'leader'
  | 'admin'
  | 'arrivalsAdmin'
  | 'arrivalsCounter'
  | 'arrivalsPayer'
  | 'leads'
  | 'isAdminFor'
  | 'isArrivalsAdminFor'
  | 'isArrivalsCounterFor'
  | 'isArrivalsPayerFor'

export type ServantType =
  | 'Leader'
  | 'Admin'
  | 'ArrivalsAdmin'
  | 'ArrivalsCounter'
  | 'Teller'
  | 'ArrivalsPayer'
export type ServantTypeLowerCase =
  | 'leader'
  | 'admin'
  | 'arrivalsAdmin'
  | 'arrivalsCounter'
  | 'teller'
  | 'arrivalsPayer'

export type StreamOptions =
  | 'Anagkazo Encounter'
  | 'Gospel Encounter'
  | 'Holy Ghost Encounter'
  | 'First Love Experience'

type TitleOptions = 'Pastor' | 'Reverend' | 'Bishop'

export interface Member {
  id: string
  // eslint-disable-next-line camelcase
  firstName: string
  middleName?: string
  lastName: string
  currentTitle: TitleOptions
  title: {
    name: TitleOptions
  }
  email: string
  pictureUrl: string
  phoneNumber: string
  whatsappNumber: string
  dob: string
  maritalStatus: string
  gender: string
  visitationArea?: string
  occupation: string
  bacenta: string
  basonta: string
}

export interface MemberWithoutBioData {
  id: string
  // eslint-disable-next-line camelcase
  firstName: string
  lastName: string
}

export interface Church {
  id: string
  name: string
  leader: MemberWithoutBioData
  admin: MemberWithoutBioData
  arrivalsAdmin: MemberWithoutBioData
  arrivalsCounter: MemberWithoutBioData
  arrivalsPayer: MemberWithoutBioData
}

export type ChurchIdAndName = {
  id: string
  name: string
}

export interface Record {
  id: string
  attendance: number
}
export type ServiceRecord = {
  __typename: 'ServiceRecord' | 'RehearsalRecord'
  id: string
  // eslint-disable-next-line camelcase
  createdAt: string
  attendance: number
  income: number
  week: number
  // eslint-disable-next-line camelcase
  stream_name: StreamOptions
  noServiceReason: string
  bankingProof: boolean
  bankingSlip: string
  transactionStatus: 'pending' | 'success' | 'failed'
  serviceDate: {
    date: string
  }
}


