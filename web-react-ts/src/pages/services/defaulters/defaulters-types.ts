import { ApolloError } from '@apollo/client'
import {
  Church,
  StreamOptions,
  Fellowship,
  ServiceRecord,
  Member,
} from 'global-types'

export interface FellowshipWithDefaulters extends Fellowship {
  __typename: 'Fellowship'
  bacenta: {
    id: string
    name: string
    constituency: Church
  }
  services: ServiceRecord[]
}

export interface HigherChurchWithDefaulters extends Church {
  __typename: 'Constituency' | 'Stream' | 'Council' | 'GatheringService'
  admin?: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    phoneNumber: string
    whatsappNumber: string
  }
  stream_name: StreamOptions
  servicesThisWeek: FellowshipWithDefaulters[]
  formDefaultersThisWeek: FellowshipWithDefaulters[]
  bankedThisWeek: FellowshipWithDefaulters[]
  bankingDefaultersThisWeek: FellowshipWithDefaulters[]
  cancelledServicesThisWeek: FellowshipWithDefaulters[]
  bankedBy: Member
  servicesThisWeekCount: number
  formDefaultersThisWeekCount: number
  bankedThisWeekCount: number
  bankingDefaultersThisWeekCount: number
  cancelledServicesThisWeekCount: number

  [key: string]: any
}

export interface DefaultersUseChurchType {
  church: HigherChurchWithDefaulters | null
  loading: boolean
  error: ApolloError | undefined
  refetch: () => Promise<any>
}
