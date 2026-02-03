"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapsMutations = exports.mapsResolvers = void 0;
const utils_1 = require("../utils/utils");
const maps_cypher_1 = require("./maps-cypher");
const maps_utils_1 = require("./maps-utils");
const parseMapData = (place) => {
    if ('member' in place) {
        return {
            id: place.member.properties.id,
            name: `${place.member.properties.firstName} ${place.member.properties.lastName}`,
            typename: 'Member',
            location: place.member.properties.location,
            latitude: place.member.properties.location.y,
            longitude: place.member.properties.location.x,
            distance: place?.distance,
            picture: place.member.properties.pictureUrl,
            description: (0, maps_utils_1.createMemberDescription)({
                member: place.member.properties,
                fellowship: place.fellowship,
                council: place.council,
                pastor: place.pastor,
                phone: place.member.properties.phoneNumber,
                WhatsApp: place.member.properties.whatsappNumber,
            }),
        };
    }
    if ('fellowship' in place) {
        return {
            id: place.fellowship.properties.id,
            name: place.fellowship.properties.name,
            typename: 'Fellowship',
            picture: place.fellowshipLeader?.pictureUrl,
            location: place.fellowship.properties.location,
            latitude: place.fellowship.properties.location.y,
            longitude: place.fellowship.properties.location.x,
            distance: place.distance,
            description: (0, maps_utils_1.createFellowshipDescription)({
                fellowshipLeader: place.fellowshipLeader,
                fellowship: place.fellowship.properties,
                council: place.council,
                councilLeader: place.councilLeader,
            }),
        };
    }
    if ('outreachVenue' in place) {
        return {
            id: place.outreachVenue.properties.id,
            name: place.outreachVenue.properties.name,
            typename: place.outreachVenue.labels.find((label) => label !== 'OutreachVenue') ||
                'OutreachVenue',
            location: place.outreachVenue.properties.location,
            latitude: place.outreachVenue.properties.location.y,
            longitude: place.outreachVenue.properties.location.x,
            distance: place.distance,
            description: (0, maps_utils_1.createVenueDescription)({
                venue: place.outreachVenue.properties,
                category: 'Outdoor',
            }),
        };
    }
    return null;
};
exports.mapsResolvers = {
    Member: {
        memberLoadCouncilUnvisitedMembers: async (source, args, context) => {
            const session = context.executionContext.session();
            try {
                const res = await session.executeRead((tx) => tx.run(maps_cypher_1.memberLoadCouncilUnvisitedMembers, {
                    id: source.id,
                    jwt: context.jwt,
                }));
                const peopleRes = (0, utils_1.rearrangeCypherObject)(res, true);
                const places = peopleRes;
                // return the 30 closest places
                const formattedPlaces = places.map((place) => parseMapData(place));
                return formattedPlaces;
            }
            catch (error) {
                (0, utils_1.throwToSentry)('e', error);
            }
            finally {
                await session.close();
            }
            return [];
        },
        placesSearchByName: async (source, args, context) => {
            const session = context.executionContext.session();
            const sessionTwo = context.executionContext.session();
            const sessionThree = context.executionContext.session();
            const sessionFour = context.executionContext.session();
            try {
                const res = await Promise.all([
                    session.executeRead((tx) => tx.run(maps_cypher_1.memberMemberSearchByName, {
                        id: source.id,
                        key: args.key,
                        limit: args.limit,
                    })),
                    sessionTwo.executeRead((tx) => tx.run(maps_cypher_1.memberBacentaSearchByName, {
                        id: source.id,
                        key: args.key,
                        limit: args.limit,
                    })),
                    sessionThree.executeRead((tx) => tx.run(maps_cypher_1.indoorOutreachVenuesSearchByName, {
                        id: source.id,
                        key: args.key,
                        limit: args.limit,
                    })),
                    sessionFour.executeRead((tx) => tx.run(maps_cypher_1.outdoorOutreachVenuesSearchByName, {
                        id: source.id,
                        key: args.key,
                        limit: args.limit,
                    })),
                ]);
                // Process Results
                const peopleRes = (0, utils_1.rearrangeCypherObject)(res[0], true);
                const fellowshipsRes = (0, utils_1.rearrangeCypherObject)(res[1], true);
                const indoorVenuesRes = (0, utils_1.rearrangeCypherObject)(res[2], true);
                const outdoorVenuesRes = (0, utils_1.rearrangeCypherObject)(res[3], true);
                // merge the two arrays and order by distance in ascending order
                const places = [
                    ...peopleRes,
                    ...fellowshipsRes,
                    ...indoorVenuesRes,
                    ...outdoorVenuesRes,
                ].sort((a, b) => a.distance - b.distance);
                // return the 30 closest places
                const formattedPlaces = places
                    .map((place) => parseMapData(place))
                    .slice(0, 30);
                return formattedPlaces;
            }
            catch (e) {
                // Handle Error
                (0, utils_1.throwToSentry)('e', e);
            }
            finally {
                // Close the session
                await Promise.all([
                    session.close(),
                    sessionTwo.close(),
                    sessionThree.close(),
                    sessionFour.close(),
                ]);
            }
            return [];
        },
        placesSearchByLocation: async (source, args, context) => {
            const session = context.executionContext.session();
            const sessionTwo = context.executionContext.session();
            const sessionThree = context.executionContext.session();
            const sessionFour = context.executionContext.session();
            try {
                const res = await Promise.all([
                    session.executeRead((tx) => tx.run(maps_cypher_1.memberMemberSearchByLocation, {
                        id: source.id,
                        latitude: args.latitude,
                        longitude: args.longitude,
                        limit: args.limit,
                    })),
                    sessionTwo.executeRead((tx) => tx.run(maps_cypher_1.memberBacentaSearchByLocation, {
                        id: source.id,
                        latitude: args.latitude,
                        longitude: args.longitude,
                        limit: args.limit,
                    })),
                    sessionThree.executeRead((tx) => tx.run(maps_cypher_1.indoorOutreachVenuesSearchByLocation, {
                        id: source.id,
                        latitude: args.latitude,
                        longitude: args.longitude,
                        limit: args.limit,
                    })),
                    sessionFour.executeRead((tx) => tx.run(maps_cypher_1.outdoorOutreachVenuesSearchByLocation, {
                        id: source.id,
                        latitude: args.latitude,
                        longitude: args.longitude,
                        limit: args.limit,
                    })),
                ]);
                // Process Results
                const peopleRes = (0, utils_1.rearrangeCypherObject)(res[0], true);
                const fellowshipsRes = (0, utils_1.rearrangeCypherObject)(res[1], true);
                const indoorVenuesRes = (0, utils_1.rearrangeCypherObject)(res[2], true);
                const outdoorVenuesRes = (0, utils_1.rearrangeCypherObject)(res[3], true);
                // merge the  arrays and order by distance in ascending order
                const places = [
                    ...peopleRes,
                    ...fellowshipsRes,
                    ...indoorVenuesRes,
                    ...outdoorVenuesRes,
                ].sort((a, b) => a.distance - b.distance);
                // return the 30 closest places
                const formattedPlaces = places
                    .map((place) => parseMapData(place))
                    .slice(0, 30);
                return formattedPlaces;
            }
            catch (e) {
                // Handle Error
                (0, utils_1.throwToSentry)('e', e);
            }
            finally {
                // Close the session
                await Promise.all([
                    session.close(),
                    sessionTwo.close(),
                    sessionThree.close(),
                    sessionFour.close(),
                ]);
            }
            return [];
        },
    },
};
exports.mapsMutations = {};
