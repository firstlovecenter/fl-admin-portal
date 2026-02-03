import { ApolloError } from '@apollo/client'
import {
  Bacenta,
  Church,
  ChurchLevel,
  Member,
  Stream,
  StreamOptions,
  TimeGraph,
} from 'global-types'

type Network = 'MTN' | 'Vodafone' | 'AirtelTigo' | 'Airtel' | 'Tigo'

export interface BussingRecord {
  id: string
  week: number
  createdAt: string
  mobilisationPicture: string
  created_by: Member
  serviceDate: TimeGraph

  bussingPictures?: string[]
  attendance: number
  leaderDeclaration: number
  numberOfBusses: number
  numberOfSprinters: number
  numberOfUrvans: number
  numberOfCars: number

  bussingTopUp: number
  counted_by: [Member]

  comments: string
  arrivalTime: Date
  transactionId: number
  arrival_confirmed_by: Member

  mobileNetwork: Network
  momoNumber: string
  momoName: string
  vehicleRecords: VehicleRecord[]
}

export type AggregateBussingRecords = {
  id: string
  week: number
  attendance: number
  leaderDeclaration: number
  numberOfSprinters: number
  numberOfUrvans: number
  numberOfCars: number
  bussingTopUp: number
}

export type VehicleRecord = {
  id: string
  created_by: Member
  createdAt: string

  leaderDeclaration: number
  attendance: number
  vehicle: 'Sprinter' | 'Urvan' | 'Car'

  momoNumber: string
  momoName: string
  mobileNetwork: Network
  vehicleTopUp: number
  picture: string

  counted_by: Member

  outbound: boolean
  comments: string
  arrivalTime: string
  transactionReference?: string
  transactionStatus?: string
}

export interface StreamWithArrivals extends Church, HigherChurchWithArrivals {
  __typename: 'Stream'
  name: StreamOptions
  meetingDay: {
    day: string
    dayNumber: number
  }
  mobilisationStartTime: string
  mobilisationEndTime: string
  arrivalStartTime: string
  arrivalEndTime: string
  arrivalsPayers: Member[]
  arrivalsCounters: Member[]
}

export interface BacentaWithArrivals extends Bacenta {
  stream: StreamWithArrivals
  stream_name: StreamOptions
  arrivalsCodeOfTheDay: string
  momoNumber: string
  outbound: boolean
  sprinterTopUp: number
  urvanTopUp: number
  bussing: BussingRecord[]
  bussingThisWeek: BussingRecord
}

export interface HigherChurchWithArrivals extends Church {
  __typename: 'Governorship' | 'Stream' | 'Council' | 'Campus'
  stream_name?: StreamOptions
  stream: Stream
  arrivalsAdmin: Member
  activeBacentaICCount: number
  bacentasNoActivity: BacentaWithArrivals[]
  bacentasMobilising: BacentaWithArrivals[]
  bacentasOnTheWay: BacentaWithArrivals[]
  bacentasBelow8: BacentaWithArrivals[]
  bacentasHaveArrived: BacentaWithArrivals[]
  bacentasNotCounted: BacentaWithArrivals[]

  vehiclesNotCountedCount: number
  bacentasNoActivityCount: number
  bacentasMobilisingCount: number
  bacentasOnTheWayCount: number
  bacentasBelow8Count: number

  vehiclesToBePaidCount: number
  vehiclesHaveBeenPaidCount: number
  vehicleAmountToBePaid: number
  vehicleAmountHasBeenPaid: number

  bacentasHaveArrivedCount: number
  bussingMembersOnTheWayCount: number
  bussingMembersHaveArrivedCount: number
  bussesThatArrivedCount: number
  bussesOnTheWayCount: number
  [key: string]: any
}

export interface ArrivalsUseChurchType {
  church: HigherChurchWithArrivals | null
  loading: boolean
  error: ApolloError | undefined
  refetch: () => Promise<any>
}

export interface ArrivalsUseChurchExt extends ArrivalsUseChurchType {
  subChurchLevel: ChurchLevel
}
