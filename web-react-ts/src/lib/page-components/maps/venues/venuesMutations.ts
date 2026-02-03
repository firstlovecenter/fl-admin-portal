import { gql } from '@apollo/client'

export const CREATE_INDOOR_OUTREACH_VENUE_MUTATION = gql`
  mutation CreateIndoorVenue(
    $name: String!
    $capacity: Int!
    $longitude: Float!
    $latitude: Float!
  ) {
    CreateIndoorVenue(
      name: $name
      capacity: $capacity
      longitude: $longitude
      latitude: $latitude
    ) {
      id
      capacity
      location {
        latitude
        longitude
      }
      name
    }
  }
`
export const CREATE_OUTDOOR_OUTREACH_VENUE_MUTATION = gql`
  mutation CreateOutdoorVenue(
    $name: String!
    $capacity: Int!
    $longitude: Float!
    $latitude: Float!
  ) {
    CreateOutdoorVenue(
      name: $name
      capacity: $capacity
      longitude: $longitude
      latitude: $latitude
    ) {
      id
      capacity
      location {
        latitude
        longitude
      }
      name
    }
  }
`
export const CREATE_SENIOR_HIGH_SCHOOL_MUTATION = gql`
  mutation CreateHighSchool(
    $name: String!
    $capacity: Int!
    $latitude: Float!
    $longitude: Float!
    $school: String!
  ) {
    CreateHighSchool(
      name: $name
      capacity: $capacity
      latitude: $latitude
      longitude: $longitude
      school: $school
    ) {
      id
      name
      capacity
      school
      location {
        latitude
        longitude
      }
    }
  }
`

export const CREATE_HOSTEL_INFORMATION_MUTATION = gql`
  mutation CreateHostel(
    $name: String!
    $capacity: Int!
    $latitude: Float!
    $longitude: Float!
    $school: String!
  ) {
    CreateHostel(
      name: $name
      capacity: $capacity
      latitude: $latitude
      longitude: $longitude
      school: $school
    ) {
      id
      name
      capacity
      school
      university
      location {
        latitude
        longitude
      }
    }
  }
`
