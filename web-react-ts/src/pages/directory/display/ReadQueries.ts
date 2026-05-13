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
      leadsOversight {
        id
        name
      }
      leadsDenomination {
        id
        name
      }

      isArrivalsAdminForCampus {
        id
        name
      }
      isArrivalsAdminForStream {
        id
        name
      }
      isArrivalsAdminForCouncil {
        id
        name
        stream_name
      }
      isArrivalsAdminForGovernorship {
        id
        name
        stream_name
      }
      isArrivalsCounterForStream {
        id
        name
      }
      isArrivalsPayerForCouncil {
        id
        name
        stream_name
      }
      isTellerForStream {
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
      isAdminForDenomination {
        id
        name
      }
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
      vacationBacentaCount
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
      pastorCount
    }
  }
`

export const GET_STREAM_COUNCILS_WITH_GOVERNORSHIPS = gql`
  query getStreamCouncilsWithGovernorships($id: ID!) {
    streams(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      memberCount
      leader {
        id
        firstName
        lastName
        fullName
      }
      admin {
        id
        firstName
        lastName
        fullName
      }
      councils {
        id
        name
        memberCount
        governorshipCount
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
        }
        governorships {
          id
          name
          memberCount
          bacentaCount
          leader {
            id
            firstName
            lastName
            pictureUrl
          }
        }
      }
    }
  }
`

export const GET_CAMPUS_STREAMS_WITH_GOVERNORSHIPS = gql`
  query getCampusStreamsWithGovernorships($id: ID!) {
    campuses(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      memberCount
      leader {
        id
        firstName
        lastName
        fullName
      }
      admin {
        id
        firstName
        lastName
        fullName
      }
      streams {
        id
        name
        memberCount
        councilCount
        leader {
          id
          firstName
          lastName
          pictureUrl
          fullName
        }
        councils {
          id
          name
          memberCount
          governorshipCount
          leader {
            id
            firstName
            lastName
            fullName
            nameWithTitle
            pictureUrl
          }
          governorships {
            id
            name
            memberCount
            bacentaCount
            leader {
              id
              firstName
              lastName
              pictureUrl
            }
          }
        }
      }
    }
  }
`

export const GET_COUNCIL_BACENTAS = gql`
  query getCouncilBacentas($id: ID!) {
    councils(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      memberCount
      governorships {
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
        bacentas {
          id
          name
          memberCount
          vacationStatus
          labels
          leader {
            id
            firstName
            lastName
            pictureUrl
          }
        }
      }
    }
  }
`

export const GET_STREAM_BACENTAS = gql`
  query getStreamBacentas($id: ID!) {
    streams(where: { id: { eq: $id } }, limit: 1) {
      id
      name
      councils {
        id
        name
        governorships {
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
          bacentas {
            id
            name
            memberCount
            vacationStatus
            labels
            leader {
              id
              firstName
              lastName
              pictureUrl
            }
          }
        }
      }
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
      vacationBacentaCount
      memberCount
      pastorCount
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
      vacationBacentaCount
      memberCount
      pastorCount
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
      vacationBacentaCount
      memberCount
      pastorCount
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
      vacationBacentaCount
      memberCount
      pastorCount
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
      vacationBacentaCount
      memberCount
      pastorCount

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

