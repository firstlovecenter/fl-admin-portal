import { gql } from '@apollo/client'

export const CREATE_MEMBER_MUTATION = gql`
  mutation CreateMember(
    $firstName: String!
    $middleName: String
    $lastName: String!
    $email: String
    $phoneNumber: String!
    $whatsappNumber: String!
    $dob: String!
    $maritalStatus: String!
    $gender: String!
    $occupation: String
    $bacenta: String!
    $visitationArea: String!
    $basonta: String
    $pictureUrl: String!
  ) {
    CreateMember(
      firstName: $firstName
      middleName: $middleName
      lastName: $lastName
      email: $email
      phoneNumber: $phoneNumber
      whatsappNumber: $whatsappNumber
      dob: $dob
      maritalStatus: $maritalStatus
      gender: $gender
      occupation: $occupation
      visitationArea: $visitationArea
      bacenta: $bacenta
      basonta: $basonta
      pictureUrl: $pictureUrl
    ) {
      id
      firstName
      lastName
      stream_name

      bacenta {
        id

        governorship {
          id
          council {
            id
          }
        }
      }
    }
  }
`

export const ADD_MEMBER_TITLE_MUTATION = gql`
  mutation AddMemberTitle(
    $memberId: ID!
    $title: String # $status: Boolean # $date: String
    $date: Date
  ) {
    updateMembers(
      where: { id: $memberId }
      connect: {
        title: { where: { node: { name: $title } }, edge: { date: $date } }
      }
    ) {
      members {
        id
        firstName
        lastName
        title {
          name
        }
        titleConnection {
          edges {
            date
            node {
              name
            }
          }
        }
      }
    }
  }
`

export const CREATE_FELLOWSHIP_MUTATION = gql`
  mutation CreateFellowship(
    $name: String!
    $bacentaId: ID!
    $leaderId: ID!
    $meetingDay: String!
    $venueLongitude: Float
    $venueLatitude: Float
  ) {
    CreateFellowship(
      name: $name
      bacentaId: $bacentaId
      leaderId: $leaderId
      meetingDay: $meetingDay
      venueLongitude: $venueLongitude
      venueLatitude: $venueLatitude
    ) {
      id
      name
      stream_name
      council {
        id
      }
      bacenta {
        id
      }
    }
  }
`

export const CREATE_BACENTA_MUTATION = gql`
  mutation CreateBacenta(
    $name: String!
    $governorshipId: ID!
    $leaderId: ID!
    $meetingDay: String!
    $venueLongitude: Float
    $venueLatitude: Float
  ) {
    CreateBacenta(
      name: $name
      governorshipId: $governorshipId
      leaderId: $leaderId
      meetingDay: $meetingDay
      venueLongitude: $venueLongitude
      venueLatitude: $venueLatitude
    ) {
      id
      name
      stream_name
      governorship {
        id
        bacentas {
          id
        }
      }

      leader {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`

export const CREATE_GOVERNORSHIP_MUTATION = gql`
  mutation CreateGovernorship($name: String!, $leaderId: ID!, $councilId: ID!) {
    CreateGovernorship(
      name: $name
      leaderId: $leaderId
      councilId: $councilId
    ) {
      id
      name
      stream_name
      council {
        id
        governorships {
          id
          name
        }
      }
    }
  }
`

export const CREATE_COUNCIL_MUTATION = gql`
  mutation CreateCouncil($name: String!, $leaderId: ID!, $streamId: ID!) {
    CreateCouncil(name: $name, leaderId: $leaderId, streamId: $streamId) {
      id
      name
      stream_name
      stream {
        id
        councils {
          id
          name
        }
      }
    }
  }
`

export const CREATE_STREAM_MUTATION = gql`
  mutation CreateStream(
    $name: String!
    $leaderId: ID!
    $campusId: ID!
    $meetingDay: String!
    $bankAccount: String!
  ) {
    CreateStream(
      name: $name
      leaderId: $leaderId
      campusId: $campusId
      meetingDay: $meetingDay
      bankAccount: $bankAccount
    ) {
      id
      name
      meetingDay {
        day
        dayNumber
      }

      campus {
        id
        streams {
          id
          name
        }
      }
    }
  }
`

export const CREATE_CAMPUS_MUTATION = gql`
  mutation CreateCampus(
    $name: String!
    $leaderId: ID!
    $oversightId: ID!
    $noIncomeTracking: Boolean!
    $currency: String!
    $conversionRateToDollar: Float!
  ) {
    CreateCampus(
      name: $name
      leaderId: $leaderId
      oversightId: $oversightId
      noIncomeTracking: $noIncomeTracking
      currency: $currency
      conversionRateToDollar: $conversionRateToDollar
    ) {
      id
      name
      noIncomeTracking
      currency
      conversionRateToDollar

      oversight {
        id
        campuses {
          id
          name
        }
      }
    }
  }
`

export const CREATE_OVERSIGHT_MUTATION = gql`
  mutation CreateOversight(
    $name: String!
    $leaderId: ID!
    $denominationId: ID!
  ) {
    CreateOversight(
      name: $name
      leaderId: $leaderId
      denominationId: $denominationId
    ) {
      id
      name

      denomination {
        id
        oversights {
          id
          name
        }
      }
    }
  }
`

export const CREATE_CREATIVEARTS_MUTATION = gql`
  mutation CreateCreativeArts($name: String!, $leaderId: ID!, $campusId: ID!) {
    CreateCreativeArts(name: $name, leaderId: $leaderId, campusId: $campusId) {
      id
      name
    }
  }
`

export const CREATE_MINISTRY_MUTATION = gql`
  mutation CreateMinistry(
    $creativeArtsId: ID!
    $leaderId: ID!
    $streamId: ID!
    $bankAccount: String!
  ) {
    CreateMinistry(
      creativeArtsId: $creativeArtsId
      leaderId: $leaderId
      streamId: $streamId
      bankAccount: $bankAccount
    ) {
      id
      name
      bankAccount
    }
  }
`

export const CREATE_HUBCOUNCIL_MUTATION = gql`
  mutation CreateHubCouncil($leaderId: ID!, $ministryId: ID!, $councilId: ID!) {
    CreateHubCouncil(
      leaderId: $leaderId
      ministryId: $ministryId
      councilId: $councilId
    ) {
      id
      name
    }
  }
`

export const CREATE_HUB_MUTATION = gql`
  mutation CreateHub(
    $name: String!
    $leaderId: ID!
    $hubCouncilId: ID!
    $governorshipId: ID!
    $meetingDay: String!
    $venueLongitude: Float
    $venueLatitude: Float
  ) {
    CreateHub(
      name: $name
      leaderId: $leaderId
      hubCouncilId: $hubCouncilId
      governorshipId: $governorshipId
      meetingDay: $meetingDay
      venueLongitude: $venueLongitude
      venueLatitude: $venueLatitude
    ) {
      id
      name
    }
  }
`
