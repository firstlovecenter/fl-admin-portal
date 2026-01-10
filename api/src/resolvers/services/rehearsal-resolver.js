"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkServantHasCurrentHistory = void 0;
const utils_1 = require("../directory/utils");
const permissions_1 = require("../permissions");
const utils_2 = require("../utils/utils");
const service_cypher_1 = require("./service-cypher");
const rehearsal_cypher_1 = require("./rehearsal-cypher");
const errorMessage = require('../texts.json').error;
const checkServantHasCurrentHistory = async (session, context, args) => {
    const relationshipCheck = (0, utils_2.rearrangeCypherObject)(await session.run(rehearsal_cypher_1.checkCurrentServiceLog, { churchId: args.churchId }));
    if (!relationshipCheck.exists) {
        const getServantAndChurch = (0, utils_2.rearrangeCypherObject)(await session.run(rehearsal_cypher_1.getServantAndChurch, { churchId: args.churchId }));
        if (Object.keys(getServantAndChurch).length === 0) {
            throw new Error('You must set a leader over this church before you can fill this form');
        }
        await (0, utils_1.makeServantCypher)({
            context,
            churchType: getServantAndChurch.churchType,
            servantType: 'Leader',
            servant: {
                id: getServantAndChurch.servantId,
                auth_id: getServantAndChurch.auth_id,
                firstName: getServantAndChurch.firstName,
                lastName: getServantAndChurch.lastName,
            },
            args: {
                leaderId: getServantAndChurch.servantId,
            },
            church: {
                id: getServantAndChurch.churchId,
                name: getServantAndChurch.churchName,
            },
        });
    }
};
exports.checkServantHasCurrentHistory = checkServantHasCurrentHistory;
const SontaServiceMutation = {
    RecordHubCouncilSundayAttendance: async (object, args, context) => {
        (0, utils_2.isAuth)((0, permissions_1.permitLeaderAdmin)('HubCouncil'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        await (0, exports.checkServantHasCurrentHistory)(session, context, {
            churchId: args.churchId,
        });
        const serviceCheck = (0, utils_2.rearrangeCypherObject)(await session.run(rehearsal_cypher_1.checkMinistryAttendanceFormFilledThisWeek, args));
        if (serviceCheck.alreadyFilled &&
            !['Ministry', 'CreativeArts'].some((label) => serviceCheck.higherChurchLabels?.includes(label))) {
            throw new Error(errorMessage.no_double_form_filling);
        }
        if (serviceCheck.labels?.includes('Vacation')) {
            throw new Error(errorMessage.vacation_cannot_fill_service);
        }
        const secondSession = context.executionContext.session();
        let aggregateCypher = '';
        if (serviceCheck.higherChurchLabels?.includes('HubCouncil')) {
            aggregateCypher = rehearsal_cypher_1.aggregateMinistryMeetingDataForHubCouncil;
        }
        else if (serviceCheck.higherChurchLabels?.includes('Ministry')) {
            aggregateCypher = rehearsal_cypher_1.aggregateMinistryMeetingDataForMinistry;
        }
        else if (serviceCheck.higherChurchLabels?.includes('CreativeArts')) {
            aggregateCypher = rehearsal_cypher_1.aggregateMinistryMeetingDataForCreativeArts;
        }
        const cypherResponse = await session
            .run(rehearsal_cypher_1.recordSundayMinistryAttendance, {
            ...args,
            jwt: context.jwt,
        })
            .catch((error) => (0, utils_2.throwToSentry)('Error fellowship ministry attendance meeting', error));
        secondSession
            .run(aggregateCypher, {
            churchId: args.churchId,
        })
            .catch((error) => console.error('Error aggregating Service', error));
        session.close();
        const serviceDetails = (0, utils_2.rearrangeCypherObject)(cypherResponse);
        return serviceDetails.ministryAttendanceRecord.properties;
    },
    RecordRehearsalMeeting: async (object, args, context) => {
        (0, utils_2.isAuth)((0, permissions_1.permitLeaderAdmin)('Hub'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const sessionThree = context.executionContext.session();
        try {
            if ((0, utils_2.checkIfArrayHasRepeatingValues)(args.treasurers)) {
                throw new Error(errorMessage.repeatingTreasurers);
            }
            await (0, exports.checkServantHasCurrentHistory)(session, context, {
                churchId: args.churchId,
            });
            const promises = [
                session.executeRead((tx) => tx.run(rehearsal_cypher_1.checkRehearsalFormFilledThisWeek, args)),
                sessionTwo.executeRead((tx) => tx.run(service_cypher_1.getCurrency, args)),
                sessionThree.executeRead((tx) => tx.run(service_cypher_1.getHigherChurches, args)),
            ];
            const serviceCheckRes = await Promise.all(promises);
            const serviceCheck = (0, utils_2.rearrangeCypherObject)(serviceCheckRes[0]);
            const currencyCheck = (0, utils_2.rearrangeCypherObject)(serviceCheckRes[1]);
            if (serviceCheck.alreadyFilled &&
                ![''].some((label) => serviceCheck.labels?.includes(label))) {
                throw new Error(errorMessage.no_double_form_filling);
            }
            if (serviceCheck.labels?.includes('Vacation')) {
                throw new Error(errorMessage.vacation_cannot_fill_service);
            }
            const aggregateCypher = '';
            const cypherResponse = await session
                .run(rehearsal_cypher_1.recordHubRehearsalService, {
                ...args,
                conversionRateToDollar: currencyCheck.conversionRateToDollar,
                jwt: context.jwt,
            })
                .catch((error) => (0, utils_2.throwToSentry)('', error));
            const aggregatePromises = [
                sessionTwo.executeWrite((tx) => tx.run(aggregateCypher, {
                    churchId: args.churchId,
                })),
            ];
            await Promise.all(aggregatePromises).catch((error) => (0, utils_2.throwToSentry)('Error Aggregating Hub Rehearsals', error));
            const serviceDetails = (0, utils_2.rearrangeCypherObject)(cypherResponse);
            return serviceDetails.rehearsalRecord.properties;
        }
        catch (error) {
            (0, utils_2.throwToSentry)('Error Recording hub rehearsal Service', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
            await sessionThree.close();
        }
        return null;
    },
    RecordMinistryOnStageAttendance: async (object, args, context) => {
        (0, utils_2.isAuth)((0, permissions_1.permitLeaderAdmin)('Ministry'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        const sessionThree = context.executionContext.session();
        try {
            await (0, exports.checkServantHasCurrentHistory)(session, context, {
                churchId: args.churchId,
            });
            const promises = [
                session.executeRead((tx) => tx.run(rehearsal_cypher_1.checkMinistryStageAttendanceFormFilledThisWeek, args)),
                sessionTwo.executeRead((tx) => tx.run(service_cypher_1.getHigherChurches, args)),
                sessionThree.executeRead((tx) => tx.run(rehearsal_cypher_1.checkStreamServiceDay, args)),
            ];
            const serviceCheckRes = await Promise.all(promises);
            const serviceCheck = (0, utils_2.rearrangeCypherObject)(serviceCheckRes[0]);
            const streamServiceDayCheck = (0, utils_2.rearrangeCypherObject)(serviceCheckRes[2]);
            if (!streamServiceDayCheck.serviceDay) {
                throw new Error(errorMessage.not_stream_service_day);
            }
            if (serviceCheck.alreadyFilled &&
                !['CreativeArts'].some((label) => serviceCheck.labels?.includes(label))) {
                throw new Error(errorMessage.no_double_form_filling);
            }
            const aggregateCypher = '';
            const cypherResponse = await session
                .run(rehearsal_cypher_1.recordOnStageAttendance, {
                ...args,
                jwt: context.jwt,
            })
                .catch((error) => (0, utils_2.throwToSentry)('Error Recording OnStage Performance attendance', error));
            const aggregatePromises = [
                sessionTwo.executeWrite((tx) => tx.run(aggregateCypher, {
                    churchId: args.churchId,
                })),
            ];
            await Promise.all(aggregatePromises).catch((error) => (0, utils_2.throwToSentry)('Error Aggregating OnStage Performance', error));
            const serviceDetails = cypherResponse.records[0].get('stageAttendanceRecord').properties;
            return serviceDetails;
        }
        catch (error) {
            (0, utils_2.throwToSentry)('Error recording OnStage attendance', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
            await sessionThree.close();
        }
        return null;
    },
    RecordCancelledOnstagePerformance: async (object, args, context) => {
        (0, utils_2.isAuth)((0, permissions_1.permitLeaderAdmin)('Ministry'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        try {
            await (0, exports.checkServantHasCurrentHistory)(session, context, {
                churchId: args.churchId,
            });
            const promises = [
                session.executeRead((tx) => tx.run(rehearsal_cypher_1.checkMinistryStageAttendanceFormFilledThisWeek, args)),
                sessionTwo.executeRead((tx) => tx.run(rehearsal_cypher_1.checkStreamServiceDay, args)),
            ];
            const serviceCheckRes = await Promise.all(promises);
            const serviceCheck = (0, utils_2.rearrangeCypherObject)(serviceCheckRes[0]);
            const streamServiceDayCheck = (0, utils_2.rearrangeCypherObject)(serviceCheckRes[2]);
            if (!streamServiceDayCheck.serviceDay) {
                throw new Error(errorMessage.not_stream_service_day);
            }
            if (serviceCheck.alreadyFilled &&
                !['CreativeArts'].some((label) => serviceCheck.labels?.includes(label))) {
                throw new Error(errorMessage.no_double_form_filling);
            }
            const cypherResponse = await session
                .run(rehearsal_cypher_1.recordCancelledOnStagePerformance, {
                ...args,
                jwt: context.jwt,
            })
                .catch((error) => (0, utils_2.throwToSentry)('Error Cancelling OnStage Performance attendance', error));
            const serviceDetails = (0, utils_2.rearrangeCypherObject)(cypherResponse);
            return serviceDetails.stagePerformanceRecord.properties;
        }
        catch (error) {
            (0, utils_2.throwToSentry)('Error cancelling OnStage performance', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
        }
        return null;
    },
};
exports.default = SontaServiceMutation;
