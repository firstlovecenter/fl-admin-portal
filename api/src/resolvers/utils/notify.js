"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinMessageStrings = exports.sendBulkSMS = exports.sendBulkEmail = exports.sendSingleEmail = void 0;
/* eslint-disable no-console */
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const secrets_1 = require("../secrets");
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const sendSingleEmail = async (member, subject, body, html) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
        username: 'api',
        key: SECRETS.MAILGUN_API_KEY,
    });
    mg.messages
        .create(SECRETS.MAILGUN_DOMAIN, {
        from: 'FL Accra Admin <no-reply@firstlovecenter.org>',
        to: SECRETS.TEST_EMAIL_ADDRESS || member.email,
        subject,
        text: body,
        template: '',
        html: html || undefined, // HTML Version of the Message for Better Styling
    })
        .then((msg) => console.log('Mailgun API response', msg)) // logs response data
        .catch((err) => console.log('Mailgun API error', err)); // logs any error
};
exports.sendSingleEmail = sendSingleEmail;
const sendBulkEmail = async (recipient, subject, body, html) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
        username: 'api',
        key: SECRETS.MAILGUN_API_KEY,
    });
    mg.messages
        .create(SECRETS.MAILGUN_DOMAIN, {
        from: 'FL Accra Admin <no-reply@firstlovecenter.org>',
        to: SECRETS.TEST_EMAIL_ADDRESS || recipient,
        subject,
        text: body,
        template: '',
        html: html || undefined, // HTML Version of the Message for Better Styling
    })
        .then((msg) => console.log('Mailgun API response', msg)) // logs response data
        .catch((err) => console.log('Mailgun API error', err)); // logs any error
};
exports.sendBulkEmail = sendBulkEmail;
const sendBulkSMS = async (recipient, message) => {
    const SECRETS = await (0, secrets_1.loadSecrets)(); // Await secrets here
    const sendMessage = {
        method: 'post',
        url: `https://api.mnotify.com/api/sms/quick?key=${SECRETS.MNOTIFY_KEY}`,
        headers: {
            'content-type': 'application/json',
        },
        data: {
            recipient: SECRETS.TEST_PHONE_NUMBER
                ? [SECRETS.TEST_PHONE_NUMBER, '0594760324d']
                : recipient,
            sender: 'FLC Admin',
            message,
            is_schedule: 'false',
            schedule_date: '',
        },
    };
    try {
        console.log('Sending SMS using mNotify');
        const res = await (0, axios_1.default)(sendMessage);
        if (res.data.code === '2000') {
            console.log(res.data.message);
            return 'Message sent successfully';
        }
        throw new Error(`There was a problem sending your SMS ${JSON.stringify(res.data)}`);
    }
    catch (error) {
        (0, utils_1.throwToSentry)('There was a problem sending your SMS', error);
    }
    return 'Message sent successfully';
};
exports.sendBulkSMS = sendBulkSMS;
const joinMessageStrings = (strings) => {
    return strings.join('');
};
exports.joinMessageStrings = joinMessageStrings;
