/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-underscore-dangle */
// @ts-nocheck
import { Context } from '../../utils/neo4j-types'
import { sendBulkEmail, sendBulkSMS } from '../../utils/notify'
import {
  checkExistingEquipmentRecord,
  createGovernorshipEquipmentRecord,
  createFellowshipEquipmentRecord,
  getGovernorshipOverseersEmailsAndNumbers,
  getEquipmentCampaign,
  getEquipmentCampaignDate,
  getFellowshipLeadersEmailsAndNumbers,
  SetEquipmentDeadline,
} from './equipment-campaign-cypher'
import texts from '../../texts.json'
import { isAuth, rearrangeCypherObject, throwToSentry } from '../../utils/utils'
import { permitAdmin, permitLeaderAdmin } from '../../permissions'
import { ChurchLevel } from '../../utils/types'

const campaignsCypher = require('./equipment-campaign-cypher')

type Record = { keys: number[]; _fields: never[] }

const sendEmailsandSMS = async (
  args: { startDate: Date; endDate: Date; id: string; target: number },
  context: Context
) => {
  const session = context.executionContext.session()

  const overseersPhoneNumbers: string[] = []
  const overseersEmailAdresses: string[] = []
  const fellowshipPhoneNumbers: string[] = []
  const fellowshipEmailAdresses: string[] = []

  const governorshipLeadersResponse = await session.run(
    getGovernorshipOverseersEmailsAndNumbers,
    args
  )

  const fellowshipLeadersResponse = await session.run(
    getFellowshipLeadersEmailsAndNumbers,
    args
  )

  governorshipLeadersResponse.records.forEach((record: Record) => {
    overseersPhoneNumbers.push(record._fields[2])
    overseersEmailAdresses.push(record._fields[1])
  })

  fellowshipLeadersResponse.records.forEach((record) => {
    fellowshipPhoneNumbers.push(record._fields[2])
    fellowshipEmailAdresses.push(record._fields[1])
  })

  const equipmentDeadline = new Date(args.endDate)
  const formattedDeadline = equipmentDeadline.toLocaleString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  await Promise.all([
    sendBulkSMS(
      fellowshipPhoneNumbers,
      texts.equipment.notify_fellowship_leaders_sms
    ),
    sendBulkSMS(
      overseersPhoneNumbers,
      texts.equipment.notify_governorship_overseers_sms
    ),
    sendBulkEmail(
      overseersEmailAdresses,
      'Equipment Campaign Data Collection Ongoing!',
      undefined,
      `<p>Hi ${texts.equipment.overseer_text},</p> ${texts.equipment.notify_governorship_overseers_email} <b>${formattedDeadline}</b> ${texts.equipment.notify_email_p1} ${texts.equipment.overseer_text}  ${texts.equipment.notify_email_p2}${texts.html.subscription}`
    ),
    sendBulkEmail(
      fellowshipEmailAdresses,
      'Equipment Campaign Data Collection Ongoing!',
      undefined,
      `<p>Hi ${texts.equipment.fellowship_text},</p> ${texts.equipment.notify_fellowship_leaders_email} <b>${formattedDeadline}</b> ${texts.equipment.notify_email_p1} ${texts.equipment.fellowship_text}  ${texts.equipment.notify_email_p2}${texts.html.subscription}`
    ),
  ]).catch((error) => {
    throwToSentry(
      'There was an error sending the equipment notifications',
      error
    )
  })
}

export const equipmentCampaignMutations = {
  // Equipment Campaigns
  SetEquipmentDeadline: async (
    object: never,
    args: { startDate: Date; endDate: Date; id: string; target: number },
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(
      permitAdmin('Campus'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    try {
      const equipmentCampaign = rearrangeCypherObject(
        await session.run(getEquipmentCampaignDate, args)
      )

      const startDate = new Date(equipmentCampaign.campaign?.equipmentStartDate)
      const newStartDate = new Date(args.startDate)

      const setEquipmentDuration = rearrangeCypherObject(
        await session.run(SetEquipmentDeadline, args)
      )

      if (
        typeof equipmentCampaign.campaign === 'undefined' ||
        !(newStartDate.getTime() === startDate.getTime())
      ) {
        sendEmailsandSMS(args, context)
      }

      return {
        id: setEquipmentDuration.campus.properties.id,
        name: setEquipmentDuration.campus.properties.name,
        equipmentStartDate:
          setEquipmentDuration.campus.properties.equipmentStartDate,
        equipmentEndDate:
          setEquipmentDuration.campus.properties.equipmentEndDate,
      }
    } catch (error: any) {
      return throwToSentry('Setting equipment deadline failed ', error)
    }
  },
  CreateGovernorshipEquipmentRecord: async (
    object: never,
    args: { id: string; pulpits: number; date: Date },
    context: Context
  ) => {
    isAuth(
      permitLeaderAdmin('Governorship'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()

    try {
      const equipmentCampaign = rearrangeCypherObject(
        await session.run(getEquipmentCampaign, { ...args })
      )

      if (typeof equipmentCampaign.campaign === 'undefined') {
        throw new Error(
          'You cannot fill your forms now because an equipment date has not been set'
        )
      }

      const currentDate = new Date()
      const startDate = new Date(equipmentCampaign.campaign.equipmentStartDate)
      const endDate = new Date(equipmentCampaign.campaign.equipmentEndDate)
      endDate.setDate(endDate.getDate() + 1)

      if (currentDate < startDate || currentDate > endDate) {
        throw new Error('Equipment Deadline is up')
      }

      const date = equipmentCampaign.campaign.equipmentDate

      const equipmentRecordExists = rearrangeCypherObject(
        await session.run(checkExistingEquipmentRecord, {
          id: args.id,
          date,
        })
      )

      if (equipmentRecordExists.alreadyFilled) {
        throw new Error(
          'You have already filled your governorship equipment form!'
        )
      }

      const governorshipRecord = rearrangeCypherObject(
        await session
          .run(createGovernorshipEquipmentRecord, {
            ...args,
            auth: context.auth,
            date,
          })
          .catch((error: any) => {
            return throwToSentry(
              'There was an error creating the governorship record',
              error
            )
          })
      )

      return {
        id: args.id,
        equipmentRecord: {
          id: governorshipRecord.record.properties.id,
          pulpits: governorshipRecord.record.properties.pulpits,
        },
      }
    } catch (error) {
      return throwToSentry(
        'Creating Governorship Equipment Record failed ',
        error
      )
    }
  },
  CreateFellowshipEquipmentRecord: async (
    object: never,
    args: { id: string; offeringBags: number; date: Date },
    context: Context
  ) => {
    isAuth(
      permitLeaderAdmin('Fellowship'),
      context.jwt['https://flcadmin.netlify.app/roles']
    )

    const session = context.executionContext.session()

    try {
      const equipmentCampaign = rearrangeCypherObject(
        await session.run(getEquipmentCampaign, { ...args })
      )

      if (typeof equipmentCampaign.campaign === 'undefined') {
        throw new Error(
          'You cannot fill your forms now because an equipment date has not been set'
        )
      }

      const currentDate = new Date()
      const startDate = new Date(equipmentCampaign.campaign.equipmentStartDate)
      const endDate = new Date(equipmentCampaign.campaign.equipmentEndDate)
      endDate.setDate(endDate.getDate() + 1)

      if (currentDate < startDate || currentDate > endDate) {
        throw new Error('Equipment Deadline is up')
      }

      const date = equipmentCampaign.campaign.equipmentDate

      const equipmentRecordExists = rearrangeCypherObject(
        await session.run(checkExistingEquipmentRecord, {
          id: args.id,
          date,
        })
      )

      if (equipmentRecordExists.alreadyFilled) {
        throw new Error(
          'You have already filled your fellowship equipment form!'
        )
      }

      const fellowshipRecord = rearrangeCypherObject(
        await session
          .run(createFellowshipEquipmentRecord, {
            ...args,
            auth: context.auth,
            date,
          })
          .catch((error: any) => {
            return throwToSentry(
              'There was an error creating fellowship equipment record',
              error
            )
          })
      )

      return {
        id: args.id,
        equipmentRecord: {
          id: fellowshipRecord.record.properties.id,
          offeringBags: fellowshipRecord.record.properties.offeringBags,
          bluetoothSpeakers:
            fellowshipRecord.record.properties.bluetoothSpeakers,
        },
      }
    } catch (error) {
      return throwToSentry(
        'Creating Fellowship Equipment Record failed ',
        error
      )
    }
  },
}

export const getEquipmentDetails = async (
  obj: any,
  args: any,
  context: Context,
  church: ChurchLevel
) => {
  const session = context.executionContext.session()
  const fellowshipEquipmentResponse = await session?.run(
    campaignsCypher[`${church}FellowshipEquipment`],
    { ...obj, ...args }
  )

  const governorshipEquipmentResponse = await session?.run(
    campaignsCypher[`${church}GovernorshipEquipment`],
    { ...obj, ...args }
  )

  let id
  let pulpits
  if (typeof governorshipEquipmentResponse.records[0] !== 'undefined') {
    // eslint-disable-next-line no-underscore-dangle
    id = governorshipEquipmentResponse.records[0]._fields[0].id
    // eslint-disable-next-line no-underscore-dangle
    pulpits = governorshipEquipmentResponse.records[0]._fields[0].pulpits.low
  } else {
    id = obj?.id
  }

  const bluetoothSpeakers =
    // eslint-disable-next-line no-underscore-dangle
    fellowshipEquipmentResponse.records[0]._fields[0].bluetoothSpeakers.low
  const offeringBags =
    // eslint-disable-next-line no-underscore-dangle
    fellowshipEquipmentResponse.records[0]._fields[0].offeringBags.low

  switch (church) {
    case 'Governorship':
      return { id, pulpits, bluetoothSpeakers, offeringBags }

    default:
      return { pulpits, bluetoothSpeakers, offeringBags }
  }
}
