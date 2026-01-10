"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminManagementResolvers = exports.RemoveChurchAdminOnly = exports.AddChurchAdmin = void 0;
const utils_1 = require("../utils/utils");
const permissions_1 = require("../permissions");
const getChurchIdParam = (churchType) => {
    return `${churchType.toLowerCase()}Id`;
};
const getPermittedRoles = (churchType) => {
    // Map church types to their parent level for permissions
    const permissionMap = {
        Governorship: 'Council',
        Council: 'Stream',
        Stream: 'Campus',
        Campus: 'Oversight',
        Oversight: 'Denomination',
        Bacenta: 'Governorship',
        Ministry: 'CreativeArts',
        CreativeArts: 'Campus',
    };
    const parentLevel = permissionMap[churchType];
    if (!parentLevel) {
        return []; // Top level or unsupported
    }
    return (0, permissions_1.permitAdmin)(parentLevel);
};
const AddChurchAdmin = async (context, args, churchType) => {
    const session = context.executionContext.session();
    const permittedRoles = getPermittedRoles(churchType);
    (0, utils_1.isAuth)(permittedRoles, context.jwt['https://flcadmin.netlify.app/roles']);
    const churchIdParam = getChurchIdParam(churchType);
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
  `;
    try {
        const result = await session.run(cypher, {
            churchId: args[churchIdParam],
            adminId: args.adminId,
            auth: context.jwt.sub,
        });
        const admin = (0, utils_1.rearrangeCypherObject)(result);
        if (!admin.id) {
            throw new Error(`Admin already assigned or not found`);
        }
        return admin;
    }
    catch (error) {
        (0, utils_1.throwToSentry)('Error adding admin', error);
        throw error;
    }
    finally {
        await session.close();
    }
};
exports.AddChurchAdmin = AddChurchAdmin;
const RemoveChurchAdminOnly = async (context, args, churchType) => {
    const session = context.executionContext.session();
    const permittedRoles = getPermittedRoles(churchType);
    (0, utils_1.isAuth)(permittedRoles, context.jwt['https://flcadmin.netlify.app/roles']);
    const churchIdParam = getChurchIdParam(churchType);
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
  `;
    try {
        const result = await session.run(cypher, {
            churchId: args[churchIdParam],
            adminId: args.adminId,
            auth: context.jwt.sub,
        });
        const admin = (0, utils_1.rearrangeCypherObject)(result);
        if (!admin.id) {
            throw new Error('Admin relationship not found');
        }
        return admin;
    }
    catch (error) {
        (0, utils_1.throwToSentry)('Error removing admin', error);
        throw error;
    }
    finally {
        await session.close();
    }
};
exports.RemoveChurchAdminOnly = RemoveChurchAdminOnly;
// Export resolver functions for each church type
exports.adminManagementResolvers = {
    // Governorship
    AddGovernorshipAdmin: (object, args, context) => (0, exports.AddChurchAdmin)(context, { adminId: args.adminId, churchId: args.governorshipId }, 'Governorship'),
    RemoveGovernorshipAdminOnly: (object, args, context) => (0, exports.RemoveChurchAdminOnly)(context, { adminId: args.adminId, churchId: args.governorshipId }, 'Governorship'),
    // Council
    AddCouncilAdmin: (object, args, context) => (0, exports.AddChurchAdmin)(context, { adminId: args.adminId, churchId: args.councilId }, 'Council'),
    RemoveCouncilAdminOnly: (object, args, context) => (0, exports.RemoveChurchAdminOnly)(context, { adminId: args.adminId, churchId: args.councilId }, 'Council'),
    // Stream
    AddStreamAdmin: (object, args, context) => (0, exports.AddChurchAdmin)(context, { adminId: args.adminId, churchId: args.streamId }, 'Stream'),
    RemoveStreamAdminOnly: (object, args, context) => (0, exports.RemoveChurchAdminOnly)(context, { adminId: args.adminId, churchId: args.streamId }, 'Stream'),
    // Campus
    AddCampusAdmin: (object, args, context) => (0, exports.AddChurchAdmin)(context, { adminId: args.adminId, churchId: args.campusId }, 'Campus'),
    RemoveCampusAdminOnly: (object, args, context) => (0, exports.RemoveChurchAdminOnly)(context, { adminId: args.adminId, churchId: args.campusId }, 'Campus'),
    // Oversight
    AddOversightAdmin: (object, args, context) => (0, exports.AddChurchAdmin)(context, { adminId: args.adminId, churchId: args.oversightId }, 'Oversight'),
    RemoveOversightAdminOnly: (object, args, context) => (0, exports.RemoveChurchAdminOnly)(context, { adminId: args.adminId, churchId: args.oversightId }, 'Oversight'),
    // Denomination
    AddDenominationAdmin: (object, args, context) => (0, exports.AddChurchAdmin)(context, { adminId: args.adminId, churchId: args.denominationId }, 'Denomination'),
    RemoveDenominationAdminOnly: (object, args, context) => (0, exports.RemoveChurchAdminOnly)(context, { adminId: args.adminId, churchId: args.denominationId }, 'Denomination'),
    // Bacenta
    AddBacentaAdmin: (object, args, context) => (0, exports.AddChurchAdmin)(context, { adminId: args.adminId, churchId: args.bacentaId }, 'Bacenta'),
    RemoveBacentaAdminOnly: (object, args, context) => (0, exports.RemoveChurchAdminOnly)(context, { adminId: args.adminId, churchId: args.bacentaId }, 'Bacenta'),
};
