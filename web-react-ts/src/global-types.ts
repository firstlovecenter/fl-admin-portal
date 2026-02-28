import { LazyExoticComponent } from 'react'

export type JSXChildren = {
  children: JSX.Element
}

export type FunctionReturnsVoid = () => void
export type HTMLElement =
  | 'div'
  | 'span'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'td'
  | 'tr'

// CHURCHES
export type ChurchLevel =
  | 'Bacenta'
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'
  | 'Oversight'
  | 'Denomination'
  | 'Ministry'
  | 'HubCouncil'
  | 'Hub'
  | 'HubCouncil'
  | 'CreativeArts'

export type ChurchLevelLower =
  | 'fellowship'
  | 'bacenta'
  | 'governorship'
  | 'council'
  | 'stream'
  | 'campus'
  | 'oversight'
  | 'creativeArts'
  | 'ministry'
  | 'hubCouncil'
  | 'hub'

export type VacationStatusOptions = 'Vacation' | 'Active'

export type TimeGraph = {
  date: string
}

export type HistoryLog = {
  __typename: 'HistoryLog'
  id: string
  timeStamp: string
  historyRecord: string
  createdAt: TimeGraph
  loggedBy: MemberWithoutBioData
}
export interface Church {
  id: string
  name: string
  downloadCredits: number
  downloadMembership: Member[]
  creditsTransactionHistory: CreditTransaction[]
  vacationStatus?: VacationStatusOptions
  stream_name?: StreamOptions
  leader: MemberWithoutBioData
  admin?: MemberWithoutBioData
  hubs?: Church[]
  lowerChurch?: Church[]
  memberCount: number
  members: Member[]
  history: HistoryLog[]
  __typename: ChurchLevel
}

export interface CreditTransaction {
  id: string
  amount: number
  mobileNetwork: 'MTN' | 'Vodafone' | 'AirtelTigo'
  mobileNumber: string
  transactionStatus: 'pending' | 'success' | 'failed' | 'send_otp'
  transactionReference: string
  createdAt: string
  credited: boolean
}

export interface Bacenta extends Church {
  __typename: 'Bacenta'
  governorship: Governorship
  council: Council
  bankingCode: number
  services: ServiceRecord[]
  vacationStatus: VacationStatusOptions
  meetingDay: {
    day: 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  }
}

export type ChurchIdAndName = {
  id: string
  name: string
  __typename: ChurchLevel
}

export type StreamOptions =
  | 'Anagkazo Encounter'
  | 'Gospel Encounter'
  | 'Holy Ghost Encounter'
  | 'First Love Experience'
export type TitleOptions = 'Pastor' | 'Reverend' | 'Bishop'

export interface Denomination extends Church {
  __typename: 'Denomination'
  oversight: Oversight
}

export interface Oversight extends Church {
  __typename: 'Oversight'
  streams: Stream
}
export interface Campus extends Church {
  __typename: 'Campus'
  streams?: Stream[]
  oversight: Oversight
  creativeArts?: CreativeArts[]
}

export interface Stream extends Church {
  id: string
  name: StreamOptions
  __typename: 'Stream'
  bankAccount: string
  meetingDay: { day: 'Friday' | 'Saturday' | 'Sunday' }
  stream_name?: StreamOptions
  campus: Campus
  ministries?: Ministry[]
  councils?: Council[]
}
export interface Governorship extends Church {
  __typename: 'Governorship'
  stream: Stream
  council: Council
}

export interface Council extends Church {
  __typename: 'Council'
  stream: Stream
  hubCouncils?: HubCouncil[]
  governorships?: Governorship[]
  hubCouncilsFromMinistry?: HubCouncil[]
}

export interface CreativeArts extends Church {
  __typename: 'CreativeArts'
  campus: Campus
  ministries?: Ministry[]
}

export interface Ministry extends HigherChurch {
  id: string
  __typename: 'Ministry'
  bankAccount: string
  name: string
  creativeArts: CreativeArts
  stream: Stream
  councils: Council[]
  hubCouncils?: HubCouncil[]
}

export interface HubCouncil extends Church {
  __typename: 'HubCouncil'
  hub: Hub
  council: Council
  ministry: Ministry
}

export interface Hub extends Church {
  __typename: 'Hub'
  location: {
    latitude: number
    longitude: number
  }
  activeHubFellowshipCount: number
  vacationHubFellowshipCount: number
  hubCouncil: HubCouncil
  governorship: Governorship
  creativeArts: Campus
  vacationStatus: VacationStatusOptions
  meetingDay: {
    day: 'Wednesday' | 'Friday' | 'Saturday'
  }
}

//MEMBERSHIP
export interface MemberWithoutBioData {
  __typename: 'Member'
  id: string
  // eslint-disable-next-line camelcase
  firstName: string
  middleName?: string
  lastName: string
  fullName: string
  pictureUrl: string
  currentTitle: TitleOptions
  nameWithTitle: string
  phoneNumber: string
  whatsappNumber: string
}

export interface Member {
  __typename: 'Member'
  id: string
  // eslint-disable-next-line camelcase
  stickyNote?: string
  firstName: string
  middleName?: string
  lastName: string
  fullName: string
  visitationArea?: string
  location?: string
  nameWithTitle: string
  currentTitle: TitleOptions
  titleConnection?: any
  email: string
  pictureUrl: string
  phoneNumber: string
  whatsappNumber: string
  dob: { date: string }
  maritalStatus: { status: 'Married' | 'Single' }
  gender: { gender: 'Male' | 'Female' }
  occupation: { occupation: string }
  bacenta: Bacenta
  fellowship: {
    id: string
    name: string
  }
  basonta: {
    id: string
    name: string
  }
}

export interface MemberWithChurches extends Member {
  roles?: Role[]
  leadsFellowship: Church[]
  leadsBacenta: Church[]
  leadsGovernorship: Church[]
  leadsCouncil: Church[]
  leadsStream: Church[]

  leadsHub: Church[]
  leadsHubCouncil: Church[]
  leadsMinistry: Church[]
  leadsCreativeArts: Church[]
  isAdminForMinistry: Church[]
  isAdminForCreativeArts: Church[]

  leadsCampus: Church[]
  leadsOversight: Church[]
  leadsDenomination: Church[]
  isAdminForGovernorship: Church[]
  isAdminForCouncil: Church[]
  isAdminForStream: Church[]
  isAdminForCampus: Church[]
  isAdminForOversight: Church[]
  isAdminForDenomination: Church[]

  isArrivalsAdminForGovernorship: Church[]
  isArrivalsAdminForCouncil: Church[]
  isArrivalsAdminForStream: Church[]
  isArrivalsAdminForCampus: Church[]
  isArrivalsAdminForOversight: Church[]
}

export interface Servant {
  id: string
  roles: Role[]
}

export type ServantType =
  | 'Leader'
  | 'Admin'
  | 'ArrivalsAdmin'
  | 'ArrivalsCounter'
  | 'Teller'

export type ServantTypeLowerCase =
  | 'leader'
  | 'admin'
  | 'arrivalsAdmin'
  | 'arrivalsCounter'

export type CurrentUser = {
  id: string
  roles: Role[]
}

export type UserRole = {
  name: string
  church: Church[]
  number: number
  link: string
}

export type UserJobs = {
  name: string
  church: Church[]
  number: number
  authRoles: string
  link: string
}

export interface LazyRouteTypes {
  path: string
  element: LazyExoticComponent<() => JSX.Element>
  placeholder?: boolean
  roles: Role[]
}

export type Role =
  | 'leaderFellowship'
  | 'leaderBacenta'
  | 'leaderGovernorship'
  | 'leaderCouncil'
  | 'leaderStream'
  | 'leaderHub'
  | 'leaderHubCouncil'
  | 'leaderMinistry'
  | 'leaderCreativeArts'
  | 'leaderCampus'
  | 'leaderOversight'
  | 'leaderDenomination'
  | 'adminGovernorship'
  | 'adminCouncil'
  | 'adminStream'
  | 'adminCampus'
  | 'adminOversight'
  | 'adminDenomination'
  | 'adminMinistry'
  | 'adminCreativeArts'
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
  | 'teller'
  | 'leads'
  | 'isAdminFor'
  | 'isArrivalsAdminFor'
  | 'isArrivalsCounterFor'
  | 'isArrivalsPayerFor'
  | 'isTellerFor'

export type ServiceRecord = {
  __typename: 'ServiceRecord' | 'RehearsalRecord' | 'StageAttendanceRecord'
  id: string
  createdAt: string
  created_by: Member
  attendance: number
  cash: number
  income: number
  onlineGiving?: number
  numberOfTithers: number
  foreignCurrency: string
  week: number
  familyPicture: string
  onStagePictures?: string[]
  treasurers: Member[]
  stream_name: StreamOptions
  noServiceReason: string
  name?: string
  description?: string
  serviceDate: {
    date: string
  }

  // Offering
  treasurerSelfie: string
  bankingProof: boolean
  tellerConfirmationTime: string
  bankingSlip: string
  transactionStatus: 'pending' | 'success' | 'failed' | 'send OTP'
  bankingSlipUploader: Member
  offeringBankedBy: Member
  bankingConfirmer: Member
}

export type AggregateServiceRecord = {
  id: string
  week: string
  attendance: number
  income: number
}

//equipment
export type EquipmentChurch = {
  __typename: string
  id: string
  name: string
  equipmentRecord: EquipmentRecord
  fellowshipEquipmentFilledCount: number
  governorshipEquipmentFilledCount: number
}

export type EquipmentRecord = {
  __typename: string
  bluetoothSpeakers: number
  offeringBags: number
  pulpits: number
}
export interface HigherChurch extends Church {
  stream_name: StreamOptions
  vacationStatus?: VacationStatusOptions
  admin: MemberWithoutBioData
  fellowshipCount: number
  bacentaCount: number
  governorshipCount: number
  councilCount: number
  streamCount: number
  memberCount: number
  hubCount: number
  ministryCount: number
  target?: number
}
