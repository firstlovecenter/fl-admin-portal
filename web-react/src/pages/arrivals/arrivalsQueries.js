import { gql } from '@apollo/client'

export const CONSTITUENCY_ARRIVALS_DASHBOARD = gql`
  query ($id: ID!) {
    constituencies(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      admin {
        id
        firstName
        lastName
      }
      arrivalsAdmin {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      bacentasNoActivityCount
      bacentasMobilisingCount
      bacentasOnTheWayCount
      bacentasHaveBeenCountedCount
      bacentasHaveArrivedCount
      bussingMembersOnTheWayCount
      bussingMembersHaveArrivedCount
    }
  }
`

export const COUNCIL_ARRIVALS_DASHBOARD = gql`
  query ($id: ID!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      admin {
        id
        firstName
        lastName
      }
      arrivalsAdmin {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      constituencyCount
      bacentasNoActivityCount
      bacentasMobilisingCount
      bacentasOnTheWayCount
      bacentasHaveBeenCountedCount
      bacentasHaveArrivedCount
      bussingMembersOnTheWayCount
      bussingMembersHaveArrivedCount
    }
  }
`

export const STREAM_ARRIVALS_DASHBOARD = gql`
  query ($id: ID!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      admin {
        id
        firstName
        lastName
      }
      arrivalsAdmin {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      councilCount
      bacentasNoActivityCount
      bacentasMobilisingCount
      bacentasOnTheWayCount
      bacentasNotCountedCount
      bacentasHaveBeenCountedCount
      bacentasHaveArrivedCount
      bussingMembersOnTheWayCount
      bussingMembersHaveArrivedCount
    }
  }
`

export const GATHERINGSERVICE_ARRIVALS_DASHBOARD = gql`
  query ($id: ID!, $date: Date!) {
    gatheringServices(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      admin {
        id
        firstName
        lastName
      }
      arrivalsAdmin {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      streamCount
      bacentasNoActivityCount
      bacentasMobilisingCount
      bacentasOnTheWayCount
      bacentasHaveBeenCountedCount
      bacentasHaveArrivedCount
      bussingMembersOnTheWayCount
      bussingMembersHaveArrivedCount
    }
    timeGraphs(where: { date: $date }) {
      id
      date
      swell
    }
  }
`

export const CONFIRM_CONSTITUENCY_ARRIVALS = gql`
  query ($id: ID!) {
    constituencies(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      stream_name
      bacentasOnTheWay {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussing(limit: 1) {
          id
          confirmed_by {
            id
            firstName
            lastName
            fullName
          }
        }
      }
    }
  }
`

export const CONFIRM_COUNCIL_ARRIVALS = gql`
  query ($id: ID!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      stream_name
      bacentasOnTheWay {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussing(limit: 1) {
          id
          confirmed_by {
            id
            firstName
            lastName
            fullName
          }
        }
      }
    }
  }
`

export const CONFIRM_STREAM_ARRIVALS = gql`
  query ($id: ID!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      stream_name
      bacentasOnTheWay {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussing(limit: 1) {
          id
          confirmed_by {
            id
            firstName
            lastName
            fullName
          }
        }
      }
    }
  }
`

export const CONFIRM_GATHERINGSERVICE_ARRIVALS = gql`
  query ($id: ID!) {
    gatheringServices(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasOnTheWay {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussing(limit: 1) {
          id
          confirmed_by {
            id
            firstName
            lastName
            fullName
          }
        }
      }
    }
  }
`

export const BACENTA_ARRIVALS = gql`
  query ($id: ID!, $date: Date) {
    bacentas(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      stream_name
      stream {
        id
        name
        mobilisationStartTime
        mobilisationEndTime
        arrivalStartTime
        arrivalEndTime
      }
      momoNumber
      normalBussingTopUp
      swellBussingTopUp

      arrivalsCodeOfTheDay
      bussing(limit: 1) {
        id
        created_at
        serviceDate {
          date
        }
        week
        mobilisationPicture
        bussingPictures
        arrivalTime
      }
    }
    timeGraphs(where: { date: $date }) {
      id
      date
      swell
    }
  }
`

export const CONSTITUENCY_LEADER_ARRIVALS = gql`
  query ($id: ID!) {
    members(where: { id: $id }, options: { limit: 1 }) {
      id
      firstName
      lastName
      fullName
      leadsConstituency {
        id
        name
      }
      isAdminForConstituency {
        id
        name
      }
    }
  }
`

export const COUNCIL_LEADER_ARRIVALS = gql`
  query ($id: ID!) {
    members(where: { id: $id }, options: { limit: 1 }) {
      id
      firstName
      lastName
      fullName
      leadsCouncil {
        id
        name
      }
      isAdminForCouncil {
        id
        name
      }
    }
  }
`

export const STREAM_LEADER_ARRIVALS = gql`
  query ($id: ID!) {
    members(where: { id: $id }, options: { limit: 1 }) {
      id
      firstName
      lastName
      fullName
      leadsStream {
        id
        name
      }
      isAdminForStream {
        id
        name
      }
    }
  }
`

export const GATHERINGSERVICE_LEADER_ARRIVALS = gql`
  query ($id: ID!) {
    members(where: { id: $id }, options: { limit: 1 }) {
      id
      firstName
      lastName
      fullName
      leadsGatheringService {
        id
        name
      }
      isAdminForGatheringService {
        id
        name
      }
    }
  }
`

export const DISPLAY_BUSSING_RECORDS = gql`
  query DisplayBussingRecords($bussingRecordId: ID!, $bacentaId: ID!) {
    bussingRecords(where: { id: $bussingRecordId }) {
      id
      created_at
      created_by {
        id
        firstName
        lastName
        fullName
      }
      confirmed_by {
        id
        firstName
        lastName
        fullName
      }
      serviceDate {
        date
      }
      week
      mobilisationPicture
      leaderDeclaration
      attendance
      bussingPictures
      bussingCost
      bussingTopUp
      numberOfBusses
      numberOfCars
      comments
      arrivalTime
    }
    bacentas(where: { id: $bacentaId }) {
      id
      name
      stream_name
      stream {
        id
        arrivalStartTime
        arrivalEndTime
      }
      normalBussingTopUp
      swellBussingTopUp
    }
  }
`
