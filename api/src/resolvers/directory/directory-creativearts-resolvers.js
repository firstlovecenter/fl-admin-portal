"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jd_date_utils_1 = require("jd-date-utils");
const utils_1 = require("../utils/utils");
const permissions_1 = require("../permissions");
const make_remove_servants_1 = require("./make-remove-servants");
const closeChurchCypher = require('../cypher/close-church-creativearts-cypher');
const directoryCreativeArtsMutation = {
    CloseDownHub: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('Hub'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        try {
            const res = await Promise.all([
                session.run(closeChurchCypher.checkHubHasNoMembers, args),
                sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
                    churchId: args.hubId,
                }),
            ]).catch((error) => {
                (0, utils_1.throwToSentry)('There was an error running checkHubHasNoMembers', error);
            });
            const hubCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
            const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(res[1]);
            if (hubCheck.memberCount) {
                throw new Error(`${hubCheck?.name} Hub has ${hubCheck?.fellowshipCount} active fellowships. Please close down all fellowships and try again.`);
            }
            const record = lastServiceRecord.lastService?.properties ?? {
                bankingSlip: null,
            };
            if (!('bankingSlip' in record ||
                record.transactionStatus === 'success' ||
                'tellerConfirmationTime' in record)) {
                throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(record.createdAt)} before attempting to close down this hub`);
            }
            // Hub  Leader must be removed since the Hub is being closed down
            await Promise.all([
                (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Hub'), 'Hub', 'Leader', true),
                args.adminId
                    ? (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Hub'), 'Hub', 'Admin')
                    : null,
            ]);
            const closeHubResponse = await session.run(closeChurchCypher.closeDownHub, {
                jwt: context.jwt,
                hubId: args.hubId,
            });
            const hubResponse = (0, utils_1.rearrangeCypherObject)(closeHubResponse);
            return hubResponse.hubCouncil;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error closing down this hub', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
    CloseDownHubCouncil: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('HubCouncil'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        try {
            const res = await Promise.all([
                session.run(closeChurchCypher.checkHubCouncilHasNoMembers, args),
                sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
                    churchId: args.hubCouncilId,
                }),
            ]).catch((error) => {
                (0, utils_1.throwToSentry)('There was an error running checkHubCouncilHasNoMembers', error);
            });
            const hubcouncilCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
            const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(res[1]);
            if (hubcouncilCheck.memberCount) {
                throw new Error(`${hubcouncilCheck?.name} HubCouncil has ${hubcouncilCheck?.hubCount} active hubs. Please close down all hubs and try again.`);
            }
            const record = lastServiceRecord.lastService?.properties ?? {
                bankingSlip: null,
            };
            if (!('bankingSlip' in record ||
                record.transactionStatus === 'success' ||
                'tellerConfirmationTime' in record)) {
                throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(record.createdAt)} before attempting to close down this hub council`);
            }
            await Promise.all([
                (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('HubCouncil'), 'HubCouncil', 'Leader', true),
                args.adminId
                    ? (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('HubCouncil'), 'HubCouncil', 'Admin')
                    : null,
            ]);
            const closeHubCouncilResponse = await session.run(closeChurchCypher.closeDownHubCouncil, {
                jwt: context.jwt,
                hubCouncilId: args.hubCouncilId,
            });
            const hubCouncilResponse = (0, utils_1.rearrangeCypherObject)(closeHubCouncilResponse);
            return hubCouncilResponse.ministry;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error closing down this hubcouncil', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
    CloseDownMinistry: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('Ministry'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const res = await Promise.all([
            session.run(closeChurchCypher.checkMinistryHasNoMembers, args),
            sessionTwo.run(closeChurchCypher.getLastServiceRecord, {
                churchId: args.ministryId,
            }),
        ]).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error running checkMinistryHasNoMembers', error);
        });
        const ministryCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
        const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(res[1]);
        if (ministryCheck.memberCount) {
            throw new Error(`${ministryCheck?.name} Ministry has ${ministryCheck?.hubCouncilCount} active hubcouncils. Please close down all hubcouncils and try again.`);
        }
        const record = lastServiceRecord.lastService?.properties ?? {
            bankingSlip: null,
        };
        if (!('bankingSlip' in record ||
            record.transactionStatus === 'success' ||
            'tellerConfirmationTime' in record)) {
            throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(record.createdAt)} before attempting to close down this creative arts`);
        }
        try {
            // creative arts Leader must be removed since the creative art is being closed down
            await Promise.all([
                (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Ministry'), 'Ministry', 'Leader', true),
                args.adminId
                    ? (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('Ministry'), 'Ministry', 'Admin')
                    : null,
            ]);
            const closeMinistryResponse = await session.run(closeChurchCypher.closeDownMinistry, {
                jwt: context.jwt,
                ministryId: args.ministryId,
            });
            const ministryResponse = (0, utils_1.rearrangeCypherObject)(closeMinistryResponse);
            return ministryResponse.creativeArts;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error closing down this ministry', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
    CloseDownCreativeArts: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('CreativeArts'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const res = await Promise.all([
            session.run(closeChurchCypher.checkCreativeArtsHasNoMembers, args),
        ]).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error running checkCreativeArtsHasNoMembers', error);
        });
        const creativeArtsCheck = (0, utils_1.rearrangeCypherObject)(res[0]);
        if (creativeArtsCheck.memberCount) {
            throw new Error(`${creativeArtsCheck?.name} CreativeArt has ${creativeArtsCheck?.ministryCount} active ministries. Please close down all ministries and try again.`);
        }
        try {
            // creative arts Leader must be removed since the creative art is being closed down
            await Promise.all([
                (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('CreativeArts'), 'CreativeArts', 'Leader', true),
                args.adminId
                    ? (0, make_remove_servants_1.RemoveServant)(context, args, (0, permissions_1.permitAdmin)('CreativeArts'), 'CreativeArts', 'Admin')
                    : null,
            ]);
            const closeCreativeArtsResponse = await session.run(closeChurchCypher.closeDownCreativeArts, {
                jwt: context.jwt,
                creativeArtsId: args.creativeArtsId,
            });
            const creativeArtsResponse = (0, utils_1.rearrangeCypherObject)(closeCreativeArtsResponse);
            return creativeArtsResponse.campus;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error closing down this CreativeArts', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
};
exports.default = directoryCreativeArtsMutation;
