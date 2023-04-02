import axios from 'axios'
import { getStreamFinancials } from '../utils/financial-utils'
import { Context } from '../utils/neo4j-types'
import {
  isAuth,
  parseNeoNumber,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import {
  permitAdmin,
  permitAdminArrivals,
  permitArrivals,
  permitArrivalsCounter,
  permitArrivalsHelpers,
} from '../permissions'
import { MakeServant, RemoveServant } from '../directory/make-remove-servants'
import {
  aggregateBussingDataOnHigherChurches,
  aggregateVehicleBussingRecordData,
  checkArrivalTimeFromVehicle,
  checkArrivalTimes,
  checkBacentaMomoDetails,
  checkIfPreMobilisationFilled,
  checkTransactionReference,
  confirmVehicleByAdmin,
  getArrivalsPaymentDataCypher,
  getVehicleRecordWithDate,
  noVehicleTopUp,
  recordVehicleFromBacenta,
  setBacentaRecipientCode,
  setSwellDate,
  setVehicleRecordTransactionSuccessful,
  setVehicleTopUp,
  uploadMobilisationPicture,
} from './arrivals-cypher'
import { joinMessageStrings, sendBulkSMS } from '../utils/notify'
import {
  neonumber,
  RearragedCypherResponse,
  StreamOptions,
} from '../utils/types'
import texts from '../texts.json'
import { CreateTransferRecipientBody, SendMoneyBody } from './arrivals-types'
import { checkServantHasCurrentHistory } from '../services/service-resolvers'
import { setBacentaStatus } from './bacenta-status/utils-bacenta-status'

const dotenv = require('dotenv')

dotenv.config()

const checkIfSelf = (servantId: string, auth: string) => {
  if (servantId === auth.replace('auth0|', '')) {
    throw new Error('Sorry! You cannot make yourself an arrivals counter')
  }
}
const arrivalEndTimeCalculator = (arrivalEndTime: string) => {
  const endTimeToday = new Date(
    new Date().toISOString().slice(0, 10) + arrivalEndTime.slice(10)
  )

  const TwentyMinBuffer = 20 * 60 * 1000

  const endTime = new Date(endTimeToday.getTime() + TwentyMinBuffer)

  return endTime
}

export const arrivalsMutation = {
  MakeConstituencyArrivalsAdmin: async (
    object: any,
    args: any,
    context: Context
  ) =>
    MakeServant(
      context,
      args,
      [...permitAdmin('Constituency'), ...permitArrivals('Council')],
      'Constituency',
      'ArrivalsAdmin'
    ),
  RemoveConstituencyArrivalsAdmin: async (
    object: any,
    args: any,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Constituency'), ...permitArrivals('Council')],
      'Constituency',
      'ArrivalsAdmin'
    ),
  MakeCouncilArrivalsAdmin: async (object: any, args: any, context: Context) =>
    MakeServant(
      context,
      args,
      [...permitAdmin('Council'), ...permitArrivals('Stream')],
      'Council',
      'ArrivalsAdmin'
    ),
  RemoveCouncilArrivalsAdmin: async (
    object: any,
    args: any,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Council'), ...permitArrivals('Stream')],
      'Council',
      'ArrivalsAdmin'
    ),
  MakeStreamArrivalsAdmin: async (object: any, args: any, context: Context) =>
    MakeServant(
      context,
      args,
      [...permitAdmin('Stream'), ...permitArrivals('GatheringService')],
      'Stream',
      'ArrivalsAdmin'
    ),
  RemoveStreamArrivalsAdmin: async (object: any, args: any, context: Context) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Stream'), ...permitArrivals('GatheringService')],
      'Stream',
      'ArrivalsAdmin'
    ),
  MakeGatheringServiceArrivalsAdmin: async (
    object: any,
    args: any,
    context: Context
  ) =>
    MakeServant(
      context,
      args,
      [...permitAdmin('GatheringService'), ...permitArrivals('Oversight')],
      'GatheringService',
      'ArrivalsAdmin'
    ),
  RemoveGatheringServiceArrivalsAdmin: async (
    object: any,
    args: any,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('GatheringService'), ...permitArrivals('Oversight')],
      'GatheringService',
      'ArrivalsAdmin'
    ),

  // ARRIVALS HELPERS
  MakeStreamArrivalsCounter: async (
    object: never,
    args: { arrivalsCounterId: string; streamId: string },
    context: Context
  ) => {
    checkIfSelf(args.arrivalsCounterId, context.auth.jwt.sub)

    return MakeServant(
      context,
      args,
      [...permitAdmin('Stream'), ...permitArrivals('Stream')],
      'Stream',
      'ArrivalsCounter'
    )
  },
  RemoveStreamArrivalsCounter: async (
    object: never,
    args: { arrivalsCounterId: string; streamId: string },
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Stream'), ...permitArrivals('Stream')],
      'Stream',
      'ArrivalsCounter'
    ),

  UploadMobilisationPicture: async (
    object: any,
    args: {
      bacentaId: string
      serviceDate: string
      mobilisationPicture: string
    },
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(['leaderBacenta'], context.auth.roles)

    const recordResponse = rearrangeCypherObject(
      await session.run(checkArrivalTimes, args)
    )

    await checkServantHasCurrentHistory(session, context, {
      churchId: args.bacentaId,
    })
    const preMobCheck = rearrangeCypherObject(
      await session.run(checkIfPreMobilisationFilled, args)
    )
    if (preMobCheck.status) {
      throw new Error('You have already filled the pre-mobilisation form')
    }

    const stream = recordResponse.stream.properties
    const mobilisationEndTime = new Date(
      new Date().toISOString().slice(0, 10) +
        new Date(stream.mobilisationEndTime).toISOString().slice(10)
    )
    const today = new Date()

    if (today > mobilisationEndTime) {
      throw new Error('It is now past the time for mobilisation. Thank you!')
    }

    const checkBacentaMomo = rearrangeCypherObject(
      await session.run(checkBacentaMomoDetails, args)
    )

    if (
      !checkBacentaMomo?.momoNumber &&
      (parseNeoNumber(checkBacentaMomo.sprinterTopUp) ||
        parseNeoNumber(checkBacentaMomo.urvanTopUp))
    ) {
      throw new Error('You need a mobile money number before filling this form')
    }

    const response = rearrangeCypherObject(
      await session.run(uploadMobilisationPicture, {
        ...args,
        auth: context.auth,
      })
    )

    const bacenta = response.bacenta.properties
    const bussingRecord = response.bussingRecord.properties
    const date = response.date.properties

    const returnToCache = {
      id: bussingRecord.id,
      attendance: bussingRecord.attendance,
      mobilisationPicture: bussingRecord.mobilisationPicture,
      serviceLog: {
        bacenta: [
          {
            id: bacenta.id,
            stream_name: response.stream_name,
            bussing: [
              {
                id: bussingRecord.id,
                serviceDate: {
                  date: date.date,
                },
                week: response.week,
                mobilisationPicture: bussingRecord.mobilisationPicture,
              },
            ],
          },
        ],
      },
    }

    return returnToCache
  },
  RecordVehicleFromBacenta: async (
    object: never,
    args: {
      bacentaId: string
      bussingRecordId: string
      leaderDeclaration: number
      vehicleCost: number
      personalContribution: number
      vehicle: string
      picture: string
    },
    context: Context
  ) => {
    isAuth(['leaderBacenta'], context.auth.roles)
    const session = context.executionContext.session()

    const recordResponse = rearrangeCypherObject(
      await session.run(checkArrivalTimes, args)
    )

    const stream = recordResponse.stream.properties
    const bacenta = recordResponse.bacenta.properties
    const arrivalEndTime = new Date(
      new Date().toISOString().slice(0, 10) +
        new Date(stream.arrivalEndTime).toISOString().slice(10)
    )
    const today = new Date()

    if (today > arrivalEndTime) {
      throw new Error('It is past the time to fill your forms. Thank you!')
    }

    const response = rearrangeCypherObject(
      await session.run(recordVehicleFromBacenta, {
        ...args,
        recipientCode: bacenta.recipientCode,
        momoNumber: bacenta.momoNumber ?? '',
        mobileNetwork: bacenta.mobileNetwork ?? '',
        outbound: bacenta.outbound,
        vehicleCostWithOutbound: args.vehicleCost,
        auth: context.auth,
      })
    )

    const vehicleRecord = response.vehicleRecord.properties
    const date = new Date().toISOString().slice(0, 10)

    const returnToCache = {
      id: vehicleRecord.id,
      leaderDeclaration: vehicleRecord.leaderDeclaration,
      attendance: vehicleRecord.attendance,
      vehicleCost: vehicleRecord.vehicleCost,
      personalContribution: vehicleRecord.personalContribution,
      vehicle: vehicleRecord.vehicle,
      picture: vehicleRecord.picture,
      outbound: vehicleRecord.outbound,
      bussingRecord: {
        serviceLog: {
          bacenta: [
            {
              id: args.bacentaId,
              stream_name: response.stream_name,
              bussing: [
                {
                  id: vehicleRecord.id,
                  serviceDate: {
                    date,
                  },
                  week: response.week,
                  vehicleCost: vehicleRecord.vehicleCost,
                  personalContribution: vehicleRecord.personalContribution,
                  vehicle: vehicleRecord.vehicle,
                  picture: vehicleRecord.picture,
                  outbound: vehicleRecord.outbound,
                },
              ],
            },
          ],
        },
      },
    }
    return returnToCache
  },
  ConfirmVehicleByAdmin: async (
    object: never,
    args: {
      bacentaId: string
      bussingRecordId: string
      leaderDeclaration: number
      attendance: number
      vehicleCost: number
      personalContribution: number
      vehicle: 'Urvan' | 'Sprinter' | 'Car'
      picture: string
    },
    context: Context
  ) => {
    isAuth(permitArrivalsCounter(), context.auth.roles)
    const session = context.executionContext.session()

    const recordResponse = rearrangeCypherObject(
      await session.run(checkArrivalTimeFromVehicle, args)
    )

    const {
      arrivalEndTime,
      bacentaId,
      streamName,
      numberOfVehicles,
      totalAttendance,
      leaderPhoneNumber,
      leaderFirstName,
      bacentaName,
    }: {
      arrivalEndTime: string
      bacentaId: string
      streamName: string
      numberOfVehicles: neonumber
      totalAttendance: neonumber
      leaderPhoneNumber: string
      leaderFirstName: string
      bacentaName: string
    } = recordResponse

    const today = new Date()

    if (today > arrivalEndTimeCalculator(arrivalEndTime)) {
      throw new Error('It is now past the time for arrivals. Thank you!')
    }

    const adjustedArgs = args

    if (streamName === 'anagkazo encounter') {
      if (args.attendance < 20 && parseNeoNumber(numberOfVehicles) < 2) {
        adjustedArgs.attendance = 0
      } else if (
        parseNeoNumber(numberOfVehicles) >= 2 &&
        parseNeoNumber(totalAttendance) < 20
      ) {
        // Two or more vehicles but the combined attendance is less than the expected minimum
        adjustedArgs.attendance = 0
      }
    } else if (args.vehicle !== 'Car') {
      if (args.attendance < 8 && parseNeoNumber(numberOfVehicles) < 2) {
        adjustedArgs.attendance = 0
      } else if (
        parseNeoNumber(numberOfVehicles) >= 2 &&
        parseNeoNumber(totalAttendance) < 8
      ) {
        // Two or more vehicles but the combined attendance is less than the expected minimum
        adjustedArgs.attendance = 0
      }

      if (args.attendance < 8) {
        adjustedArgs.vehicle = 'Car'
      }
    }

    const response = rearrangeCypherObject(
      await session.run(confirmVehicleByAdmin, {
        ...adjustedArgs,
        auth: context.auth,
      })
    )

    await session
      .run(aggregateVehicleBussingRecordData, adjustedArgs)
      .catch((error: any) =>
        throwToSentry('Error Running aggregateVehicleBussingRecordData', error)
      )
    await session
      .run(aggregateBussingDataOnHigherChurches, { bacentaId })
      .catch((error: any) =>
        throwToSentry(
          'Error Running aggregateLeaderBussingDataOnHigherChurches',
          error
        )
      )

    await setBacentaStatus(
      bacentaId,
      leaderFirstName,
      leaderPhoneNumber,
      bacentaName,
      context
    ).catch((error: any) =>
      console.error('Error Setting bacenta Status', error)
    )

    const vehicleRecord = response.vehicleRecord.properties
    const date = new Date().toISOString().slice(0, 10)

    const returnToCache = {
      id: vehicleRecord.id,
      leaderDeclaration: vehicleRecord.leaderDeclaration,
      attendance: vehicleRecord.attendance,
      vehicleCost: vehicleRecord.vehicleCost,
      personalContribution: vehicleRecord.personalContribution,
      vehicle: vehicleRecord.vehicle,
      picture: vehicleRecord.picture,
      outbound: vehicleRecord.outbound,
      arrivalTime: vehicleRecord.arrivalTime,
      bussingRecord: {
        serviceLog: {
          bacenta: [
            {
              id: args.bacentaId,
              stream_name: response.stream_name,
              bussing: [
                {
                  id: vehicleRecord.id,
                  serviceDate: {
                    date,
                  },
                  week: response.week,
                  vehicleCost: vehicleRecord.vehicleCost,
                  personalContribution: vehicleRecord.personalContribution,
                  vehicle: vehicleRecord.vehicle,
                  picture: vehicleRecord.picture,
                  outbound: vehicleRecord.outbound,
                },
              ],
            },
          ],
        },
      },
    }
    return returnToCache
  },

  SetVehicleSupport: async (
    object: never,
    args: { vehicleRecordId: string },
    context: Context
  ) => {
    const session = context.executionContext.session()

    type responseType = {
      id: string
      target: neonumber
      attendance: number
      vehicle: 'Sprinter' | 'Urvan' | 'Car'
      vehicleCost: number
      outbound: boolean
      personalContribution: number
      bacentaSprinterTopUp: number
      bacentaUrvanTopUp: number
      arrivalTime: string
      leaderPhoneNumber: string
      leaderFirstName: string
      dateLabels: string[]
    }

    const response: responseType = rearrangeCypherObject(
      await session.run(getVehicleRecordWithDate, args)
    )

    let vehicleRecord: RearragedCypherResponse | undefined

    const calculateVehicleTopUp = (data: responseType) => {
      const outbound = response.outbound ? 2 : 1
      const sprinterTopUp = data.bacentaSprinterTopUp * outbound
      const urvanTopUp = data.bacentaUrvanTopUp * outbound

      const amountToPay = data.vehicleCost - data.personalContribution

      if (data.vehicle === 'Sprinter') {
        if (sprinterTopUp === 0) return 0
        if (data.vehicleCost < sprinterTopUp || amountToPay < sprinterTopUp) {
          return amountToPay
        }

        return parseFloat(sprinterTopUp.toFixed(2))
      }

      if (data.vehicle === 'Urvan') {
        if (urvanTopUp === 0) return 0
        if (data.vehicleCost < urvanTopUp || amountToPay < urvanTopUp) {
          return amountToPay
        }

        return parseFloat(urvanTopUp.toFixed(2))
      }
      return 0
    }
    const vehicleTopUp = calculateVehicleTopUp(response)

    if (response.vehicle === 'Car') {
      const attendanceRes = await Promise.all([
        session.run(noVehicleTopUp, { ...args, vehicleTopUp }),
        sendBulkSMS(
          [response.leaderPhoneNumber],
          joinMessageStrings([
            texts.arrivalsSMS.no_busses_to_pay_for,
            response.attendance.toString(),
          ])
        ),
      ])
      vehicleRecord = rearrangeCypherObject(attendanceRes[0])
      return vehicleRecord?.record.properties
    }

    if (response.attendance < 8) {
      await Promise.all([
        session.run(noVehicleTopUp, args),
        sendBulkSMS(
          [response.leaderPhoneNumber],
          joinMessageStrings([
            `Hi ${response.leaderFirstName}\n\n`,
            texts.arrivalsSMS.less_than_8,
            response.attendance.toString(),
          ])
        ),
      ]).catch((error) =>
        throwToSentry('There was an error processing bussing payment', error)
      )
      throw new Error("Today's Bussing doesn't require a top up")
    }

    if (response.vehicleCost === 0 || vehicleTopUp <= 0) {
      const attendanceRes = await Promise.all([
        session.run(noVehicleTopUp, { ...args, vehicleTopUp }),
        sendBulkSMS(
          [response.leaderPhoneNumber],
          joinMessageStrings([
            texts.arrivalsSMS.no_bussing_cost,
            response.attendance.toString(),
          ])
        ),
      ])
      vehicleRecord = rearrangeCypherObject(attendanceRes[0])
      return vehicleRecord?.record.properties
    }

    if (
      response.attendance &&
      (response.vehicle === 'Sprinter' || response.vehicle === 'Urvan')
    ) {
      const receiveMoney = joinMessageStrings([
        `Hi  ${response.leaderFirstName}\n\n`,
        texts.arrivalsSMS.normal_top_up_p1,
        vehicleTopUp?.toString(),
        texts.arrivalsSMS.normal_top_up_p2,
        response.attendance?.toString(),
      ])

      const attendanceRes = await Promise.all([
        session.run(setVehicleTopUp, { ...args, vehicleTopUp }),
        sendBulkSMS([response.leaderPhoneNumber], `${receiveMoney}`),
      ]).catch((error) =>
        throwToSentry('There was an error processing bussing payment', error)
      )
      vehicleRecord = rearrangeCypherObject(attendanceRes[0])
    }

    return vehicleRecord?.record.properties
  },
  SendVehicleSupport: async (
    object: any,
    // eslint-disable-next-line camelcase
    args: { vehicleRecordId: string; stream_name: StreamOptions },
    context: Context
  ) => {
    isAuth(permitArrivalsHelpers(), context.auth.roles)
    const session = context.executionContext.session()

    const { auth } = getStreamFinancials(args.stream_name)
    const recordResponse = rearrangeCypherObject(
      await session.run(checkTransactionReference, args)
    )

    const vehicleRecord = recordResponse.record.properties
    const bacenta = recordResponse.bacenta.properties
    const leader = recordResponse.leader.properties

    let recipient = vehicleRecord

    if (vehicleRecord?.transactionStatus === 'success') {
      throw new Error('Money has already been sent to this bacenta')
    } else if (
      !vehicleRecord?.arrivalTime ||
      vehicleRecord?.attendance < 8 ||
      !vehicleRecord?.vehicleTopUp
    ) {
      // If record has not been confirmed, it will return null
      throw new Error('This bacenta is not eligible to receive money')
    }

    if (!vehicleRecord.recipientCode) {
      const createRecipient: CreateTransferRecipientBody = {
        method: 'post',
        baseURL: 'https://api.paystack.co/',
        url: '/transferrecipient',
        headers: {
          'content-type': 'application/json',
          Authorization: auth,
        },
        data: {
          type: 'mobile_money',
          name: vehicleRecord.momoName,
          email: leader.email,
          account_number: vehicleRecord.momoNumber,
          bank_code: vehicleRecord.mobileNetwork,
          currency: 'GHS',
          metadata: {
            bacenta: {
              id: bacenta.id,
              name: bacenta.name,
            },
            leader: {
              id: leader.id,
              firstName: leader.firstName,
              lastName: leader.lastName,
              phoneNumber: leader.phoneNumber,
              whatsappNumber: leader.whatsappNumber,
            },
          },
        },
      }

      const recipientResponse = await axios(createRecipient).catch((err) =>
        throwToSentry('Error creating transfer recipient', err)
      )

      await session.run(setBacentaRecipientCode, {
        bacentaId: bacenta.id,
        recipientCode: recipientResponse.data.data.recipient_code,
      })

      recipient = {
        ...recipientResponse.data.data,
        recipientCode: recipientResponse.data.data.recipient_code,
      }
    }

    const sendVehicleSupport: SendMoneyBody = {
      method: 'post',
      baseURL: 'https://api.paystack.co/',
      url: '/transfer',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      data: {
        source: 'balance',
        reason: `${bacenta.name} Bacenta bussed ${vehicleRecord.attendance}`,
        amount: vehicleRecord.vehicleTopUp * 100,
        currency: 'GHS',
        recipient: recipient.recipientCode,
      },
    }

    try {
      const res = await axios(sendVehicleSupport)

      const responseData = res.data.data

      await session
        .run(setVehicleRecordTransactionSuccessful, {
          ...args,
          recipientCode: recipient.recipientCode,
          transactionReference: responseData.reference,
          transferCode: responseData.transfer_code,
          responseStatus: responseData.status,
        })
        .catch((error: any) =>
          throwToSentry(
            'There was an error setting Vehicle Record Transaction Status',
            error
          )
        )

      console.log('Money Sent Successfully to', vehicleRecord.momoNumber)

      return vehicleRecord
    } catch (error: any) {
      throwToSentry(
        `Money could not be sent! ${error.response.data.message}`,
        error
      )
    }

    return vehicleRecord
  },
  SetSwellDate: async (object: any, args: any, context: Context) => {
    isAuth(permitAdminArrivals('GatheringService'), context.auth.roles)

    const session = context.executionContext.session()

    const cypherResponse = rearrangeCypherObject(
      await session.run(setSwellDate, args)
    )

    return cypherResponse
  },
  SendMobileVerificationNumber: async (
    object: any,
    args: { firstName: string; phoneNumber: string; otp: string },
    context: Context
  ) => {
    isAuth(['leaderBacenta'], context.auth.roles)

    const response = await sendBulkSMS(
      [args.phoneNumber],
      `Hi ${args.firstName},\n\nYour OTP is ${args.otp}. Input this on the portal to verify your phone number.`
    )

    return response
  },
}

const getArrivalsPaymentData = async (
  object: any,
  // eslint-disable-next-line camelcase
  args: { arrivalsDate: string },
  context: Context
) => {
  isAuth(permitAdminArrivals('Stream'), context.auth.roles)

  const session = context.executionContext.session()

  const cypherResponse = rearrangeCypherObject(
    await session.run(getArrivalsPaymentDataCypher, {
      streamId: object.id,
      date: args.arrivalsDate,
    }),
    true
  )

  return cypherResponse
}

export const arrivalsResolvers = {
  Stream: {
    arrivalsPaymentData: async (
      object: any,
      args: { arrivalsDate: string },
      context: Context
    ) => getArrivalsPaymentData(object, args, context),
  },
}
