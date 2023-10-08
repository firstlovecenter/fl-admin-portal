import { Context } from '../utils/neo4j-types'
import { Member } from '../utils/types'
import { permitAdmin, permitAdminArrivals } from '../permissions'
import { MakeServant, RemoveServant } from './make-remove-servants'

const MakeServantResolvers = {
  // Administrative Mutations
  MakeOversightAdmin: async (object: any, args: Member, context: Context) =>
    MakeServant(
      context,
      args,
      permitAdmin('Denomination'),
      'Oversight',
      'Admin'
    ),
  RemoveOversightAdmin: async (object: any, args: Member, context: Context) =>
    RemoveServant(
      context,
      args,
      permitAdmin('Denomination'),
      'Oversight',
      'Admin'
    ),
  MakeCampusAdmin: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Oversight'), 'Campus', 'Admin'),
  RemoveCampusAdmin: async (object: any, args: Member, context: Context) =>
    RemoveServant(context, args, permitAdmin('Oversight'), 'Campus', 'Admin'),
  MakeStreamAdmin: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Campus'), 'Stream', 'Admin'),
  RemoveStreamAdmin: async (object: any, args: Member, context: Context) =>
    RemoveServant(context, args, permitAdmin('Campus'), 'Stream', 'Admin'),
  MakeCouncilAdmin: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Stream'), 'Council', 'Admin'),
  RemoveCouncilAdmin: async (object: any, args: Member, context: Context) =>
    RemoveServant(context, args, permitAdmin('Stream'), 'Council', 'Admin'),
  MakeConstituencyAdmin: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Council'), 'Constituency', 'Admin'),
  RemoveConstituencyAdmin: async (
    object: any,
    args: Member,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      permitAdmin('Council'),
      'Constituency',
      'Admin'
    ),
  MakeCreativeArtsAdmin: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Campus'), 'CreativeArts', 'Admin'),
  RemoveCreativeArtsAdmin: async (
    object: any,
    args: Member,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      permitAdmin('Campus'),
      'CreativeArts',
      'Admin'
    ),
  MakeMinistryAdmin: async (object: any, args: Member, context: Context) =>
    MakeServant(
      context,
      args,
      permitAdmin('CreativeArts'),
      'Ministry',
      'Admin'
    ),
  RemoveMinistryAdmin: async (object: any, args: Member, context: Context) =>
    RemoveServant(
      context,
      args,
      permitAdmin('CreativeArts'),
      'Ministry',
      'Admin'
    ),

  // Pastoral Mutations
  MakeFellowshipLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Bacenta'), 'Fellowship', 'Leader'),
  RemoveFellowshipLeader: async (object: any, args: Member, context: Context) =>
    RemoveServant(
      context,
      args,
      permitAdmin('Bacenta'),
      'Fellowship',
      'Leader'
    ),
  MakeBacentaLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(
      context,
      args,
      permitAdminArrivals('Fellowship'),
      'Bacenta',
      'Leader'
    ),
  RemoveBacentaLeader: async (object: any, args: Member, context: Context) =>
    RemoveServant(
      context,
      args,
      permitAdminArrivals('Fellowship'),
      'Bacenta',
      'Leader'
    ),
  MakeConstituencyLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(
      context,
      args,
      permitAdmin('Council'),
      'Constituency',
      'Leader'
    ),
  RemoveConstituencyLeader: async (
    object: any,
    args: Member,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      permitAdmin('Council'),
      'Constituency',
      'Leader'
    ),
  MakeCouncilLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Stream'), 'Council', 'Leader'),
  RemoveCouncilLeader: async (object: any, args: Member, context: Context) =>
    RemoveServant(context, args, permitAdmin('Stream'), 'Council', 'Leader'),
  MakeStreamLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Campus'), 'Stream', 'Leader'),
  RemoveStreamLeader: async (object: any, args: Member, context: Context) =>
    RemoveServant(context, args, permitAdmin('Campus'), 'Stream', 'Leader'),
  MakeCampusLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Oversight'), 'Campus', 'Leader'),
  RemoveCampusLeader: async (object: any, args: Member, context: Context) =>
    RemoveServant(context, args, permitAdmin('Oversight'), 'Campus', 'Leader'),
  MakeOversightLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(
      context,
      args,
      permitAdmin('Denomination'),
      'Oversight',
      'Leader'
    ),
  RemoveOversightLeader: async (object: any, args: Member, context: Context) =>
    RemoveServant(
      context,
      args,
      permitAdmin('Denomination'),
      'Oversight',
      'Leader'
    ),
  MakeDenominationLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, ['fishers'], 'Denomination', 'Leader'),
  RemoveDenominationLeader: async (
    object: any,
    args: Member,
    context: Context
  ) => RemoveServant(context, args, ['fishers'], 'Denomination', 'Leader'),
  MakeCreativeArtsLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Campus'), 'CreativeArts', 'Leader'),
  RemoveCreativeArtsLeader: async (
    object: any,
    args: Member,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      permitAdmin('Campus'),
      'CreativeArts',
      'Leader'
    ),
  MakeMinistryLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(
      context,
      args,
      permitAdmin('CreativeArts'),
      'Ministry',
      'Leader'
    ),
  RemoveMinistryLeader: async (object: any, args: Member, context: Context) =>
    RemoveServant(
      context,
      args,
      permitAdmin('CreativeArts'),
      'Ministry',
      'Leader'
    ),
  MakeHubCouncilLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(
      context,
      args,
      [...permitAdmin('Ministry'), ...permitAdmin('Council')],
      'HubCouncil',
      'Leader'
    ),
  RemoveHubCouncilLeader: async (object: any, args: Member, context: Context) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Ministry'), ...permitAdmin('Council')],
      'HubCouncil',
      'Leader'
    ),
  MakeHubLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(
      context,
      args,
      [...permitAdmin('Ministry'), ...permitAdmin('Council')],
      'Hub',
      'Leader'
    ),
  RemoveHubLeader: async (object: any, args: Member, context: Context) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Ministry'), ...permitAdmin('Council')],
      'Hub',
      'Leader'
    ),
}

export default MakeServantResolvers
