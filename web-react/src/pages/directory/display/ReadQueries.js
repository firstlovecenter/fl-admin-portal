import { gql } from '@apollo/client'

export const DISPLAY_MEMBER_BIO = gql`
  query ($id: ID!) {
    members(where: { id: $id }) {
      id
      firstName
      middleName
      lastName
      fullName
      email
      phoneNumber
      pictureUrl
      whatsappNumber
      pictureUrl
      dob {
        date
      }
      gender {
        gender
      }
      maritalStatus {
        status
      }
      occupation {
        occupation
      }
      titleConnection {
        edges {
          date
          node {
            title
          }
        }
      }
    }
  }
`
export const DISPLAY_MEMBER_LEADERSHIP = gql`
  query ($id: ID!) {
    members(where: { id: $id }) {
      id

      #Leadership Information
      leadsFellowship {
        id
        name
        stream_name
        leader {
          firstName
          lastName
        }
      }
      leadsBacenta {
        id
        name
        stream_name
      }
      leadsConstituency {
        id
        name
        stream_name
      }
      leadsCouncil {
        id
        name
        stream_name
      }
      leadsStream {
        id
        name
      }
      leadsGatheringService {
        id
        name
      }
      leadsSonta {
        id
        name
        stream_name
      }

      leadsMinistry {
        id
        name
      }
    }
  }
`

export const DISPLAY_MEMBER_ADMIN = gql`
  query ($id: ID!) {
    members(where: { id: $id }) {
      id

      #Admin Information
      isAdminForGatheringService {
        id
        name
      }
      isAdminForStream {
        id
        name
      }
      isAdminForCouncil {
        id
        name
        stream_name
      }
      isAdminForConstituency {
        id
        name
        stream_name
      }
    }
  }
`

export const DISPLAY_MEMBER_CHURCH = gql`
  query ($id: ID!) {
    members(where: { id: $id }) {
      id
      #church info
      stream_name
      ministry {
        id
        name
        leader {
          firstName
          lastName
        }
      }

      fellowship {
        id
        name
        leader {
          firstName
          lastName
        }
        council {
          id
        }
      }
      #Personal history
      history(limit: 3) {
        id
        timeStamp
        created_at {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const DISPLAY_FELLOWSHIP = gql`
  query ($id: ID!) {
    fellowships(where: { id: $id }, options: { limit: 1 }) {
      id
      vacationStatus
      stream_name
      bankingCode
      name
      memberCount
      location {
        longitude
        latitude
      }
      meetingDay {
        day
      }
      bacenta {
        id
        name
        constituency {
          id
          name
        }
      }
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
    }
  }
`
export const DISPLAY_FELLOWSHIP_HISTORY = gql`
  query ($id: ID!) {
    fellowships(where: { id: $id }, options: { limit: 1 }) {
      id
      services(limit: 5) {
        id
        bankingProof
        week
      }
      history(limit: 5) {
        id
        timeStamp
        created_at {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const DISPLAY_SONTA = gql`
  query DisplaySonta($id: ID!) {
    sontas(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      ministry {
        id
        name
      }
      leader {
        id
        firstName
        lastName
        whatsappNumber
        title {
          title
        }
      }

      constituency {
        id
        name
        council {
          id
          name
        }
      }
      history(limit: 5) {
        id
        timeStamp
        created_at {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
    }
    sontaMemberCount(id: $id)
    sontaBasontaLeaderList(id: $id) {
      id
      firstName
      lastName
    }
  }
`

export const DISPLAY_BACENTA = gql`
  query ($id: ID!) {
    bacentas(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      vacationStatus
      graduationStatus
      target
      normalBussingTopUp
      swellBussingTopUp
      momoNumber
      stream_name
      activeFellowshipCount
      vacationFellowshipCount
      fellowships(options: { limit: 5 }) {
        id
        name
        leader {
          id
        }
        bacenta {
          id
          name
          stream_name

          constituency {
            id
            council {
              id
            }
          }
        }
      }

      constituency {
        id
        name
        stream_name
        council {
          id
          name
        }
      }
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        whatsappNumber
        title {
          title
        }
      }
      history(limit: 5) {
        id
        timeStamp
        created_at {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
      memberCount
    }
  }
`

export const DISPLAY_CONSTITUENCY = gql`
  query ($id: ID!) {
    constituencies(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      target
      stream_name
      activeBacentaCount
      vacationBacentaCount
      vacationFellowshipCount
      bacentas(options: { limit: 5 }) {
        id
        name
        leader {
          id
        }
        constituency {
          id
          name
          council {
            id
          }
        }
      }
      sontas {
        id
        name
      }
      admin {
        id
        firstName
        lastName
        fellowship {
          id
          bacenta {
            id
            constituency {
              id
              name
              council {
                id
              }
            }
          }
        }
      }
      council {
        id
        name
      }

      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        created_at {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
      memberCount
      activeFellowshipCount
    }
  }
`

export const DISPLAY_COUNCIL = gql`
  query ($id: ID!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      target
      stream {
        id
        name
      }
      stream_name
      constituencyCount
      activeBacentaCount
      activeFellowshipCount
      memberCount
      pastorCount
      vacationBacentaCount
      vacationFellowshipCount
      stream {
        id
        name
      }
      constituencies {
        id
        name
        stream_name
        leader {
          id
        }
        council {
          id
        }
      }

      admin {
        id
        firstName
        lastName
        fellowship {
          id
        }
      }
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        created_at {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const DISPLAY_STREAM = gql`
  query ($id: ID!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      target
      councilCount
      constituencyCount
      activeBacentaCount
      activeFellowshipCount
      memberCount
      pastorCount
      vacationBacentaCount
      vacationFellowshipCount
      gatheringService {
        id
        name
      }
      councils {
        id
        name
        stream_name
        leader {
          id
        }
      }

      admin {
        id
        firstName
        lastName
        stream_name
      }
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        created_at {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const DISPLAY_GATHERINGSERVICE = gql`
  query ($id: ID!) {
    gatheringServices(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      target
      streamCount
      councilCount
      constituencyCount
      activeBacentaCount
      activeFellowshipCount
      memberCount
      pastorCount
      vacationBacentaCount
      vacationFellowshipCount
      streams {
        id
        name
        stream_name
      }

      admin {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        created_at {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
    }
  }
`
