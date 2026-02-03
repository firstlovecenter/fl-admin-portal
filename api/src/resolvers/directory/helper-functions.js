"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseForCacheRemoval = exports.parseForCache = exports.servantInEmail = exports.churchInEmail = exports.assignRoles = exports.removeRoles = exports.historyRecordString = exports.directoryLock = void 0;
/* eslint-disable no-console */
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../utils/utils");
const auth0_1 = require("../utils/auth0");
const authenticate_1 = require("../authenticate");
const directoryLock = (userRoles) => {
    if ((new Date().getDay() === 1 && new Date().getHours() >= 12) ||
        new Date().getDay() === 2 ||
        ['fishers']?.some((r) => userRoles.includes(r))) {
        return false;
    }
    return true;
};
exports.directoryLock = directoryLock;
const historyRecordString = ({ servant, oldServant, church, churchType, servantType, removed, args, higherChurch, }) => {
    if (removed) {
        return `${servant.firstName} ${servant.lastName} was removed as the ${churchType} ${servantType} for  ${church.name} ${churchType}`;
    }
    if (oldServant?.id) {
        return `${servant.firstName} ${servant.lastName} became the ${servantType} of ${church.name} ${churchType} replacing ${oldServant.firstName} ${oldServant.lastName}`;
    }
    if (!args?.leaderId) {
        return `${servant.firstName} ${servant.lastName} became the ${servantType} of ${church.name} ${churchType}`;
    }
    return `${servant.firstName} ${servant.lastName} started ${church.name} ${churchType} under ${higherChurch?.name} ${higherChurch?.type}`;
};
exports.historyRecordString = historyRecordString;
const removeRoles = async (servant, userRoles, rolesToRemove, authToken) => {
    const authRoles = await (0, authenticate_1.getAuth0Roles)(authToken);
    const userRoleIds = userRoles.map((role) => authRoles[role].id);
    // A remove roles function to simplify removing roles with an axios request
    if (userRoleIds.includes(rolesToRemove)) {
        const deleteRoleConfig = await (0, auth0_1.deleteUserRoles)(servant.auth_id, [rolesToRemove], authToken);
        return (0, axios_1.default)(deleteRoleConfig)
            .then(() => console.log(`Role successfully removed for ${servant.firstName} ${servant.lastName}`))
            .catch((err) => (0, utils_1.throwToSentry)('There was an error removing role', err));
    }
    return servant;
};
exports.removeRoles = removeRoles;
const assignRoles = async (servant, userRoles, rolesToAssign, authToken) => {
    const authRoles = await (0, authenticate_1.getAuth0Roles)(authToken);
    const userRoleIds = userRoles.map((role) => authRoles[role].id);
    const authRolesArray = Object.entries(authRoles);
    const nameOfRoles = authRolesArray
        .map((role) => {
        if (rolesToAssign[0] === role[1].id) {
            return role[1].name;
        }
        return '';
    })
        .filter((role) => role);
    if (userRoleIds.includes(rolesToAssign[0])) {
        console.log(`${servant.firstName} ${servant.lastName} already has the role`, nameOfRoles[0]);
        return;
    }
    // An assign roles function to simplify assigning roles with an axios request
    if (!userRoleIds.includes(rolesToAssign[0])) {
        try {
            const setRoleConfig = await (0, auth0_1.setUserRoles)(servant.auth_id, rolesToAssign, authToken);
            await (0, axios_1.default)(setRoleConfig);
            console.log(nameOfRoles[0], `role successfully added to ${servant.firstName} ${servant.lastName}`);
        }
        catch (err) {
            (0, utils_1.throwToSentry)('There was an error assigning role', err);
        }
    }
};
exports.assignRoles = assignRoles;
const churchInEmail = (church) => {
    if (church.type === 'ClosedFellowship') {
        return `${church.name} Fellowship which has been closed`;
    }
    if (church.type === 'ClosedBacenta') {
        return `${church.name} Bacenta which has been closed`;
    }
    return `${church.name} ${church.type}`;
};
exports.churchInEmail = churchInEmail;
const servantInEmail = (servant) => {
    return servant;
};
exports.servantInEmail = servantInEmail;
const parseForCache = (servant, church, verb, role) => {
    // Returning the data such that it can update apollo cache
    servant[`${verb}`].push({
        id: church.id,
        name: church.name,
        momoNumber: null,
        [`${role}`]: {
            id: servant.id,
            firstName: servant.firstName,
            lastName: servant.lastName,
        },
    });
    servant[`${verb}`].forEach((churchMutable) => {
        // eslint-disable-next-line no-param-reassign
        churchMutable[`${role}`] = {
            id: servant.id,
            firstName: servant.firstName,
            lastName: servant.lastName,
        };
    });
    return servant;
};
exports.parseForCache = parseForCache;
const parseForCacheRemoval = (servant, removedChurch, verb, role) => {
    const servantMutable = servant;
    // Returning the data such that it can update apollo cache
    servantMutable[`${verb}`] = servantMutable[`${verb}`].filter((church) => {
        if (church.id === removedChurch.id) {
            return false;
        }
        return true;
    });
    servant[`${verb}`].forEach((churchMutable) => {
        // eslint-disable-next-line no-param-reassign
        churchMutable[`${role}`] = {
            id: servant.id,
            firstName: servant.firstName,
            lastName: servant.lastName,
        };
    });
    return servantMutable;
};
exports.parseForCacheRemoval = parseForCacheRemoval;
