import { gql } from '@apollo/client'

export const FELLOWSHIP_GRAPHS = gql`
  query fellowshipGraphs($fellowshipId: ID) {
    fellowships(where: { id: $fellowshipId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      services(limit: 4) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }
      memberCount
    }
  }
`

export const BACENTA_GRAPHS = gql`
  query bacentaGraphs($id: ID!) {
    bacentas(where: { id: $id }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: 4) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: 4) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }
      bussing(limit: 4) {
        id
        createdAt
        attendance
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const GOVERNORSHIP_GRAPHS = gql`
  query governorshipGraphs($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: 4) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: 4) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const COUNCIL_GRAPHS = gql`
  query councilGraphs($councilId: ID!) {
    councils(where: { id: $councilId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: 4) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: 4) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const STREAM_GRAPHS = gql`
  query streamGraphs($streamId: ID!) {
    streams(where: { id: $streamId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: 4) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: 4) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const CAMPUS_GRAPHS = gql`
  query campusGraphs($campusId: ID!) {
    campuses(where: { id: $campusId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        dollarIncome
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: 4) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: 4) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const OVERSIGHT_GRAPHS = gql`
  query oversightGraphs($oversightId: ID!) {
    oversights(where: { id: $oversightId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: 4) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: 4) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const DENOMINATION_GRAPHS = gql`
  query denominationGraphs($denominationId: ID!) {
    denominations(where: { id: $denominationId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        dollarIncome
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: 4) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }

      memberCount
    }
  }
`

export const HUB_GRAPHS = gql`
  query hubGraphs($hubId: ID!) {
    hubs(where: { id: $hubId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        nameWithTitle
        pictureUrl
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }

      rehearsals(limit: 4) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const HUBCOUNCIL_GRAPHS = gql`
  query hubCouncilGraphs($hubCouncilId: ID!) {
    hubCouncils(where: { id: $hubCouncilId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        nameWithTitle
        pictureUrl
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateRehearsalRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }

      rehearsals(limit: 4) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const MINISTRY_GRAPHS = gql`
  query ministryGraphs($ministryId: ID!) {
    ministries(where: { id: $ministryId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      onStageAttendanceRecords(limit: 4) {
        id
        attendance
        week
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }

      aggregateRehearsalRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }

      memberCount
    }
  }
`

export const CREATIVEARTS_GRAPHS = gql`
  query creativeArtsGraphs($creativeArtsId: ID!) {
    creativeArts(where: { id: $creativeArtsId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }

      aggregateRehearsalRecords(limit: 4) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateStageAttendanceRecords(limit: 4) {
        id
        attendance
        numberOfServices
        week
      }

      memberCount
    }
  }
`
