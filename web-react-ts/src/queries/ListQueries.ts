import { gql } from '@apollo/client'

export const GET_BISHOPS = gql`
  query getBishops {
    members(where: { title: { some: { name: { eq: "Bishop" } } } }) {
      id
      firstName
      lastName
      fullName
    }
  }
`

export const GET_GOVERNORSHIP_BACENTAS = gql`
  query getGovernorshipBacentas($id: ID!) {
    governorships(where: { id: { eq: $id } }) {
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
        nameWithTitle
        pictureUrl
      }

      memberCount

      bacentas {
        id
        name
        memberCount
        vacationStatus
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
    governorships(where: { id: { eq: $id } }) {
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
    councils(where: { id: { eq: $id } }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admin {
        id
        firstName
        lastName
        stream_name
      }
      governorships {
        name
        id
        stream_name
        memberCount
        bacentaCount

        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
        admin {
          id
          firstName
          lastName
          stream_name
        }

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
    campuses(where: { id: { eq: $id } }) {
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
      admin {
        id
        firstName
        lastName
        stream_name
        fullName
      }
      governorships {
        name
        id
        stream_name
        memberCount
        bacentaCount
        leader {
          id
          firstName
          lastName
          pictureUrl
          stream_name
        }
        admin {
          id
          firstName
          lastName
          stream_name
        }
      }
    }
  }
`

export const GET_STREAM_COUNCILS = gql`
  query getStreamCouncils($id: ID!) {
    streams(where: { id: { eq: $id } }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admin {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      councils {
        name
        id
        stream_name
        memberCount
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
        admin {
          id
          firstName
          lastName
          stream_name
        }
      }
    }
  }
`

export const GET_CAMPUS_STREAMS = gql`
  query gatheringStreams($id: ID!) {
    campuses(where: { id: { eq: $id } }) {
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
      admin {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      streams {
        name
        id
        stream_name
        memberCount
        councilCount
        vacationStatus
        leader {
          id
          firstName
          lastName
          stream_name
          pictureUrl
        }
        admin {
          id
          firstName
          lastName
          stream_name
          fullName
        }
      }
    }
  }
`

export const GET_DENOMINATION_OVERSIGHTS = gql`
  query getDenominationOversights($id: ID!) {
    denominations(where: { id: { eq: $id } }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admin {
        id
        firstName
        lastName
        fullName
      }
      oversights {
        name
        id

        memberCount
        councilCount
        leader {
          id
          firstName
          lastName
          pictureUrl
        }
        admin {
          id
          firstName
          lastName
          fullName
        }
      }
    }
  }
`

export const GET_OVERSIGHT_CAMPUSES = gql`
  query getOversightCampuses($id: ID!) {
    oversights(where: { id: { eq: $id } }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admin {
        id
        firstName
        lastName
        fullName
      }
      campuses {
        name
        id
        currency
        conversionRateToDollar
        noIncomeTracking
        memberCount
        councilCount
        leader {
          id
          firstName
          lastName
          pictureUrl
        }
        admin {
          id
          firstName
          lastName
          fullName
        }
      }
    }
  }
`

export const GET_STREAM_GOVERNORSHIPS = gql`
  query getStreamGovernorships($id: ID!) {
    streams(where: { id: { eq: $id } }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      memberCount
      admin {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      governorships {
        name
        id
        stream_name
        memberCount
        bacentaCount
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
    campuses(where: { id: { eq: $id } }) {
      id
      name
      basontas {
        id
        name
      }
    }
  }
`


