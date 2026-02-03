"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.deleteUserRoles = exports.setUserRoles = exports.getUserRoles = exports.getAuthIdConfig = exports.deleteAuthUserConfig = exports.changePasswordConfig = exports.updateAuthUserConfig = exports.createAuthUserConfig = void 0;
const secrets_1 = require("../secrets");
const createAuthUserConfig = async (member, token) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    return {
        method: 'post',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/users`,
        headers: {
            autho: '',
            Authorization: `Bearer ${token}`,
        },
        data: {
            connection: `flcadmin${SECRETS.TEST_ENV ? '-test' : ''}`,
            email: member.email,
            given_name: member.firstName,
            family_name: member.lastName,
            name: `${member.firstName} ${member.lastName}`,
            picture: member.pictureUrl ||
                'https://res.cloudinary.com/firstlovecenter/image/upload/v1627893621/user_qvwhs7.png',
            user_id: member.id,
            password: SECRETS.TEST_ENV ? 'password' : 'rAnd0MLetteR5',
        },
    };
};
exports.createAuthUserConfig = createAuthUserConfig;
const updateAuthUserConfig = async (member, token) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    return {
        method: 'patch',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/users/${member.auth_id}`,
        headers: {
            autho: '',
            Authorization: `Bearer ${token}`,
        },
        data: {
            connection: `flcadmin${SECRETS.TEST_ENV ? '-test' : ''}`,
            email: member.email,
            given_name: member.firstName,
            family_name: member.lastName,
            name: `${member.firstName} ${member.lastName}`,
            picture: member.pictureUrl ||
                'https://res.cloudinary.com/firstlovecenter/image/upload/v1627893621/user_qvwhs7.png',
        },
    };
};
exports.updateAuthUserConfig = updateAuthUserConfig;
const changePasswordConfig = async (member, token) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    return {
        method: 'post',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/tickets/password-change`,
        headers: {
            autho: '',
            Authorization: `Bearer ${token}`,
        },
        data: {
            connection_id: SECRETS.AUTH0_DB_CONNECTION_ID,
            email: member.email,
            mark_email_as_verified: true,
        },
    };
};
exports.changePasswordConfig = changePasswordConfig;
const deleteAuthUserConfig = async (memberId, token) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    return {
        method: 'delete',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/users/${memberId}`,
        headers: {
            autho: '',
            Authorization: `Bearer ${token}`,
        },
    };
};
exports.deleteAuthUserConfig = deleteAuthUserConfig;
const getAuthIdConfig = async (member, token) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    const sanitizedEmail = member.email.replace(/\s+/g, '');
    return {
        method: 'get',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/users-by-email?email=${sanitizedEmail}`,
        headers: {
            autho: '',
            Authorization: `Bearer ${token}`,
        },
    };
};
exports.getAuthIdConfig = getAuthIdConfig;
const getUserRoles = async (memberId, token) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    return {
        method: 'get',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/users/${memberId}/roles`,
        headers: {
            autho: '',
            Authorization: `Bearer ${token}`,
        },
    };
};
exports.getUserRoles = getUserRoles;
const setUserRoles = async (memberId, roles, token) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    return {
        method: 'post',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/users/${memberId}/roles`,
        headers: {
            autho: '',
            Authorization: `Bearer ${token}`,
        },
        data: {
            roles,
        },
    };
};
exports.setUserRoles = setUserRoles;
const deleteUserRoles = async (memberId, roles, token) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    return {
        method: 'delete',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/users/${memberId}/roles`,
        headers: {
            autho: '',
            Authorization: `Bearer ${token}`,
        },
        data: {
            roles,
        },
    };
};
exports.deleteUserRoles = deleteUserRoles;
const deleteRole = async (role, token, authRoles) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    const getRoleId = (roleName) => authRoles[roleName].id;
    return {
        method: 'delete',
        baseURL: SECRETS.AUTH0_BASE_URL,
        url: `/api/v2/roles/${getRoleId(role)}`,
        headers: {
            autho: '',
            Authorization: `Bearer ${token}`,
        },
    };
};
exports.deleteRole = deleteRole;
