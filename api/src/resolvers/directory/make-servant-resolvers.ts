import axios from 'axios'
import { Context } from '../utils/neo4j-types'
import { Member, Role } from '../utils/types'
import { permitAdmin, permitAdminArrivals } from '../permissions'
import { MakeServant, RemoveServant } from './make-remove-servants'
import { removeRoles } from './helper-functions'
import { getAuth0Roles, getAuthToken } from '../authenticate'
import { matchMemberFromAuthId } from '../cypher/resolver-cypher'
import { Auth0RoleObject, getUserRoles } from '../utils/auth0'

const MakeServantResolvers = {
  RemoveRoleFromMember: async (
    object: any,
    args: { role: Role },
    context: Context
  ) => {
    const session = context.executionContext.session()

    try {
      const authToken = await getAuthToken()
      const authRoles = await getAuth0Roles(authToken)

      const servantRes = await session.executeRead((tx) =>
        tx.run(matchMemberFromAuthId, {
          jwt: context.jwt,
        })
      )
      const userRoleResponse = await axios(
        getUserRoles(context.jwt.sub, authToken)
      )
      const roles: Role[] = userRoleResponse.data.map(
        (role: Auth0RoleObject) => role.name
      )

      const servant = servantRes.records[0].get('member').properties

      await removeRoles(servant, roles, authRoles[args.role].id, authToken)

      return true
    } catch (err) {
      console.log(err)
    }

    return false
  },
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
  MakeGovernorshipAdmin: async (object: any, args: Member, context: Context) =>
    MakeServant(context, args, permitAdmin('Council'), 'Governorship', 'Admin'),
  RemoveGovernorshipAdmin: async (
    object: any,
    args: Member,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      permitAdmin('Council'),
      'Governorship',
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
  MakeGovernorshipLeader: async (object: any, args: Member, context: Context) =>
    MakeServant(
      context,
      args,
      permitAdmin('Council'),
      'Governorship',
      'Leader'
    ),
  RemoveGovernorshipLeader: async (
    object: any,
    args: Member,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      permitAdmin('Council'),
      'Governorship',
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
