"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVenueDescription = exports.createFellowshipDescription = exports.createMemberDescription = void 0;
const createMemberDescription = ({ member, fellowship, council, pastor, phone, WhatsApp, }) => JSON.stringify({
    member,
    fellowship,
    council,
    pastor,
    phoneNumber: phone,
    whatsappNumber: WhatsApp,
});
exports.createMemberDescription = createMemberDescription;
const createFellowshipDescription = ({ fellowshipLeader, fellowship, council, councilLeader, }) => JSON.stringify({
    fellowshipLeader,
    fellowship,
    council,
    councilLeader,
});
exports.createFellowshipDescription = createFellowshipDescription;
const createVenueDescription = ({ venue, category, }) => {
    return JSON.stringify({
        venue,
        category,
    });
};
exports.createVenueDescription = createVenueDescription;
