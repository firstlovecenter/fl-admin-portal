"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const service_resolvers_1 = __importDefault(require("./no-income/service-resolvers"));
const service_resolvers_2 = __importDefault(require("./services/service-resolvers"));
const treasury_resolvers_1 = __importDefault(require("./anagkazo/treasury-resolvers"));
const directory_resolvers_1 = __importDefault(require("./directory/directory-resolvers"));
const directory_creativearts_resolvers_1 = __importDefault(require("./directory/directory-creativearts-resolvers"));
const arrivals_resolvers_1 = require("./arrivals/arrivals-resolvers");
const banking_resolver_1 = __importDefault(require("./banking/banking-resolver"));
const accounts_resolvers_1 = require("./accounts/accounts-resolvers");
const maps_resolvers_1 = require("./maps/maps-resolvers");
const rehearsal_resolver_1 = __importDefault(require("./services/rehearsal-resolver"));
const make_servant_resolvers_1 = __importDefault(require("./directory/make-servant-resolvers"));
const download_credits_resolvers_1 = require("./download-credits/download-credits-resolvers");
const upload_resolvers_1 = __importDefault(require("./uploads/upload-resolvers"));
const admin_management_resolvers_1 = require("./directory/admin-management-resolvers");
const dotenv = require('dotenv');
dotenv.config();
const resolvers = {
    // Resolver Parameters
    // Object: the parent result of a previous resolver
    // Args: Field Arguments
    // Context: Context object, database connection, API, etc
    // GraphQLResolveInfo
    Member: {
        fullName: (source) => `${source.firstName} ${source.lastName}`,
        nameWithTitle: async (source, args, context) => {
            const session = context.executionContext.session();
            const res = await session.run(`MATCH (member:Member {id: $id})-[:HAS_GENDER]->(gender:Gender)
          MATCH (member)-[:HAS_TITLE]->(title:Title)
          RETURN member AS member, gender.gender AS gender, title.name AS title, title.priority AS priority ORDER BY priority DESC LIMIT 1`, {
                id: source.id,
            });
            const gender = res.records[0]?.get('gender');
            const title = res.records[0]?.get('title') ?? '';
            let shortTitle = '';
            if (title === 'Bishop') {
                shortTitle = 'Bishop';
            }
            if (title === 'Bishop' && gender === 'Female') {
                shortTitle = 'Mother';
            }
            if (title === 'Reverend') {
                shortTitle = 'Rev.';
            }
            if (title === 'Reverend' && gender === 'Female') {
                shortTitle = 'LR';
            }
            if (title === 'Pastor') {
                shortTitle = 'Ps.';
            }
            if (title === 'Pastor' && gender === 'Female') {
                shortTitle = 'LP';
            }
            return `${shortTitle} ${source.firstName} ${source.lastName}`;
        },
        ...maps_resolvers_1.mapsResolvers.Member,
    },
    Fellowship: {},
    Bacenta: {},
    Governorship: {},
    Council: {
        ...download_credits_resolvers_1.downloadCreditsQueries.Council,
    },
    Stream: {
        ...arrivals_resolvers_1.arrivalsResolvers.Stream,
    },
    Campus: {},
    Mutation: {
        ...make_servant_resolvers_1.default,
        ...directory_resolvers_1.default,
        ...arrivals_resolvers_1.arrivalsMutation,
        ...service_resolvers_2.default,
        ...banking_resolver_1.default,
        ...treasury_resolvers_1.default,
        ...service_resolvers_1.default,
        ...rehearsal_resolver_1.default,
        ...accounts_resolvers_1.accountsMutations,
        ...directory_creativearts_resolvers_1.default,
        ...download_credits_resolvers_1.downloadCreditsMutations,
        ...upload_resolvers_1.default,
        ...admin_management_resolvers_1.adminManagementResolvers,
    },
};
exports.default = resolvers;
