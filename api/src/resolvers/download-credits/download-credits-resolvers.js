"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadCreditsQueries = exports.downloadCreditsMutations = void 0;
const axios_1 = __importDefault(require("axios"));
const admin_portal_api_core_1 = require("@jaedag/admin-portal-api-core");
const permissions_1 = require("../permissions");
const financial_utils_1 = require("../utils/financial-utils");
const utils_1 = require("../utils/utils");
const download_credits_cypher_1 = require("./download-credits-cypher");
const download_credits_member_cypher_1 = require("./download-credits-member-cypher");
exports.downloadCreditsMutations = {
    PurchaseDownloadCredits: async (object, args, context) => {
        const session = context.executionContext.session();
        (0, utils_1.isAuth)((0, permissions_1.permitMe)('Bacenta'), context.jwt['https://flcadmin.netlify.app/roles']);
        try {
            const { auth, subaccount } = await (0, financial_utils_1.getCreditsFinancials)();
            const memberResponse = await session.executeRead((tx) => tx.run(download_credits_cypher_1.getMember, {
                jwt: context.jwt,
            }));
            const member = memberResponse.records[0]?.get('member')?.properties;
            const response = await Promise.all([
                (0, axios_1.default)((0, admin_portal_api_core_1.initiatePaystackCharge)({
                    amount: args.amount * 20,
                    mobile_money: {
                        phone: args.mobileNumber,
                        provider: args.mobileNetwork,
                    },
                    bearCharges: true,
                    customer: member,
                    subaccount,
                    auth,
                })),
                member && (0, axios_1.default)((0, admin_portal_api_core_1.updatePaystackCustomerBody)({ auth, customer: member })),
            ]);
            const paymentRes = response[0].data.data;
            const cypherRes = await session.executeWrite((tx) => tx.run(download_credits_cypher_1.initiateDownloadCreditsTransaction, {
                ...args,
                jwt: context.jwt,
                transactionStatus: paymentRes.status,
                transactionReference: paymentRes.reference,
            }));
            return cypherRes.records[0].get('transaction').properties;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('Error purchasing credits', error);
        }
        finally {
            await session.close();
        }
        return {};
    },
    ConfirmCreditTransaction: async (object, args, context) => {
        const session = context.executionContext.session();
        (0, utils_1.isAuth)((0, permissions_1.permitMe)('Bacenta'), context.jwt['https://flcadmin.netlify.app/roles']);
        try {
            const { auth } = await (0, financial_utils_1.getCreditsFinancials)();
            const confirmRes = await (0, axios_1.default)((0, admin_portal_api_core_1.confirmTransactionStatus)({
                reference: args.transactionReference,
                auth,
            }));
            const cypherRes = await session.executeWrite((tx) => tx.run(download_credits_cypher_1.updateTransactionStatus, {
                transactionReference: args.transactionReference,
                status: confirmRes.data.data.status,
            }));
            const transaction = cypherRes.records[0].get('transaction').properties;
            if (transaction.transactionStatus === 'success' &&
                !transaction.credited) {
                const response = await session.executeWrite((tx) => tx.run(download_credits_cypher_1.creditSuccessfulTransaction, {
                    transactionReference: args.transactionReference,
                }));
                return response.records[0].get('record').properties;
            }
            return cypherRes.records[0].get('transaction').properties;
        }
        catch (error) {
            (0, utils_1.throwToSentry)('Error confirming transaction', error);
        }
        finally {
            await session.close();
        }
        return {};
    },
};
exports.downloadCreditsQueries = {
    Council: {
        downloadMembership: async (object, args, context) => {
            const session = context.executionContext.session();
            (0, utils_1.isAuth)((0, permissions_1.permitMe)('Council'), context.jwt['https://flcadmin.netlify.app/roles']);
            try {
                const councilRes = await session.executeRead((tx) => {
                    return tx.run(download_credits_member_cypher_1.councilDownloadMembers, {
                        id: object.id,
                    });
                });
                const council = councilRes.records[0].get('council');
                if (council.downloadCredits < 1) {
                    throw new Error('You do not have enough credits to download this report');
                }
                return councilRes.records[0].get('members');
            }
            catch (error) {
                (0, utils_1.throwToSentry)('Error getting council membership', error);
            }
            finally {
                await session.close();
            }
            return {};
        },
    },
};
