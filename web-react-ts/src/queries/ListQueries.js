import { gql } from '@apollo/client'

export const GET_BISHOPS = gql`
  {
    members(where: { title: { title: "Bishop" } }) {
      id
      firstName
      lastName
      fullName
    }
  }
`

export const GET_FELLOWSHIP_LEADERS = gql`
  {
    constituencyList(firstName: $firstName, lastName: $lastName) {
      id
      bacentas {
        id
        fellowships {
          id
          fellowshipLeader {
            id
            firstName
            lastName
          }
        }
      }
    }
  }
`

export const GET_CONSTITUENCY_BACENTAS = gql`
  query ($id: ID!) {
    constituencies(where: { id: $id }) {
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
      sontas {
        id
        name
        leader {
          id
          firstName
          lastName
        }
      }
      bacentas {
        id
        name
        stream_name
        vacationStatus
        fellowshipCount
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

export const GET_COUNCIL_CONSTITUENCIES = gql`
  query ($id: ID!) {
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
      admin {
        id
        firstName
        lastName
        stream_name
      }
      constituencies {
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
        admin {
          id
          firstName
          lastName
          stream_name
        }
        sontas {
          id
          name
        }
        bacentas {
          id
          name
        }
      }
    }
  }
`
export const GET_GATHERING_SERVICE_CONSTITUENCIES = gql`
  query ($id: ID!) {
    gatheringServices(where: { id: $id }) {
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
        fullName
      }
      constituencies {
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
  query ($id: ID!) {
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
        target
        constituencies {
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

export const GET_GATHERINGSERVICE_STREAMS = gql`
  query ($id: ID!) {
    gatheringServices(where: { id: $id }) {
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
      streams {
        name
        id
        stream_name
        memberCount
        councilCount
        target
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

export const GET_STREAM_CONSTITUENCIES = gql`
  query ($id: ID!) {
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
      admin {
        id
        firstName
        lastName
        fullName
        stream_name
      }
      constituencies {
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
  {
    councils {
      id
      name
      constituencies {
        id
      }
    }
  }
`

export const GET_STREAMS = gql`
  {
    streams {
      id
      name
      councils {
        id
      }
    }
  }
`

export const GET_GATHERINGSERVICES = gql`
  {
    gatheringServices {
      id
      name
      streams {
        id
      }
    }
  }
`

export const GET_MINISTRIES = gql`
  query {
    ministries {
      id
      name
    }
  }
`

export const GET_BACENTA_FELLOWSHIPS = gql`
  query ($id: ID!) {
    bacentas(where: { id: $id }) {
      id
      memberCount
      fellowships {
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
          constituency {
            id
          }
        }
      }
    }
  }
`

export const OCCUPATION_LIST = gql`
  query ($searchKey: String!) {
    occupationList(searchKey: $searchKey, first: 5) {
      occupation
    }
  }
`
