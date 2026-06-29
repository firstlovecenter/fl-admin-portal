import axios from 'axios'
import { Integer, int, Session } from 'neo4j-driver'
import { getHumanReadableDate } from '../utils/date-utils'
import { getStreamFinancials } from '../utils/financial-utils'
import { Context } from '../utils/neo4j-types'
import {
  badRequest,
  isAuth,
  parseNeoNumber,
  rearrangeCypherObject,
  throwToSentry,
} from '../utils/utils'
import {
  assertChurchScope,
  assertScopeViaVehicleRecord,
} from '../utils/scope-utils'
import {
  permitAdmin,
  permitAdminArrivals,
  permitArrivals,
  permitArrivalsCounter,
  permitArrivalsHelpers,
  permitArrivalsPayer,
  permitBacentaBussingAdmin,
} from '../permissions'
import { MakeServant, RemoveServant } from '../directory/make-remove-servants'
import {
  aggregateVehicleBussingRecordData,
  checkArrivalTimeFromVehicle,
  checkArrivalTimes,
  checkBacentaMomoDetails,
  checkIfPreMobilisationFilled,
  checkTransactionReference,
  confirmVehicleByAdmin,
  getArrivalsPaymentDataCypher,
  getArrivalsPaymentCountCypher,
  getVehicleRecordWithDate,
  noVehicleTopUp,
  recordVehicleFromBacenta,
  setBacentaRecipientCode,
  setSwellDate,
  setVehicleRecordTransactionSuccessful,
  setVehicleTopUp,
  updateBacentaBussingDetails,
  updateBusPaymentDetails,
  uploadMobilisationPicture,
} from './arrivals-cypher'
import { joinMessageStrings, sendBulkSMS } from '../utils/notify'
import { neonumber } from '../utils/types'
import texts from '../texts.json'
import { CreateTransferRecipientBody, SendMoneyBody } from './arrivals-types'
import { checkServantHasCurrentHistory } from '../services/service-resolvers'

const dotenv = require('dotenv')

dotenv.config()

const checkIfSelf = (servantId: string, auth: string | undefined) => {
  if (!auth) return
  if (servantId === auth.replace('auth0|', '')) {
    throw new Error('Sorry! You cannot make yourself an arrivals counter')
  }
}
const arrivalEndTimeCalculator = (arrivalEndTime: string) => {
  const endTimeToday = new Date(
    new Date().toISOString().slice(0, 10) + arrivalEndTime.slice(10)
  )

  const COUNTINGBUFFER = 15 * 60 * 1000

  const endTime = new Date(endTimeToday.getTime() + COUNTINGBUFFER)

  return endTime
}

type VehicleSupportData = {
  vehicleRecordId: string
  attendance: number
  vehicle: 'Sprinter' | 'Urvan' | 'Car'
  outbound: boolean
  bacentaSprinterTopUp: number
  bacentaUrvanTopUp: number
  arrivalTime: string
  leaderPhoneNumber: string
  leaderFirstName: string
  dateLabels: string[]
}

// The eligible top-up is the bacenta's configured rate for the vehicle type,
// doubled for an "in and out" (outbound) journey. A Car or an unconfigured
// rate yields 0. `vehicleCost` was removed from the bussing flow long ago, so
// there is no per-vehicle cost to clamp against — the configured rate is the
// source of truth.
const calculateVehicleTopUp = (data: VehicleSupportData) => {
  const outbound = data.outbound ? 2 : 1
  const sprinterTopUp =
    parseNeoNumber(data.bacentaSprinterTopUp as unknown as Integer) * outbound
  const urvanTopUp =
    parseNeoNumber(data.bacentaUrvanTopUp as unknown as Integer) * outbound

  if (data.vehicle === 'Sprinter') {
    return sprinterTopUp === 0 ? 0 : parseFloat(sprinterTopUp.toFixed(2))
  }
  if (data.vehicle === 'Urvan') {
    return urvanTopUp === 0 ? 0 : parseFloat(urvanTopUp.toFixed(2))
  }
  return 0
}

// Derives and writes the eligible top-up for an already-counted vehicle, then
// notifies the leader. Idempotent — re-running it is how a re-confirm heals a
// record whose top-up was never set. Cars, sub-8 attendance, and unconfigured
// rates write 0 via noVehicleTopUp; otherwise the calculated amount is written
// via setVehicleTopUp. Approving the amount moves no money — release stays with
// the payer's SendVehicleSupport (SM5 separation of duties).
const applyVehicleSupport = async (
  session: Session,
  vehicleRecordId: string,
  options: { notify: boolean }
) => {
  const data: VehicleSupportData = rearrangeCypherObject(
    await session.run(getVehicleRecordWithDate, { vehicleRecordId })
  )

  const attendance = parseNeoNumber(data.attendance as unknown as Integer)
  const vehicleTopUp = calculateVehicleTopUp(data)

  const writeAndNotify = async (
    cypher: string,
    amount: number,
    message: string
  ) => {
    const result = rearrangeCypherObject(
      await session.run(cypher, { vehicleRecordId, vehicleTopUp: amount })
    )
    if (options.notify) {
      sendBulkSMS([data.leaderPhoneNumber], message).catch((error) =>
        throwToSentry(
          'There was an error sending the bussing payment SMS',
          error
        )
      )
    }
    return result?.record?.properties
  }

  const greeting = (extra = '') => `Hi ${extra}${data.leaderFirstName}\n\n`

  if (data.vehicle === 'Car') {
    return writeAndNotify(
      noVehicleTopUp,
      0,
      joinMessageStrings([
        greeting(),
        texts.arrivalsSMS.no_busses_to_pay_for,
        attendance.toString(),
      ])
    )
  }

  if (attendance < 8) {
    return writeAndNotify(
      noVehicleTopUp,
      0,
      joinMessageStrings([
        greeting(),
        texts.arrivalsSMS.less_than_8,
        attendance.toString(),
      ])
    )
  }

  if (vehicleTopUp <= 0) {
    return writeAndNotify(
      noVehicleTopUp,
      0,
      joinMessageStrings([
        greeting(),
        texts.arrivalsSMS.no_bussing_cost,
        attendance.toString(),
      ])
    )
  }

  return writeAndNotify(
    setVehicleTopUp,
    vehicleTopUp,
    joinMessageStrings([
      greeting(' '),
      texts.arrivalsSMS.normal_top_up_p1,
      vehicleTopUp.toString(),
      texts.arrivalsSMS.normal_top_up_p2,
      attendance.toString(),
    ])
  )
}

export const arrivalsMutation = {
  MakeGovernorshipArrivalsAdmin: async (
    object: any,
    args: any,
    context: Context
  ) =>
    MakeServant(
      context,
      args,
      [...permitAdmin('Stream')],
      'Governorship',
      'ArrivalsAdmin'
    ),
  RemoveGovernorshipArrivalsAdmin: async (
    object: any,
    args: any,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Stream')],
      'Governorship',
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
      [...permitAdmin('Stream'), ...permitArrivals('Campus')],
      'Stream',
      'ArrivalsAdmin'
    ),
  RemoveStreamArrivalsAdmin: async (object: any, args: any, context: Context) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Stream'), ...permitArrivals('Campus')],
      'Stream',
      'ArrivalsAdmin'
    ),
  MakeCampusArrivalsAdmin: async (object: any, args: any, context: Context) =>
    MakeServant(
      context,
      args,
      [...permitAdmin('Campus'), ...permitArrivals('Oversight')],
      'Campus',
      'ArrivalsAdmin'
    ),
  RemoveCampusArrivalsAdmin: async (object: any, args: any, context: Context) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Campus'), ...permitArrivals('Oversight')],
      'Campus',
      'ArrivalsAdmin'
    ),

  // ARRIVALS HELPERS
  MakeStreamArrivalsCounter: async (
    object: never,
    args: { arrivalsCounterId: string; streamId: string },
    context: Context
  ) => {
    checkIfSelf(args.arrivalsCounterId, context.jwt?.userId)

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
  MakeCouncilArrivalsPayer: async (
    object: never,
    args: never,
    context: Context
  ) =>
    MakeServant(
      context,
      args,
      [...permitAdminArrivals('Campus')],
      'Council',
      'ArrivalsPayer'
    ),
  RemoveCouncilArrivalsPayer: async (
    object: never,
    args: never,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      [...permitAdminArrivals('Campus')],
      'Council',
      'ArrivalsPayer'
    ),

  // SYN-185 — was an SDL @cypher mutation gated on role strings only, so any
  // campus/stream arrivals admin could overwrite ANY bacenta's top-ups (which
  // drive driver payouts). Now a resolver: the role gate is the same four roles
  // the old @authentication accepted, plus assertChurchScope binds the write to
  // a bacenta within the caller's authority. Out-of-scope calls throw a friendly
  // FORBIDDEN before any write or HistoryLog.
  UpdateBacentaBussingDetails: async (
    object: never,
    args: {
      bacentaId: string
      sprinterTopUp: number
      urvanTopUp: number
      outbound: boolean
    },
    context: Context
  ) => {
    isAuth(permitBacentaBussingAdmin(), context.jwt?.roles)
    await assertChurchScope(context, args.bacentaId)

    // These top-ups drive driver-payout amounts — reject negative/non-finite
    // values server-side (ADR-005). GraphQL Float! already blocks NaN/Infinity;
    // the finite check is belt-and-suspenders.
    if (
      !Number.isFinite(args.sprinterTopUp) ||
      !Number.isFinite(args.urvanTopUp) ||
      args.sprinterTopUp < 0 ||
      args.urvanTopUp < 0
    ) {
      throw badRequest('Top-up amounts must be zero or a positive number.')
    }

    const session = context.executionContext.session()
    try {
      const response = await session.executeWrite((tx) =>
        tx.run(updateBacentaBussingDetails, {
          bacentaId: args.bacentaId,
          sprinterTopUp: args.sprinterTopUp,
          urvanTopUp: args.urvanTopUp,
          outbound: args.outbound,
          userId: context.jwt?.userId,
        })
      )
      return response.records[0]?.get('bacenta')
    } catch (error: any) {
      throwToSentry('Error updating bacenta bussing details', error)
      throw error
    } finally {
      await session.close()
    }
  },
  // SYN-185 — companion to UpdateBacentaBussingDetails. Gated to the bacenta's
  // own leader; assertChurchScope confirms the leader actually leads the target
  // bacenta rather than trusting the bacentaId argument.
  UpdateBusPaymentDetails: async (
    object: never,
    args: {
      bacentaId: string
      mobileNetwork: string
      momoName: string
      momoNumber: string
    },
    context: Context
  ) => {
    isAuth(['leaderBacenta'], context.jwt?.roles)
    await assertChurchScope(context, args.bacentaId)

    const session = context.executionContext.session()
    try {
      const response = await session.executeWrite((tx) =>
        tx.run(updateBusPaymentDetails, {
          bacentaId: args.bacentaId,
          mobileNetwork: args.mobileNetwork,
          momoName: args.momoName,
          momoNumber: args.momoNumber,
          userId: context.jwt?.userId,
        })
      )
      return response.records[0]?.get('bacenta')
    } catch (error: any) {
      throwToSentry('Error updating bus payment details', error)
      throw error
    } finally {
      await session.close()
    }
  },
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
    isAuth(['leaderBacenta'], context.jwt?.roles)
    await assertChurchScope(context, args.bacentaId)

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
        jwt: context.jwt,
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
      vehicle: string
      picture: string
    },
    context: Context
  ) => {
    isAuth(['leaderBacenta'], context.jwt?.roles)
    await assertChurchScope(context, args.bacentaId)

    if (!args.picture?.trim()) {
      throw new Error('A vehicle picture is required.')
    }
    if (!['Urvan', 'Sprinter', 'Car'].includes(args.vehicle)) {
      throw new Error('Vehicle must be Urvan, Sprinter, or Car.')
    }
    if (
      !Number.isInteger(args.leaderDeclaration) ||
      args.leaderDeclaration < 1 ||
      args.leaderDeclaration > 200
    ) {
      throw new Error(
        'Leader declaration must be a whole number between 1 and 200.'
      )
    }

    const session = context.executionContext.session()

    try {
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
          jwt: context.jwt,
        })
      )

      const vehicleRecord = response.vehicleRecord.properties
      const date = new Date().toISOString().slice(0, 10)

      return {
        id: vehicleRecord.id,
        leaderDeclaration: vehicleRecord.leaderDeclaration,
        attendance: vehicleRecord.attendance,
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
                    id: args.bussingRecordId,
                    serviceDate: {
                      date,
                    },
                    week: response.week,
                  },
                ],
              },
            ],
          },
        },
      }
    } catch (error: any) {
      throwToSentry('RecordVehicleFromBacenta failed', error)
    } finally {
      await session.close()
    }

    return null
  },
  // SM5 onTheWay → counted → approved, in one round trip. The counter records
  // attendance (once-only) and the eligible top-up is derived in the same call.
  // A re-confirm skips the attendance write but still re-derives the top-up, so
  // a record orphaned by a dropped first response (counted server-side, top-up
  // never set) heals on resubmit instead of being stuck forever. Approving the
  // amount moves no money — release stays with the payer's SendVehicleSupport.
  ConfirmVehicleByAdmin: async (
    object: never,
    args: {
      vehicleRecordId: string
      attendance: number
      vehicle: 'Urvan' | 'Sprinter' | 'Car'
      comments: string | null
    },
    context: Context
  ) => {
    isAuth(permitArrivalsCounter(), context.jwt?.roles)
    await assertScopeViaVehicleRecord(context, args.vehicleRecordId)

    // TS types are erased at runtime; the SDL only enforces Int! / String!.
    // Reject negative/NaN/absurdly-large counts and unknown vehicle labels
    // so neither the VehicleRecord write nor the downstream aggregation can
    // be poisoned by tampered client input.
    if (
      !Number.isInteger(args.attendance) ||
      args.attendance < 0 ||
      args.attendance > 200
    ) {
      throw new Error('Attendance must be a whole number between 0 and 200.')
    }
    if (!['Urvan', 'Sprinter', 'Car'].includes(args.vehicle)) {
      throw new Error('Vehicle must be Urvan, Sprinter, or Car.')
    }

    const session = context.executionContext.session()

    try {
      const recordResponse = rearrangeCypherObject(
        await session.run(checkArrivalTimeFromVehicle, args)
      )

      const {
        arrivalEndTime,
        numberOfVehicles,
        totalAttendance,
        isToday,
        alreadyCounted,
      }: {
        arrivalEndTime: string
        numberOfVehicles: neonumber
        totalAttendance: neonumber
        isToday: boolean
        alreadyCounted: boolean
      } = recordResponse

      if (!isToday) {
        throw new Error(
          'This bussing record is not for today. You can only count vehicles for today.'
        )
      }

      // First count: enforce the arrival window and write attendance once.
      // SM5 counted is once-only — a re-confirm (alreadyCounted) leaves the
      // recorded attendance/arrivalTime untouched and falls straight through
      // to re-derive the top-up.
      if (!alreadyCounted) {
        const today = new Date()

        if (today > arrivalEndTimeCalculator(arrivalEndTime)) {
          throw new Error('It is now past the time for arrivals. Thank you!')
        }

        const adjustedArgs = args

        if (args.vehicle !== 'Car') {
          if (parseNeoNumber(numberOfVehicles) < 1 && args.attendance < 8) {
            // No arrived vehicles and attendance is less than 8
            adjustedArgs.attendance = 0
          } else if (
            parseNeoNumber(numberOfVehicles) >= 1 &&
            args.attendance < 8 &&
            parseNeoNumber(totalAttendance) < 8
          ) {
            // One arrived vehicle but the combined attendance is less than 8
            adjustedArgs.attendance = 0
          }
        }

        if (args.attendance < 8) {
          adjustedArgs.vehicle = 'Car'
        }

        await session.run(confirmVehicleByAdmin, {
          ...adjustedArgs,
          jwt: context.jwt,
        })
      }

      const vehicleRecord = await applyVehicleSupport(
        session,
        args.vehicleRecordId,
        { notify: !alreadyCounted }
      )

      await session
        .run(aggregateVehicleBussingRecordData, {
          vehicleRecordId: args.vehicleRecordId,
        })
        .catch((error: any) =>
          throwToSentry(
            'Error Running aggregateVehicleBussingRecordData',
            error
          )
        )

      return vehicleRecord
    } finally {
      await session.close()
    }
  },

  // SM5 counted → approved. Stand-alone entry to (re-)derive the eligible
  // top-up for an already-counted vehicle, available to the counter or payer
  // (permitArrivalsHelpers). The counter form normally approves the top-up in
  // the same call as ConfirmVehicleByAdmin; this remains for re-approval and
  // back-office repair. Approving moves no money (SM5 SoD).
  SetVehicleSupport: async (
    object: never,
    args: { vehicleRecordId: string },
    context: Context
  ) => {
    isAuth(permitArrivalsHelpers('Stream'), context.jwt?.roles)
    await assertScopeViaVehicleRecord(context, args.vehicleRecordId)
    const session = context.executionContext.session()

    try {
      return await applyVehicleSupport(session, args.vehicleRecordId, {
        notify: true,
      })
    } finally {
      await session.close()
    }
  },
  // SM5 approved → paid. Separation of duties: this resolver is restricted
  // to `permitArrivalsPayer()` (Council Payer) only. The Stream Counter can
  // record attendance and approve the eligible top-up via SetVehicleSupport,
  // but cannot release momo from the Paystack stream account — that authority
  // sits with the Council Payer. See kb/04-state-machines.md SM5 actor matrix.
  SendVehicleSupport: async (
    object: any,
    // eslint-disable-next-line camelcase
    args: {
      vehicleRecordId: string
      momoName: string
      momoNumber: string
      vehicleTopUp: number
      outbound: boolean
    },
    context: Context
  ) => {
    isAuth(permitArrivalsPayer(), context.jwt?.roles)
    await assertScopeViaVehicleRecord(context, args.vehicleRecordId)
    const session = context.executionContext.session()

    try {
      const recordResponse = rearrangeCypherObject(
        await session.executeRead((tx) =>
          tx.run(checkTransactionReference, args)
        )
      )

      if (!recordResponse?.isToday) {
        throw new Error(
          'This bussing record is not for today. You can only pay for vehicles bussed today.'
        )
      }

      const { auth } = await getStreamFinancials(
        recordResponse.stream.properties
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
            name: `${leader.firstName} ${leader.lastName}`,
            email: leader.email,
            account_number: vehicleRecord.momoNumber,
            bank_code: vehicleRecord.mobileNetwork,
            currency: 'GHS',
            metadata: {
              momo: {
                name: vehicleRecord.momoName,
                number: vehicleRecord.momoNumber,
              },
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

        const recipientResponse = await axios(createRecipient)

        await session.executeWrite((tx) =>
          tx.run(setBacentaRecipientCode, {
            bacentaId: bacenta.id,
            vehicleRecordId: vehicleRecord.id,
            recipientCode: recipientResponse.data.data.recipient_code,
          })
        )

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
          reason: `${bacenta.name} Bacenta bussed ${
            vehicleRecord.attendance
          } on ${getHumanReadableDate(new Date().toISOString())}`,
          amount: vehicleRecord.vehicleTopUp * 100,
          currency: 'GHS',
          recipient: recipient.recipientCode,
        },
      }

      const res = await axios(sendVehicleSupport)

      const responseData = res.data.data

      await session.executeWrite((tx) =>
        tx.run(setVehicleRecordTransactionSuccessful, {
          ...args,
          transactionReference: responseData.reference,
          transferCode: responseData.transfer_code,
          responseStatus: responseData.status,
        })
      )

      console.log('Money Sent Successfully to', vehicleRecord.momoName)

      return vehicleRecord
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? String(error)
      throwToSentry(`Money could not be sent! ${message}`, error)
    } finally {
      await session.close()
    }

    return null
  },
  SetSwellDate: async (object: any, args: any, context: Context) => {
    isAuth(permitAdminArrivals('Campus'), context.jwt?.roles)

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
    isAuth(['leaderBacenta'], context.jwt?.roles)

    const response = await sendBulkSMS(
      [args.phoneNumber],
      `Hi ${args.firstName},\n\nYour OTP is ${args.otp}. Input this on the portal to verify your phone number.`
    )

    return response
  },
}

const getArrivalsPaymentData = async (
  object: any,
  args: { arrivalsDate: string; limit: number; offset: number },
  context: Context
) => {
  isAuth(permitAdminArrivals('Stream'), context.jwt?.roles)

  const session = context.executionContext.session()

  const cypherResponse = rearrangeCypherObject(
    await session.run(getArrivalsPaymentDataCypher, {
      streamId: object.id,
      date: args.arrivalsDate,
      limit: int(args.limit),
      offset: int(args.offset),
    }),
    true
  )

  return cypherResponse
}

const getArrivalsPaymentCount = async (
  object: any,
  args: { arrivalsDate: string },
  context: Context
) => {
  isAuth(permitAdminArrivals('Stream'), context.jwt?.roles)

  const session = context.executionContext.session()

  const result = await session.run(getArrivalsPaymentCountCypher, {
    streamId: object.id,
    date: args.arrivalsDate,
  })

  return result.records[0]?.get('total')?.toNumber?.() ?? 0
}

export const arrivalsResolvers = {
  Stream: {
    arrivalsPaymentData: async (
      object: any,
      args: { arrivalsDate: string; limit: number; offset: number },
      context: Context
    ) => getArrivalsPaymentData(object, args, context),
    arrivalsPaymentCount: async (
      object: any,
      args: { arrivalsDate: string },
      context: Context
    ) => getArrivalsPaymentCount(object, args, context),
  },
}
