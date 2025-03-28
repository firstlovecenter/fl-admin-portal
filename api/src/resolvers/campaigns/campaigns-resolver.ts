import { permitAdmin, permitLeader } from '../permissions'
import { Context } from '../utils/neo4j-types'
import { ChurchLevel, Role } from '../utils/types'
import { getEquipmentDetails } from './equipment/equipment-campaign-resolvers'

const churchCampaigns = async (context: Context, church: ChurchLevel) => {
  let campaignsList: string[] = []
  switch (church) {
    case 'Oversight':
    case 'Campus':
    case 'Stream':
      campaignsList = [
        'Equipment',
        'Anti-Brutish',
        'Multiplication',
        'Swollen Sunday',
        'Shepherding Control',
      ]
      break
    case 'Council':
    case 'Governorship':
      campaignsList = [
        'Equipment',
        'Anti-Brutish',
        'Multiplication',
        'Swollen Sunday',
        'Shepherding Control',
      ]
      break
    case 'Bacenta':
      campaignsList = ['Equipment', 'Swollen Sunday', 'Shepherding Control']
      break
    case 'Fellowship':
      campaignsList = ['Equipment']
      break

    default:
      campaignsList = []
  }
  const userRoles: Role[] = context.jwt['https://flcadmin.netlify.app/roles']
  const permittedRoles: Role[] = ['sheepseekerStream']
  permittedRoles.push(...permitAdmin('Stream'))
  permittedRoles.push(...permitLeader('Stream'))

  const permittedChurches: ChurchLevel[] = ['Campus', 'Stream']

  if (
    permittedRoles.some((r) => userRoles.includes(r)) &&
    permittedChurches.includes(church)
  ) {
    campaignsList.push('Sheep Seeking')
  }

  return campaignsList
}

const campaignsResolvers = {
  Oversight: {
    campaigns: async (obj: any, args: any, context: Context) =>
      churchCampaigns(context, 'Oversight'),
  },
  Campus: {
    campaigns: async (obj: any, args: any, context: Context) =>
      churchCampaigns(context, 'Campus'),
    equipmentRecord: (obj: any, args: any, context: Context) =>
      getEquipmentDetails(obj, args, context, 'Campus'),
  },
  Stream: {
    campaigns: async (obj: any, args: any, context: Context) =>
      churchCampaigns(context, 'Stream'),
    equipmentRecord: (obj: any, args: any, context: Context) =>
      getEquipmentDetails(obj, args, context, 'Stream'),
  },
  Council: {
    campaigns: async (obj: any, args: any, context: Context) =>
      churchCampaigns(context, 'Council'),
    equipmentRecord: (obj: any, args: any, context: Context) =>
      getEquipmentDetails(obj, args, context, 'Council'),
  },
  Governorship: {
    campaigns: async (obj: any, args: any, context: Context) =>
      churchCampaigns(context, 'Governorship'),
    equipmentRecord: (obj: any, args: any, context: Context) =>
      getEquipmentDetails(obj, args, context, 'Governorship'),
  },
  Bacenta: {
    campaigns: async (obj: any, args: any, context: Context) =>
      churchCampaigns(context, 'Bacenta'),
  },
  Fellowship: {
    campaigns: async (obj: any, args: any, context: Context) =>
      churchCampaigns(context, 'Fellowship'),
  },
}

export default campaignsResolvers
