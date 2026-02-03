import { gql } from '@apollo/client'

export const MEMBER_PLACES_SEARCH_BY_LOCATION = gql`
  query memberPlacesSearchByLocation(
    $id: ID!
    $latitude: Float!
    $longitude: Float!
  ) {
    members(where: { id: $id }) {
      id
      placesSearchByLocation(latitude: $latitude, longitude: $longitude) {
        id
        name
        typename
        description
        picture
        # TODO: We must eventually switch from these to a location property object
        latitude
        longitude
      }
    }
  }
`

export const MEMBER_PLACES_SEARCH_BY_NAME = gql`
  query memberPlacesSearchByName($id: ID!, $key: String!) {
    members(where: { id: $id }) {
      id
      placesSearchByName(key: $key) {
        id
        name
        typename
        description
        picture
        latitude
        longitude
      }
    }
  }
`

export const LOAD_COUNCIL_UNVISITED_MEMBERS = gql`
  query memberLoadCouncilUnvisitedMembers($id: ID!) {
    members(where: { id: $id }) {
      id
      memberLoadCouncilUnvisitedMembers {
        id
        name
        typename
        description
        picture
        latitude
        longitude
      }
    }
  }
`
