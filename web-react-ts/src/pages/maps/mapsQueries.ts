import { gql } from '@apollo/client'

export const PLACES_SEARCH_BY_LOCATION = gql`
  query PlacesSearchByLocation(
    $id: ID!
    $latitude: Float!
    $longitude: Float!
  ) {
    members(where: { id: { eq: $id } }) {
      id
      placesSearchByLocation(latitude: $latitude, longitude: $longitude) {
        id
        typename
        name
        firstName
        lastName
        latitude
        longitude
        description
        picture
      }
    }
  }
`

export const PLACES_SEARCH_BY_NAME = gql`
  query PlacesSearchByName($id: ID!, $key: String!) {
    members(where: { id: { eq: $id } }) {
      id
      placesSearchByName(key: $key) {
        id
        typename
        name
        firstName
        lastName
        latitude
        longitude
        description
        picture
      }
    }
  }
`

export const LOAD_COUNCIL_UNVISITED_MEMBERS = gql`
  query LoadCouncilUnvisitedMembers($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      memberLoadCouncilUnvisitedMembers {
        id
        typename
        name
        firstName
        lastName
        latitude
        longitude
        description
        picture
      }
    }
  }
`

// Pictorial overview: all Bacentas with a recorded location.
// Marker locations only — no PII. Scoped server-side by Member auth.
export const BACENTAS_WITH_LOCATIONS = gql`
  query BacentasWithLocations($limit: Int!) {
    bacentas(limit: $limit) {
      id
      name
      location {
        latitude
        longitude
      }
      leader {
        id
        fullName
        phoneNumber
        whatsappNumber
      }
      governorship {
        id
        name
      }
    }
  }
`
