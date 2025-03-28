import { gql } from '@apollo/client'

export const GOVERNORSHIP_DEFAULTERS = gql`
  query governorshipDefaulters($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name

      activeBacentaCount
      formDefaultersThisWeekCount
      bankingDefaultersThisWeekCount
      bankedThisWeekCount
      servicesThisWeekCount
      cancelledServicesThisWeekCount
    }
  }
`

export const GOVERNORSHIP_SERVICES_LIST = gql`
  query governorshipServicesThisWeek($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name

      servicesThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const GOVERNORSHIP_CANCELLED_SERVICES_LIST = gql`
  query governorshipCancelledServicesThisWeek($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name

      cancelledServicesThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          noServiceReason
        }
      }
    }
  }
`

export const GOVERNORSHIP_FORM_DEFAULTERS_LIST = gql`
  query governorshipFormDefaulters($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name

      formDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        meetingDay {
          day
        }
      }
    }
  }
`

export const GOVERNORSHIP_BANKING_DEFAULTERS_LIST = gql`
  query governorshipBankingDefaulters($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name

      bankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const GOVERNORSHIP_BANKED_LIST = gql`
  query governorshipBanked($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name

      bankedThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const COUNCIL_DEFAULTERS = gql`
  query councilDefaulters($id: ID!) {
    councils(where: { id: $id }) {
      id
      name
      governorshipCount
      activeBacentaCount
      formDefaultersThisWeekCount
      bankingDefaultersThisWeekCount
      bankedThisWeekCount
      servicesThisWeekCount
      cancelledServicesThisWeekCount
      governorshipBankedThisWeekCount
      governorshipBankingDefaultersThisWeekCount
    }
  }
`

export const COUNCIL_SERVICES_LIST = gql`
  query councilServicesThisWeek($id: ID!) {
    councils(where: { id: $id }) {
      id
      name

      servicesThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        meetingDay {
          day
        }
        governorship {
          id
          name
        }
        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const COUNCIL_CANCELLED_SERVICES_LIST = gql`
  query councilCancelledServicesThisWeek($id: ID!) {
    councils(where: { id: $id }) {
      id
      name

      cancelledServicesThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          noServiceReason
        }
      }
    }
  }
`

export const COUNCIL_FORM_DEFAULTERS_LIST = gql`
  query councilFormDefaulters($id: ID!) {
    councils(where: { id: $id }) {
      id
      name

      formDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
      }
    }
  }
`

export const COUNCIL_BANKING_DEFAULTERS_LIST = gql`
  query councilBankingDefaulters($id: ID!) {
    councils(where: { id: $id }) {
      id
      name

      bankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const COUNCIL_BANKED_LIST = gql`
  query councilBanked($id: ID!) {
    councils(where: { id: $id }) {
      id
      name

      bankedThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const COUNCIL_BY_GOVERNORSHIP = gql`
  query councilByGovernorship($id: ID!) {
    councils(where: { id: $id }) {
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
        }
        admin {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        bankedBy {
          id
          firstName
          lastName
        }
        activeBacentaCount
        formDefaultersThisWeekCount
        bankingDefaultersThisWeekCount
        bankedThisWeekCount
        servicesThisWeekCount
        cancelledServicesThisWeekCount
      }
    }
  }
`

export const STREAM_DEFAULTERS = gql`
  query streamDefaulters($id: ID!) {
    streams(where: { id: $id }) {
      id
      name
      councilCount
      activeBacentaCount
      formDefaultersThisWeekCount
      bankingDefaultersThisWeekCount
      bankedThisWeekCount
      servicesThisWeekCount
      cancelledServicesThisWeekCount
      governorshipBankedThisWeekCount
      governorshipBankingDefaultersThisWeekCount
      councilBankedThisWeekCount
      councilBankingDefaultersThisWeekCount
    }
  }
`

export const STREAM_SERVICES_LIST = gql`
  query streamServicesThisWeek($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      servicesThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        meetingDay {
          day
        }

        council {
          id
          name
        }

        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const STREAM_CANCELLED_SERVICES_LIST = gql`
  query streamCancelledServicesThisWeek($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      cancelledServicesThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        council {
          id
          name
        }

        meetingDay {
          day
        }
        services(limit: 1) {
          id
          noServiceReason
        }
      }
    }
  }
`

export const STREAM_FORM_DEFAULTERS_LIST = gql`
  query streamFormDefaulters($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      formDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        council {
          id
          name
        }

        meetingDay {
          day
        }
      }
    }
  }
`

export const STREAM_BANKING_DEFAULTERS_LIST = gql`
  query streamBankingDefaulters($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      bankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
          pictureUrl
        }

        council {
          id
          name
        }

        meetingDay {
          day
        }
        services(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const GOVERNORSHIP_BANKING_DEFUALTERS_THIS_WEEK = gql`
  query governorshipBankingDefaultersThisWeek($id: ID!) {
    streams(where: { id: $id }) {
      id
      name
      governorshipBankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
          pictureUrl
        }
      }
    }
  }
`

export const STREAM_BANKED_LIST = gql`
  query streamBanked($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      bankedThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        council {
          id
          name
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const STREAM_BY_COUNCIL = gql`
  query streamByCouncil($id: ID!) {
    streams(where: { id: $id }) {
      id
      name
      councils {
        id
        name
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
          phoneNumber
          whatsappNumber
        }
        activeBacentaCount
        formDefaultersThisWeekCount
        bankingDefaultersThisWeekCount
        bankedThisWeekCount
        servicesThisWeekCount
        cancelledServicesThisWeekCount
      }
    }
  }
`

export const CAMPUS_DEFAULTERS = gql`
  query campusDefaulters($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      streamCount
      creativeArtsCount
      activeStreamCount

      streamFormDefaultersThisWeekCount
      streamBankingDefaultersThisWeekCount
      streamBankedThisWeekCount
      streamServicesThisWeekCount
      streamCancelledServicesThisWeekCount

      activeBacentaCount
      formDefaultersThisWeekCount
      bankingDefaultersThisWeekCount
      bankedThisWeekCount
      servicesThisWeekCount
      cancelledServicesThisWeekCount
      governorshipBankedThisWeekCount
      governorshipBankingDefaultersThisWeekCount
      councilBankedThisWeekCount
      councilBankingDefaultersThisWeekCount

      activeHubCount
      hubFormDefaultersThisWeekCount
      hubBankingDefaultersThisWeekCount
      hubsBankedThisWeekCount
      hubRehearsalsThisWeekCount
      hubCancelledRehearsalsThisWeekCount
    }
  }
`

export const CAMPUS_SERVICES_LIST = gql`
  query campusesThisWeek($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      servicesThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        meetingDay {
          day
        }
        governorship {
          id
          name
        }
        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_CANCELLED_SERVICES_LIST = gql`
  query gatheringCancelledServicesThisWeek($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      cancelledServicesThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          noServiceReason
        }
      }
    }
  }
`

export const CAMPUS_FORM_DEFAULTERS_LIST = gql`
  query gatheringFormDefaulters($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      formDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
      }
    }
  }
`

export const CAMPUS_BANKING_DEFAULTERS_LIST = gql`
  query gatheringBankingDefaulters($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      bankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_BANKED_LIST = gql`
  query gatheringBanked($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      bankedThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        services(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_BY_STREAM = gql`
  query defaultersCampusByStream($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      streams {
        id
        name
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
          phoneNumber
          whatsappNumber
        }
        activeBacentaCount
        formDefaultersThisWeekCount
        bankingDefaultersThisWeekCount
        bankedThisWeekCount
        servicesThisWeekCount
        cancelledServicesThisWeekCount
      }
    }
  }
`

export const CAMPUS_SERVICES_GOVERNORSHIP_JOINT_DEFAULTERS_LIST = gql`
  query gatheringGovernorshipJointServicesThisWeek($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      governorshipBankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        council {
          id
          name
          stream {
            id
            name
          }
        }
        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_SERVICES_GOVERNORSHIP_JOINT_BANKED_LIST = gql`
  query gatheringGovernorshipJointServicesBankedThisWeek($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      governorshipBankedThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        council {
          id
          name
          stream {
            id
            name
          }
        }
        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const STREAM_GOVERNORSHIP_JOINT_DEFAULTERS_LIST = gql`
  query streamGovernorshipJointServicesDefaultersThisWeek($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      governorshipBankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        council {
          id
          name
          stream {
            id
            name
          }
        }
        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const STREAM_GOVERNORSHIP_JOINT_BANKED_LIST = gql`
  query streamGovernorshipJointServicesBankedThisWeek($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      governorshipBankedThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        council {
          id
          name
          stream {
            id
            name
          }
        }
        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const COUNCIL_GOVERNORSHIP_JOINT_DEFAULTERS_LIST = gql`
  query councilGovernorshipJointServicesDefaultersThisWeek($id: ID!) {
    councils(where: { id: $id }) {
      id
      name

      governorshipBankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        council {
          id
          name
          stream {
            id
            name
          }
        }
        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const COUNCIL_GOVERNORSHIP_JOINT_BANKED_LIST = gql`
  query councilGovernorshipJointServicesBankedThisWeek($id: ID!) {
    councils(where: { id: $id }) {
      id
      name

      governorshipBankedThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        council {
          id
          name
          stream {
            id
            name
          }
        }
        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_SERVICES_COUNCIL_JOINT_DEFAULTERS_LIST = gql`
  query gatheringCouncilJointServicesDefaultersThisWeek($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      councilBankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        stream {
          id
          name
        }

        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_SERVICES_COUNCIL_JOINT_BANKED_LIST = gql`
  query gatheringCouncilJointServicesBankedThisWeek($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      councilBankedThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        stream {
          id
          name
        }

        services(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const STREAM_COUNCIL_JOINT_DEFAULTERS_LIST = gql`
  query streamCouncilJointServicesDefaultersThisWeek($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      councilBankingDefaultersThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        stream {
          id
          name
        }
      }
      services(limit: 1) {
        id
        noServiceReason
        attendance
        income
      }
    }
  }
`

export const STREAM_COUNCIL_JOINT_BANKED_LIST = gql`
  query streamCouncilJointServicesBankedThisWeek($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      councilBankedThisWeek {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        stream {
          id
          name
        }
      }
      services(limit: 1) {
        id
        noServiceReason
        attendance
        income
      }
    }
  }
`

export const OVERSIGHT_DEFAULTERS = gql`
  query oversightDefaulters($id: ID!) {
    oversights(where: { id: $id }) {
      id
      name
      campusCount
      activeStreamCount

      streamFormDefaultersThisWeekCount
      streamBankingDefaultersThisWeekCount
      streamBankedThisWeekCount
      streamServicesThisWeekCount
      streamCancelledServicesThisWeekCount
    }
  }
`
