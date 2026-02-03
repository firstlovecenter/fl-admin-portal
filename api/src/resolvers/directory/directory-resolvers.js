"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const jd_date_utils_1 = require("jd-date-utils");
const utils_1 = require("../utils/utils");
const permissions_1 = require("../permissions");
const make_remove_servants_1 = require("./make-remove-servants");
const auth0_1 = require("../utils/auth0");
const resolver_cypher_1 = require("../cypher/resolver-cypher");
const authenticate_1 = require("../authenticate");
const notify_1 = require("../utils/notify");
const cypher = require('../cypher/resolver-cypher');
const texts = require('../texts.json');
const closeChurchCypher = require('../cypher/close-church-cypher');
const directoryMutation = {
    CreateMember: async (object, args, context) => {
        (0, utils_1.isAuth)([
            ...(0, permissions_1.permitSheepSeeker)(),
            ...(0, permissions_1.permitLeaderAdmin)('Fellowship'),
            ...(0, permissions_1.permitLeader)('Hub'),
        ], context?.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const inactiveMemberResponse = (0, utils_1.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(cypher.checkInactiveMember, {
            email: args.email ?? null,
            whatsappNumber: args?.whatsappNumber ?? null,
        })));
        if (inactiveMemberResponse.count > 0) {
            const activateInactiveMemberResponse = await session.executeWrite((tx) => tx.run(resolver_cypher_1.activateInactiveMember, {
                id: inactiveMemberResponse.id,
                firstName: args?.firstName ?? '',
                middleName: args?.middleName ?? '',
                lastName: args?.lastName ?? '',
                phoneNumber: args?.phoneNumber ?? '',
                dob: args?.dob ?? '',
                maritalStatus: args?.maritalStatus ?? '',
                occupation: args?.occupation ?? '',
                bacenta: args?.bacenta ?? '',
                basonta: args?.basonta ?? '',
                visitationArea: args?.visitationArea ?? '',
                pictureUrl: args?.pictureUrl ?? '',
                auth_id: context.jwt.sub ?? '',
            }));
            const member = (0, utils_1.rearrangeCypherObject)(activateInactiveMemberResponse);
            return member;
        }
        const memberResponse = await session.executeRead((tx) => tx.run(cypher.checkMemberEmailExists, {
            email: args.email ?? null,
            whatsappNumber: args?.whatsappNumber ?? null,
        }));
        const memberCheck = (0, utils_1.rearrangeCypherObject)(memberResponse, true)[0];
        const duplicateMember = memberCheck.member?.properties;
        if (memberCheck.predicate) {
            if (duplicateMember.email === args.email) {
                const errorMsg = `There is a member with this email "${duplicateMember.email}" called ${duplicateMember.firstName} ${duplicateMember.lastName}`;
                const error = new Error(errorMsg);
                error.name = 'DuplicateEmail';
                throw error;
            }
            if (duplicateMember.whatsappNumber === args.whatsappNumber) {
                const errorMsg = `There is a member with this whatsapp number "${duplicateMember.whatsappNumber}" called ${duplicateMember.firstName} ${duplicateMember.lastName}`;
                const error = new Error(errorMsg);
                error.name = 'DuplicateWhatsappNumber';
                throw error;
            }
        }
        const createMemberResponse = await session.executeWrite((tx) => tx.run(resolver_cypher_1.createMember, {
            firstName: args?.firstName ?? '',
            middleName: args?.middleName ?? null,
            lastName: args?.lastName ?? '',
            email: args?.email ?? null,
            phoneNumber: args?.phoneNumber ?? '',
            whatsappNumber: args?.whatsappNumber ?? '',
            dob: args?.dob ?? '',
            maritalStatus: args?.maritalStatus ?? '',
            gender: args?.gender ?? '',
            occupation: args?.occupation ?? '',
            bacenta: args?.bacenta ?? '',
            basonta: args?.basonta ?? '',
            visitationArea: args?.visitationArea ?? '',
            pictureUrl: args?.pictureUrl ?? '',
            auth_id: context.jwt.sub ?? '',
        }));
        const member = (0, utils_1.rearrangeCypherObject)(createMemberResponse);
        await session.close();
        return member;
    },
    UpdateMemberBacenta: async (object, args, context) => {
        (0, utils_1.isAuth)([...(0, permissions_1.permitMe)('Bacenta'), ...(0, permissions_1.permitMe)('Hub'), ...(0, permissions_1.permitSheepSeeker)()], context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const memberRes = await session.executeRead((tx) => tx.run(resolver_cypher_1.matchMemberAndIMCLStatus, {
            id: args.memberId,
        }));
        const member = memberRes.records[0]?.get('member').properties;
        if (member?.imclChecked === false) {
            throw new Error('You cannot move this member without filling IMCL details for them');
        }
        const moveRes = await session.executeWrite((tx) => tx.run(resolver_cypher_1.updateMemberBacenta, {
            id: args.memberId,
            bacentaId: args.bacentaId,
        }));
        const updatedMember = moveRes.records[0]?.get('member').properties;
        return updatedMember;
    },
    UpdateMemberEmail: async (object, args, context) => {
        (0, utils_1.isAuth)([...(0, permissions_1.permitMe)('Fellowship'), ...(0, permissions_1.permitMe)('Hub'), ...(0, permissions_1.permitSheepSeeker)()], context.jwt['https://flcadmin.netlify.app/roles']);
        const authToken = await (0, authenticate_1.getAuthToken)();
        const session = context.executionContext.session();
        const member = (0, utils_1.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(resolver_cypher_1.matchMemberQuery, {
            id: args.id,
        })));
        const updatedMember = (0, utils_1.rearrangeCypherObject)(await session.executeWrite((tx) => tx.run(resolver_cypher_1.updateMemberEmail, {
            id: args.id,
            email: args.email,
        })));
        if (member.auth_id) {
            // Update a user's Auth Profile with Picture and Name Details
            const config = await (0, auth0_1.updateAuthUserConfig)(updatedMember, authToken);
            await (0, axios_1.default)(config);
        }
        await session.close();
        return updatedMember;
    },
    MakeMemberInactive: async (object, args, context) => {
        (0, utils_1.isAuth)([...(0, permissions_1.permitLeaderAdmin)('Governorship'), ...(0, permissions_1.permitSheepSeeker)()], context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const memberCheck = (0, utils_1.rearrangeCypherObject)(await session.run(cypher.checkMemberHasNoActiveRelationships, args));
        if (memberCheck.relationshipCount.low > 0) {
            throw new Error('This member has active roles in church. Please remove all active roles and try again');
        }
        let mutation = resolver_cypher_1.makeMemberInactive;
        if (args.reason.toLowerCase().includes('duplicate')) {
            mutation = resolver_cypher_1.removeDuplicateMember;
        }
        const member = (0, utils_1.rearrangeCypherObject)(await session.run(mutation, {
            id: args.id,
            reason: args.reason,
            jwt: context.jwt,
        }));
        await session.close();
        return member?.properties;
    },
    CloseDownFellowship: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('Governorship'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const res = await Promise.all([
            session.run(closeChurchCypher.checkFellowshipHasNoMembers, args),
            sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
                churchId: args.fellowshipId,
            }),
        ]).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error running checkFellowshipHasNoMembers', error);
        });
        const fellowshipCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
        const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(res[1]);
        if (fellowshipCheck.memberCount > 0) {
            throw new Error(`${fellowshipCheck?.name} Fellowship has ${fellowshipCheck?.memberCount} members. Please transfer all members and try again.`);
        }
        const record = lastServiceRecord.lastService?.properties ?? {
            bankingSlip: null,
        };
        if (!('bankingSlip' in record ||
            record.transactionStatus === 'success' ||
            'tellerConfirmationTime' in record)) {
            throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(record.createdAt)} before attempting to bank this week's offering`);
        }
        try {
            // Fellowship Leader must be removed since the fellowship is being closed down
            await (0, make_remove_servants_1.RemoveServant)(context, args, ['adminCampus', 'adminStream', 'adminCouncil', 'adminGovernorship'], 'Fellowship', 'Leader', true);
            const closeFellowshipResponse = await session.run(closeChurchCypher.closeDownFellowship, {
                jwt: context.jwt,
                fellowshipId: args.fellowshipId,
            });
            const fellowshipResponse = (0, utils_1.rearrangeCypherObject)(closeFellowshipResponse); // Returns a Bacenta
            return fellowshipResponse.bacenta;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
    CloseDownBacenta: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdminArrivals)('Governorship'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        try {
            const bacentaCheckResponse = await session.run(closeChurchCypher.checkBacentaHasNoMembers, args);
            const bacentaCheck = (0, utils_1.rearrangeCypherObject)(bacentaCheckResponse);
            if (bacentaCheck.memberCount > 0) {
                throw new Error(`${bacentaCheck?.name} Bacenta has ${bacentaCheck?.memberCount} members. Please transfer all members and try again.`);
            }
            // Bacenta Leader must be removed since the Bacenta is being closed down
            await (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Governorship'), 'Bacenta', 'Leader', true);
            const closeBacentaResponse = await session.run(closeChurchCypher.closeDownBacenta, {
                jwt: context.jwt,
                bacentaId: args.bacentaId,
            });
            const bacentaResponse = (0, utils_1.rearrangeCypherObject)(closeBacentaResponse);
            return bacentaResponse.governorship;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('a', error);
        }
        finally {
            await session.close();
        }
        return null;
    },
    CloseDownGovernorship: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('Council'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const res = await Promise.all([
            session.run(closeChurchCypher.checkGovernorshipHasNoMembers, args),
            sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
                churchId: args.governorshipId,
            }),
        ]).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error running checkGovernorshipHasNoMembers', error);
        });
        const governorshipCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
        const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(res[1]);
        if (governorshipCheck.bacentaCount.toNumber()) {
            throw new Error(`${governorshipCheck?.name} Governorship has ${governorshipCheck?.bacentaCount} active bacentas. Please close down all bacentas and try again.`);
        }
        if (governorshipCheck.hubCount.toNumber()) {
            throw new Error(`${governorshipCheck?.name} Governorship has ${governorshipCheck?.hubCount} active hubs. Please close down all hubs and try again.`);
        }
        const record = lastServiceRecord.lastService?.properties ?? {
            bankingSlip: null,
        };
        if (!('bankingSlip' in record ||
            record.transactionStatus === 'success' ||
            'tellerConfirmationTime' in record)) {
            throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(record.createdAt)} before attempting to close down this governorship`);
        }
        try {
            // Bacenta Leader must be removed since the Bacenta is being closed down
            await Promise.all([
                (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Council'), 'Governorship', 'Leader', true),
                args.adminId
                    ? (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Council'), 'Governorship', 'Admin')
                    : null,
            ]);
            const closeGovernorshipResponse = await session.run(closeChurchCypher.closeDownGovernorship, {
                jwt: context.jwt,
                governorshipId: args.governorshipId,
            });
            const governorshipResponse = (0, utils_1.rearrangeCypherObject)(closeGovernorshipResponse);
            return governorshipResponse.council;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error closing down this governorship', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
    CloseDownCouncil: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('Stream'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const res = await Promise.all([
            session.run(closeChurchCypher.checkCouncilHasNoMembers, args),
            sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
                churchId: args.councilId,
            }),
        ]).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error running checkCouncilHasNoMembers', error);
        });
        const councilCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
        const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(res[1]);
        if (councilCheck.governorshipCount.toNumber()) {
            throw new Error(`${councilCheck?.name} Council has ${councilCheck?.governorshipCount} active governorships. Please close down all governorships and try again.`);
        }
        if (councilCheck.hubCouncilLeaderCount.toNumber()) {
            throw new Error(`${councilCheck?.name} Council has ${councilCheck?.hubCouncilCount} active hub councils. Please close down all hub councils and try again.`);
        }
        const record = lastServiceRecord.lastService?.properties ?? {
            bankingSlip: null,
        };
        if (!('bankingSlip' in record ||
            record.transactionStatus === 'success' ||
            'tellerConfirmationTime' in record)) {
            throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(record.createdAt)} before attempting to close down this council`);
        }
        try {
            // Council Leader must be removed since the Council is being closed down
            await Promise.all([
                (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Stream'), 'Council', 'Leader', true),
                args.adminId
                    ? (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Stream'), 'Council', 'Admin')
                    : null,
            ]);
            const closeCouncilResponse = await session.run(closeChurchCypher.closeDownCouncil, {
                jwt: context.jwt,
                councilId: args.councilId,
            });
            const councilResponse = (0, utils_1.rearrangeCypherObject)(closeCouncilResponse);
            return councilResponse.stream;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error closing down this council', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
    CloseDownStream: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('Campus'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const res = await Promise.all([
            session.run(closeChurchCypher.checkStreamHasNoMembers, args),
            sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
                churchId: args.streamId,
            }),
        ]).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error running checkStreamHasNoMembers', error);
        });
        const streamCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
        const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(res[1]);
        if (streamCheck.memberCount > 0) {
            throw new Error(`${streamCheck?.name} Stream has ${streamCheck?.councilCount} active councils. Please close down all councils and try again.`);
        }
        if (streamCheck.ministryLeaderCount > 0) {
            throw new Error(`${streamCheck?.name} Stream has ${streamCheck?.ministryCount} active ministries. Please close down all ministries and try again.`);
        }
        const record = lastServiceRecord.lastService?.properties ?? {
            bankingSlip: null,
        };
        if (!('bankingSlip' in record ||
            record.transactionStatus === 'success' ||
            'tellerConfirmationTime' in record)) {
            throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(record.createdAt)} before attempting to close down this stream`);
        }
        try {
            // Stream Leader must be removed since the Stream is being closed down
            await Promise.all([
                (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'Stream', 'Leader', true),
                args.adminId
                    ? (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Campus'), 'Stream', 'Admin')
                    : null,
            ]);
            const closeStreamResponse = await session.run(closeChurchCypher.closeDownStream, {
                jwt: context.jwt,
                streamId: args.streamId,
            });
            const streamResponse = (0, utils_1.rearrangeCypherObject)(closeStreamResponse);
            return streamResponse.campus;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error closing down this stream', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
    CloseDownCampus: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('Oversight'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const res = await Promise.all([
            session.run(closeChurchCypher.checkCampusHasNoMembers, args),
            sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
                churchId: args.campusId,
            }),
        ]).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error running checkCampusHasNoMembers', error);
        });
        const campusCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
        const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(res[1]);
        if (campusCheck.memberCount > 0) {
            throw new Error(`${campusCheck?.name} Campus has ${campusCheck?.streamCount} active streams. Please close down all streams and try again.`);
        }
        if (campusCheck.leaderCount > 0) {
            throw new Error(`${campusCheck?.name} Campus has ${campusCheck?.creativeArtsCount} active creativeArts. Please close down all creativeArts and try again.`);
        }
        const record = lastServiceRecord.lastService?.properties ?? {
            bankingSlip: null,
        };
        if (!('bankingSlip' in record ||
            record.transactionStatus === 'success' ||
            'tellerConfirmationTime' in record)) {
            throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(record.createdAt)} before attempting to close down this campus`);
        }
        try {
            // Stream Leader must be removed since the Stream is being closed down
            await Promise.all([
                (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Oversight'), 'Campus', 'Leader', true),
                args.adminId
                    ? (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Oversight'), 'Campus', 'Admin')
                    : null,
            ]);
            const closeCampusResponse = await session.run(closeChurchCypher.closeDownCampus, {
                jwt: context.jwt,
                campusId: args.campusId,
            });
            const campusResponse = (0, utils_1.rearrangeCypherObject)(closeCampusResponse);
            return campusResponse.oversight;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error closing down this campus', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
    CloseDownOversight: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('Denomination'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const res = await Promise.all([
            session.run(closeChurchCypher.checkOversightHasNoMembers, args),
            sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
                churchId: args.oversightId,
            }),
        ]).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error running checkOversightHasNoMembers', error);
        });
        const oversightCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
        const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(res[1]);
        if (oversightCheck.memberCount) {
            throw new Error(`${oversightCheck?.name} Oversight has ${oversightCheck?.campusCount} active campuses. Please close down all campuses and try again.`);
        }
        const record = lastServiceRecord.lastService?.properties ?? {
            bankingSlip: null,
        };
        if (!('bankingSlip' in record ||
            record.transactionStatus === 'success' ||
            'tellerConfirmationTime' in record)) {
            throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(record.createdAt)} before attempting to close down this campus`);
        }
        try {
            // Stream Leader must be removed since the Stream is being closed down
            await Promise.all([
                (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Denomination'), 'Oversight', 'Leader', true),
                args.adminId
                    ? (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Denomination'), 'Oversight', 'Admin')
                    : null,
            ]);
            const closeOversightResponse = await session.run(closeChurchCypher.closeDownOversight, {
                jwt: context.jwt,
                oversightId: args.oversightId,
            });
            const oversightResponse = (0, utils_1.rearrangeCypherObject)(closeOversightResponse);
            return oversightResponse.denomination;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error closing down this Oversight', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
    CreateMemberAccount: async (object, args, context) => {
        const authToken = await (0, authenticate_1.getAuthToken)();
        const session = context.executionContext.session();
        const memberRes = await session.executeRead((tx) => tx.run(resolver_cypher_1.matchMemberQuery, {
            id: args.memberId,
        }));
        const member = memberRes.records[0]?.get('member');
        const authIdConfig = await (0, auth0_1.getAuthIdConfig)(member, authToken);
        const authIdResponse = await (0, axios_1.default)(authIdConfig);
        if (!authIdResponse.data[0]?.user_id) {
            const authUserConfig = await (0, auth0_1.createAuthUserConfig)(member, authToken);
            const authProfileResponse = await (0, axios_1.default)(authUserConfig);
            const changePassConfig = await (0, auth0_1.changePasswordConfig)(member, authToken);
            const passwordTicketResponse = await (0, axios_1.default)(changePassConfig);
            const res = await Promise.all([
                session.executeWrite((tx) => tx.run(resolver_cypher_1.updateMemberAuthId, {
                    id: args.memberId,
                    auth_id: authProfileResponse.data.user_id,
                })),
                (0, notify_1.sendSingleEmail)(member, 'Welcome to the My First Love Portal', undefined, `<p>Hi ${member.firstName} ${member.lastName},<br/><br/>Welcome to your First Love Membership Portal</b>.<br/><br/>Your account has just been created. Please set up your password by clicking <b><a href=${passwordTicketResponse.data.ticket}>this link</a></b>. After setting up your password, you can log in by clicking <b>https://my.firstlovecenter.com/</b><br/><br/>${texts.html.subscription}`),
            ]);
            return res[0].records[0]?.get('member').properties;
        }
        if (!member.auth_id && authIdResponse.data[0]?.user_id) {
            const res = await session.executeWrite((tx) => tx.run(resolver_cypher_1.updateMemberAuthId, {
                id: args.memberId,
                auth_id: authIdResponse.data[0]?.user_id,
            }));
            return res.records[0]?.get('member').properties;
        }
        return member;
    },
};
exports.default = directoryMutation;
