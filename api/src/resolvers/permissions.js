"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permitSheepSeeker = exports.permitTellerStream = exports.permitAdminArrivals = exports.permitLeaderAdminArrivals = exports.permitArrivalsHelpers = exports.permitArrivalsPayer = exports.permitArrivalsCounter = exports.permitArrivals = exports.permitMe = exports.permitLeaderAdmin = exports.permitAdmin = exports.permitLeader = void 0;
// Permissions Things
const permitLeader = (churchLevel) => {
    let permittedFor = [];
    switch (churchLevel.toLowerCase()) {
        case 'fellowship':
            permittedFor = [
                'leaderDenomination',
                'leaderOversight',
                'leaderCampus',
                'leaderStream',
                'leaderCouncil',
                'leaderGovernorship',
                'leaderBacenta',
                'leaderFellowship',
                'leaderHub',
                'leaderMinistry',
                'leaderCreativeArts',
            ];
            break;
        case 'bacenta':
            permittedFor = [
                'leaderDenomination',
                'leaderOversight',
                'leaderCampus',
                'leaderStream',
                'leaderCouncil',
                'leaderGovernorship',
                'leaderBacenta',
            ];
            break;
        case 'governorship':
            permittedFor = [
                'leaderDenomination',
                'leaderOversight',
                'leaderCampus',
                'leaderStream',
                'leaderCouncil',
                'leaderGovernorship',
            ];
            break;
        case 'council':
            permittedFor = [
                'leaderDenomination',
                'leaderOversight',
                'leaderCampus',
                'leaderStream',
                'leaderCouncil',
            ];
            break;
        case 'stream':
            permittedFor = [
                'leaderDenomination',
                'leaderOversight',
                'leaderCampus',
                'leaderStream',
            ];
            break;
        case 'campus':
            permittedFor = ['leaderDenomination', 'leaderOversight', 'leaderCampus'];
            break;
        case 'oversight':
            permittedFor = ['leaderDenomination', 'leaderOversight'];
            break;
        case 'denomination':
            permittedFor = ['leaderDenomination'];
            break;
        case 'creativearts':
            permittedFor = ['leaderCampus', 'leaderCreativeArts'];
            break;
        case 'ministry':
            permittedFor = [
                'leaderCampus',
                'leaderStream',
                'leaderCreativeArts',
                'leaderMinistry',
            ];
            break;
        case 'hubcouncil':
            permittedFor = [
                'leaderCampus',
                'leaderCreativeArts',
                'leaderStream',
                'leaderMinistry',
                'leaderHubCouncil',
            ];
            break;
        case 'hub':
            permittedFor = [
                'leaderCampus',
                'leaderCreativeArts',
                'leaderStream',
                'leaderMinistry',
                'leaderHubCouncil',
                'leaderHub',
            ];
            break;
        default:
            permittedFor = [];
            break;
    }
    return permittedFor;
};
exports.permitLeader = permitLeader;
const permitAdmin = (churchLevel) => {
    let permittedFor = [];
    switch (churchLevel) {
        case 'Fellowship':
        case 'Bacenta':
        case 'Hub':
            permittedFor = [
                'adminMinistry',
                'adminCreativeArts',
                'adminGovernorship',
                'adminCouncil',
                'adminStream',
                'adminCampus',
                'adminOversight',
                'adminDenomination',
            ];
            break;
        case 'HubCouncil':
            permittedFor = [
                'adminMinistry',
                'adminCreativeArts',
                'adminCouncil',
                'adminStream',
                'adminCampus',
                'adminOversight',
                'adminDenomination',
            ];
            break;
        case 'Governorship':
            permittedFor = [
                'adminDenomination',
                'adminOversight',
                'adminCampus',
                'adminStream',
                'adminCouncil',
                'adminGovernorship',
            ];
            break;
        case 'Council':
            permittedFor = [
                'adminDenomination',
                'adminOversight',
                'adminCampus',
                'adminStream',
                'adminCouncil',
            ];
            break;
        case 'Stream':
            permittedFor = [
                'adminDenomination',
                'adminOversight',
                'adminCampus',
                'adminStream',
            ];
            break;
        case 'Campus':
            permittedFor = ['adminDenomination', 'adminOversight', 'adminCampus'];
            break;
        case 'Oversight':
            permittedFor = ['adminDenomination', 'adminOversight'];
            break;
        case 'Denomination':
            permittedFor = ['adminDenomination'];
            break;
        case 'CreativeArts':
            permittedFor = ['adminCampus', 'adminCreativeArts'];
            break;
        case 'Ministry':
            permittedFor = [
                'adminStream',
                'adminCreativeArts',
                'adminMinistry',
                'adminCampus',
            ];
            break;
        default:
            permittedFor = [];
            break;
    }
    return permittedFor;
};
exports.permitAdmin = permitAdmin;
const permitLeaderAdmin = (churchLevel) => {
    return [...(0, exports.permitLeader)(churchLevel), ...(0, exports.permitAdmin)(churchLevel)];
};
exports.permitLeaderAdmin = permitLeaderAdmin;
const permitMe = (churchLevel) => {
    return [
        ...(0, exports.permitLeaderAdmin)(churchLevel),
        ...(0, exports.permitArrivals)(churchLevel),
        ...(0, exports.permitArrivalsHelpers)(churchLevel),
        ...(0, exports.permitTellerStream)(),
        ...(0, exports.permitSheepSeeker)(),
    ];
};
exports.permitMe = permitMe;
const permitArrivals = (churchLevel) => {
    let permittedFor = [];
    switch (churchLevel) {
        case 'Fellowship':
        case 'Bacenta':
            permittedFor = [
                'arrivalsAdminCampus',
                'arrivalsAdminStream',
                'arrivalsAdminCouncil',
                'arrivalsAdminGovernorship',
            ];
            break;
        case 'Governorship':
            permittedFor = [
                'arrivalsAdminCampus',
                'arrivalsAdminStream',
                'arrivalsAdminCouncil',
                'arrivalsAdminGovernorship',
            ];
            break;
        case 'Council':
            permittedFor = [
                'arrivalsAdminCampus',
                'arrivalsAdminStream',
                'arrivalsAdminCouncil',
            ];
            break;
        case 'Stream':
            permittedFor = ['arrivalsAdminCampus', 'arrivalsAdminStream'];
            break;
        case 'Campus':
            permittedFor = ['arrivalsAdminCampus'];
            break;
        default:
            permittedFor = [];
            break;
    }
    if (churchLevel === 'Stream') {
        return [...(0, exports.permitAdmin)(churchLevel), ...permittedFor];
    }
    return permittedFor;
};
exports.permitArrivals = permitArrivals;
const permitArrivalsCounter = () => {
    return ['arrivalsCounterStream'];
};
exports.permitArrivalsCounter = permitArrivalsCounter;
const permitArrivalsPayer = () => {
    return ['arrivalsPayerCouncil'];
};
exports.permitArrivalsPayer = permitArrivalsPayer;
const permitArrivalsHelpers = (churchLevel) => {
    if (churchLevel === 'Stream') {
        return ['arrivalsCounterStream', 'arrivalsPayerCouncil'];
    }
    return [];
};
exports.permitArrivalsHelpers = permitArrivalsHelpers;
const permitLeaderAdminArrivals = (churchLevel) => {
    return [...(0, exports.permitLeaderAdmin)(churchLevel), ...(0, exports.permitArrivals)(churchLevel)];
};
exports.permitLeaderAdminArrivals = permitLeaderAdminArrivals;
const permitAdminArrivals = (churchLevel) => {
    return [...(0, exports.permitAdmin)(churchLevel), ...(0, exports.permitArrivals)(churchLevel)];
};
exports.permitAdminArrivals = permitAdminArrivals;
const permitTellerStream = () => {
    return ['tellerStream'];
};
exports.permitTellerStream = permitTellerStream;
const permitSheepSeeker = () => {
    return ['sheepseekerStream'];
};
exports.permitSheepSeeker = permitSheepSeeker;
