import { ApolloError } from '@apollo/client'
import {
  Church,
  StreamOptions,
  ServiceRecord,
  Member,
  Governorship,
  Council,
  MemberWithoutBioData,
  Campus,
  Stream,
  ChurchLevel,
  Bacenta,
} from 'global-types'

export interface HigherChurchWithDefaulters extends Church {
  services?: ServiceRecord[]
  rehearsals?: ServiceRecord[]
}
export interface BacentaWithDefaulters extends Bacenta {
  __typename: 'Bacenta'
  governorship: Governorship
  services: ServiceRecord[]
  // Single service record for the selected week (driven by `weekStart` arg
  // on the cypher field). Replaces the `services(limit: 1)` accessor that
  // always returned the latest record across all time.
  serviceRecordForWeek?: ServiceRecord | null
}
// Combined unbanked total for a joint-service church (own joint service +
// all its sub-churches' unbanked records), surfaced by the backend
// `aggregateServiceRecordForWeek` @cypher. Used on the joint-defaulter cards.
export interface JointWeekAggregate {
  __typename?: 'AggregateServiceRecord'
  id?: string
  attendance?: number | null
  income?: number | null
  // Aggregates never carry a no-service reason; declared optional only so the
  // card can read it off the `JointWeekAggregate | ServiceRecord` union.
  noServiceReason?: string | null
}

export interface GovernorshipWithDefaulters extends Governorship {
  __typename: 'Governorship'
  council: Council
  services: ServiceRecord[]
  aggregateServiceRecordForWeek?: JointWeekAggregate | null
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
  aggregateServiceRecordForWeek?: JointWeekAggregate | null
}
export interface StreamWithDefaulters extends Stream {
  __typename: 'Stream'
  campus: Campus
  services: ServiceRecord[]
}
export interface HigherChurchWithDefaulters extends Church {
  __typename: ChurchLevel
  admin?: MemberWithoutBioData
  stream_name: StreamOptions
  servicesThisWeek: BacentaWithDefaulters[]
  formDefaultersThisWeek: BacentaWithDefaulters[]
  bankedThisWeek: BacentaWithDefaulters[]
  bankingDefaultersThisWeek: BacentaWithDefaulters[]
  cancelledServicesThisWeek: BacentaWithDefaulters[]
  governorshipBankingDefaultersThisWeek: GovernorshipWithDefaulters[]
  councilBankingDefaultersThisWeek: CouncilWithDefaulters[]
  governorshipBankedThisWeek: GovernorshipWithDefaulters[]
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
  streamGovernorshipBankingDefaultersThisWeekCount?: number

  bankedBy: Member
  servicesThisWeekCount: number
  formDefaultersThisWeekCount: number
  bankedThisWeekCount: number
  bankingDefaultersThisWeekCount: number
  cancelledServicesThisWeekCount: number
  governorshipBankingDefaultersThisWeekCount: number

  [key: string]: any
}

export interface DefaultersUseChurchType {
  church: HigherChurchWithDefaulters | null
  loading: boolean
  error: ApolloError | undefined
  refetch: () => Promise<any>
}
