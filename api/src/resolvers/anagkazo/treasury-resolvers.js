"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle */
const utils_1 = require("../utils/utils");
const make_remove_servants_1 = require("../directory/make-remove-servants");
const permissions_1 = require("../permissions");
const treasury_cypher_1 = __importDefault(require("./treasury-cypher"));
const treasuryMutations = {
    MakeStreamTeller: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, [...(0, permissions_1.permitAdmin)('Stream')], 'Stream', 'Teller'),
    RemoveStreamTeller: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, [...(0, permissions_1.permitAdmin)('Stream')], 'Stream', 'Teller'),
    ConfirmBanking: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitTellerStream)(), context?.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        (0, utils_1.noEmptyArgsValidation)(['governorshipId']);
        // const today = new Date()
        // if (today.getDay() > 6) {
        //   throw new Error('You cannot receive offerings today! Thank you')
        // }
        //  implement checks to make sure that all the fellowships have filled their offering
        const formDefaultersResponse = (0, utils_1.rearrangeCypherObject)(await session
            .run(treasury_cypher_1.default.formDefaultersCount, args)
            .catch((error) => (0, utils_1.throwToSentry)('There was an error running cypher', error)));
        // const checks = await Promise.all([
        //   session.executeRead((tx) =>
        //     tx.run(anagkazo.membershipAttendanceDefaultersCount, args)
        //   ),
        //   sessionTwo.executeRead((tx) =>
        //     tx.run(anagkazo.imclDefaultersCount, args)
        //   ),
        // ])
        // const membershipAttendanceDefaultersCount = parseNeoNumber(
        //   checks[0].records[0]?.get('defaulters')
        // )
        // const membershipAttendanceDefaultersList =
        //   checks[0].records[0]?.get('defaultersNames')
        // const imclDefaultersCount = parseNeoNumber(
        //   checks[1].records[0]?.get('defaulters')
        // )
        // const imcleDefaultersList = checks[1].records[0]?.get('defaultersNames')
        const formDefaultersCount = formDefaultersResponse.defaulters.low;
        const formDefaultersList = formDefaultersResponse.defaultersNames;
        if (formDefaultersCount > 0) {
            throw new Error(`You cannot confirm this governorship until all the active fellowships have filled their forms. Outstanding fellowships are: ${formDefaultersList.join(', ')}`);
        }
        // if (membershipAttendanceDefaultersCount > 0) {
        //   throw new Error(
        //     `You cannot confirm this governorship until all the active fellowships have marked their attendance on the Poimen App. Outstanding fellowships are: ${membershipAttendanceDefaultersList.join(
        //       ', '
        //     )}`
        //   )
        // }
        // if (imclDefaultersCount > 0) {
        //   throw new Error(
        //     `You cannot confirm this governorship until all the active fellowships have filled their IMCL forms on the Poimen App. Oustanding fellowships are: ${imcleDefaultersList.join(
        //       ', '
        //     )}`
        //   )
        // }
        const checkAlreadyConfirmedResponse = (0, utils_1.rearrangeCypherObject)(await session
            .run(treasury_cypher_1.default.bankingDefaulersCount, args)
            .catch((error) => (0, utils_1.throwToSentry)('There was an error running cypher', error)));
        const checkAlreadyConfirmed = checkAlreadyConfirmedResponse.bankingDefaulters.low;
        if (checkAlreadyConfirmed < 1) {
            throw new Error("This governorship's offering has already been banked!");
        }
        try {
            const response = await session.executeWrite((tx) => tx.run(treasury_cypher_1.default.confirmBanking, {
                ...args,
                jwt: context.jwt,
            }));
            const confirmationResponse = (0, utils_1.rearrangeCypherObject)(response);
            if (typeof confirmationResponse === 'string') {
                return confirmationResponse;
            }
            // return confirmationResponse.governorship.properties
            return {
                ...confirmationResponse.governorship.properties,
                banked: true,
            };
        }
        catch (error) {
            throw new Error(`There was a problem confirming the banking ${error}`);
        }
        finally {
            await Promise.all([session.close(), sessionTwo.close()]);
        }
    },
};
exports.default = treasuryMutations;
