"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const permissions_1 = require("../permissions");
const make_remove_servants_1 = require("./make-remove-servants");
const helper_functions_1 = require("./helper-functions");
const authenticate_1 = require("../authenticate");
const resolver_cypher_1 = require("../cypher/resolver-cypher");
const auth0_1 = require("../utils/auth0");
const MakeServantResolvers = {
    RemoveRoleFromMember: async (object, args, context) => {
        const session = context.executionContext.session();
        try {
            const authToken = await (0, authenticate_1.getAuthToken)();
            const authRoles = await (0, authenticate_1.getAuth0Roles)(authToken);
            const servantRes = await session.executeRead((tx) => tx.run(resolver_cypher_1.matchMemberFromAuthId, {
                jwt: context.jwt,
            }));
            const userRolesUrl = await (0, auth0_1.getUserRoles)(context.jwt.sub, authToken);
            const userRoleResponse = await (0, axios_1.default)(userRolesUrl);
            const roles = userRoleResponse.data.map((role) => role.name);
            const servant = servantRes.records[0].get('member').properties;
            await (0, helper_functions_1.removeRoles)(servant, roles, authRoles[args.role].id, authToken);
            return true;
        }
        catch (err) {
            console.log(err);
        }
        return false;
    },
    // Administrative Mutations
    MakeOversightAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Denomination'), 'Oversight', 'Admin'),
    RemoveOversightAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Denomination'), 'Oversight', 'Admin'),
    MakeCampusAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Oversight'), 'Campus', 'Admin'),
    RemoveCampusAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Oversight'), 'Campus', 'Admin'),
    MakeStreamAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'Stream', 'Admin'),
    RemoveStreamAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'Stream', 'Admin'),
    MakeCouncilAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Stream'), 'Council', 'Admin'),
    RemoveCouncilAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Stream'), 'Council', 'Admin'),
    MakeGovernorshipAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Council'), 'Governorship', 'Admin'),
    RemoveGovernorshipAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Council'), 'Governorship', 'Admin'),
    MakeCreativeArtsAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'CreativeArts', 'Admin'),
    RemoveCreativeArtsAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'CreativeArts', 'Admin'),
    MakeMinistryAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('CreativeArts'), 'Ministry', 'Admin'),
    RemoveMinistryAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('CreativeArts'), 'Ministry', 'Admin'),
    // Pastoral Mutations
    MakeFellowshipLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Bacenta'), 'Fellowship', 'Leader'),
    RemoveFellowshipLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Bacenta'), 'Fellowship', 'Leader'),
    MakeBacentaLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdminArrivals)('Fellowship'), 'Bacenta', 'Leader'),
    RemoveBacentaLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdminArrivals)('Fellowship'), 'Bacenta', 'Leader'),
    MakeGovernorshipLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Council'), 'Governorship', 'Leader'),
    RemoveGovernorshipLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Council'), 'Governorship', 'Leader'),
    MakeCouncilLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Stream'), 'Council', 'Leader'),
    RemoveCouncilLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Stream'), 'Council', 'Leader'),
    MakeStreamLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'Stream', 'Leader'),
    RemoveStreamLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'Stream', 'Leader'),
    MakeCampusLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Oversight'), 'Campus', 'Leader'),
    RemoveCampusLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Oversight'), 'Campus', 'Leader'),
    MakeOversightLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Denomination'), 'Oversight', 'Leader'),
    RemoveOversightLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Denomination'), 'Oversight', 'Leader'),
    MakeDenominationLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, ['fishers'], 'Denomination', 'Leader'),
    RemoveDenominationLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, ['fishers'], 'Denomination', 'Leader'),
    MakeCreativeArtsLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'CreativeArts', 'Leader'),
    RemoveCreativeArtsLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'CreativeArts', 'Leader'),
    MakeMinistryLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, (0, permissions_1.permitAdmin)('CreativeArts'), 'Ministry', 'Leader'),
    RemoveMinistryLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('CreativeArts'), 'Ministry', 'Leader'),
    MakeHubCouncilLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, [...(0, permissions_1.permitAdmin)('Ministry'), ...(0, permissions_1.permitAdmin)('Council')], 'HubCouncil', 'Leader'),
    RemoveHubCouncilLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, [...(0, permissions_1.permitAdmin)('Ministry'), ...(0, permissions_1.permitAdmin)('Council')], 'HubCouncil', 'Leader'),
    MakeHubLeader: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, [...(0, permissions_1.permitAdmin)('Ministry'), ...(0, permissions_1.permitAdmin)('Council')], 'Hub', 'Leader'),
    RemoveHubLeader: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, [...(0, permissions_1.permitAdmin)('Ministry'), ...(0, permissions_1.permitAdmin)('Council')], 'Hub', 'Leader'),
};
exports.default = MakeServantResolvers;
