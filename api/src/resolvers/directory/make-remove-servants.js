"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveServant = exports.MakeServant = void 0;
/* eslint-disable react/destructuring-assignment */
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../utils/utils");
const notify_1 = require("../utils/notify");
const auth0_1 = require("../utils/auth0");
const resolver_cypher_1 = require("../cypher/resolver-cypher");
const authenticate_1 = require("../authenticate");
const helper_functions_1 = require("./helper-functions");
const utils_2 = require("./utils");
const texts = require('../texts.json');
const setUp = (setUpArgs) => {
    const { permittedRoles, context, churchLower, servantLower, args } = setUpArgs;
    if ((0, helper_functions_1.directoryLock)(context.jwt['https://flcadmin.netlify.app/roles']) &&
        servantLower !== 'arrivalsCounter') {
        throw new Error('Directory is locked till next Tuesday');
    }
    (0, utils_1.isAuth)(permittedRoles, context.jwt['https://flcadmin.netlify.app/roles']);
    (0, utils_1.noEmptyArgsValidation)([
        `${churchLower}Id`,
        args[`${churchLower}Id`],
        `${servantLower}Id`,
        args[`${servantLower}Id`],
    ]);
};
const servantValidation = (servant) => {
    if (!servant.id) {
        return false;
    }
    (0, utils_1.errorHandling)(servant);
    return true;
};
const MakeServant = async (context, args, permittedRoles, churchType, servantType) => {
    const authToken = await (0, authenticate_1.getAuthToken)();
    const authRoles = await (0, authenticate_1.getAuth0Roles)(authToken);
    const terms = (0, utils_2.formatting)(churchType, servantType);
    const { verb, servantLower, churchLower, memberQuery } = terms;
    const setUpArgs = {
        permittedRoles,
        context,
        churchLower,
        servantLower,
        args,
    };
    setUp(setUpArgs);
    const session = context.executionContext.session();
    const churchRes = await session.run(resolver_cypher_1.matchChurchQuery, {
        id: args[`${churchLower}Id`],
    });
    const church = (0, utils_1.rearrangeCypherObject)(churchRes);
    const churchNameInEmail = `${church.name} ${church.type}`;
    const servantRes = await session.run(memberQuery, {
        id: args[`${servantLower}Id`],
    });
    const oldServantRes = await session.run(memberQuery, {
        id: args[`old${servantType}Id`] ?? '',
    });
    const servant = (0, utils_1.rearrangeCypherObject)(servantRes);
    const oldServant = (0, utils_1.rearrangeCypherObject)(oldServantRes);
    servantValidation(servant);
    // Check for AuthID of servant
    const authIdConfig = await (0, auth0_1.getAuthIdConfig)(servant, authToken);
    const authIdResponse = await (0, axios_1.default)(authIdConfig);
    servant.auth_id = authIdResponse.data[0]?.user_id;
    if (!servant.auth_id) {
        try {
            // If servant Does Not Have Auth0 Profile, Create One
            const createUserCfg = await (0, auth0_1.createAuthUserConfig)(servant, authToken);
            const authProfileResponse = await (0, axios_1.default)(createUserCfg);
            const passwordTicketConfig = await (0, auth0_1.changePasswordConfig)(servant, authToken);
            const passwordTicketResponse = await (0, axios_1.default)(passwordTicketConfig);
            servant.auth_id = authProfileResponse.data.user_id;
            const roles = [];
            await Promise.all([
                // Send Mail to the Person after Password Change Ticket has been generated
                (0, notify_1.sendSingleEmail)(servant, 'Your Account Has Been Created On The FL State of the Flock Admin Portal', undefined, `<p>Hi ${servant.firstName} ${servant.lastName},<br/><br/>Congratulations on being made the <b>${churchType} ${servantType}</b> for <b>${churchNameInEmail}</b>.<br/><br/>Your account has just been created on the First Love Church Administrative Portal. Please set up your password by clicking <b><a href=${passwordTicketResponse.data.ticket}>this link</a></b>. After setting up your password, you can log in by clicking <b>https://synago.firstlovecenter.com/</b><br/><br/>Please go through ${texts.html.helpdesk} to find guidelines and instructions on how to use it as well as answers to questions you may have.</p>${texts.html.subscription}`),
                (0, helper_functions_1.assignRoles)(servant, roles, [authRoles[`${servantLower}${churchType}`].id], authToken),
                // Write Auth0 ID of Leader to Neo4j DB
                (0, utils_2.makeServantCypher)({
                    context,
                    churchType,
                    servantType,
                    servant,
                    args,
                    church,
                    oldServant,
                }),
            ]).then(() => console.log(`Auth0 Account successfully created for ${servant.firstName} ${servant.lastName}`));
        }
        catch (error) {
            (0, utils_1.throwToSentry)('Servant had no authId and hit an error', error);
        }
    }
    else if (servant.auth_id) {
        // Update a user's Auth Profile with Picture and Name Details
        const updateUserConfig = await (0, auth0_1.updateAuthUserConfig)(servant, authToken);
        await (0, axios_1.default)(updateUserConfig);
        // Check auth0 roles and add roles 'leaderBacenta'
        const userRoleConfig = await (0, auth0_1.getUserRoles)(servant.auth_id, authToken);
        const userRoleResponse = await (0, axios_1.default)(userRoleConfig);
        const roles = userRoleResponse.data.map((role) => role.name);
        // Write Auth0 ID of Servant to Neo4j DB
        await Promise.all([
            (0, helper_functions_1.assignRoles)(servant, roles, [authRoles[`${servantLower}${churchType}`].id], authToken),
            (0, utils_2.makeServantCypher)({
                context,
                args,
                churchType,
                servantType,
                servant,
                oldServant,
                church,
            }),
            (0, notify_1.sendSingleEmail)(servant, 'FL Servanthood Status Update', undefined, `<p>Hi ${servant.firstName} ${servant.lastName},<br/><br/>Congratulations on your new position as the <b>${churchType} ${servantType}</b> for <b>${churchNameInEmail}</b>.<br/><br/>Once again we are reminding you to go through ${texts.html.helpdesk} to find guidelines and instructions as well as answers to questions you may have</p>${texts.html.subscription}`),
        ]);
    }
    await session.close();
    return (0, helper_functions_1.parseForCache)(servant, church, verb, servantLower);
};
exports.MakeServant = MakeServant;
const RemoveServant = async (context, args, permittedRoles, churchType, servantType, removeOnly) => {
    const authToken = await (0, authenticate_1.getAuthToken)();
    const authRoles = await (0, authenticate_1.getAuth0Roles)(authToken);
    const terms = (0, utils_2.formatting)(churchType, servantType);
    const { verb, servantLower, churchLower, memberQuery } = terms;
    const setUpArgs = {
        permittedRoles,
        context,
        churchLower,
        servantLower,
        args,
    };
    setUp(setUpArgs);
    const session = context.executionContext.session();
    const churchRes = await session.run(resolver_cypher_1.matchChurchQuery, {
        id: args[`${churchLower}Id`],
    });
    const church = (0, utils_1.rearrangeCypherObject)(churchRes);
    const servantRes = await session.run(memberQuery, {
        id: args[`${servantLower}Id`],
    });
    const newServantRes = await session.run(memberQuery, {
        id: args[`new${servantType}Id`] ?? '',
    });
    const servant = (0, utils_1.rearrangeCypherObject)(servantRes);
    const newServant = (0, utils_1.rearrangeCypherObject)(newServantRes);
    // fetch church data
    const churchDataRes = (0, utils_1.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(resolver_cypher_1.getChurchDataQuery, {
        id: args[`${churchLower}Id`],
    })));
    if ((!servantValidation(servant) || !servantValidation(newServant)) &&
        !['ArrivalsCounter', 'Teller', 'SheepSeeker', 'ArrivalsPayer'].includes(servantType) &&
        !removeOnly) {
        return null;
    }
    if (!servant.auth_id) {
        // if he has no auth_id then there is nothing to do
        await (0, utils_2.removeServantCypher)({
            context,
            churchType,
            servantType,
            servant,
            church,
        });
        return (0, helper_functions_1.parseForCache)(servant, church, verb, servantLower);
    }
    if (servant[`${verb}`].length > 1) {
        // If he leads more than one Church don't touch his Auth0 roles
        console.log(`${servant.firstName} ${servant.lastName} leads more than one ${churchType}`);
        await Promise.all([
            // Disconnect him from the Church
            (0, utils_2.removeServantCypher)({
                context,
                churchType,
                servantType,
                servant,
                church,
            }),
            // Send a Mail to That Effect
            (0, notify_1.sendSingleEmail)(servant, 'You Have Been Removed!', undefined, `<p>Hi ${servant.firstName} ${servant.lastName},<br/><br/>We regret to inform you that you have been removed as the <b>${churchType} ${servantType}</b> for <b>${(0, helper_functions_1.churchInEmail)(church)}</b>. Your church data for the last 8 weeks are as follows:
          <br/>
          Service attendance:<b>${churchDataRes.attendance}</b>, Average:<b>${churchDataRes.averageAttendance}</b>
          <br/>
          Income:<b>${churchDataRes.income}</b>, Average:<b>${churchDataRes.averageIncome}</b>
          <br/>
          Bussing:<b>${churchDataRes.bussingAttendance}</b>, Average:${churchDataRes.averageBussingAttendance}.
         <br/><br/>We however encourage you to strive to serve the Lord faithfully in your other roles. Do not be discouraged by this removal; as you work hard we hope and pray that you will soon be restored to your service to him.</p>${texts.html.subscription}`),
        ]);
        await session.close();
        return (0, helper_functions_1.parseForCacheRemoval)(servant, church, verb, servantLower);
    }
    // Check auth0 roles and remove roles 'leaderBacenta'
    const userRoleConfig = await (0, auth0_1.getUserRoles)(servant.auth_id, authToken);
    const userRoleResponse = await (0, axios_1.default)(userRoleConfig);
    const roles = userRoleResponse.data.map((role) => role.name);
    const rolesToCompare = roles;
    // If the person is only a governorship Admin, delete auth0 profile
    if (rolesToCompare.includes(`${servantLower}${churchType}`) &&
        roles.length === 1) {
        const deleteUserConfig = await (0, auth0_1.deleteAuthUserConfig)(servant.auth_id, authToken);
        await (0, axios_1.default)(deleteUserConfig);
        console.log(`Auth0 Account successfully deleted for ${servant.firstName} ${servant.lastName}`);
        // Remove Auth0 ID of Leader from Neo4j DB
        (0, utils_2.removeServantCypher)({
            context,
            churchType,
            servantType,
            servant,
            church,
        });
        const { jwt } = context;
        await session.executeWrite((tx) => tx.run(resolver_cypher_1.removeMemberAuthId, {
            log: `${servant.firstName} ${servant.lastName} was removed as a ${churchType} ${servantType}`,
            auth_id: servant.auth_id,
            jwt,
        }));
        // Send a Mail to That Effect
        (0, notify_1.sendSingleEmail)(servant, 'Your Servant Account Has Been Deleted', undefined, `Hi ${servant.firstName} ${servant.lastName},<br/><br/>This is to inform you that your servant account has been deleted from the First Love State of the Flock Admin Portal. You will no longer have access to any data<br/><br/>his is due to the fact that you have been removed as a ${churchType} ${servantType} for ${(0, helper_functions_1.churchInEmail)(church)}.<br/><br/>We however encourage you to strive to serve the Lord faithfully. Do not be discouraged from loving God by this removal; we hope it is just temporary.${texts.html.subscription}`);
        await session.close();
        return (0, helper_functions_1.parseForCacheRemoval)(servant, church, verb, servantLower);
    }
    // If the person is a bacenta leader as well as any other position, remove role bacenta leader
    if (rolesToCompare.includes(`${servantLower}${churchType}`) &&
        roles.length > 1) {
        (0, utils_2.removeServantCypher)({
            context,
            churchType,
            servantType,
            servant,
            church,
        });
        (0, helper_functions_1.removeRoles)(servant, roles, authRoles[`${servantLower}${churchType}`].id, authToken);
        // Send Email Using Mailgun
        (0, notify_1.sendSingleEmail)(servant, 'You Have Been Removed!', undefined, `<p>Hi ${servant.firstName} ${servant.lastName},<br/><br/>We regret to inform you that you have been removed as the <b>${churchType} ${servantType}</b> for <b>${(0, helper_functions_1.churchInEmail)(church)}</b>.<br/><br/>We however encourage you to strive to serve the Lord faithfully in your other roles. Do not be discouraged by this removal; as you work hard we hope and pray that you will soon be restored to your service to him.</p>${texts.html.subscription}`);
    }
    await session.close();
    return (0, helper_functions_1.parseForCacheRemoval)(servant, church, verb, servantLower);
};
exports.RemoveServant = RemoveServant;
