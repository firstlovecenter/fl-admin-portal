/**
 * Servant Resolver Configuration
 * This is the SOURCE OF TRUTH for all servant mutations.
 * Adding a new mutation? Add one line here. That's it.
 */

import { ChurchLevel, Role, ServantType } from '../utils/types'

export type ServantMutationConfig = {
  name: string // e.g., "MakeOversightAdmin"
  churchType: ChurchLevel
  servantType: ServantType
  requiredPermissionLevel: ChurchLevel // Which level must you admin to make this change?
  action: 'make' | 'remove'
}

/**
 * All servant mutations, declaratively.
 * Format: {name, churchType, servantType, requiredPermissionLevel, action}
 * The factory generates the actual resolvers from this.
 */
export const SERVANT_MUTATIONS: ServantMutationConfig[] = [
  // ADMINISTRATIVE MUTATIONS
  {
   
   
   
   
   ,
 
   
    name: 'MakeOversightAdmin',
   
   
   
   ,
 
   
    churchType: 'Oversight',
   
   
   
   ,
 
   
    servantType: 'Admin',
   
   
   
   ,
 
   
    requiredPermissionLevel:
    'Denomination',
   
   
   ,
 
   
    action: 'make',
   
   
   
   ,
 
  }
,   
   
   
   
   ,
 
  {
   
   
   
   
   ,
 
   
    name: 'RemoveOversightAdmin',
   
   
   
   ,
 
   
    churchType: 'Oversight',
   
   
   
   ,
 
   
    servantType: 'Admin',
   
   
   
   ,
 
   
    requiredPermissionLevel: 'Denomi
n   ation',
   
   
   ,
 
   
    action: 'remove',
   
   
   
   ,
 
  }
,   
   
   
   
   ,
 
  {
    name: 'MakeCampusAdmin',
   
    churchType: 'Campus',
   
   
   
   ,
 
   
    servantType: 'Admin',
   
   
   
   ,
 
   
    requiredPermissionLevel: '
O   versight',
   
   
   ,
 
   
    action: 'make',
   
   
   
   ,
 
  }
,   
   
   
   
   ,
 
  {
   
   
   
   
   ,
 
   
    name: 'RemoveCampusAdmin',
   
   
   
   ,
 
   
    churchType: 'Campus',
   
   
   
   ,
 
   
    servantType: 'Admin',
   
   
   
   ,
 
   
    requiredPermissionLevel: 'O
   versight',
   
   
   ,
 
   
    action: 'remove',
   
   
   
   ,
 
  }
   ,
   
   
   
   ,
 
  {
   
   
   
   
   ,
 
   
    name: 'MakeStreamAdmin',
   
   
   
   ,
 
   
    churchType: 'Stream',
   
   
   
   ,
 
   
    servantType: 'Admin',
   
   
   
   ,
 
   
    requiredPermissionLevel: 'Campu
   s',
   
   
   ,
 
   
    action: 'make',
   
   
   
   ,
 
  }
   ,
   
   
   
   ,
 
  {
   
   
   
   
   ,
 
   
    name: 'RemoveStreamAdmin',
   
   
   
   ,
 
   
    churchType: 'Stream',
   
   
   
   ,
 
   
    servantType: 'Admin',
   
   
   
   ,
 
   
    requiredPermissionLevel:
    'Campus',
   
   
   ,
 
    action: 'remove',
  },
  {
    name: 'MakeCouncilAdmin',
    churchType: 'Council',
    servantType: 'Admin',
    requiredPermissionLevel: 'Stream',
    action: 'make',
  },
  {
    name: 'RemoveCouncilAdmin',
    churchType: 'Council',
    servantType: 'Admin',
    requiredPermissionLevel: 'Stream',
    action: 'remove',
  },
  {
    name: 'MakeGovernorshipAdmin',
    churchType: 'Governorship',
    servantType: 'Admin',
    requiredPermissionLevel: 'Council',
    action: 'make',
  },
  {
    name: 'RemoveGovernorshipAdmin',
    churchType: 'Governorship',
    servantType: 'Admin',
    requiredPermissionLevel: 'Council',
    action: 'remove',
  },
  {
    name: 'MakeCreativeArtsAdmin',
    churchType: 'CreativeArts',
    servantType: 'Admin',
    requiredPermissionLevel: 'Campus',
    action: 'make',
  },
  {
    name: 'RemoveCreativeArtsAdmin',
    churchType: 'CreativeArts',
    servantType: 'Admin',
    requiredPermissionLevel: 'Campus',
    action: 'remove',
  },
  {
    name: 'MakeMinistryAdmin',
    churchType: 'Ministry',
    servantType: 'Admin',
    requiredPermissionLevel: 'CreativeArts',
    action: 'make',
  },
  {
    name: 'RemoveMinistryAdmin',
    churchType: 'Ministry',
    servantType: 'Admin',
    requiredPermissionLevel: 'CreativeArts',
    action: 'remove',
  },

  // PASTORAL MUTATIONS
  {
    name: 'MakeFellowshipLeader',
    churchType: 'Fellowship',
    servantType: 'Leader',
    requiredPermissionLevel: 'Bacenta',
    action: 'make',
  },
  {
    name: 'RemoveFellowshipLeader',
    churchType: 'Fellowship',
    servantType: 'Leader',
    requiredPermissionLevel: 'Bacenta',
    action: 'remove',
  },
  {
    name: 'MakeBacentaLeader',
    churchType: 'Bacenta',
    servantType: 'Leader',
    requiredPermissionLevel: 'Fellowship',
    action: 'make',
  },
  {
    name: 'RemoveBacentaLeader',
    churchType: 'Bacenta',
    servantType: 'Leader',
    requiredPermissionLevel: 'Fellowship',
    action: 'remove',
  },
  {
    name: 'MakeGovernorshipLeader',
    churchType: 'Governorship',
    servantType: 'Leader',
    requiredPermissionLevel: 'Council',
    action: 'make',
  },
  {
    name: 'RemoveGovernorshipLeader',
    churchType: 'Governorship',
    servantType: 'Leader',
    requiredPermissionLevel: 'Council',
    action: 'remove',
  },
  {
    name: 'MakeCouncilLeader',
    churchType: 'Council',
    servantType: 'Leader',
    requiredPermissionLevel: 'Stream',
    action: 'make',
  },
  {
    name: 'RemoveCouncilLeader',
    churchType: 'Council',
    servantType: 'Leader',
    requiredPermissionLevel: 'Stream',
    action: 'remove',
  },
  {
    name: 'MakeStreamLeader',
    churchType: 'Stream',
    servantType: 'Leader',
    requiredPermissionLevel: 'Campus',
    action: 'make',
  },
  {
    name: 'RemoveStreamLeader',
    churchType: 'Stream',
    servantType: 'Leader',
    requiredPermissionLevel: 'Campus',
    action: 'remove',
  },
  {
    name: 'MakeCampusLeader',
    churchType: 'Campus',
    servantType: 'Leader',
    requiredPermissionLevel: 'Oversight',
    action: 'make',
  },
  {
    name: 'RemoveCampusLeader',
    churchType: 'Campus',
    servantType: 'Leader',
    requiredPermissionLevel: 'Oversight',
    action: 'remove',
  },
  {
    name: 'MakeOversightLeader',
    churchType: 'Oversight',
    servantType: 'Leader',
    requiredPermissionLevel: 'Denomination',
    action: 'make',
  },
  {
    name: 'RemoveOversightLeader',
    churchType: 'Oversight',
    servantType: 'Leader',
    requiredPermissionLevel: 'Denomination',
    action: 'remove',
  },
  {
    name: 'MakeDenominationLeader',
    churchType: 'Denomination',
    servantType: 'Leader',
    requiredPermissionLevel: 'Denomination',
    action: 'make',
  },
  {
    name: 'RemoveDenominationLeader',
    churchType: 'Denomination',
    servantType: 'Leader',
    requiredPermissionLevel: 'Denomination',
    action: 'remove',
  },
  {
    name: 'MakeCreativeArtsLeader',
    churchType: 'CreativeArts',
    servantType: 'Leader',
    requiredPermissionLevel: 'Campus',
    action: 'make',
  },
  {
    name: 'RemoveCreativeArtsLeader',
    churchType: 'CreativeArts',
    servantType: 'Leader',
    requiredPermissionLevel: 'Campus',
    action: 'remove',
  },
  {
    name: 'MakeMinistryLeader',
    churchType: 'Ministry',
    servantType: 'Leader',
    requiredPermissionLevel: 'CreativeArts',
    action: 'make',
  },
  {
    name: 'RemoveMinistryLeader',
    churchType: 'Ministry',
    servantType: 'Leader',
    requiredPermissionLevel: 'CreativeArts',
    action: 'remove',
  },
  {
    name: 'MakeHubCouncilLeader',
    churchType: 'HubCouncil',
    servantType: 'Leader',
    requiredPermissionLevel: 'Ministry',
    action: 'make',
  },
  {
    name: 'RemoveHubCouncilLeader',
    churchType: 'HubCouncil',
    servantType: 'Leader',
    requiredPermissionLevel: 'Ministry',
    action: 'remove',
  },
  {
    name: 'MakeHubLeader',
    churchType: 'Hub',
    servantType: 'Leader',
    requiredPermissionLevel: 'Ministry',
    action: 'make',
  },
  {
    name: 'RemoveHubLeader',
    churchType: 'Hub',
    servantType: 'Leader',
    requiredPermissionLevel: 'Ministry',
    action: 'remove',
  },
]

/**
 * Permission rules: which roles can make which mutations?
 * Key insight: Use permitAdmin(level) which already knows the hierarchy
 */
export const getPermittedRoles = (churchLevel: ChurchLevel): string[] => {
  // This delegates to existing permitAdmin logic
  // No need to reinvent the wheel—reuse what works
  return [`admin${churchLevel}`]
}
