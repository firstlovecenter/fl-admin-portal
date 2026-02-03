"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrivalsResolvers = exports.arrivalsMutation = void 0;
const axios_1 = __importDefault(require("axios"));
const jd_date_utils_1 = require("jd-date-utils");
const financial_utils_1 = require("../utils/financial-utils");
const utils_1 = require("../utils/utils");
const permissions_1 = require("../permissions");
const make_remove_servants_1 = require("../directory/make-remove-servants");
const arrivals_cypher_1 = require("./arrivals-cypher");
const notify_1 = require("../utils/notify");
const texts_json_1 = __importDefault(require("../texts.json"));
const service_resolvers_1 = require("../services/service-resolvers");
const dotenv = require('dotenv');
dotenv.config();
const checkIfSelf = (servantId, auth) => {
    if (servantId === auth.replace('auth0|', '')) {
        throw new Error('Sorry! You cannot make yourself an arrivals counter');
    }
};
const arrivalEndTimeCalculator = (arrivalEndTime) => {
    const endTimeToday = new Date(new Date().toISOString().slice(0, 10) + arrivalEndTime.slice(10));
    const COUNTINGBUFFER = 15 * 60 * 1000;
    const endTime = new Date(endTimeToday.getTime() + COUNTINGBUFFER);
    return endTime;
};
exports.arrivalsMutation = {
    MakeGovernorshipArrivalsAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, [...(0, permissions_1.permitAdmin)('Stream')], 'Governorship', 'ArrivalsAdmin'),
    RemoveGovernorshipArrivalsAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, [...(0, permissions_1.permitAdmin)('Stream')], 'Governorship', 'ArrivalsAdmin'),
    MakeCouncilArrivalsAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, [...(0, permissions_1.permitAdmin)('Council'), ...(0, permissions_1.permitArrivals)('Stream')], 'Council', 'ArrivalsAdmin'),
    RemoveCouncilArrivalsAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, [...(0, permissions_1.permitAdmin)('Council'), ...(0, permissions_1.permitArrivals)('Stream')], 'Council', 'ArrivalsAdmin'),
    MakeStreamArrivalsAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, [...(0, permissions_1.permitAdmin)('Stream'), ...(0, permissions_1.permitArrivals)('Campus')], 'Stream', 'ArrivalsAdmin'),
    RemoveStreamArrivalsAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, [...(0, permissions_1.permitAdmin)('Stream'), ...(0, permissions_1.permitArrivals)('Campus')], 'Stream', 'ArrivalsAdmin'),
    MakeCampusArrivalsAdmin: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, [...(0, permissions_1.permitAdmin)('Campus'), ...(0, permissions_1.permitArrivals)('Oversight')], 'Campus', 'ArrivalsAdmin'),
    RemoveCampusArrivalsAdmin: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, [...(0, permissions_1.permitAdmin)('Campus'), ...(0, permissions_1.permitArrivals)('Oversight')], 'Campus', 'ArrivalsAdmin'),
    // ARRIVALS HELPERS
    MakeStreamArrivalsCounter: async (object, args, context) => {
        checkIfSelf(args.arrivalsCounterId, context.jwt.sub);
        return (0, make_remove_servants_1.MakeServant)(context, args, [...(0, permissions_1.permitAdmin)('Stream'), ...(0, permissions_1.permitArrivals)('Stream')], 'Stream', 'ArrivalsCounter');
    },
    RemoveStreamArrivalsCounter: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, [...(0, permissions_1.permitAdmin)('Stream'), ...(0, permissions_1.permitArrivals)('Stream')], 'Stream', 'ArrivalsCounter'),
    MakeCouncilArrivalsPayer: async (object, args, context) => (0, make_remove_servants_1.MakeServant)(context, args, [...(0, permissions_1.permitAdminArrivals)('Campus')], 'Council', 'ArrivalsPayer'),
    RemoveCouncilArrivalsPayer: async (object, args, context) => (0, make_remove_servants_1.RemoveServant)(context, args, [...(0, permissions_1.permitAdminArrivals)('Campus')], 'Council', 'ArrivalsPayer'),
    UploadMobilisationPicture: async (object, args, context) => {
        const session = context.executionContext.session();
        (0, utils_1.isAuth)(['leaderBacenta'], context.jwt['https://flcadmin.netlify.app/roles']);
        const recordResponse = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.checkArrivalTimes, args));
        await (0, service_resolvers_1.checkServantHasCurrentHistory)(session, context, {
            churchId: args.bacentaId,
        });
        const preMobCheck = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.checkIfPreMobilisationFilled, args));
        if (preMobCheck.status) {
            throw new Error('You have already filled the pre-mobilisation form');
        }
        const stream = recordResponse.stream.properties;
        const mobilisationEndTime = new Date(new Date().toISOString().slice(0, 10) +
            new Date(stream.mobilisationEndTime).toISOString().slice(10));
        const today = new Date();
        if (today > mobilisationEndTime) {
            throw new Error('It is now past the time for mobilisation. Thank you!');
        }
        const checkBacentaMomo = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.checkBacentaMomoDetails, args));
        if (!checkBacentaMomo?.momoNumber &&
            ((0, utils_1.parseNeoNumber)(checkBacentaMomo.sprinterTopUp) ||
                (0, utils_1.parseNeoNumber)(checkBacentaMomo.urvanTopUp))) {
            throw new Error('You need a mobile money number before filling this form');
        }
        const response = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.uploadMobilisationPicture, {
            ...args,
            jwt: context.jwt,
        }));
        const bacenta = response.bacenta.properties;
        const bussingRecord = response.bussingRecord.properties;
        const date = response.date.properties;
        const returnToCache = {
            id: bussingRecord.id,
            attendance: bussingRecord.attendance,
            mobilisationPicture: bussingRecord.mobilisationPicture,
            serviceLog: {
                bacenta: [
                    {
                        id: bacenta.id,
                        stream_name: response.stream_name,
                        bussing: [
                            {
                                id: bussingRecord.id,
                                serviceDate: {
                                    date: date.date,
                                },
                                week: response.week,
                                mobilisationPicture: bussingRecord.mobilisationPicture,
                            },
                        ],
                    },
                ],
            },
        };
        return returnToCache;
    },
    RecordVehicleFromBacenta: async (object, args, context) => {
        (0, utils_1.isAuth)(['leaderBacenta'], context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const recordResponse = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.checkArrivalTimes, args));
        const stream = recordResponse.stream.properties;
        const bacenta = recordResponse.bacenta.properties;
        const arrivalEndTime = new Date(new Date().toISOString().slice(0, 10) +
            new Date(stream.arrivalEndTime).toISOString().slice(10));
        const today = new Date();
        if (today > arrivalEndTime) {
            throw new Error('It is past the time to fill your forms. Thank you!');
        }
        const response = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.recordVehicleFromBacenta, {
            ...args,
            recipientCode: bacenta.recipientCode,
            momoNumber: bacenta.momoNumber ?? '',
            mobileNetwork: bacenta.mobileNetwork ?? '',
            outbound: bacenta.outbound,
            jwt: context.jwt,
        }));
        const vehicleRecord = response.vehicleRecord.properties;
        const date = new Date().toISOString().slice(0, 10);
        const returnToCache = {
            id: vehicleRecord.id,
            leaderDeclaration: vehicleRecord.leaderDeclaration,
            attendance: vehicleRecord.attendance,
            vehicle: vehicleRecord.vehicle,
            picture: vehicleRecord.picture,
            outbound: vehicleRecord.outbound,
            bussingRecord: {
                serviceLog: {
                    bacenta: [
                        {
                            id: args.bacentaId,
                            stream_name: response.stream_name,
                            bussing: [
                                {
                                    id: vehicleRecord.id,
                                    serviceDate: {
                                        date,
                                    },
                                    week: response.week,
                                    vehicle: vehicleRecord.vehicle,
                                    picture: vehicleRecord.picture,
                                    outbound: vehicleRecord.outbound,
                                },
                            ],
                        },
                    ],
                },
            },
        };
        return returnToCache;
    },
    ConfirmVehicleByAdmin: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitArrivalsCounter)(), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const recordResponse = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.checkArrivalTimeFromVehicle, args));
        const { arrivalEndTime, numberOfVehicles, totalAttendance, } = recordResponse;
        const today = new Date();
        if (today > arrivalEndTimeCalculator(arrivalEndTime)) {
            throw new Error('It is now past the time for arrivals. Thank you!');
        }
        const adjustedArgs = args;
        if (args.vehicle !== 'Car') {
            if ((0, utils_1.parseNeoNumber)(numberOfVehicles) < 1 && args.attendance < 8) {
                // No arrived vehicles and attendance is less than 8
                adjustedArgs.attendance = 0;
            }
            else if ((0, utils_1.parseNeoNumber)(numberOfVehicles) >= 1 &&
                args.attendance < 8 &&
                (0, utils_1.parseNeoNumber)(totalAttendance) < 8) {
                // One arrived vehicle but the combined attendance is less than 8
                adjustedArgs.attendance = 0;
            }
        }
        if (args.attendance < 8) {
            adjustedArgs.vehicle = 'Car';
        }
        const response = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.confirmVehicleByAdmin, {
            ...adjustedArgs,
            jwt: context.jwt,
        }));
        await session
            .run(arrivals_cypher_1.aggregateVehicleBussingRecordData, adjustedArgs)
            .catch((error) => (0, utils_1.throwToSentry)('Error Running aggregateVehicleBussingRecordData', error));
        const vehicleRecord = response.vehicleRecord.properties;
        const date = new Date().toISOString().slice(0, 10);
        const returnToCache = {
            id: vehicleRecord.id,
            leaderDeclaration: vehicleRecord.leaderDeclaration,
            attendance: vehicleRecord.attendance,
            vehicle: vehicleRecord.vehicle,
            picture: vehicleRecord.picture,
            outbound: vehicleRecord.outbound,
            arrivalTime: vehicleRecord.arrivalTime,
            bussingRecord: {
                serviceLog: {
                    bacenta: [
                        {
                            id: args.bacentaId,
                            stream_name: response.stream_name,
                            bussing: [
                                {
                                    id: vehicleRecord.id,
                                    serviceDate: {
                                        date,
                                    },
                                    week: response.week,
                                    vehicle: vehicleRecord.vehicle,
                                    picture: vehicleRecord.picture,
                                    outbound: vehicleRecord.outbound,
                                },
                            ],
                        },
                    ],
                },
            },
        };
        return returnToCache;
    },
    SetVehicleSupport: async (object, args, context) => {
        const session = context.executionContext.session();
        const response = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.getVehicleRecordWithDate, args));
        let vehicleRecord;
        const calculateVehicleTopUp = (data) => {
            const outbound = response.outbound ? 2 : 1;
            const sprinterTopUp = (0, utils_1.parseNeoNumber)(data.bacentaSprinterTopUp) *
                outbound;
            const urvanTopUp = (0, utils_1.parseNeoNumber)(data.bacentaUrvanTopUp) * outbound;
            const amountToPay = data.vehicleCost;
            if (data.vehicle === 'Sprinter') {
                if (sprinterTopUp === 0)
                    return 0;
                if (data.vehicleCost < sprinterTopUp || amountToPay < sprinterTopUp) {
                    return amountToPay;
                }
                return parseFloat(sprinterTopUp.toFixed(2));
            }
            if (data.vehicle === 'Urvan') {
                if (urvanTopUp === 0)
                    return 0;
                if (data.vehicleCost < urvanTopUp || amountToPay < urvanTopUp) {
                    return amountToPay;
                }
                return parseFloat(urvanTopUp.toFixed(2));
            }
            return 0;
        };
        console.log('🚀 ~ file: arrivals-resolvers.ts:544 ~ response:', response);
        const vehicleTopUp = calculateVehicleTopUp(response);
        if (response.vehicle === 'Car') {
            const attendanceRes = await Promise.all([
                session.run(arrivals_cypher_1.noVehicleTopUp, { ...args, vehicleTopUp }),
                (0, notify_1.sendBulkSMS)([response.leaderPhoneNumber], (0, notify_1.joinMessageStrings)([
                    `Hi ${response.leaderFirstName}\n\n`,
                    texts_json_1.default.arrivalsSMS.no_busses_to_pay_for,
                    response.attendance.toString(),
                ])),
            ]);
            vehicleRecord = (0, utils_1.rearrangeCypherObject)(attendanceRes[0]);
            return vehicleRecord?.record.properties;
        }
        if (response.attendance < 8) {
            await Promise.all([
                session.run(arrivals_cypher_1.noVehicleTopUp, args),
                (0, notify_1.sendBulkSMS)([response.leaderPhoneNumber], (0, notify_1.joinMessageStrings)([
                    `Hi ${response.leaderFirstName}\n\n`,
                    texts_json_1.default.arrivalsSMS.less_than_8,
                    response.attendance.toString(),
                ])),
            ]).catch((error) => (0, utils_1.throwToSentry)('There was an error processing bussing payment', error));
            throw new Error("Today's Bussing doesn't require a top up");
        }
        if (response.vehicleCost === 0 || vehicleTopUp <= 0) {
            const attendanceRes = await Promise.all([
                session.run(arrivals_cypher_1.noVehicleTopUp, { ...args, vehicleTopUp }),
                (0, notify_1.sendBulkSMS)([response.leaderPhoneNumber], (0, notify_1.joinMessageStrings)([
                    `Hi ${response.leaderFirstName}\n\n`,
                    texts_json_1.default.arrivalsSMS.no_bussing_cost,
                    response.attendance.toString(),
                ])),
            ]);
            vehicleRecord = (0, utils_1.rearrangeCypherObject)(attendanceRes[0]);
            return vehicleRecord?.record.properties;
        }
        if (response.attendance &&
            (response.vehicle === 'Sprinter' || response.vehicle === 'Urvan')) {
            const receiveMoney = (0, notify_1.joinMessageStrings)([
                `Hi  ${response.leaderFirstName}\n\n`,
                texts_json_1.default.arrivalsSMS.normal_top_up_p1,
                vehicleTopUp?.toString(),
                texts_json_1.default.arrivalsSMS.normal_top_up_p2,
                response.attendance?.toString(),
            ]);
            const attendanceRes = await Promise.all([
                session.run(arrivals_cypher_1.setVehicleTopUp, { ...args, vehicleTopUp }),
                (0, notify_1.sendBulkSMS)([response.leaderPhoneNumber], `${receiveMoney}`),
            ]).catch((error) => (0, utils_1.throwToSentry)('There was an error processing bussing payment', error));
            vehicleRecord = (0, utils_1.rearrangeCypherObject)(attendanceRes[0]);
        }
        return vehicleRecord?.record.properties;
    },
    SendVehicleSupport: async (object, 
    // eslint-disable-next-line camelcase
    args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitArrivalsHelpers)('Stream'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        try {
            const recordResponse = (0, utils_1.rearrangeCypherObject)(await session.executeRead((tx) => tx.run(arrivals_cypher_1.checkTransactionReference, args)));
            const { auth } = await (0, financial_utils_1.getStreamFinancials)(recordResponse.stream.properties);
            const vehicleRecord = recordResponse.record.properties;
            const bacenta = recordResponse.bacenta.properties;
            const leader = recordResponse.leader.properties;
            let recipient = vehicleRecord;
            if (vehicleRecord?.transactionStatus === 'success') {
                throw new Error('Money has already been sent to this bacenta');
            }
            else if (!vehicleRecord?.arrivalTime ||
                vehicleRecord?.attendance < 8 ||
                !vehicleRecord?.vehicleTopUp) {
                // If record has not been confirmed, it will return null
                throw new Error('This bacenta is not eligible to receive money');
            }
            if (!vehicleRecord.recipientCode) {
                const createRecipient = {
                    method: 'post',
                    baseURL: 'https://api.paystack.co/',
                    url: '/transferrecipient',
                    headers: {
                        'content-type': 'application/json',
                        Authorization: auth,
                    },
                    data: {
                        type: 'mobile_money',
                        name: `${leader.firstName} ${leader.lastName}`,
                        email: leader.email,
                        account_number: vehicleRecord.momoNumber,
                        bank_code: vehicleRecord.mobileNetwork,
                        currency: 'GHS',
                        metadata: {
                            momo: {
                                name: vehicleRecord.momoName,
                                number: vehicleRecord.momoNumber,
                            },
                            bacenta: {
                                id: bacenta.id,
                                name: bacenta.name,
                            },
                            leader: {
                                id: leader.id,
                                firstName: leader.firstName,
                                lastName: leader.lastName,
                                phoneNumber: leader.phoneNumber,
                                whatsappNumber: leader.whatsappNumber,
                            },
                        },
                    },
                };
                const recipientResponse = await (0, axios_1.default)(createRecipient);
                await session.executeWrite((tx) => tx.run(arrivals_cypher_1.setBacentaRecipientCode, {
                    bacentaId: bacenta.id,
                    vehicleRecordId: vehicleRecord.id,
                    recipientCode: recipientResponse.data.data.recipient_code,
                }));
                recipient = {
                    ...recipientResponse.data.data,
                    recipientCode: recipientResponse.data.data.recipient_code,
                };
            }
            const sendVehicleSupport = {
                method: 'post',
                baseURL: 'https://api.paystack.co/',
                url: '/transfer',
                headers: {
                    'content-type': 'application/json',
                    Authorization: auth,
                },
                data: {
                    source: 'balance',
                    reason: `${bacenta.name} Bacenta bussed ${vehicleRecord.attendance} on ${(0, jd_date_utils_1.getHumanReadableDate)(new Date().toISOString())}`,
                    amount: vehicleRecord.vehicleTopUp * 100,
                    currency: 'GHS',
                    recipient: recipient.recipientCode,
                },
            };
            const res = await (0, axios_1.default)(sendVehicleSupport);
            const responseData = res.data.data;
            await session.executeWrite((tx) => tx.run(arrivals_cypher_1.setVehicleRecordTransactionSuccessful, {
                ...args,
                transactionReference: responseData.reference,
                transferCode: responseData.transfer_code,
                responseStatus: responseData.status,
            }));
            console.log('Money Sent Successfully to', vehicleRecord.momoName);
            return vehicleRecord;
        }
        catch (error) {
            (0, utils_1.throwToSentry)(`Money could not be sent! ${error.response.data.message}`, error);
        }
        finally {
            await session.close();
        }
        return null;
    },
    SetSwellDate: async (object, args, context) => {
        (0, utils_1.isAuth)((0, permissions_1.permitAdminArrivals)('Campus'), context.jwt['https://flcadmin.netlify.app/roles']);
        const session = context.executionContext.session();
        const cypherResponse = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.setSwellDate, args));
        return cypherResponse;
    },
    SendMobileVerificationNumber: async (object, args, context) => {
        (0, utils_1.isAuth)(['leaderBacenta'], context.jwt['https://flcadmin.netlify.app/roles']);
        const response = await (0, notify_1.sendBulkSMS)([args.phoneNumber], `Hi ${args.firstName},\n\nYour OTP is ${args.otp}. Input this on the portal to verify your phone number.`);
        return response;
    },
};
const getArrivalsPaymentData = async (object, 
// eslint-disable-next-line camelcase
args, context) => {
    (0, utils_1.isAuth)((0, permissions_1.permitAdminArrivals)('Stream'), context.jwt['https://flcadmin.netlify.app/roles']);
    const session = context.executionContext.session();
    const cypherResponse = (0, utils_1.rearrangeCypherObject)(await session.run(arrivals_cypher_1.getArrivalsPaymentDataCypher, {
        streamId: object.id,
        date: args.arrivalsDate,
    }), true);
    return cypherResponse;
};
exports.arrivalsResolvers = {
    Stream: {
        arrivalsPaymentData: async (object, args, context) => getArrivalsPaymentData(object, args, context),
    },
};
