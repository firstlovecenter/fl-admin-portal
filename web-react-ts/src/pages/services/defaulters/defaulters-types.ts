import { ApolloError } from '@apollo/client'
import {
  Church,
  StreamOptions,
  Fellowship,
  ServiceRecord,
  Member,
  Constituency,
  Council,
  Bacenta,
  MemberWithoutBioData,
  Campus,
  Stream,
} from 'global-types'

export interface FellowshipWithDefaulters extends Fellowship {
  __typename: 'Fellowship'
  bacenta: Bacenta
  services: ServiceRecord[]
}
export interface ConstituencyWithDefaulters extends Constituency {
  __typename: 'Constituency'
  council: Council
  services: ServiceRecord[]
}

export interface CouncilWithDefaulters extends Council {
  __typename: 'Council'
  council: {
    __typename: string
    id: string
    name: string
    stream: Church
  }
  services: ServiceRecord[]
}
export interface StreamWithDefaulters extends Stream {
  __typename: 'Stream'
  campus: Campus
  services: ServiceRecord[]
}
export interface HigherChurchWithDefaulters extends Church {
  __typename: 'Constituency' | 'Stream' | 'Council' | 'Campus'
  admin?: MemberWithoutBioData
  stream_name: StreamOptions
  servicesThisWeek: FellowshipWithDefaulters[]
  formDefaultersThisWeek: FellowshipWithDefaulters[]
  bankedThisWeek: FellowshipWithDefaulters[]
  bankingDefaultersThisWeek: FellowshipWithDefaulters[]
  cancelledServicesThisWeek: FellowshipWithDefaulters[]
  constituencyBankingDefaultersThisWeek: ConstituencyWithDefaulters[]
  councilBankingDefaultersThisWeek: CouncilWithDefaulters[]
  constituencyBankedThisWeek: ConstituencyWithDefaulters[]
  councilBankedThisWeek: CouncilWithDefaulters[]

  streamServicesThisWeek?: StreamWithDefaulters[]
  streamFormDefaultersThisWeek?: StreamWithDefaulters[]
  streamBankedThisWeek?: StreamWithDefaulters[]
  streamBankingDefaultersThisWeek?: StreamWithDefaulters[]
  streamCancelledServicesThisWeek?: StreamWithDefaulters[]
  streamServicesThisWeekCount?: number
  streamFormDefaultersThisWeekCount?: number
  streamBankedThisWeekCount?: number
  streamBankingDefaultersThisWeekCount?: number
  streamCancelledServicesThisWeekCount?: number
  streamConstituencyBankingDefaultersThisWeekCount?: number

  bankedBy: Member
  servicesThisWeekCount: number
  formDefaultersThisWeekCount: number
  bankedThisWeekCount: number
  bankingDefaultersThisWeekCount: number
  cancelledServicesThisWeekCount: number
  constituencyBankingDefaultersThisWeekCount: number

  [key: string]: any
}

export interface DefaultersUseChurchType {
  church: HigherChurchWithDefaulters | null
  loading: boolean
  error: ApolloError | undefined
  refetch: () => Promise<any>
}
