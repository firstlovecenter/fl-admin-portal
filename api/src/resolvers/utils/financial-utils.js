"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStreamFinancials = exports.getCreditsFinancials = exports.padNumbers = exports.getMobileCode = void 0;
const secrets_1 = require("../secrets");
const dotenv = require('dotenv');
dotenv.config();
const getMobileCode = (network) => {
    switch (network) {
        case 'MTN':
            return 'mtn';
        case 'Vodafone':
            return 'vod';
        case 'AirtelTigo':
            return 'tgo';
        case 'Airtel':
            return 'tgo';
        case 'Tigo':
            return 'tgo';
        default:
            break;
    }
    return 'mtn';
};
exports.getMobileCode = getMobileCode;
const padNumbers = (number) => {
    if (!number) {
        return '';
    }
    return number.toString().padStart(12, '0');
};
exports.padNumbers = padNumbers;
const getCreditsFinancials = async () => {
    const SECRETS = await (0, secrets_1.loadSecrets)();
    const auth = SECRETS.PAYSTACK_PRIVATE_KEY_WEEKDAY;
    const subaccount = SECRETS.PS_SB_DOWNLOAD_CREDITS;
    return { auth, subaccount };
};
exports.getCreditsFinancials = getCreditsFinancials;
const getStreamFinancials = async (stream) => {
    const SECRETS = await (0, secrets_1.loadSecrets)();
    const auth = SECRETS.PAYSTACK_PRIVATE_KEY_WEEKDAY;
    let subaccount;
    switch (stream.bankAccount) {
        case 'manual':
            throw new Error('Payment Error ' +
                'You may not use the self-banking platform. Please contact your admin');
        case 'aes_account':
            throw new Error('Payment Error' +
                'Anagkazo has a different financial system. Thank you!');
        case 'fle_account':
            subaccount = SECRETS.PS_SB_FLE;
            break;
        case 'acc_floc':
            subaccount = SECRETS.PS_SB_FLOC;
            break;
        case 'bjosh_special':
            subaccount = SECRETS.PS_SB_BJOSH;
            break;
        case 'oa_kumasi':
            subaccount = SECRETS.PS_SB_OA_GHSOUTH;
            break;
        case 'oa_gheast':
            subaccount = SECRETS.PS_SB_OA_GHSOUTH;
            break;
        case 'oa_ghnorth':
            subaccount = SECRETS.PS_SB_OA_GHSOUTH;
            break;
        case 'oa_ghsouth':
            subaccount = SECRETS.PS_SB_OA_GHSOUTH;
            break;
        case 'oa_ghwest':
            subaccount = SECRETS.PS_SB_OA_GHSOUTH;
            break;
        case 'oa_tarkwa':
            subaccount = SECRETS.PS_SB_OA_GHSOUTH;
            break;
        case 'oa_sunyani':
            subaccount = SECRETS.PS_SB_OA_GHSOUTH;
            break;
        // Creative Arts Accounts
        case 'accra_greater_love_choir':
            subaccount = SECRETS.PS_SB_CA_GREATER_LOVE_CHOIR;
            break;
        case 'accra_dancing_stars':
            subaccount = SECRETS.PS_SB_CA_DANCING_STARS;
            break;
        case 'accra_film_stars':
            subaccount = SECRETS.PS_SB_CA_FILM_STARS;
            break;
        default:
            subaccount = SECRETS.PS_SB_FLE;
            break;
    }
    return { auth, subaccount };
};
exports.getStreamFinancials = getStreamFinancials;
