"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountsMutations = void 0;
const notify_1 = require("../utils/notify");
const utils_1 = require("../utils/utils");
const accounts_cypher_1 = require("./accounts-cypher");
exports.accountsMutations = {
    DepositIntoCouncilCurrentAccount: async (object, args, context) => {
        const session = context.executionContext.session();
        (0, utils_1.isAuth)(['adminCampus'], context.jwt['https://flcadmin.netlify.app/roles']);
        try {
            const councilBalancesResult = await session.run(accounts_cypher_1.getCouncilBalances, args);
            const council = councilBalancesResult.records[0].get('council').properties;
            const leader = councilBalancesResult.records[0].get('leader').properties;
            const message = `Dear ${leader.firstName}, an amount of ${args.weekdayBalanceDepositAmount} GHS has been deposited into your weekday account for ${council.name}. Your weekday account balance is ${council.weekdayBalance + args.weekdayBalanceDepositAmount} GHS and bussing society is ${council.bussingSocietyBalance} GHS`;
            const debitRes = await Promise.all([
                session.run(accounts_cypher_1.depositIntoCouncilCurrentAccount, {
                    jwt: context.jwt,
                    ...args,
                }),
                (0, notify_1.sendBulkSMS)([leader.phoneNumber], message),
            ]);
            const trans = debitRes[0].records[0].get('transaction').properties;
            const depositor = debitRes[0].records[0].get('depositor').properties;
            return {
                ...trans,
                loggedBy: { ...depositor },
            };
        }
        catch (error) {
            (0, utils_1.throwToSentry)('', error);
        }
        finally {
            await session.close();
        }
        return null;
    },
    DepositIntoCouncilBussingSociety: async (object, args, context) => {
        const session = context.executionContext.session();
        // isAuth(['arrivalsAdminCampus'], context.jwt['https://flcadmin.netlify.app/roles'])
        try {
            const councilBalancesResult = await session.run(accounts_cypher_1.getCouncilBalances, args);
            const council = councilBalancesResult.records[0].get('council').properties;
            const leader = councilBalancesResult.records[0].get('leader').properties;
            const depositAmount = args.bussingSocietyBalance - council.bussingSocietyBalance;
            let transactionDescription = ` made a deposit of ${depositAmount} into the bussing society`;
            let transactionType = 'Deposit';
            let transactionSMS = `an amount of ${depositAmount} GHS has been deposited into your bussing society`;
            if (depositAmount < 0) {
                transactionDescription = ` marked a deduction of ${depositAmount} on your bussing society`;
                transactionType = 'Debit';
                transactionSMS = `a debit of ${depositAmount} GHS has been marked on your bussing society`;
            }
            const message = `Dear ${leader.firstName}, ${transactionSMS} for ${council.name}. Your current bussing society balance is ${args.bussingSocietyBalance} GHS`;
            const debitRes = await Promise.all([
                session.run(accounts_cypher_1.depositIntoCoucilBussingSociety, {
                    jwt: context.jwt,
                    ...args,
                    transactionDescription,
                    transactionType,
                    bussingSocietyDepositAmount: depositAmount,
                }),
                (0, notify_1.sendBulkSMS)([leader.phoneNumber], message),
            ]);
            const trans = debitRes[0].records[0].get('transaction').properties;
            const depositor = debitRes[0].records[0].get('depositor').properties;
            return {
                ...trans,
                loggedBy: { ...depositor },
            };
        }
        catch (error) {
            (0, utils_1.throwToSentry)('', error);
        }
        finally {
            await session.close();
        }
        return null;
    },
    ApproveExpense: async (object, args, context) => {
        const session = context.executionContext.session();
        const sessionTwo = context.executionContext.session();
        (0, utils_1.isAuth)(['adminCampus'], context.jwt['https://flcadmin.netlify.app/roles']);
        try {
            const councilBalancesResult = await session.run(accounts_cypher_1.getCouncilBalancesWithTransaction, args);
            const council = councilBalancesResult.records[0].get('council').properties;
            const leader = councilBalancesResult.records[0].get('leader').properties;
            const transaction = councilBalancesResult.records[0].get('transaction').properties;
            const transactionAmount = transaction.amount * -1;
            if (transaction.category === 'Bussing') {
                if (council.weekdayBalance < transactionAmount) {
                    throw new Error('Insufficient bussing funds');
                }
                const currentAmountRemaining = council.weekdayBalance - transactionAmount - args.charge;
                const amountRemaining = council.bussingSocietyBalance + transactionAmount;
                const message = `Dear ${leader.firstName}, your expense request of ${transactionAmount} GHS from ${council.name} weekday account for ${transaction.category} has been approved. Balance remaining is ${currentAmountRemaining} GHS. Bussing Society Balance is ${amountRemaining} GHS`;
                const debitRes = await Promise.all([
                    session.run(accounts_cypher_1.approveBussingExpense, args),
                    sessionTwo.run(accounts_cypher_1.creditBussingSocietyFromWeekday, {
                        ...args,
                        jwt: context.jwt,
                    }),
                    (0, notify_1.sendBulkSMS)([leader.phoneNumber], message),
                ]);
                const trans = debitRes[0].records[0].get('transaction').properties;
                const depositor = debitRes[0].records[0].get('depositor').properties;
                return {
                    ...trans,
                    loggedBy: { ...depositor },
                };
            }
            if (council.weekdayBalance < transactionAmount) {
                throw new Error('Insufficient Funds');
            }
            const amountRemaining = council.weekdayBalance - transactionAmount - args.charge;
            const message = `Dear ${leader.firstName}, your expense request of ${transactionAmount} GHS (Charges: ${args.charge} GHS) from ${council.name} weekday account for ${transaction.category} has been approved. Balance remaining is ${amountRemaining} GHS`;
            const debitRes = await Promise.all([
                session.run(accounts_cypher_1.approveExpense, args),
                (0, notify_1.sendBulkSMS)([leader.phoneNumber], message),
            ]);
            const trans = debitRes[0].records[0].get('transaction').properties;
            const depositor = debitRes[0].records[0].get('depositor').properties;
            return {
                ...trans,
                loggedBy: { ...depositor },
            };
        }
        catch (error) {
            (0, utils_1.throwToSentry)('', error.message);
        }
        finally {
            await Promise.all([session.close(), sessionTwo.close()]);
        }
        return null;
    },
    DebitBussingSociety: async (object, args, context) => {
        const session = context.executionContext.session();
        (0, utils_1.isAuth)(['arrivalsAdminCampus', 'adminCampus'], context.jwt['https://flcadmin.netlify.app/roles']);
        try {
            const councilBalancesResult = await session.run(accounts_cypher_1.getCouncilBalances, args);
            const council = councilBalancesResult.records[0].get('council').properties;
            const leader = councilBalancesResult.records[0].get('leader').properties;
            const amountRemaining = council.bussingSocietyBalance - args.expenseAmount;
            const message = `Dear ${leader.firstName}, ${council.name} Council spent ${args.expenseAmount} GHS on bussing. Bussing Society Balance remaining is ${amountRemaining} GHS`;
            const debitRes = await Promise.all([
                session.run(accounts_cypher_1.debitBussingSociety, { ...args, jwt: context.jwt }),
                (0, notify_1.sendBulkSMS)([leader.phoneNumber], message),
            ]);
            const trans = debitRes[0].records[0].get('transaction').properties;
            const depositor = debitRes[0].records[0].get('requester').properties;
            return {
                ...trans,
                loggedBy: { ...depositor },
            };
        }
        catch (err) {
            (0, utils_1.throwToSentry)('There was an error debiting bussing society', err);
        }
        finally {
            await session.close();
        }
        return null;
    },
};
exports.default = exports.accountsMutations;
