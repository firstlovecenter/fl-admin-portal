import { Context } from '../utils/neo4j-types'
import { isAuth, rearrangeCypherObject, throwToSentry } from '../utils/utils'
import { permitAdmin } from '../permissions'
import { ChurchLevel, Role } from '../utils/types'

interface AddAdminArgs {
  adminId: string
  [key: string]: string // Allow dynamic church ID properties
}

interface RemoveAdminArgs {
  adminId: string
  [key: string]: string // Allow dynamic church ID properties
}

const getChurchIdParam = (churchType: ChurchLevel): string => {
  return `${churchType.toLowerCase()}Id`
}

const getPermittedRoles = (churchType: ChurchLevel): Role[] => {
  // Map church types to their parent level for permissions
  const permissionMap: Partial<Record<ChurchLevel, ChurchLevel>> = {
    Governorship: 'Council',
    Council: 'Stream',
    Stream: 'Campus',
    Campus: 'Oversight',
    Oversight: 'Denomination',
    Bacenta: 'Governorship',
    Ministry: 'CreativeArts',
    CreativeArts: 'Campus',
  }

  const parentLevel = permissionMap[churchType]
  if (!parentLevel) {
    return [] // Top level or unsupported
  }

  return permitAdmin(parentLevel)
}

export const AddChurchAdmin = async (
  context: Context,
  args: AddAdminArgs,
  churchType: ChurchLevel
) => {
  const session = context.executionContext.session()
  const permittedRoles = getPermittedRoles(churchType)
  
  isAuth(permittedRoles, context.jwt['https://flcadmin.netlify.app/roles'])

  const churchIdParam = getChurchIdParam(churchType)

  const cypher = `
    MATCH (church:${churchType} {id: $churchId})
    MATCH (admin:Active:Member {id: $adminId})
    MATCH (currentUser:Active:Member {auth_id: $auth})
    
    // Check if admin is already assigned
    OPTIONAL MATCH (admin)-[existing:IS_ADMIN_FOR]->(church)
    WITH church, admin, currentUser, existing
    WHERE existing IS NULL
    
    // Create admin relationship
    MERGE (admin)-[:IS_ADMIN_FOR]->(church)
    
    // Log history
    CREATE (log:HistoryLog {id: apoc.create.uuid()})
    SET log.timeStamp = datetime(),
        log.historyRecord = admin.firstName + ' ' + admin.lastName + ' was added as admin for ' + church.name + ' ${churchType}'
    
    MERGE (date:TimeGraph {date: date()})
    MERGE (log)-[:LOGGED_BY]->(currentUser)
    MERGE (log)-[:RECORDED_ON]->(date)
    MERGE (church)-[:HAS_HISTORY]->(log)
    
    RETURN admin
  `

  try {
    const result = await session.run(cypher, {
      churchId: args[churchIdParam],
      adminId: args.adminId,
      auth: context.jwt.sub,
    })

    const admin = rearrangeCypherObject(result)
    
    if (!admin.id) {
      throw new Error(`Admin already assigned or not found`)
    }

    return admin
  } catch (error) {
    throwToSentry('Error adding admin', error)
    throw error
  } finally {
    await session.close()
  }
}

export const RemoveChurchAdminOnly = async (
  context: Context,
  args: RemoveAdminArgs,
  churchType: ChurchLevel
) => {
  const session = context.executionContext.session()
  const permittedRoles = getPermittedRoles(churchType)
  
  isAuth(permittedRoles, context.jwt['https://flcadmin.netlify.app/roles'])

  const churchIdParam = getChurchIdParam(churchType)

  const cypher = `
    MATCH (church:${churchType} {id: $churchId})
    MATCH (admin:Active:Member {id: $adminId})
    MATCH (currentUser:Active:Member {auth_id: $auth})
    
    // Check if admin is assigned
    MATCH (admin)-[r:IS_ADMIN_FOR]->(church)
    
    // Remove admin relationship
    DELETE r
    
    // Log history
    CREATE (log:HistoryLog {id: apoc.create.uuid()})
    SET log.timeStamp = datetime(),
        log.historyRecord = admin.firstName + ' ' + admin.lastName + ' was removed as admin for ' + church.name + ' ${churchType}'
    
    MERGE (date:TimeGraph {date: date()})
    MERGE (log)-[:LOGGED_BY]->(currentUser)
    MERGE (log)-[:RECORDED_ON]->(date)
    MERGE (church)-[:HAS_HISTORY]->(log)
    
    RETURN admin
  `

  try {
    const result = await session.run(cypher, {
      churchId: args[churchIdParam],
      adminId: args.adminId,
      auth: context.jwt.sub,
    })

    const admin = rearrangeCypherObject(result)
    
    if (!admin.id) {
      throw new Error('Admin relationship not found')
    }

    return admin
  } catch (error) {
    throwToSentry('Error removing admin', error)
    throw error
  } finally {
    await session.close()
  }
}

// Export resolver functions for each church type
export const adminManagementResolvers = {
  // Governorship
  AddGovernorshipAdmin: (object: any, args: any, context: Context) =>
    AddChurchAdmin(context, { adminId: args.adminId, churchId: args.governorshipId }, 'Governorship'),
  RemoveGovernorshipAdminOnly: (object: any, args: any, context: Context) =>
    RemoveChurchAdminOnly(context, { adminId: args.adminId, churchId: args.governorshipId }, 'Governorship'),

  // Council
  AddCouncilAdmin: (object: any, args: any, context: Context) =>
    AddChurchAdmin(context, { adminId: args.adminId, churchId: args.councilId }, 'Council'),
  RemoveCouncilAdminOnly: (object: any, args: any, context: Context) =>
    RemoveChurchAdminOnly(context, { adminId: args.adminId, churchId: args.councilId }, 'Council'),

  // Stream
  AddStreamAdmin: (object: any, args: any, context: Context) =>
    AddChurchAdmin(context, { adminId: args.adminId, churchId: args.streamId }, 'Stream'),
  RemoveStreamAdminOnly: (object: any, args: any, context: Context) =>
    RemoveChurchAdminOnly(context, { adminId: args.adminId, churchId: args.streamId }, 'Stream'),

  // Campus
  AddCampusAdmin: (object: any, args: any, context: Context) =>
    AddChurchAdmin(context, { adminId: args.adminId, churchId: args.campusId }, 'Campus'),
  RemoveCampusAdminOnly: (object: any, args: any, context: Context) =>
    RemoveChurchAdminOnly(context, { adminId: args.adminId, churchId: args.campusId }, 'Campus'),

  // Oversight
  AddOversightAdmin: (object: any, args: any, context: Context) =>
    AddChurchAdmin(context, { adminId: args.adminId, churchId: args.oversightId }, 'Oversight'),
  RemoveOversightAdminOnly: (object: any, args: any, context: Context) =>
    RemoveChurchAdminOnly(context, { adminId: args.adminId, churchId: args.oversightId }, 'Oversight'),

  // Denomination
  AddDenominationAdmin: (object: any, args: any, context: Context) =>
    AddChurchAdmin(context, { adminId: args.adminId, churchId: args.denominationId }, 'Denomination'),
  RemoveDenominationAdminOnly: (object: any, args: any, context: Context) =>
    RemoveChurchAdminOnly(context, { adminId: args.adminId, churchId: args.denominationId }, 'Denomination'),

  // Bacenta
  AddBacentaAdmin: (object: any, args: any, context: Context) =>
    AddChurchAdmin(context, { adminId: args.adminId, churchId: args.bacentaId }, 'Bacenta'),
  RemoveBacentaAdminOnly: (object: any, args: any, context: Context) =>
    RemoveChurchAdminOnly(context, { adminId: args.adminId, churchId: args.bacentaId }, 'Bacenta'),
}
