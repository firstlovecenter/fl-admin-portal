import type { Node, Integer, Point } from 'neo4j-driver'
import { Member } from '../utils/types'
import { rearrangeCypherObject, throwToSentry } from '../utils/utils'
import {
  memberBacentaSearchByLocation,
  memberBacentaSearchByName,
  memberMemberSearchByLocation,
  memberMemberSearchByName,
  indoorOutreachVenuesSearchByLocation,
  indoorOutreachVenuesSearchByName,
  outdoorOutreachVenuesSearchByName,
  outdoorOutreachVenuesSearchByLocation,
  memberLoadCouncilUnvisitedMembers,
} from './maps-cypher'
import {
  createFellowshipDescription,
  createMemberDescription,
  createVenueDescription,
} from './maps-utils'
import { Context } from '../utils/neo4j-types'

interface FellowshipResultShape {
  fellowship: Node<
    Integer,
    {
      id: string
      name: string
      location: Point
      description: string
    }
  >

  fellowshipLeader: {
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    whatsappNumber: string
    pictureUrl: string
  }

  council: {
    id: string
    name: string
  }

  councilLeader: {
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    whatsappNumber: string
    pictureUrl: string
  }

  distance: number
}

interface PeopleResultShape {
  member: Node<
    Integer,
    {
      id: string
      firstName: string
      lastName: string
      location: Point
      pictureUrl: string
      phoneNumber: string
      whatsappNumber: string
      description: string
    }
  >
  fellowship: {
    id: string
    name: string
    location: Point
  }

  council: {
    id: string
    name: string
  }

  pastor: {
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
  }

  distance: number
}

interface OutreachVenueResultShape {
  outreachVenue: Node<
    Integer,
    {
      id: string
      name: string
      location: Point
      description: string
      capacity: number
    }
  >
  distance: number
}

const parseMapData = (
  place: FellowshipResultShape | OutreachVenueResultShape | PeopleResultShape
) => {
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
      description: createMemberDescription({
        member: place.member.properties,
        fellowship: place.fellowship,
        council: place.council,
        pastor: place.pastor,
        phone: place.member.properties.phoneNumber,
        WhatsApp: place.member.properties.whatsappNumber,
      }),
    }
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
      description: createFellowshipDescription({
        fellowshipLeader: place.fellowshipLeader,
        fellowship: place.fellowship.properties,
        council: place.council,
        councilLeader: place.councilLeader,
      }),
    }
  }

  if ('outreachVenue' in place) {
    return {
      id: place.outreachVenue.properties.id,
      name: place.outreachVenue.properties.name,
      typename:
        place.outreachVenue.labels.find((label) => label !== 'OutreachVenue') ||
        'OutreachVenue',
      location: place.outreachVenue.properties.location,
      latitude: place.outreachVenue.properties.location.y,
      longitude: place.outreachVenue.properties.location.x,
      distance: place.distance,
      description: createVenueDescription({
        venue: place.outreachVenue.properties,
        category: 'Outdoor',
      }),
    }
  }

  return null
}

export const mapsResolvers = {
  Member: {
    memberLoadCouncilUnvisitedMembers: async (
      source: Member,
      args: any,
      context: Context
    ) => {
      const session = context.executionContext.session()

      try {
        const res = await session.executeRead((tx: any) =>
          tx.run(memberLoadCouncilUnvisitedMembers, {
            id: source.id,
            jwt: context.jwt,
          })
        )
        const peopleRes: PeopleResultShape[] = rearrangeCypherObject(res, true)
        const places = peopleRes

        // return the 30 closest places
        const formattedPlaces = places.map((place) => parseMapData(place))

        return formattedPlaces
      } catch (error: any) {
        throwToSentry('e', error)
      } finally {
        await session.close()
      }
      return []
    },

    placesSearchByName: async (source: Member, args: any, context: Context) => {
      const session = context.executionContext.session()
      const sessionTwo = context.executionContext.session()
      const sessionThree = context.executionContext.session()
      const sessionFour = context.executionContext.session()

      try {
        const res = await Promise.all([
          session.executeRead((tx: any) =>
            tx.run(memberMemberSearchByName, {
              id: source.id,
              key: args.key,
              limit: args.limit,
            })
          ),
          sessionTwo.executeRead((tx: any) =>
            tx.run(memberBacentaSearchByName, {
              id: source.id,
              key: args.key,
              limit: args.limit,
            })
          ),
          sessionThree.executeRead((tx: any) =>
            tx.run(indoorOutreachVenuesSearchByName, {
              id: source.id,
              key: args.key,
              limit: args.limit,
            })
          ),
          sessionFour.executeRead((tx: any) =>
            tx.run(outdoorOutreachVenuesSearchByName, {
              id: source.id,
              key: args.key,
              limit: args.limit,
            })
          ),
        ])

        // Process Results
        const peopleRes: PeopleResultShape[] = rearrangeCypherObject(
          res[0],
          true
        )

        const fellowshipsRes: FellowshipResultShape[] = rearrangeCypherObject(
          res[1],
          true
        )

        const indoorVenuesRes: OutreachVenueResultShape[] =
          rearrangeCypherObject(res[2], true)
        const outdoorVenuesRes: OutreachVenueResultShape[] =
          rearrangeCypherObject(res[3], true)

        // merge the two arrays and order by distance in ascending order
        const places = [
          ...peopleRes,
          ...fellowshipsRes,
          ...indoorVenuesRes,
          ...outdoorVenuesRes,
        ].sort((a, b) => a.distance - b.distance)

        // return the 30 closest places
        const formattedPlaces = places
          .map((place) => parseMapData(place))
          .slice(0, 30)

        return formattedPlaces
      } catch (e) {
        // Handle Error
        throwToSentry('e', e)
      } finally {
        // Close the session
        await Promise.all([
          session.close(),
          sessionTwo.close(),
          sessionThree.close(),
          sessionFour.close(),
        ])
      }
      return []
    },

    placesSearchByLocation: async (
      source: Member,
      args: any,
      context: Context
    ) => {
      const session = context.executionContext.session()
      const sessionTwo = context.executionContext.session()
      const sessionThree = context.executionContext.session()
      const sessionFour = context.executionContext.session()

      try {
        const res = await Promise.all([
          session.executeRead((tx: any) =>
            tx.run(memberMemberSearchByLocation, {
              id: source.id,
              latitude: args.latitude,
              longitude: args.longitude,
              limit: args.limit,
            })
          ),
          sessionTwo.executeRead((tx: any) =>
            tx.run(memberBacentaSearchByLocation, {
              id: source.id,

              latitude: args.latitude,
              longitude: args.longitude,
              limit: args.limit,
            })
          ),
          sessionThree.executeRead((tx: any) =>
            tx.run(indoorOutreachVenuesSearchByLocation, {
              id: source.id,
              latitude: args.latitude,
              longitude: args.longitude,
              limit: args.limit,
            })
          ),
          sessionFour.executeRead((tx: any) =>
            tx.run(outdoorOutreachVenuesSearchByLocation, {
              id: source.id,
              latitude: args.latitude,
              longitude: args.longitude,
              limit: args.limit,
            })
          ),
        ])

        // Process Results
        const peopleRes: PeopleResultShape[] = rearrangeCypherObject(
          res[0],
          true
        )
        const fellowshipsRes: FellowshipResultShape[] = rearrangeCypherObject(
          res[1],
          true
        )
        const indoorVenuesRes: OutreachVenueResultShape[] =
          rearrangeCypherObject(res[2], true)
        const outdoorVenuesRes: OutreachVenueResultShape[] =
          rearrangeCypherObject(res[3], true)

        // merge the  arrays and order by distance in ascending order
        const places = [
          ...peopleRes,
          ...fellowshipsRes,
          ...indoorVenuesRes,
          ...outdoorVenuesRes,
        ].sort((a, b) => a.distance - b.distance)

        // return the 30 closest places
        const formattedPlaces = places
          .map((place) => parseMapData(place))
          .slice(0, 30)

        return formattedPlaces
      } catch (e) {
        // Handle Error
        throwToSentry('e', e)
      } finally {
        // Close the session
        await Promise.all([
          session.close(),
          sessionTwo.close(),
          sessionThree.close(),
          sessionFour.close(),
        ])
      }
      return []
    },
  },
}

export const mapsMutations = {}
