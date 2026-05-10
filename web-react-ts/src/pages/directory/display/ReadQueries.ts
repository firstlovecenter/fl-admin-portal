import { gql } from '@apollo/client'

export const DISPLAY_MEMBER_BIO = gql`
  query displayMemberBio($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      firstName
      middleName
      lastName
      fullName
      nameWithTitle
      currentTitle
      email
      phoneNumber
      stickyNote
      pictureUrl
      visitationArea
      whatsappNumber
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
    }
  }
`
export const DISPLAY_MEMBER_LEADERSHIP = gql`
  query displayMemberLeadership($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      leadsBacenta {
        id
        name
        stream_name
      }
      leadsGovernorship {
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
      leadsCampus {
        id
        name
      }
    }
  }
`

export const DISPLAY_MEMBER_ADMIN = gql`
  query displayMemberAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      #Admin Information
      isAdminForOversight {
        id
        name
      }
      isAdminForCampus {
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
      isAdminForGovernorship {
        id
        name
        stream_name
      }

    }
  }
`

export const DISPLAY_MEMBER_CHURCH = gql`
  query displayMemberChurch($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      #church info
      bacenta {
        id
        name
        leader {
          firstName
          lastName
        }
        council {
          id
          name
          leader {
            id
            firstName
            lastName
            fullName
          }
        }
      }
      basonta {
        id
        name
        leader {
          id
          firstName
          lastName
        }
      }
      #Personal history
      history(limit: 3) {
        id
        timeStamp
        createdAt {
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

export const DISPLAY_BACENTA_HISTORY = gql`
  query displayBacentaHistory($id: ID!) {
    bacentas(where: { id: { eq: $id } }, limit: 1) {
      id
      services(limit: 5) {
        id
        bankingProof
        week
        noServiceReason
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
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

export const DISPLAY_BACENTA = gql`
  query displayBacenta($id: ID!) {
    bacentas(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      bankingCode
      location {
        longitude
        latitude
      }
      meetingDay {
        day
        dayNumber
      }
      vacationStatus
      outbound
      sprinterTopUp
      urvanTopUp

      momoNumber
      stream_name

      governorship {
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
        currentTitle
        nameWithTitle
        pictureUrl
      }
      admin {
        id
        firstName
        lastName
        currentTitle
        nameWithTitle
        pictureUrl
      }
      deputyLeader {
        id
        firstName
        lastName
        currentTitle
        nameWithTitle
        pictureUrl
      }

      memberCount
    }
  }
`

export const DISPLAY_GOVERNORSHIP = gql`
  query displayGovernorship($id: ID!) {
    governorships(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      stream_name
      bacentaCount
      vacationGraduatedBacentaCount
      activeIcBacentaCount
      vacationIcBacentaCount
      bacentas(limit: 5) {
        id
        name
        leader {
          id
        }
      }

      admin {
        id
        firstName
        lastName
        pictureUrl
      }
      council {
        id
        name
      }

      leader {
        id
        firstName
        lastName
        currentTitle
        nameWithTitle
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
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

export const DISPLAY_COUNCIL = gql`
  query displayCouncil($id: ID!) {
    councils(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      stream {
        id
        name
      }
      stream_name
      governorshipCount
      bacentaCount
      memberCount
      pastorCount
      vacationGraduatedBacentaCount
      activeIcBacentaCount
      vacationIcBacentaCount
      stream {
        id
        name
      }
      governorships(limit: 5) {
        id
        name
      }

      admin {
        id
        firstName
        lastName
        pictureUrl
      }
      leader {
        id
        firstName
        lastName
        currentTitle
        nameWithTitle
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
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
  query displayStream($id: ID!) {
    streams(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      vacationStatus
      bankAccount
      councilCount
      governorshipCount
      bacentaCount
      memberCount
      pastorCount
      vacationGraduatedBacentaCount
      activeIcBacentaCount
      vacationIcBacentaCount
      meetingDay {
        day
        dayNumber
      }
      campus {
        id
        name
      }
      councils(limit: 5) {
        id
        name
      }

      admin {
        id
        firstName
        lastName
        pictureUrl
      }
      leader {
        id
        firstName
        lastName
        currentTitle
        nameWithTitle
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
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

export const DISPLAY_CAMPUS = gql`
  query displayCampus($id: ID!) {
    campuses(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      noIncomeTracking
      currency
      conversionRateToDollar
      streamCount
      councilCount
      governorshipCount
      bacentaCount
      memberCount
      pastorCount
      vacationGraduatedBacentaCount
      activeIcBacentaCount
      vacationIcBacentaCount
      oversight {
        id
        name
      }
      streams(limit: 5) {
        id
        name
        stream_name
      }

      admin {
        id
        firstName
        lastName
        pictureUrl
      }
      leader {
        id
        firstName
        lastName
        fullName
        currentTitle
        nameWithTitle
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
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

export const DISPLAY_OVERSIGHT = gql`
  query displayOversight($id: ID!) {
    oversights(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      campusCount
      streamCount
      councilCount
      governorshipCount
      bacentaCount
      memberCount
      pastorCount
      vacationGraduatedBacentaCount
      activeIcBacentaCount
      vacationIcBacentaCount
      denomination {
        id
        name
      }
      campuses {
        id
        name
        noIncomeTracking
        currency
        conversionRateToDollar
      }
      admin {
        id
        firstName
        lastName
        pictureUrl
      }
      leader {
        id
        firstName
        lastName
        fullName
        currentTitle
        nameWithTitle
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
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

export const DISPLAY_DENOMINATION = gql`
  query displayDenomination($id: ID!) {
    denominations(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      campusCount
      streamCount
      councilCount
      governorshipCount
      bacentaCount
      memberCount
      pastorCount
      vacationGraduatedBacentaCount

      oversights {
        id
        name
      }
      admin {
        id
        firstName
        lastName
        pictureUrl
      }
      leader {
        id
        firstName
        lastName
        fullName
        currentTitle
        nameWithTitle
        pictureUrl
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
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

