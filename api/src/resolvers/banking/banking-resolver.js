"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfLastServiceBanked = void 0;
const axios_1 = __importDefault(require("axios"));
const jd_date_utils_1 = require("jd-date-utils");
const permissions_1 = require("../permissions");
const financial_utils_1 = require("../utils/financial-utils");
const utils_1 = require("../utils/utils");
const banking_cypher_1 = require("./banking-cypher");
const secrets_1 = require("../secrets");
const checkIfLastServiceBanked = async (serviceRecordId, context) => {
    const session = context.executionContext.session();
    const sessionTwo = context.executionContext.session();
    // this checks if the person has banked their last offering
    const lastServiceResponse = await Promise.all([
        session.run(banking_cypher_1.getLastServiceRecord, {
            serviceRecordId,
            jwt: context.jwt,
        }),
        sessionTwo.run(banking_cypher_1.checkIfIMCLNotFilled, {
            serviceRecordId,
            jwt: context.jwt,
        }),
    ]).catch((error) => (0, utils_1.throwToSentry)('There was a problem checking the lastService', error));
    const lastServiceRecord = (0, utils_1.rearrangeCypherObject)(lastServiceResponse[0]);
    // const imclNotFilled: boolean =
    //   lastServiceResponse[1].records[0]?.get('imclNotFilled')
    if (!('lastService' in lastServiceRecord))
        return true;
    const lastService = lastServiceRecord.lastService.properties;
    // const currentService = lastServiceRecord.record.properties
    const date = lastServiceRecord.lastDate.properties;
    // const { church } = lastServiceRecord
    if (!('bankingSlip' in lastService ||
        lastService.transactionStatus === 'success' ||
        'tellerConfirmationTime' in lastService)) {
        throw new Error(`Please bank outstanding offering for your service filled on ${(0, jd_date_utils_1.getHumanReadableDate)(date.date)} before attempting to bank this week's offering`);
    }
    // if (!currentService.markedAttendance && church.labels.includes('Bacenta')) {
    //   throw new Error(
    //     'Please tick the present members on the Poimen App before you will be allowed to bank your offering'
    //   )
    // }
    // if (imclNotFilled) {
    //   throw new Error(
    //     'Please fill the IMCL form on the Poimen App before you will be allowed to bank your offering'
    //   )
    // }
    return true;
};
exports.checkIfLastServiceBanked = checkIfLastServiceBanked;
const bankingMutation = {
    BankServiceOffering: async (object, args, context) => {
        const SECRETS = await (0, secrets_1.loadSecrets)();
        (0, utils_1.isAuth)((0, permissions_1.permitLeaderAdmin)('Bacenta'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        // This code checks if there has already been a successful transaction
        const transactionResponse = (0, utils_1.rearrangeCypherObject)(await session
            .run(banking_cypher_1.checkTransactionReference, args)
            .catch((error) => (0, utils_1.throwToSentry)('There was a problem checking the transactionReference', error)));
        try {
            const { auth, subaccount } = await (0, financial_utils_1.getStreamFinancials)(transactionResponse?.stream);
            if (!subaccount && SECRETS.TEST_ENV !== 'true') {
                throw new Error(`There was an error with the payment. Please email admin@firstlovecenter.com ${JSON.stringify({
                    transactionResponse,
                    args,
                    subaccount,
                })}`);
            }
            await (0, exports.checkIfLastServiceBanked)(args.serviceRecordId, context);
            const transactionStatus = transactionResponse?.record.transactionStatus;
            if (transactionStatus === 'success') {
                throw new Error('Banking has already been done for this service');
            }
            if (transactionStatus === 'pending') {
                throw new Error('Please confirm your initial payment before attempting another one');
            }
            const cypherResponse = (0, utils_1.rearrangeCypherObject)(await session
                .run(banking_cypher_1.initiateServiceRecordTransaction, {
                jwt: context.jwt,
                ...args,
            })
                .catch((error) => (0, utils_1.throwToSentry)('There was an error setting serviceRecordTransactionReference', error)));
            const serviceRecord = cypherResponse.record.properties;
            const payOffering = {
                method: 'post',
                baseURL: 'https://api.paystack.co/',
                url: `/charge`,
                headers: {
                    'content-type': 'application/json',
                    Authorization: auth,
                },
                data: {
                    amount: Math.round((serviceRecord.cash / (1 - 0.0195) + 0.01) * 100),
                    email: cypherResponse.author.email,
                    currency: 'GHS',
                    subaccount,
                    mobile_money: {
                        phone: args.mobileNumber,
                        provider: (0, financial_utils_1.getMobileCode)(args.mobileNetwork),
                    },
                    metadata: {
                        custom_fields: [
                            {
                                church_name: cypherResponse.churchName,
                                church_level: cypherResponse.churchLevel,
                                depositor_firstname: cypherResponse.author.firstName,
                                depositor_lastname: cypherResponse.author.lastName,
                            },
                        ],
                    },
                },
            };
            const updatePaystackCustomer = {
                method: 'put',
                baseURL: 'https://api.paystack.co/',
                url: `/customer/${cypherResponse.author.email}`,
                headers: {
                    'content-type': 'application/json',
                    Authorization: auth ?? '',
                },
                data: {
                    first_name: cypherResponse.author.firstName,
                    last_name: cypherResponse.author.lastName,
                    phone: cypherResponse.author.phoneNumber,
                },
            };
            const paymentResponse = await (0, axios_1.default)(payOffering);
            (0, axios_1.default)(updatePaystackCustomer);
            const paymentCypherRes = (0, utils_1.rearrangeCypherObject)(await session.executeWrite((tx) => tx.run(banking_cypher_1.setRecordTransactionReference, {
                id: serviceRecord.id,
                reference: paymentResponse.data.data.reference,
            })));
            if (paymentResponse.data.data.status === 'send_otp') {
                const otpCypherRes = (0, utils_1.rearrangeCypherObject)(await session.run(banking_cypher_1.setRecordTransactionReferenceWithOTP, {
                    id: serviceRecord.id,
                }));
                return otpCypherRes.record;
            }
            return paymentCypherRes.record;
        }
        catch (error) {
            throw new Error(`There was an error processing your payment ${error}`);
        }
        finally {
            await session.close();
        }
    },
    BankRehearsalOffering: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitLeaderAdmin)('Hub'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        // This code checks if there has already been a successful transaction
        const transactionResponse = (0, utils_1.rearrangeCypherObject)(await session
            .run(banking_cypher_1.checkRehearsalTransactionReference, args)
            .catch((error) => (0, utils_1.throwToSentry)('There was a problem checking the transactionReference', error)));
        const bankAccountChurch = transactionResponse?.ministry?.bankAccount
            ? transactionResponse?.ministry
            : transactionResponse?.stream;
        try {
            const { auth, subaccount } = await (0, financial_utils_1.getStreamFinancials)(bankAccountChurch);
            if (!subaccount) {
                throw new Error(`There was an error with the payment. Please email admin@firstlovecenter.com ${JSON.stringify({
                    transactionResponse,
                    args,
                    subaccount,
                })}`);
            }
            await (0, exports.checkIfLastServiceBanked)(args.rehearsalRecordId, context);
            const transactionStatus = transactionResponse?.record.transactionStatus;
            if (transactionStatus === 'success') {
                throw new Error('Banking has already been done for this service');
            }
            if (transactionStatus === 'pending') {
                throw new Error('Please confirm your initial payment before attempting another one');
            }
            const cypherResponse = (0, utils_1.rearrangeCypherObject)(await session
                .run(banking_cypher_1.initiateServiceRecordTransaction, {
                jwt: context.jwt,
                ...args,
                serviceRecordId: args.rehearsalRecordId,
            })
                .catch((error) => (0, utils_1.throwToSentry)('There was an error setting serviceRecordTransactionReference', error)));
            const serviceRecord = cypherResponse.record.properties;
            const payOffering = {
                method: 'post',
                baseURL: 'https://api.paystack.co/',
                url: `/charge`,
                headers: {
                    'content-type': 'application/json',
                    Authorization: auth,
                },
                data: {
                    amount: Math.round((serviceRecord.cash / (1 - 0.0195) + 0.01) * 100),
                    email: cypherResponse.author.email,
                    currency: 'GHS',
                    subaccount,
                    mobile_money: {
                        phone: args.mobileNumber,
                        provider: (0, financial_utils_1.getMobileCode)(args.mobileNetwork),
                    },
                    metadata: {
                        custom_fields: [
                            {
                                church_name: cypherResponse.churchName,
                                church_level: cypherResponse.churchLevel,
                                depositor_firstname: cypherResponse.author.firstName,
                                depositor_lastname: cypherResponse.author.lastName,
                            },
                        ],
                    },
                },
            };
            const updatePaystackCustomer = {
                method: 'put',
                baseURL: 'https://api.paystack.co/',
                url: `/customer/${cypherResponse.author.email}`,
                headers: {
                    'content-type': 'application/json',
                    Authorization: auth ?? '',
                },
                data: {
                    first_name: cypherResponse.author.firstName,
                    last_name: cypherResponse.author.lastName,
                    phone: cypherResponse.author.phoneNumber,
                },
            };
            const paymentResponse = await (0, axios_1.default)(payOffering);
            (0, axios_1.default)(updatePaystackCustomer);
            const paymentCypherRes = (0, utils_1.rearrangeCypherObject)(await session.executeWrite((tx) => tx.run(banking_cypher_1.setRecordTransactionReference, {
                id: serviceRecord.id,
                reference: paymentResponse.data.data.reference,
            })));
            if (paymentResponse.data.data.status === 'send_otp') {
                const otpCypherRes = (0, utils_1.rearrangeCypherObject)(await session.run(banking_cypher_1.setRecordTransactionReferenceWithOTP, {
                    id: serviceRecord.id,
                }));
                return otpCypherRes.record;
            }
            return paymentCypherRes.record;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('There was an error processing your payment', error);
        }
        finally {
            await session.close();
        }
        return transactionResponse.record;
    },
    SendPaymentOTP: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitMe)('Fellowship'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const transactionResponse = (0, utils_1.rearrangeCypherObject)(await session
            .run(banking_cypher_1.checkTransactionReference, args)
            .catch((error) => (0, utils_1.throwToSentry)('There was a problem checking the transactionReference', error)));
        const { auth } = await (0, financial_utils_1.getStreamFinancials)(transactionResponse?.stream.bankAccount);
        const sendOtp = {
            method: 'post',
            baseURL: 'https://api.paystack.co/',
            url: `/charge/submit_otp`,
            headers: {
                'content-type': 'application/json',
                Authorization: auth,
            },
            data: {
                otp: args.otp,
                reference: args.reference,
            },
        };
        const otpResponse = await (0, axios_1.default)(sendOtp).catch(async (error) => {
            if (error.response.data.message === 'Charge attempted') {
                console.log('OTP was already sent and charge attempted');
                return {
                    data: {
                        data: {
                            status: 'pay_offline',
                        },
                    },
                };
            }
            return (0, utils_1.throwToSentry)('There was an error sending OTP', error);
        });
        if (otpResponse.data.data.status === 'pay_offline') {
            const paymentCypherRes = (0, utils_1.rearrangeCypherObject)(await session
                .run(banking_cypher_1.setRecordTransactionReference, {
                id: args.serviceRecordId,
                reference: args.reference,
            })
                .catch((error) => (0, utils_1.throwToSentry)('There was an error setting transaction reference', error)));
            return paymentCypherRes.record;
        }
        if (otpResponse.data.data.status === 'failed') {
            const paymentCypherRes = (0, utils_1.rearrangeCypherObject)(await session
                .run(banking_cypher_1.setTransactionStatusFailed, {
                id: args.serviceRecordId,
                reference: args.reference,
                status: otpResponse.data.data.status,
                error: otpResponse.data.data.gateway_response,
            })
                .catch((error) => (0, utils_1.throwToSentry)('There was an error setting transaction reference', error)));
            return paymentCypherRes.record;
        }
        return {
            id: args.serviceRecordId,
            transactionStatus: 'send OTP',
        };
    },
    ConfirmOfferingPayment: async (object, 
    // eslint-disable-next-line camelcase
    args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitMe)('Bacenta'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const transactionResponse = (0, utils_1.rearrangeCypherObject)(await session
            .run(banking_cypher_1.checkTransactionReference, args)
            .catch((error) => (0, utils_1.throwToSentry)('There was an error checking transaction reference', error)));
        let record = transactionResponse?.record;
        const banker = transactionResponse?.banker;
        const stream = transactionResponse?.stream;
        const { auth } = await (0, financial_utils_1.getStreamFinancials)(stream);
        // if transactionTime is within the last 1 minute then return the record
        if (record?.transactionTime &&
            new Date().getTime() - new Date(record?.transactionTime).getTime() <
                180000) {
            console.log('transactionTime is within the last 2 minutes');
            return {
                id: record.id,
                cash: record.cash,
                transactionReference: record.transactionReference,
                transactionStatus: record.transactionStatus,
                offeringBankedBy: {
                    id: banker.id,
                    firstName: banker.firstName,
                    lastName: banker.lastName,
                    fullName: `${banker.firstName} ${banker.fullName}`,
                },
            };
        }
        if (!record?.transactionReference) {
            record = (0, utils_1.rearrangeCypherObject)(await session
                .run(banking_cypher_1.setTransactionStatusFailed, {
                ...args,
                status: 'failed',
                error: 'No Transaction Reference',
            })
                .catch((error) => (0, utils_1.throwToSentry)('There was an error setting the transaction', error)));
            record = record.record.properties;
            return record;
        }
        const confirmPaymentBody = {
            method: 'get',
            baseURL: 'https://api.paystack.co/',
            url: `/transaction/verify/${record.transactionReference}`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: auth,
            },
        };
        let confirmationResponse;
        try {
            confirmationResponse = await (0, axios_1.default)(confirmPaymentBody);
            if (confirmationResponse.data.data.status === 'success') {
                record = (0, utils_1.rearrangeCypherObject)(await session
                    .run(banking_cypher_1.setTransactionStatusSuccess, {
                    ...args,
                    status: confirmationResponse.data.data.status,
                })
                    .catch((error) => (0, utils_1.throwToSentry)('There was an error setting the successful transaction', error)));
                record = record.record.properties;
            }
            if (confirmationResponse.data.data.status === 'failed' ||
                confirmationResponse.data.data.status === 'abandoned') {
                record = (0, utils_1.rearrangeCypherObject)(await session
                    .run(banking_cypher_1.setTransactionStatusFailed, {
                    ...args,
                    status: confirmationResponse.data.data.status,
                    error: confirmationResponse.data.data.gateway_response,
                })
                    .catch((error) => (0, utils_1.throwToSentry)('There was an error setting the transaction', error)));
                record = record.record.properties;
            }
        }
        catch (error) {
            if (error.response?.data?.code === 'transaction_not_found') {
                record = (0, utils_1.rearrangeCypherObject)(await session.executeWrite((tx) => tx.run(banking_cypher_1.setTransactionStatusFailed, {
                    ...args,
                    status: error.response.data.status,
                    error: error.response.data.message,
                })));
            }
            (0, utils_1.throwToSentry)('There was an error confirming transaction - ', JSON.stringify(error.response?.data || error.message));
        }
        return {
            ...record,
            offeringBankedBy: {
                id: banker.id,
                firstName: banker.firstName,
                lastName: banker.lastName,
                fullName: `${banker.firstName} ${banker.fullName}`,
            },
        };
    },
    SubmitBankingSlip: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdmin)('Campus'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        await (0, exports.checkIfLastServiceBanked)(args.serviceRecordId, context).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error checking if last service banked', error);
        });
        const submissionResponse = (0, utils_1.rearrangeCypherObject)(await session
            .run(banking_cypher_1.submitBankingSlip, { ...args, jwt: context.jwt })
            .catch((error) => (0, utils_1.throwToSentry)('There was an error submitting banking slip', error)));
        return submissionResponse.record.properties;
    },
    ManuallyConfirmOfferingPayment: async (object, args, context) => {
        (0, utils_1.isAuth)(['fishers', ...(0, permissions_1.permitTellerStream)()], context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const churchRes = await session.executeRead((tx) => tx.run(`MATCH (record:ServiceRecord {id: $serviceRecordId})
        MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
        RETURN labels(church) AS churchLabels`, args));
        const churchLabels = churchRes.records[0].get('churchLabels');
        if (context.jwt['https://flcadmin.netlify.app/roles'].includes('tellerStream') &&
            !['Stream', 'Campus', 'Oversight', 'Denomination'].some((churchLevel) => churchLabels.includes(churchLevel))) {
            throw new Error('You are not allowed to manually confirm offering payment for this church');
        }
        await (0, exports.checkIfLastServiceBanked)(args.serviceRecordId, context).catch((error) => {
            (0, utils_1.throwToSentry)('There was an error checking if last service banked', error);
        });
        const submissionResponse = (0, utils_1.rearrangeCypherObject)(await session
            .run(banking_cypher_1.manuallyConfirmOfferingPayment, { ...args, jwt: context.jwt })
            .catch((error) => (0, utils_1.throwToSentry)('There was an error confirming offering payment', error)));
        return submissionResponse.service.properties;
    },
};
exports.default = bankingMutation;
