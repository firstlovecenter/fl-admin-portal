"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils/utils");
const service_cypher_1 = require("../services/service-cypher");
const permissions_1 = require("../permissions");
const utils_2 = require("../directory/utils");
const service_cypher_2 = __importDefault(require("./service-cypher"));
const errorMessage = require('../texts.json').error;
const serviceNoIncomeMutations = {
    RecordServiceNoIncome: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitLeaderAdmin)('Fellowship'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const relationshipCheck = (0, utils_1.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(service_cypher_1.checkCurrentServiceLog, args)));
        if (!relationshipCheck.exists) {
            // Checks if the church has a current history record otherwise creates it
            const getServantAndChurch = (0, utils_1.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(service_cypher_1.getServantAndChurch, args)));
            await (0, utils_2.makeServantCypher)({
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
        const serviceCheck = (0, utils_1.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(service_cypher_1.checkFormFilledThisWeek, args)));
        if (serviceCheck.alreadyFilled) {
            throw new Error(errorMessage.no_double_form_filling);
        }
        if (serviceCheck.labels?.includes('Vacation')) {
            throw new Error(errorMessage.vacation_cannot_fill_service);
        }
        const serviceDetails = (0, utils_1.rearrangeCypherObject)(await session.executeWrite((tx) => tx.run(service_cypher_2.default, {
            ...args,
            jwt: context.jwt,
        })));
        return serviceDetails.serviceRecord.properties;
    },
};
exports.default = serviceNoIncomeMutations;
