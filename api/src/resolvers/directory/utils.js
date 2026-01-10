"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeServantCypher = exports.removeServantCypher = exports.formatting = exports.setPriorityLevel = void 0;
const utils_1 = require("../utils/utils");
const helper_functions_1 = require("./helper-functions");
const servant_cypher_1 = __importDefault(require("./servant-cypher"));
const resolver_cypher_1 = require("../cypher/resolver-cypher");
const ministry_directory_cypher_1 = require("../cypher/ministry-directory-cypher");
const setPriorityLevel = (churchType) => {
    let priority = 0;
    switch (churchType) {
        case 'Denomination':
            priority = 1;
            break;
        case 'Oversight':
            priority = 2;
            break;
        case 'Campus':
            priority = 3;
            break;
        case 'Stream':
        case 'CreativeArts':
            priority = 4;
            break;
        case 'Council':
        case 'Ministry':
            priority = 5;
            break;
        case 'HubCouncil':
        case 'Governorship':
            priority = 6;
            break;
        case 'Hub':
        case 'Bacenta':
            priority = 7;
            break;
        case 'Fellowship':
            priority = 8;
            break;
        default:
            priority = 0;
    }
    return priority;
};
exports.setPriorityLevel = setPriorityLevel;
const formatting = (churchType, servantType) => {
    let churchLower = churchType?.toLowerCase();
    let servantLower = 'leader';
    let memberQuery = resolver_cypher_1.matchMemberQuery;
    let verb = `leads${churchType}`;
    if (servantType === 'Admin') {
        verb = `isAdminFor${churchType}`;
        servantLower = 'admin';
    }
    if (servantType === 'ArrivalsAdmin') {
        verb = `isArrivalsAdminFor${churchType}`;
        servantLower = 'arrivalsAdmin';
    }
    if (servantType === 'ArrivalsCounter') {
        verb = `isArrivalsCounterFor${churchType}`;
        servantLower = 'arrivalsCounter';
    }
    if (servantType === 'ArrivalsPayer') {
        verb = `isArrivalsPayerFor${churchType}`;
        servantLower = 'arrivalsPayer';
    }
    if (servantType === 'Teller') {
        verb = `isTellerFor${churchType}`;
        servantLower = 'teller';
        memberQuery = resolver_cypher_1.matchMemberTellerQuery;
    }
    if (servantType === 'SheepSeeker') {
        verb = `isSheepSeekerFor${churchType}`;
        servantLower = 'sheepseeker';
        memberQuery = resolver_cypher_1.matchMemberSheepSeekerQuery;
    }
    if (churchType === 'Campus') {
        churchLower = 'campus';
    }
    if (churchType === 'Oversight') {
        memberQuery = resolver_cypher_1.matchMemberOversightQuery;
    }
    if (churchType === 'Denomination') {
        memberQuery = resolver_cypher_1.matchMemberDenominationQuery;
    }
    if (churchType === 'CreativeArts') {
        churchLower = 'creativeArts';
        memberQuery = ministry_directory_cypher_1.matchMemberCreativeArtsQuery;
    }
    if (churchType === 'Ministry') {
        churchLower = 'ministry';
        memberQuery = ministry_directory_cypher_1.matchMemberMinistryQuery;
    }
    if (churchType === 'HubCouncil') {
        churchLower = 'hubCouncil';
        memberQuery = ministry_directory_cypher_1.matchMemberHubCouncilQuery;
    }
    if (churchType === 'Hub') {
        churchLower = 'hub';
        memberQuery = ministry_directory_cypher_1.matchMemberHubQuery;
    }
    const priority = (0, exports.setPriorityLevel)(churchType);
    return {
        verb,
        servantLower,
        churchLower,
        memberQuery,
        priority,
    };
};
exports.formatting = formatting;
const removeServantCypher = async ({ context, churchType, servantType, servant, church, }) => {
    const terms = (0, exports.formatting)(churchType, servantType);
    const { servantLower } = terms;
    const session = context.executionContext.session();
    if (!servant.id) {
        throw new Error('There is no servant to remove');
    }
    // Disconnect him from the Church
    await session.executeWrite((tx) => tx.run(servant_cypher_1.default[`disconnectChurch${servantType}`], {
        [`${servantLower}Id`]: servant.id ?? '',
        churchId: church.id,
        auth_id: servant.auth_id,
        jwt: context.jwt,
    }));
    const historyRecordStringArgs = {
        servant,
        church,
        churchType,
        servantType,
        removed: true,
    };
    const historyLogRes = (0, utils_1.rearrangeCypherObject)(await session.executeWrite((tx) => tx.run(servant_cypher_1.default.createHistoryLog, {
        id: servant.id,
        churchType,
        historyRecord: (0, helper_functions_1.historyRecordString)(historyRecordStringArgs),
    })));
    await session.executeWrite((tx) => tx.run(servant_cypher_1.default.connectHistoryLog, {
        churchId: church.id,
        servantId: servant.id,
        logId: historyLogRes.id,
        jwt: context.jwt,
    }));
};
exports.removeServantCypher = removeServantCypher;
const makeServantCypher = async ({ context, churchType, servantType, servant, args, church, oldServant, }) => {
    const terms = (0, exports.formatting)(churchType, servantType);
    const { servantLower, priority } = terms;
    const session = context.executionContext.session();
    // Connect Leader to Church
    const connectedChurchRes = (0, utils_1.rearrangeCypherObject)(await session
        .run(servant_cypher_1.default[`connectChurch${servantType}`], {
        [`${servantLower}Id`]: servant.id,
        churchId: church.id,
        auth_id: servant.auth_id,
        jwt: context.jwt,
    })
        .catch((e) => (0, utils_1.throwToSentry)(`Error Connecting Church${servantType}`, e)));
    const historyRecordStringArgs = {
        servant,
        servantType,
        oldServant,
        church,
        churchType,
        removed: false,
        args,
        higherChurch: {
            type: (0, utils_1.nextHigherChurch)(churchType),
            name: connectedChurchRes?.higherChurchName,
        },
    };
    const serviceLogRes = (0, utils_1.rearrangeCypherObject)(await session
        .run(servant_cypher_1.default.createHistoryLog, {
        id: servant.id,
        churchType,
        historyRecord: (0, helper_functions_1.historyRecordString)(historyRecordStringArgs),
    })
        .catch((e) => (0, utils_1.throwToSentry)(`Error Creating History Log`, e)));
    if (servantType === 'Leader') {
        await session
            .run(servant_cypher_1.default.makeHistoryServiceLog, {
            logId: serviceLogRes.id,
            priority,
        })
            .catch((e) => (0, utils_1.throwToSentry)(`Error Converting History to Service Log`, e));
        await session
            .run(servant_cypher_1.default.connectServiceLog, {
            churchId: church.id,
            servantId: servant.id,
            oldServantId: oldServant?.id ?? '',
            logId: serviceLogRes.id,
            jwt: context.jwt,
        })
            .catch((e) => (0, utils_1.throwToSentry)(`Error Connecting Service Log`, e));
    }
    else {
        await session
            .run(servant_cypher_1.default.connectHistoryLog, {
            churchId: church.id,
            servantId: servant.id,
            oldServantId: oldServant?.id ?? '',
            logId: serviceLogRes.id,
            jwt: context.jwt,
        })
            .catch((e) => (0, utils_1.throwToSentry)(`Error Connecting History Log`, e));
    }
};
exports.makeServantCypher = makeServantCypher;
