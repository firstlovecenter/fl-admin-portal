"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth0Roles = exports.getAuthToken = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils/utils");
const secrets_1 = require("./secrets");
const getAuthToken = async () => {
    try {
        const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
        const getTokenConfig = {
            method: 'post',
            url: `${SECRETS.AUTH0_BASE_URL}oauth/token`,
            headers: { 'content-type': 'application/json' },
            data: {
                client_id: SECRETS.AUTH0_MGMT_CLIENT_ID,
                client_secret: SECRETS.AUTH0_CLIENT_SECRET,
                audience: `${SECRETS.AUTH0_BASE_URL}api/v2/`,
                grant_type: 'client_credentials',
            },
        };
        const tokenRes = await (0, axios_1.default)(getTokenConfig);
        return tokenRes.data.access_token;
    }
    catch (error) {
        return (0, utils_1.throwToSentry)('Problem Obtaining Auth Token', error);
    }
};
exports.getAuthToken = getAuthToken;
const getAuth0Roles = async (authToken) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    const getRolesConfig = {
        method: 'get',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/roles`,
        headers: {
            autho: '',
            Authorization: `Bearer ${authToken}`,
        },
    };
    const rolesRes = await (0, axios_1.default)(getRolesConfig);
    const authRoles = {};
    rolesRes.data.forEach((role) => {
        authRoles[role.name] = {
            id: role.id,
            name: role.name,
            description: role.description,
        };
        return authRoles;
    });
    return authRoles;
};
exports.getAuth0Roles = getAuth0Roles;
