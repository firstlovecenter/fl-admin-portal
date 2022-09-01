import axios from 'axios'
import {
  getMobileCode,
  getStreamFinancials,
  padNumbers,
} from '../utils/financial-utils'
import { Context } from '../utils/neo4j-types'
import { isAuth, rearrangeCypherObject, throwErrorMsg } from '../utils/utils'
import {
  permitAdmin,
  permitAdminArrivals,
  permitArrivals,
  permitArrivalsCounter,
  permitArrivalsHelpers,
} from '../permissions'
import { MakeServant, RemoveServant } from '../directory/make-remove-servants'
import { PaySwitchRequestBody } from '../banking/banking-types'
import {
  aggregateLeaderBussingDataOnHigherChurches,
  checkArrivalTimes,
  checkBacentaMomoDetails,
  checkTransactionId,
  getVehicleRecordWithDate,
  noVehicleTopUp,
  recordArrivalTime,
  recordVehicleFromBacenta,
  removeVehicleRecordTransactionId,
  setSwellDate,
  setVehicleRecordTransactionId,
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

const dotenv = require('dotenv')

dotenv.config()

const checkIfSelf = (servantId: string, auth: string) => {
  if (servantId === auth.replace('auth0|', '')) {
    throwErrorMsg('Sorry! You cannot make yourself an arrivals counter')
  }
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

    const stream = recordResponse.stream.properties
    const mobilisationEndTime = new Date(
      new Date().toISOString().slice(0, 10) +
        stream.mobilisationEndTime.slice(10)
    )
    const today = new Date()

    if (today > mobilisationEndTime) {
      throwErrorMsg('It is now past the time for mobilisation. Thank you!')
    }

    const checkBacentaMomo = rearrangeCypherObject(
      await session.run(checkBacentaMomoDetails, args)
    )

    if (!checkBacentaMomo?.momoNumber) {
      throwErrorMsg('You need a mobile money number before filling this form')
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
      outbound: boolean
    },
    context: Context
  ) => {
    isAuth(['leaderBacenta'], context.auth.roles)
    const session = context.executionContext.session()

    const response = rearrangeCypherObject(
      await session.run(recordVehicleFromBacenta, {
        ...args,
        auth: context.auth,
      })
    )

    const secondResponse = rearrangeCypherObject(
      await session.run(aggregateLeaderBussingDataOnHigherChurches, args)
    )
    const vehicleRecord = response.vehicleRecord.properties
    const bacenta = secondResponse.church.properties
    const date = secondResponse.timeNode.properties

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
              id: bacenta.id,
              stream_name: response.stream_name,
              bussing: [
                {
                  id: vehicleRecord.id,
                  serviceDate: {
                    date: date.date,
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
    try {
      type responseType = {
        id: string
        target: neonumber
        attendance: number
        vehicle: 'Sprinter' | 'Urvan' | 'Car'
        vehicleCost: number
        outbound: boolean
        personalContribution: number
        bacentaSprinterCost: neonumber
        bacentaUrvanCost: neonumber
        arrivalTime: string
        leaderPhoneNumber: string
        leaderFirstName: string
        dateLabels: string[]
      }

      const response: responseType = rearrangeCypherObject(
        await session.run(getVehicleRecordWithDate, args)
      )
      const calculateTopUp = (vehicleCost: number) => {
        if (vehicleCost <= 100) return 0.5 * vehicleCost
        if (vehicleCost <= 220) return 0.7 * vehicleCost
        return 0.8 * vehicleCost
      }

      if (response.arrivalTime) {
        throwErrorMsg(
          'This bacenta has already been marked as arrived and will not receive money'
        )
      }

      let vehicleRecord: RearragedCypherResponse | undefined

      const calculateVehicleTopUp = (data: responseType) => {
        const sprinterTopUp = calculateTopUp(data.bacentaSprinterCost.low)
        const urvanTopUp = calculateTopUp(data.bacentaUrvanCost.low)

        const outbound = response.outbound ? 2 : 1
        if (data.vehicle === 'Sprinter') {
          if (data.vehicleCost < sprinterTopUp) {
            return data.vehicleCost * outbound - data.personalContribution
          }
          return sprinterTopUp * outbound - data.personalContribution
        }
        if (data.vehicle === 'Urvan') {
          if (data.vehicleCost < urvanTopUp) {
            return data.vehicleCost * outbound - data.personalContribution
          }
          return urvanTopUp * outbound - data.personalContribution
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
        try {
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
          ])
          throwErrorMsg("Today's Bussing doesn't require a top up")
        } catch (error: any) {
          throwErrorMsg(error)
        }
      }

      if (response.vehicleCost === 0 || vehicleTopUp <= 0) {
        const attendanceRes = await Promise.all([
          session.run(noVehicleTopUp, { ...args, vehicleTopUp }),
          sendBulkSMS(
            [response.leaderPhoneNumber],
            joinMessageStrings([texts.arrivalsSMS.no_bussing_cost])
          ),
        ])
        vehicleRecord = rearrangeCypherObject(attendanceRes[0])
        return vehicleRecord?.record.properties
      }

      if (
        response.attendance &&
        (response.vehicle === 'Sprinter' || response.vehicle === 'Urvan')
      ) {
        // Did not cross your target, you get your normal zonal top up

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
        ])
        vehicleRecord = rearrangeCypherObject(attendanceRes[0])
      }

      return vehicleRecord?.record.properties
    } catch (error: any) {
      throwErrorMsg(error)
    }
    return {}
  },
  SendVehicleSupport: async (
    object: any,
    // eslint-disable-next-line camelcase
    args: { vehicleRecordId: string; stream_name: StreamOptions },
    context: Context
  ) => {
    isAuth(permitArrivalsHelpers(), context.auth.roles)
    const session = context.executionContext.session()

    const { merchantId, auth, passcode } = getStreamFinancials(args.stream_name)
    const recordResponse = rearrangeCypherObject(
      await session.run(checkTransactionId, args)
    )

    const transactionResponse = recordResponse.record.properties

    if (transactionResponse?.transactionStatus === 'success') {
      throwErrorMsg('Money has already been sent to this bacenta')
    } else if (
      !transactionResponse?.arrivalTime ||
      transactionResponse?.attendance < 8 ||
      !transactionResponse?.vehicleTopUp
    ) {
      // If record has not been confirmed, it will return null
      throwErrorMsg('This bacenta is not eligible to receive money')
    }
    const cypherResponse = rearrangeCypherObject(
      await session.run(setVehicleRecordTransactionId, args)
    )
    const vehicleRecord = cypherResponse.record.properties

    const sendVehicleSupport: PaySwitchRequestBody = {
      method: 'post',
      url: `https://prod.theteller.net/v1.1/transaction/process`,
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      data: {
        merchant_id: merchantId,
        transaction_id: padNumbers(vehicleRecord.transactionId),
        amount: padNumbers(vehicleRecord.bussingTopUp * 100),
        processing_code: '404000',
        'r-switch': 'FLT',
        desc: `${cypherResponse.bacentaName} Bacenta ${vehicleRecord.momoName}`,
        pass_code: passcode,
        account_number: vehicleRecord.momoNumber,
        account_issuer: getMobileCode(vehicleRecord.mobileNetwork),
      },
    }

    try {
      const res = await axios(sendVehicleSupport)

      if (res.data.code !== '000') {
        await session.run(removeVehicleRecordTransactionId, args)
        throwErrorMsg(`${res.data.code} ${res.data.reason}`)
      }

      await session
        .run(setVehicleRecordTransactionSuccessful, args)
        .catch((error: any) => throwErrorMsg(error))

      // eslint-disable-next-line no-console
      console.log(
        'Money Sent Successfully to',
        vehicleRecord.momoNumber,
        res.data
      )
      return vehicleRecord
    } catch (error: any) {
      throwErrorMsg(error, 'Money could not be sent!')
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
  RecordArrivalTime: async (
    object: any,
    args: { vehicleRecordId: string; bacentaId: string; attendance: number },
    context: Context
  ) => {
    isAuth(permitArrivalsCounter(), context.auth.roles)
    const session = context.executionContext.session()

    const recordResponse = rearrangeCypherObject(
      await session.run(checkTransactionId, args)
    )

    const stream = recordResponse.stream.properties
    const arrivalEndTime = () => {
      const endTimeToday = new Date(
        new Date().toISOString().slice(0, 10) + stream.arrivalEndTime.slice(10)
      )

      const TenMinBuffer = 10 * 60 * 1000

      const endTime = new Date(endTimeToday.getTime() + TenMinBuffer)

      return endTime
    }
    const today = new Date()

    if (today > arrivalEndTime()) {
      throwErrorMsg('It is now past the time for arrivals. Thank you!')
    }

    const promiseAllResponse = await Promise.all([
      session.run(recordArrivalTime, {
        ...args,
        auth: context.auth,
      }),
    ])

    const response = rearrangeCypherObject(promiseAllResponse[0])

    return response.vehicleRecord
  },
}

export const arrivalsResolvers = {}
