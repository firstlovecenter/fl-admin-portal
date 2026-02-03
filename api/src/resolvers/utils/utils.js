"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNeoNumber = exports.nextHigherChurch = exports.isAuth = exports.rearrangeCypherObject = exports.errorHandling = exports.noEmptyArgsValidation = exports.throwToSentry = exports.checkIfArrayHasRepeatingValues = void 0;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable no-relative-import-paths/no-relative-import-paths */
const node_1 = require("@sentry/node");
const checkIfArrayHasRepeatingValues = (array) => {
    const sortedArray = array.sort();
    for (let i = 0; i < sortedArray.length - 1; i += 1) {
        if (sortedArray[i + 1] === sortedArray[i]) {
            return true;
        }
    }
    return false;
};
exports.checkIfArrayHasRepeatingValues = checkIfArrayHasRepeatingValues;
const throwToSentry = (message, error) => {
    let errorVar = '';
    if (error) {
        errorVar = error;
    }
    if (error?.response?.statusText) {
        errorVar = `${error.response.status} ${error.response.statusText}`;
    }
    if (error?.response?.data?.message) {
        errorVar = error?.response?.data?.message;
    }
    if (error?.response?.data?.data) {
        errorVar = JSON.stringify(error?.response?.data?.data);
    }
    // eslint-disable-next-line no-console
    console.error(`${message} ${JSON.stringify(error)}`);
    console.log('🚀 ~ file: utils.ts:49 ~ errorVar:', errorVar);
    (0, node_1.captureException)(error, {
        tags: {
            message,
        },
    });
    throw new Error(`${message} ${errorVar}`);
};
exports.throwToSentry = throwToSentry;
const noEmptyArgsValidation = (args) => {
    if (!args.length) {
        (0, exports.throwToSentry)('Argument not in Array', Error('Args must be passed in array'));
    }
    args.forEach((argument, index) => {
        if (!argument) {
            (0, exports.throwToSentry)('No Empty Arguments Allowed', Error(`${args[index - 1]} Argument Cannot Be Empty`));
        }
    });
};
exports.noEmptyArgsValidation = noEmptyArgsValidation;
const errorHandling = (member) => {
    if (!member.email) {
        throw new Error(`${member.firstName} ${member.lastName} does not have a valid email address. Please add an email address and then try again`);
    }
};
exports.errorHandling = errorHandling;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rearrangeCypherObject = (response, horizontal) => {
    const member = {};
    response.records[0]?.keys.forEach((value, index) => {
        // eslint-disable-next-line no-underscore-dangle
        member[value] = response.records[0]._fields[index];
    });
    response.records.forEach((record, index) => {
        record.keys.forEach((value, j) => {
            // eslint-disable-next-line no-underscore-dangle
            member[value] = response.records[index]._fields[j];
        });
    });
    if (horizontal) {
        const records = [];
        response.records.forEach((record, index) => {
            const object = {};
            record?.keys.forEach((key, j) => {
                // eslint-disable-next-line no-underscore-dangle
                object[key] = response.records[index]._fields[j];
            });
            records.push(object);
        });
        return records;
    }
    return member?.member || member;
};
exports.rearrangeCypherObject = rearrangeCypherObject;
const isAuth = (permittedRoles, userRoles) => {
    if (!permittedRoles.some((r) => userRoles?.includes(r))) {
        throw new Error('You are not permitted to run this mutation');
    }
};
exports.isAuth = isAuth;
const nextHigherChurch = (churchLevel) => {
    switch (churchLevel) {
        case 'Fellowship':
            return 'Bacenta';
        case 'Bacenta':
            return 'Governorship';
        case 'Governorship':
            return 'Council';
        case 'Council':
            return 'Stream';
        case 'Stream':
            return 'Campus';
        case 'Campus':
            return 'Oversight';
        case 'Hub':
            return 'Ministry';
        case 'Ministry':
            return 'CreativeArts';
        case 'CreativeArts':
            return 'Campus';
        default:
            return 'Oversight';
    }
};
exports.nextHigherChurch = nextHigherChurch;
const parseNeoNumber = (neoNumber) => {
    if (!neoNumber)
        return 0;
    if (neoNumber?.low)
        return neoNumber.low;
    if (typeof neoNumber === 'number')
        return neoNumber;
    return 0;
};
exports.parseNeoNumber = parseNeoNumber;
