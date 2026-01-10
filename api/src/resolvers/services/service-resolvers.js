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
    const relationshipCheck = await session.executeRead((tx) => tx.run(service_cypher_1.checkCurrentServiceLog, { churchId: args.churchId }));
    const relationExists = relationshipCheck.records[0]?.get('exists');
    if (!relationExists) {
        // Checks if the church has a current history record otherwise creates it
        const getServantAndChurch = await session.executeRead((tx) => tx.run(service_cypher_1.getServantAndChurch, { churchId: args.churchId }));
        const servantAndChurch = {
            churchId: getServantAndChurch.records[0]?.get('churchId'),
            churchName: getServantAndChurch.records[0]?.get('churchName'),
            churchType: getServantAndChurch.records[0]?.get('churchType'),
            servantId: getServantAndChurch.records[0]?.get('servantId'),
            auth_id: getServantAndChurch.records[0]?.get('auth_id'),
            firstName: getServantAndChurch.records[0]?.get('firstName'),
            lastName: getServantAndChurch.records[0]?.get('lastName'),
        };
        if (Object.keys(servantAndChurch).length === 0) {
            throw new Error('You must set a leader over this church before you can fill this form');
        }
        await (0, utils_1.makeServantCypher)({
            context,
            churchType: servantAndChurch.churchType,
            servantType: 'Leader',
            servant: {
                id: servantAndChurch.servantId,
                auth_id: servantAndChurch.auth_id,
                firstName: servantAndChurch.firstName,
                lastName: servantAndChurch.lastName,
            },
            args: {
                leaderId: servantAndChurch.servantId,
            },
            church: {
                id: servantAndChurch.churchId,
                name: servantAndChurch.churchName,
            },
        });
    }
};
exports.checkServantHasCurrentHistory = checkServantHasCurrentHistory;
const serviceMutation = {
    RecordService: async (object, args, context) => {
        (0, utils_2.isAuth)((0, permissions_1.permitLeaderAdmin)('Fellowship'), context.jwt['https://flcadmin.netlify.app/roles']);
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
                session.executeRead((tx) => tx.run(service_cypher_1.checkFormFilledThisWeek, args)),
                sessionTwo.executeRead((tx) => tx.run(service_cypher_1.getCurrency, args)),
                sessionThree.executeRead((tx) => tx.run(service_cypher_1.getHigherChurches, args)),
            ];
            const serviceCheckRes = await Promise.all(promises);
            const serviceCheck = (0, utils_2.rearrangeCypherObject)(serviceCheckRes[0]);
            const currencyCheck = (0, utils_2.rearrangeCypherObject)(serviceCheckRes[1]);
            if (serviceCheck.alreadyFilled &&
                !['Oversight', 'Denomination'].some((label) => serviceCheck.labels?.includes(label))) {
                throw new Error(errorMessage.no_double_form_filling);
            }
            if (serviceCheck.labels?.includes('Vacation')) {
                throw new Error(errorMessage.vacation_cannot_fill_service);
            }
            const cypherResponse = await session
                .executeWrite((tx) => tx.run(service_cypher_1.recordService, {
                ...args,
                conversionRateToDollar: currencyCheck.conversionRateToDollar,
                jwt: context.jwt,
            }))
                .catch((error) => (0, utils_2.throwToSentry)('Error Recording Service', error));
            const serviceRecordId = cypherResponse.records[0].get('serviceRecord').properties.id;
            await session.executeWrite((tx) => tx.run(service_cypher_1.absorbAllTransactions, {
                ...args,
                conversionRateToDollar: currencyCheck.conversionRateToDollar,
                serviceRecordId,
            }));
            const serviceDetails = (0, utils_2.rearrangeCypherObject)(cypherResponse);
            return serviceDetails.serviceRecord.properties;
        }
        catch (error) {
            (0, utils_2.throwToSentry)('Error Recording Service', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
            await sessionThree.close();
        }
        return null;
    },
    RecordSpecialService: async (object, args, context) => {
        (0, utils_2.isAuth)((0, permissions_1.permitLeaderAdmin)('Fellowship'), context.jwt['https://flcadmin.netlify.app/roles']);
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
                sessionTwo.executeRead((tx) => tx.run(service_cypher_1.getCurrency, args)),
                sessionThree.executeRead((tx) => tx.run(service_cypher_1.getHigherChurches, args)),
            ];
            const serviceCheckRes = await Promise.all(promises);
            const currencyCheck = (0, utils_2.rearrangeCypherObject)(serviceCheckRes[0]);
            if (currencyCheck.labels?.includes('Vacation')) {
                throw new Error(errorMessage.vacation_cannot_fill_service);
            }
            const cypherResponse = await session
                .executeWrite((tx) => tx.run(service_cypher_1.recordSpecialService, {
                ...args,
                conversionRateToDollar: currencyCheck.conversionRateToDollar,
                jwt: context.jwt,
            }))
                .catch((error) => (0, utils_2.throwToSentry)('Error Recording Service', error));
            const serviceRecordId = cypherResponse.records[0].get('serviceRecord').properties.id;
            await session.executeWrite((tx) => tx.run(service_cypher_1.absorbAllTransactions, {
                ...args,
                conversionRateToDollar: currencyCheck.conversionRateToDollar,
                serviceRecordId,
            }));
            const serviceDetails = (0, utils_2.rearrangeCypherObject)(cypherResponse);
            return serviceDetails.serviceRecord.properties;
        }
        catch (error) {
            (0, utils_2.throwToSentry)('Error Recording Service', error);
        }
        finally {
            await session.close();
            await sessionTwo.close();
            await sessionThree.close();
        }
        return null;
    },
    RecordCancelledService: async (object, args, context) => {
        (0, utils_2.isAuth)((0, permissions_1.permitLeaderAdmin)('Bacenta'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const relationshipCheck = (0, utils_2.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(service_cypher_1.checkCurrentServiceLog, args)));
        if (!relationshipCheck.exists) {
            // Checks if the church has a current history record otherwise creates it
            const getServantAndChurch = (0, utils_2.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(service_cypher_1.getServantAndChurch, args)));
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
        const serviceCheck = (0, utils_2.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(service_cypher_1.checkFormFilledThisWeek, args)));
        if (serviceCheck.alreadyFilled) {
            throw new Error(errorMessage.no_double_form_filling);
        }
        if (serviceCheck.labels?.includes('Vacation')) {
            throw new Error(errorMessage.vacation_cannot_fill_service);
        }
        let cypher = service_cypher_1.recordCancelledService;
        if (serviceCheck.labels?.includes('Hub')) {
            cypher = rehearsal_cypher_1.recordCancelledService;
        }
        const cypherResponse = await session.executeWrite((tx) => tx.run(cypher, {
            ...args,
            jwt: context.jwt,
        }));
        await session.close();
        const serviceDetails = (0, utils_2.rearrangeCypherObject)(cypherResponse);
        return serviceDetails.serviceRecord.properties;
    },
};
exports.default = serviceMutation;
