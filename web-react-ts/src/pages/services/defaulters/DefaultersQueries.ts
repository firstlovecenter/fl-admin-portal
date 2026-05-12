import { gql } from '@apollo/client'

export const GOVERNORSHIP_DEFAULTERS = gql`
  query governorshipDefaulters($id: ID!, $weekStart: Date) {
    governorships(where: { id: { eq: $id } }) {
      id
      name

      activeBacentaCount
      formDefaultersThisWeekCount(weekStart: $weekStart)
      bankingDefaultersThisWeekCount(weekStart: $weekStart)
      bankedThisWeekCount(weekStart: $weekStart)
      servicesThisWeekCount(weekStart: $weekStart)
      cancelledServicesThisWeekCount(weekStart: $weekStart)
    }
  }
`

export const GOVERNORSHIP_SERVICES_LIST = gql`
  query governorshipServicesThisWeek($id: ID!, $weekStart: Date) {
    governorships(where: { id: { eq: $id } }) {
      id
      name

      servicesThisWeek(weekStart: $weekStart) {
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
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query governorshipCancelledServicesThisWeek($id: ID!, $weekStart: Date) {
    governorships(where: { id: { eq: $id } }) {
      id
      name

      cancelledServicesThisWeek(weekStart: $weekStart) {
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
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          noServiceReason
        }
      }
    }
  }
`

export const GOVERNORSHIP_FORM_DEFAULTERS_LIST = gql`
  query governorshipFormDefaulters($id: ID!, $weekStart: Date) {
    governorships(where: { id: { eq: $id } }) {
      id
      name

      formDefaultersThisWeek(weekStart: $weekStart) {
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
        meetingDay {
          day
        }
      }
    }
  }
`

export const GOVERNORSHIP_BANKING_DEFAULTERS_LIST = gql`
  query governorshipBankingDefaulters($id: ID!, $weekStart: Date) {
    governorships(where: { id: { eq: $id } }) {
      id
      name

      bankingDefaultersThisWeek(weekStart: $weekStart) {
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
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          attendance
          income
        }
      }
    }
  }
`

export const GOVERNORSHIP_BANKED_LIST = gql`
  query governorshipBanked($id: ID!, $weekStart: Date) {
    governorships(where: { id: { eq: $id } }) {
      id
      name

      bankedThisWeek(weekStart: $weekStart) {
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
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          attendance
          income
        }
      }
    }
  }
`

export const COUNCIL_DEFAULTERS = gql`
  query councilDefaulters($id: ID!, $weekStart: Date) {
    councils(where: { id: { eq: $id } }) {
      id
      name
      governorshipCount
      activeBacentaCount
      formDefaultersThisWeekCount(weekStart: $weekStart)
      bankingDefaultersThisWeekCount(weekStart: $weekStart)
      bankedThisWeekCount(weekStart: $weekStart)
      servicesThisWeekCount(weekStart: $weekStart)
      cancelledServicesThisWeekCount(weekStart: $weekStart)
      governorshipBankedThisWeekCount(weekStart: $weekStart)
      governorshipBankingDefaultersThisWeekCount(weekStart: $weekStart)
    }
  }
`

export const COUNCIL_SERVICES_LIST = gql`
  query councilServicesThisWeek($id: ID!, $weekStart: Date) {
    councils(where: { id: { eq: $id } }) {
      id
      name

      servicesThisWeek(weekStart: $weekStart) {
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
        meetingDay {
          day
        }
        governorship {
          id
          name
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query councilCancelledServicesThisWeek($id: ID!, $weekStart: Date) {
    councils(where: { id: { eq: $id } }) {
      id
      name

      cancelledServicesThisWeek(weekStart: $weekStart) {
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
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          noServiceReason
        }
      }
    }
  }
`

export const COUNCIL_FORM_DEFAULTERS_LIST = gql`
  query councilFormDefaulters($id: ID!, $weekStart: Date) {
    councils(where: { id: { eq: $id } }) {
      id
      name

      formDefaultersThisWeek(weekStart: $weekStart) {
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
  query councilBankingDefaulters($id: ID!, $weekStart: Date) {
    councils(where: { id: { eq: $id } }) {
      id
      name

      bankingDefaultersThisWeek(weekStart: $weekStart) {
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
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          attendance
          income
        }
      }
    }
  }
`

export const COUNCIL_BANKED_LIST = gql`
  query councilBanked($id: ID!, $weekStart: Date) {
    councils(where: { id: { eq: $id } }) {
      id
      name

      bankedThisWeek(weekStart: $weekStart) {
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
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          attendance
          income
        }
      }
    }
  }
`

export const COUNCIL_BY_GOVERNORSHIP = gql`
  query councilByGovernorship($id: ID!, $weekStart: Date) {
    councils(where: { id: { eq: $id } }) {
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
          pictureUrl
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
        formDefaultersThisWeekCount(weekStart: $weekStart)
        bankingDefaultersThisWeekCount(weekStart: $weekStart)
        bankedThisWeekCount(weekStart: $weekStart)
        servicesThisWeekCount(weekStart: $weekStart)
        cancelledServicesThisWeekCount(weekStart: $weekStart)
      }
    }
  }
`

export const STREAM_DEFAULTERS = gql`
  query streamDefaulters($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name
      councilCount
      governorshipCount
      activeBacentaCount
      formDefaultersThisWeekCount(weekStart: $weekStart)
      bankingDefaultersThisWeekCount(weekStart: $weekStart)
      bankedThisWeekCount(weekStart: $weekStart)
      servicesThisWeekCount(weekStart: $weekStart)
      cancelledServicesThisWeekCount(weekStart: $weekStart)
      governorshipBankedThisWeekCount(weekStart: $weekStart)
      governorshipBankingDefaultersThisWeekCount(weekStart: $weekStart)
      councilBankedThisWeekCount(weekStart: $weekStart)
      councilBankingDefaultersThisWeekCount(weekStart: $weekStart)
    }
  }
`

export const STREAM_BY_GOVERNORSHIP = gql`
  query streamByGovernorship($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name
      councils {
        id
        name
        leader {
          id
          fullName
        }
        governorships {
          id
          name
          leader {
            id
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
          formDefaultersThisWeekCount(weekStart: $weekStart)
          bankingDefaultersThisWeekCount(weekStart: $weekStart)
          bankedThisWeekCount(weekStart: $weekStart)
          servicesThisWeekCount(weekStart: $weekStart)
          cancelledServicesThisWeekCount(weekStart: $weekStart)
        }
      }
    }
  }
`

export const STREAM_SERVICES_LIST = gql`
  query streamServicesThisWeek($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name

      servicesThisWeek(weekStart: $weekStart) {
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
        meetingDay {
          day
        }

        council {
          id
          name
        }

        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query streamCancelledServicesThisWeek($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name

      cancelledServicesThisWeek(weekStart: $weekStart) {
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
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          noServiceReason
        }
      }
    }
  }
`

export const STREAM_FORM_DEFAULTERS_LIST = gql`
  query streamFormDefaulters($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name

      formDefaultersThisWeek(weekStart: $weekStart) {
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
      }
    }
  }
`

export const STREAM_BANKING_DEFAULTERS_LIST = gql`
  query streamBankingDefaulters($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name

      bankingDefaultersThisWeek(weekStart: $weekStart) {
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
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          attendance
          income
        }
      }
    }
  }
`

export const GOVERNORSHIP_BANKING_DEFUALTERS_THIS_WEEK = gql`
  query governorshipBankingDefaultersThisWeek($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name
      governorshipBankingDefaultersThisWeek(weekStart: $weekStart) {
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
  query streamBanked($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name

      bankedThisWeek(weekStart: $weekStart) {
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
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          attendance
          income
        }
      }
    }
  }
`

export const STREAM_BY_COUNCIL = gql`
  query streamByCouncil($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
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
          pictureUrl
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
        formDefaultersThisWeekCount(weekStart: $weekStart)
        bankingDefaultersThisWeekCount(weekStart: $weekStart)
        bankedThisWeekCount(weekStart: $weekStart)
        servicesThisWeekCount(weekStart: $weekStart)
        cancelledServicesThisWeekCount(weekStart: $weekStart)
      }
    }
  }
`

export const CAMPUS_DEFAULTERS = gql`
  query campusDefaulters($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name
      streamCount
      creativeArtsCount
      activeStreamCount

      streamFormDefaultersThisWeekCount(weekStart: $weekStart)
      streamBankingDefaultersThisWeekCount(weekStart: $weekStart)
      streamBankedThisWeekCount(weekStart: $weekStart)
      streamServicesThisWeekCount(weekStart: $weekStart)
      streamCancelledServicesThisWeekCount(weekStart: $weekStart)

      activeBacentaCount
      formDefaultersThisWeekCount(weekStart: $weekStart)
      bankingDefaultersThisWeekCount(weekStart: $weekStart)
      bankedThisWeekCount(weekStart: $weekStart)
      servicesThisWeekCount(weekStart: $weekStart)
      cancelledServicesThisWeekCount(weekStart: $weekStart)
      governorshipBankedThisWeekCount(weekStart: $weekStart)
      governorshipBankingDefaultersThisWeekCount(weekStart: $weekStart)
      councilBankedThisWeekCount(weekStart: $weekStart)
      councilBankingDefaultersThisWeekCount(weekStart: $weekStart)

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
  query campusesThisWeek($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name

      servicesThisWeek(weekStart: $weekStart) {
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
        meetingDay {
          day
        }
        governorship {
          id
          name
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query gatheringCancelledServicesThisWeek($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name

      cancelledServicesThisWeek(weekStart: $weekStart) {
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
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          noServiceReason
        }
      }
    }
  }
`

export const CAMPUS_FORM_DEFAULTERS_LIST = gql`
  query gatheringFormDefaulters($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name

      formDefaultersThisWeek(weekStart: $weekStart) {
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
  query gatheringBankingDefaulters($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name

      bankingDefaultersThisWeek(weekStart: $weekStart) {
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
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_BANKED_LIST = gql`
  query gatheringBanked($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name

      bankedThisWeek(weekStart: $weekStart) {
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
        governorship {
          id
          name
        }
        meetingDay {
          day
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
          id
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_BY_STREAM = gql`
  query defaultersCampusByStream($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
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
          pictureUrl
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
        formDefaultersThisWeekCount(weekStart: $weekStart)
        bankingDefaultersThisWeekCount(weekStart: $weekStart)
        bankedThisWeekCount(weekStart: $weekStart)
        servicesThisWeekCount(weekStart: $weekStart)
        cancelledServicesThisWeekCount(weekStart: $weekStart)
      }
    }
  }
`

export const CAMPUS_SERVICES_GOVERNORSHIP_JOINT_DEFAULTERS_LIST = gql`
  query gatheringGovernorshipJointServicesThisWeek($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name

      governorshipBankingDefaultersThisWeek(weekStart: $weekStart) {
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
          stream {
            id
            name
          }
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query gatheringGovernorshipJointServicesBankedThisWeek($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name

      governorshipBankedThisWeek(weekStart: $weekStart) {
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
          stream {
            id
            name
          }
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query streamGovernorshipJointServicesDefaultersThisWeek($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name

      governorshipBankingDefaultersThisWeek(weekStart: $weekStart) {
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
          stream {
            id
            name
          }
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query streamGovernorshipJointServicesBankedThisWeek($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name

      governorshipBankedThisWeek(weekStart: $weekStart) {
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
          stream {
            id
            name
          }
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query councilGovernorshipJointServicesDefaultersThisWeek($id: ID!, $weekStart: Date) {
    councils(where: { id: { eq: $id } }) {
      id
      name

      governorshipBankingDefaultersThisWeek(weekStart: $weekStart) {
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
          stream {
            id
            name
          }
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query councilGovernorshipJointServicesBankedThisWeek($id: ID!, $weekStart: Date) {
    councils(where: { id: { eq: $id } }) {
      id
      name

      governorshipBankedThisWeek(weekStart: $weekStart) {
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
          stream {
            id
            name
          }
        }
        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query gatheringCouncilJointServicesDefaultersThisWeek($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name

      councilBankingDefaultersThisWeek(weekStart: $weekStart) {
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

        stream {
          id
          name
        }

        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query gatheringCouncilJointServicesBankedThisWeek($id: ID!, $weekStart: Date) {
    campuses(where: { id: { eq: $id } }) {
      id
      name

      councilBankedThisWeek(weekStart: $weekStart) {
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

        stream {
          id
          name
        }

        serviceRecordForWeek(weekStart: $weekStart) {
          serviceDate {
            date
          }
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
  query streamCouncilJointServicesDefaultersThisWeek($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name

      councilBankingDefaultersThisWeek(weekStart: $weekStart) {
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
  query streamCouncilJointServicesBankedThisWeek($id: ID!, $weekStart: Date) {
    streams(where: { id: { eq: $id } }) {
      id
      name

      councilBankedThisWeek(weekStart: $weekStart) {
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
  query oversightDefaulters($id: ID!, $weekStart: Date) {
    oversights(where: { id: { eq: $id } }) {
      id
      name
      campusCount
      activeStreamCount

      streamFormDefaultersThisWeekCount(weekStart: $weekStart)
      streamBankingDefaultersThisWeekCount(weekStart: $weekStart)
      streamBankedThisWeekCount(weekStart: $weekStart)
      streamServicesThisWeekCount(weekStart: $weekStart)
      streamCancelledServicesThisWeekCount(weekStart: $weekStart)
    }
  }
`

export const DENOMINATION_DEFAULTERS = gql`
  query denominationDefaulters($id: ID!, $weekStart: Date) {
    denominations(where: { id: { eq: $id } }) {
      id
      name
      activeStreamCount

      streamFormDefaultersThisWeekCount(weekStart: $weekStart)
      streamBankingDefaultersThisWeekCount(weekStart: $weekStart)
      streamBankedThisWeekCount(weekStart: $weekStart)
      streamServicesThisWeekCount(weekStart: $weekStart)
      streamCancelledServicesThisWeekCount(weekStart: $weekStart)
    }
  }
`
