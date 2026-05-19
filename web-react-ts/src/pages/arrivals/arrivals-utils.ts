import { FormikSelectOptions, convertNeoWeekdayToJSWeekday } from 'global-utils'
import { addMinutes, getTodayTime, isToday } from 'lib/date-utils'
import {
  BacentaWithArrivals,
  BussingRecord,
  StreamWithArrivals,
  VehicleRecord,
} from './arrivals-types'

export const formatAmount = (amount?: number) =>
  typeof amount === 'number' && Number.isFinite(amount)
    ? new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        maximumFractionDigits: 0,
      }).format(amount)
    : '—'

export const MOBILE_NETWORK_OPTIONS: FormikSelectOptions = [
  { key: '', value: '' },
  { key: 'MTN', value: 'MTN' },
  { key: 'Vodafone', value: 'Vodafone' },
  { key: 'AirtelTigo', value: 'AirtelTigo' },
]
export const VEHICLE_OPTIONS: FormikSelectOptions = [
  { key: 'Urvan', value: 'Urvan' },
  { key: 'Sprinter', value: 'Sprinter' },
]

export const VEHICLE_OPTIONS_WITH_CAR: FormikSelectOptions = [
  { key: 'Urvan', value: 'Urvan' },
  { key: 'Sprinter', value: 'Sprinter' },
  { key: 'Private Car', value: 'Car' },
]

export const OUTBOUND_OPTIONS: FormikSelectOptions = [
  { key: 'In Only', value: 'In Only' },
  { key: 'In and Out', value: 'In and Out' },
]

export const convertOutboundToBoolean = (value: string | boolean) =>
  value === 'In and Out'

export const convertOutboundToString = (value: boolean) =>
  value === true ? 'In and Out' : 'In Only'

const isArrivalsToday = (bacenta: { stream: StreamWithArrivals }) => {
  if (!bacenta) return false
  if (import.meta.env.DEV) return true

  const today = new Date().getDay()

  if (
    convertNeoWeekdayToJSWeekday(bacenta.stream.meetingDay.dayNumber) === today
  )
    return true

  return false
}

export const beforeStreamArrivalsDeadline = (stream: StreamWithArrivals) => {
  if (!stream) return false

  const church = {
    ...stream,
    stream: stream,
  }

  const today = new Date()

  return (
    isArrivalsToday(church) &&
    today < new Date(getTodayTime(stream.arrivalEndTime))
  )
}

export const beforeCountingDeadline = (
  bussing: VehicleRecord,
  church: BacentaWithArrivals
) => {
  if (!bussing || !church) {
    return
  }

  const today = new Date()

  if (church?.__typename !== 'Bacenta') return false

  const arrivalStartTime = new Date(
    getTodayTime(church?.stream.arrivalStartTime)
  )
  const arrivalEndTime = new Date(getTodayTime(church?.stream.arrivalEndTime))
  const countingEndTime = addMinutes(arrivalEndTime.toString(), 15)

  if (
    isArrivalsToday(church) &&
    arrivalStartTime < today &&
    today < countingEndTime
  ) {
    if (isToday(bussing?.createdAt) && !bussing?.arrivalTime) {
      //If the record was created today
      //And if the time is less than the arrivals cutoff time
      return true
    }
  }

  // return false
  return false
}

export const beforeArrivalDeadline = (
  church: BacentaWithArrivals
): boolean => {
  if (!church) return false
  if (church?.__typename !== 'Bacenta') return false

  const today = new Date()
  const arrivalStartTime = new Date(
    getTodayTime(church?.stream.arrivalStartTime)
  )
  const arrivalEndTime = new Date(getTodayTime(church?.stream.arrivalEndTime))

  return (
    isArrivalsToday(church) &&
    arrivalStartTime < today &&
    today < arrivalEndTime
  )
}

export const beforeMobilisationDeadline = (
  church?: BacentaWithArrivals,
  bussing?: BussingRecord
) => {
  if (!church) {
    return
  }

  const today = new Date()

  if (church?.__typename !== 'Bacenta') return

  const mobilisationStartTime = new Date(
    getTodayTime(church?.stream.mobilisationStartTime)
  )
  const mobilisationEndTime = new Date(
    getTodayTime(church?.stream.mobilisationEndTime)
  )

  if (
    isArrivalsToday(church) &&
    mobilisationStartTime < today &&
    today < mobilisationEndTime
  ) {
    if (!bussing) return true

    if (!bussing?.mobilisationPicture) return true
  }

  // return false
  return false
}
