import { permitAdmin } from '../permissions'

import {
  checkExistingEquipmentRecord,
  createConstituencyEquipmentRecord,
  createFellowshipEquipmentRecord,
  SetEquipmentDeadline,
  getEquipmentCampaign,
} from './campaigns-cypher'

import { isAuth, rearrangeCypherObject, throwErrorMsg } from '../utils/utils'
import { Context } from '../utils/neo4j-types'
import { ChurchLevel } from '../utils/types'

export const campaignsMutation = {
  // Equipment Campaigns
  SetEquipmentDeadline: async (
    object: never,
    args: { startDate: Date; endDate: Date; id: string; target: number },
    context: Context
  ) => {
    const session = context.executionContext.session()
    isAuth(permitAdmin('GatheringService'), context.auth.roles)

    try {
      const setEquipmentDuration = rearrangeCypherObject(
        await session.run(SetEquipmentDeadline, args)
      )

      return {
        id: setEquipmentDuration.gatheringService.properties.id,
        name: setEquipmentDuration.gatheringService.properties.name,
        equipmentStartDate:
          setEquipmentDuration.gatheringService.properties.equipmentStartDate,
        equipmentEndDate:
          setEquipmentDuration.gatheringService.properties.equipmentEndDate,
      }
    } catch (error: any) {
      return throwErrorMsg('Setting equipment deadline failed ', error)
    }
  },
  CreateConstituencyEquipmentRecord: async (
    object: never,
    args: { id: string; pulpits: number; date: Date },
    context: Context
  ) => {
    isAuth(permitAdmin('Constituency'), context.auth.roles)

    const session = context.executionContext.session()

    try {
      const equipmentCampaign = rearrangeCypherObject(
        await session.run(getEquipmentCampaign, { ...args })
      )

      const currentDate = new Date(args.date)
      const startDate = new Date(equipmentCampaign.campaign.equipmentStartDate)
      const endDate = new Date(equipmentCampaign.campaign.equipmentEndDate)

      if (currentDate >= startDate && currentDate <= endDate) {
        const date = equipmentCampaign.campaign.equipmentDate

        const equipmentRecordExists = rearrangeCypherObject(
          await session.run(checkExistingEquipmentRecord, {
            id: args.id,
            pulpits: args.pulpits,
            date,
          })
        )

        if (Object.keys(equipmentRecordExists).length !== 0) {
          throwErrorMsg(
            'You have already filled your constituency equipment form!'
          )
        }

        const constituencyRecord = rearrangeCypherObject(
          await session.run(createConstituencyEquipmentRecord, {
            ...args,
            auth: context.auth,
            date,
          })
        )

        return {
          id: constituencyRecord.record.properties.id,
          pulpits: constituencyRecord.record.properties.pulpits,
        }
      }
      return throwErrorMsg('Equipment Deadline is up')
    } catch (error) {
      return throwErrorMsg(
        'Creating Constituency Equipment Record failed ',
        error
      )
    }
  },
  CreateFellowshipEquipmentRecord: async (
    object: never,
    args: { id: string; offeringBags: number; date: Date },
    context: Context
  ) => {
    isAuth(permitAdmin('Fellowship'), context.auth.roles)

    const session = context.executionContext.session()

    try {
      const equipmentCampaign = rearrangeCypherObject(
        await session.run(getEquipmentCampaign, { ...args })
      )

      const currentDate = new Date(args.date)
      const startDate = new Date(equipmentCampaign.campaign.equipmentStartDate)
      const endDate = new Date(equipmentCampaign.campaign.equipmentEndDate)

      if (currentDate >= startDate && currentDate <= endDate) {
        const date = equipmentCampaign.campaign.equipmentDate

        const equipmentRecordExists = rearrangeCypherObject(
          await session.run(checkExistingEquipmentRecord, {
            id: args.id,
            offeringBags: args.offeringBags,
            date,
          })
        )

        if (Object.keys(equipmentRecordExists).length !== 0) {
          throwErrorMsg(
            'You have already filled your fellowship equipment form!'
          )
        }

        const fellowshipRecord = rearrangeCypherObject(
          await session.run(createFellowshipEquipmentRecord, {
            ...args,
            auth: context.auth,
            date,
          })
        )

        return {
          id: fellowshipRecord.record.properties.id,
          offeringBags: fellowshipRecord.record.properties.offeringBags,
        }
      }
      return throwErrorMsg('Equipment Deadline is up')
    } catch (error) {
      return throwErrorMsg(
        'Creating Fellowship Equipment Record failed ',
        error
      )
    }
  },
}

const churchCampaigns = async (church: ChurchLevel) => {
  switch (church) {
    case 'Oversight':
    case 'GatheringService':
    case 'Stream':
    case 'Council':
    case 'Constituency':
    case 'Bacenta':
    case 'Fellowship':
      return ['Equipment']

    default:
      return []
  }
}

export const campaignsResolvers = {
  Oversight: {
    campaigns: async () => churchCampaigns('Oversight'),
  },
  GatheringService: {
    campaigns: async () => churchCampaigns('GatheringService'),
  },
  Stream: {
    campaigns: async () => churchCampaigns('Stream'),
  },
  Council: {
    campaigns: async () => churchCampaigns('Council'),
  },
  Constituency: {
    campaigns: async () => churchCampaigns('Constituency'),
  },
  Bacenta: {
    campaigns: async () => churchCampaigns('Bacenta'),
  },
  Fellowship: {
    campaigns: async () => churchCampaigns('Fellowship'),
  },
}
