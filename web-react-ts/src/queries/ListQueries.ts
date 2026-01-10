import { gql } from '@apollo/client'

export const GET_BISHOPS = gql`
  query getBishops {
    members(where: { title_SOME: { name: "Bishop" } }) {
      id
      firstName
      lastName
      fullName
    }
  }
`

export const GET_GOVERNORSHIP_BACENTAS = gql`
  query getGovernorshipBacentas($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name

      stream_name
      council {
        id
      }
      leader {
        id
        firstName
        lastName
        fullName
      }

      memberCount

      bacentas {
        id
        name
        memberCount
        vacationStatus
        target
        council {
          id
        }
        leader {
          id
          firstName
          lastName
          pictureUrl
        }
      }
    }
  }
`

export const GET_GOVERNORSHIP_ICBACENTAS = gql`
  query getGovernorshipIcBacentas($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name

      council {
        id
      }
      leader {
        id
        firstName
        lastName
        fullName
      }

      memberCount

      icBacentas {
        id
        name
        memberCount
        vacationStatus
        target
        council {
          id
        }
        leader {
          id
          firstName
          lastName
          pictureUrl
        }
      }
    }
  }
`

export const GET_COUNCIL_GOVERNORSHIPS = gql`
  query getCouncilGovernorships($id: ID!) {
    councils(where: { id: $id }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        stream_name
      }
      adminCount
      governorships {
        name
        id
        stream_name
        memberCount
        bacentaCount
        target
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
        admins {
          id
          firstName
          lastName
          stream_name
        }
        adminCount

        bacentas {
          id
          name
        }
      }
    }
  }
`
export const GET_CAMPUS_GOVERNORSHIPS = gql`
  query getGatheringGovernorships($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      noIncomeTracking
      currency
      conversionRateToDollar
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        stream_name
        fullName
      }
      adminCount
      governorships {
        name
        id
        stream_name
        memberCount
        bacentaCount
        target
        leader {
          id
          firstName
          lastName
          pictureUrl
          stream_name
        }
        admins {
          id
          firstName
          lastName
          stream_name
        }
        adminCount
      }
    }
  }
`

export const GET_STREAM_COUNCILS = gql`
  query getStreamCouncils($id: ID!) {
    streams(where: { id: $id }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      adminCount
      councils {
        name
        id
        stream_name
        memberCount
        target
        governorshipCount
        governorships {
          id
        }
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
        admins {
          id
          firstName
          lastName
          stream_name
        }
        adminCount
      }
    }
  }
`

export const GET_CAMPUS_STREAMS = gql`
  query gatheringStreams($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      noIncomeTracking
      currency
      conversionRateToDollar

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      adminCount
      streams {
        name
        id
        stream_name
        memberCount
        councilCount
        vacationStatus
        target
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
        admins {
          id
          firstName
          lastName
          stream_name
          fullName
        }
        adminCount
      }
    }
  }
`

export const GET_DENOMINATION_OVERSIGHTS = gql`
  query getDenominationOversights($id: ID!) {
    denominations(where: { id: $id }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
      }
      adminCount
      oversights {
        name
        id

        memberCount
        councilCount
        target
        leader {
          id
          firstName
          lastName
          pictureUrl
        }
        admins {
          id
          firstName
          lastName
          fullName
        }
        adminCount
      }
    }
  }
`

export const GET_OVERSIGHT_CAMPUSES = gql`
  query getOversightCampuses($id: ID!) {
    oversights(where: { id: $id }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
      }
      adminCount
      campuses {
        name
        id
        currency
        conversionRateToDollar
        noIncomeTracking
        memberCount
        councilCount
        target
        leader {
          id
          firstName
          lastName
          pictureUrl
        }
        admins {
          id
          firstName
          lastName
          fullName
        }
        adminCount
      }
    }
  }
`

export const GET_STREAM_GOVERNORSHIPS = gql`
  query getStreamGovernorships($id: ID!) {
    streams(where: { id: $id }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      adminCount
      governorships {
        name
        id
        stream_name
        memberCount
        bacentaCount
        target
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
          fullName
        }
      }
    }
  }
`

export const GET_COUNCILS = gql`
  query getCouncils {
    councils {
      id
      name
      governorships {
        id
      }
    }
  }
`

export const GET_STREAMS = gql`
  query getStreams {
    streams {
      id
      name
      councils {
        id
      }
    }
  }
`

export const GET_CAMPUSES = gql`
  query getCampuses {
    campuses {
      id
      name
      streams {
        id
      }
    }
  }
`

export const GET_OVERSIGHTS = gql`
  query getOversights {
    oversights {
      id
      name
      campuses {
        id
      }
    }
  }
`

export const GET_DENOMINATIONS = gql`
  query getDenominations {
    denominations {
      id
      name
      campuses {
        id
      }
    }
  }
`

export const GET_CREATIVEARTS = gql`
  query getCreativeArts {
    creativeArts {
      id
      name
    }
  }
`

export const GET_MINISTRIES = gql`
  query getMinistries {
    ministries {
      id
      name
    }
  }
`

export const GET_HUBS = gql`
  query getHubs {
    hubs {
      id
      name
    }
  }
`

export const GET_CAMPUS_BASONTAS = gql`
  query getCampusBasontas($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      basontas {
        id
        name
      }
    }
  }
`

export const GET_HUB_HUBFELLOWSHIPS = gql`
  query getHubFellowships($id: ID!) {
    hubs(where: { id: $id }) {
      id
      name
      memberCount
      hubFellowships {
        id
        name
        vacationStatus
        memberCount
        leader {
          id
          firstName
          lastName
          pictureUrl
        }
        bacenta {
          id
          name
          leader {
            id
            firstName
            lastName
            fullName
          }
          governorship {
            id
          }
        }
      }
    }
  }
`

export const GET_STREAM_MINISTRIES = gql`
  query getStreamMinistries($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      adminCount
      ministries {
        name
        id
        memberCount
        hubCount
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
      }
    }
  }
`

export const GET_STREAM_HUBS = gql`
  query getStreamHubs($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      adminCount
      hubs {
        name
        id
        memberCount
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
      }
    }
  }
`

export const GET_STREAM_SONTAS = gql`
  query getStreamSontas($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      adminCount
    }
  }
`

export const GET_HUBCOUNCIL_HUBS = gql`
  query getHubCouncilHubs($id: ID!) {
    hubCouncils(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount

      hubs {
        name
        id
        memberCount
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
      }
    }
  }
`

export const GET_MINISTRY_HUBCOUNCILS = gql`
  query getMinistryHubCouncils($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount

      councils {
        id
        name
        hubCouncilsFromMinistry(ministryId: $id) {
          name
          id
          memberCount
          leader {
            id
            firstName
            lastName
            stream_name
            pictureUrl
          }
        }
      }
    }
  }
`

export const GET_MINISTRY_SONTAS = gql`
  query getMinistrySontas($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
    }
  }
`

export const GET_HUB_SONTAS = gql`
  query getHubSontas($id: ID!) {
    hubs(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
    }
  }
`

export const GET_FEDERALMINISTRY_MINISTRIES = gql`
  query getCreativeArtsMinistries($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      # admin {
      #   id
      #   firstName
      #   lastName
      #   fullName
      #   stream_name
      # }
      ministries {
        name
        id
        memberCount
        hubCount
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
        # admin {
        #   id
        #   firstName
        #   lastName
        #   stream_name
        #   fullName
        # }
      }
    }
  }
`

export const GET_CAMPUS_CREATIVEARTS = gql`
  query getCampusCreativeArts($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      noIncomeTracking
      currency
      conversionRateToDollar
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      adminCount
      creativeArtsCount
      creativeArts {
        name
        id
        memberCount
        hubCount
        ministryCount
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
      }
    }
  }
`

export const GET_COUNCIL_HUBCOUNCILS = gql`
  query getCouncilHubCouncils($id: ID!) {
    councils(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admins {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      adminCount
      hubCouncils {
        name
        id
        memberCount
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
      }
    }
  }
`

export const GET_GOVERNORSHIP_HUBS = gql`
  query getGovernorshipHubs($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount

      hubs {
        name
        id
        memberCount
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
      }
    }
  }
`

export const GET_CREATIVEARTS_MINISTRIES = gql`
  query getCreativeArtsMinistriesList($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name

      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount

      ministries {
        name
        id
        memberCount
        hubCount
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
      }
    }
  }
`
