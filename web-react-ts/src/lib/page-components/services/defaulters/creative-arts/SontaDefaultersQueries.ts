import { gql } from '@apollo/client'

export const HUB_DEFAULTERS = gql`
  query hubDefaulters($id: ID!) {
    hubs(where: { id: $id }) {
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

export const HUB_SERVICES_LIST = gql`
  query hubServicesThisWeek($id: ID!) {
    hubs(where: { id: $id }) {
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

export const HUB_CANCELLED_SERVICES_LIST = gql`
  query hubCancelledhubRehearsalsThisWeek($id: ID!) {
    hubs(where: { id: $id }) {
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

export const HUB_FORM_DEFAULTERS_LIST = gql`
  query hubFormDefaulters($id: ID!) {
    hubs(where: { id: $id }) {
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

export const HUB_BANKING_DEFAULTERS_LIST = gql`
  query hubBankingDefaulters($id: ID!) {
    hubs(where: { id: $id }) {
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

export const HUB_BANKED_LIST = gql`
  query hubBanked($id: ID!) {
    hubs(where: { id: $id }) {
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

export const HUBCOUNCIL_DEFAULTERS = gql`
  query hubCouncilDefaulters($id: ID!) {
    hubCouncils(where: { id: $id }) {
      id
      name

      hubCount
      activeBacentaCount
      formDefaultersThisWeekCount
      bankingDefaultersThisWeekCount
      bankedThisWeekCount
      servicesThisWeekCount
      cancelledServicesThisWeekCount

      activeHubCount
      hubFormDefaultersThisWeekCount
      hubBankingDefaultersThisWeekCount
      hubsBankedThisWeekCount
      hubRehearsalsThisWeekCount
      hubCancelledRehearsalsThisWeekCount
    }
  }
`

export const HUBCOUNCIL_HUBREHEARSALS_LIST = gql`
  query hubCouncilhubRehearsalsThisWeek($id: ID!) {
    hubCouncils(where: { id: $id }) {
      id
      name

      hubRehearsalsThisWeek {
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
        rehearsals(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const HUBCOUNCIL_CANCELLED_HUBREHEARSALS_LIST = gql`
  query hubCouncilCancelledhubRehearsalsThisWeek($id: ID!) {
    hubCouncils(where: { id: $id }) {
      id
      name

      hubCancelledRehearsalsThisWeek {
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
        rehearsals(limit: 1) {
          id
          noServiceReason
        }
      }
    }
  }
`

export const HUBCOUNCIL_HUB_FORM_DEFAULTERS_LIST = gql`
  query hubCouncilHubFormDefaulters($id: ID!) {
    hubCouncils(where: { id: $id }) {
      id
      name

      hubFormDefaultersThisWeek {
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

export const HUBCOUNCIL_HUB_BANKING_DEFAULTERS_LIST = gql`
  query hubCouncilHubBankingDefaulters($id: ID!) {
    hubCouncils(where: { id: $id }) {
      id
      name

      hubBankingDefaultersThisWeek {
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
        rehearsals(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const HUBCOUNCIL_HUB_BANKED_LIST = gql`
  query hubCouncilHubBanked($id: ID!) {
    hubCouncils(where: { id: $id }) {
      id
      name

      hubsBankedThisWeek {
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
        rehearsals(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const MINISTRY_DEFAULTERS = gql`
  query ministryDefaulters($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name

      hubCouncilCount
      activeBacentaCount
      formDefaultersThisWeekCount
      bankingDefaultersThisWeekCount
      bankedThisWeekCount
      servicesThisWeekCount
      cancelledServicesThisWeekCount

      activeHubCount
      hubFormDefaultersThisWeekCount
      hubBankingDefaultersThisWeekCount
      hubsBankedThisWeekCount
      hubRehearsalsThisWeekCount
      hubCancelledRehearsalsThisWeekCount
    }
  }
`

export const MINISTRY_HUBREHEARSALS_LIST = gql`
  query ministriehubRehearsalsThisWeek($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name

      hubRehearsalsThisWeek {
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
        rehearsals(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const MINISTRY_CANCELLED_HUBREHEARSALS_LIST = gql`
  query ministryCancelledhubRehearsalsThisWeek($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name

      hubCancelledRehearsalsThisWeek {
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
        rehearsals(limit: 1) {
          id
          noServiceReason
        }
      }
    }
  }
`

export const MINISTRY_HUB_FORM_DEFAULTERS_LIST = gql`
  query ministryHubFormDefaulters($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name

      hubFormDefaultersThisWeek {
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

export const MINISTRY_HUB_BANKING_DEFAULTERS_LIST = gql`
  query ministryHubBankingDefaulters($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name

      hubBankingDefaultersThisWeek {
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
        rehearsals(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const MINISTRY_HUB_BANKED_LIST = gql`
  query ministryHubBanked($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name

      hubsBankedThisWeek {
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
        rehearsals(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const CREATIVEARTS_DEFAULTERS = gql`
  query creativeArtsDefaulters($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name

      ministryCount
      activeHubCount
      activeBacentaCount
      formDefaultersThisWeekCount
      bankingDefaultersThisWeekCount
      bankedThisWeekCount
      servicesThisWeekCount
      cancelledServicesThisWeekCount

      activeHubCount
      hubFormDefaultersThisWeekCount
      hubBankingDefaultersThisWeekCount
      hubsBankedThisWeekCount
      hubRehearsalsThisWeekCount
      hubCancelledRehearsalsThisWeekCount
    }
  }
`

export const CREATIVEARTS_HUBREHEARSALS_LIST = gql`
  query creativeArtsHubRehearsalsThisWeek($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name

      hubRehearsalsThisWeek {
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
        rehearsals(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const CREATIVEARTS_CANCELLED_HUBREHEARSALS_LIST = gql`
  query creativeArtsCancelledhubRehearsalsThisWeek($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name

      hubCancelledRehearsalsThisWeek {
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
        rehearsals(limit: 1) {
          id
          noServiceReason
        }
      }
    }
  }
`

export const CREATIVEARTS_HUB_FORM_DEFAULTERS_LIST = gql`
  query creativeArtsHubFormDefaulters($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name

      hubFormDefaultersThisWeek {
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

export const CREATIVEARTS_HUB_BANKING_DEFAULTERS_LIST = gql`
  query creativeArtsHubBankingDefaulters($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name

      hubBankingDefaultersThisWeek {
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
        rehearsals(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const CREATIVEARTS_HUB_BANKED_LIST = gql`
  query creativeArtsHubBanked($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name

      hubsBankedThisWeek {
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
        rehearsals(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

//  Church By Sub Church

export const CAMPUS_BY_CREATIVEARTS = gql`
  query campusByCreativeArts($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      creativeArts {
        id
        name
        admin {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        activeHubCount
        hubFormDefaultersThisWeekCount
        hubBankingDefaultersThisWeekCount
        hubsBankedThisWeekCount
        hubRehearsalsThisWeekCount
        hubCancelledRehearsalsThisWeekCount

        activeBacentaCount
        servicesThisWeekCount
        formDefaultersThisWeekCount
        bankingDefaultersThisWeekCount
        bankedThisWeekCount
        hubRehearsalsThisWeekCount
        hubCancelledRehearsalsThisWeekCount
      }
    }
  }
`

export const CREATIVEARTS_BY_MINISTRY = gql`
  query creativeArtsByMinistry($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name
      ministries {
        id
        name
        admin {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
        }

        activeHubCount
        hubFormDefaultersThisWeekCount
        hubBankingDefaultersThisWeekCount
        hubsBankedThisWeekCount
        hubRehearsalsThisWeekCount
        hubCancelledRehearsalsThisWeekCount

        activeBacentaCount
        servicesThisWeekCount
        formDefaultersThisWeekCount
        bankingDefaultersThisWeekCount
        bankedThisWeekCount
        hubRehearsalsThisWeekCount
        hubCancelledRehearsalsThisWeekCount
      }
    }
  }
`

export const MINISTRY_BY_HUBCOUNCIL = gql`
  query ministryByHubCouncil($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name
      hubCouncils {
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

        activeHubCount
        hubFormDefaultersThisWeekCount
        hubBankingDefaultersThisWeekCount
        hubsBankedThisWeekCount
        hubRehearsalsThisWeekCount
        hubCancelledRehearsalsThisWeekCount

        activeBacentaCount
        servicesThisWeekCount
        formDefaultersThisWeekCount
        bankingDefaultersThisWeekCount
        bankedThisWeekCount
        hubRehearsalsThisWeekCount
        hubCancelledRehearsalsThisWeekCount
      }
    }
  }
`

export const HUBCOUNCIL_BY_HUB = gql`
  query hubCouncilByHub($id: ID!) {
    hubCouncils(where: { id: $id }) {
      id
      name
      hubs {
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

        activeBacentaCount
        servicesThisWeekCount
        formDefaultersThisWeekCount
        bankingDefaultersThisWeekCount
        bankedThisWeekCount
      }
    }
  }
`

export const CAMPUS_HUBREHEARSALS_LIST = gql`
  query campusHubRehearsalsThisWeek($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      hubRehearsalsThisWeek {
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
        rehearsals(limit: 1) {
          id
          noServiceReason
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_CANCELLED_HUBREHEARSALS_LIST = gql`
  query campusCancelledhubRehearsalsThisWeek($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      hubCancelledRehearsalsThisWeek {
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
        rehearsals(limit: 1) {
          id
          noServiceReason
        }
      }
    }
  }
`

export const CAMPUS_HUB_FORM_DEFAULTERS_LIST = gql`
  query campusHubFormDefaulters($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      hubFormDefaultersThisWeek {
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

export const CAMPUS_BANKING_DEFAULTERS_LIST = gql`
  query campusBankingDefaulters($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      hubBankingDefaultersThisWeek {
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
        rehearsals(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const CAMPUS_HUB_BANKED_LIST = gql`
  query campusHubBanked($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      hubsBankedThisWeek {
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
        rehearsals(limit: 1) {
          id
          attendance
          income
        }
      }
    }
  }
`

export const CREATIVE_ARTS_SERVICES_LIST = gql`
  query creativeArtsServicesThisWeek($id: ID!) {
    creativeArts(where: { id: $id }) {
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

export const CREATIVEARTS_FORM_DEFAULTERS_LIST = gql`
  query creativeArtsFormDefaulters($id: ID!) {
    creativeArts(where: { id: $id }) {
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

export const CREATIVEARTS_BANKING_DEFAULTERS_LIST = gql`
  query creativeArtsBankingDefaulters($id: ID!) {
    creativeArts(where: { id: $id }) {
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

export const CREATIVEARTS_BANKED_LIST = gql`
  query creativeArtsBanked($id: ID!) {
    creativeArts(where: { id: $id }) {
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

export const CREATIVEARTS_CANCELLED_SERVICES_LIST = gql`
  query creativeArtsCancelledServicesThisWeek($id: ID!) {
    creativeArts(where: { id: $id }) {
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

export const MINISTRY_SERVICES_LIST = gql`
  query ministryServicesThisWeek($id: ID!) {
    ministries(where: { id: $id }) {
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

export const MINISTRY_FORM_DEFAULTERS_LIST = gql`
  query ministryFormDefaulters($id: ID!) {
    ministries(where: { id: $id }) {
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

export const MINISTRY_BANKING_DEFAULTERS_LIST = gql`
  query ministryBankingDefaulters($id: ID!) {
    ministries(where: { id: $id }) {
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

export const MINISTRY_BANKED_LIST = gql`
  query ministryBanked($id: ID!) {
    ministries(where: { id: $id }) {
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

export const MINISTRY_CANCELLED_SERVICES_LIST = gql`
  query ministryCancelledServicesThisWeek($id: ID!) {
    ministries(where: { id: $id }) {
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

export const HUBCOUNCIL_SERVICES_LIST = gql`
  query hubCouncilServicesThisWeek($id: ID!) {
    hubCouncils(where: { id: $id }) {
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
export const HUBCOUNCIL_FORM_DEFAULTERS_LIST = gql`
  query hubCouncilFormDefaulters($id: ID!) {
    hubCouncils(where: { id: $id }) {
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

export const HUBCOUNCIL_BANKING_DEFAULTERS_LIST = gql`
  query hubCouncilBankingDefaulters($id: ID!) {
    hubCouncils(where: { id: $id }) {
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

export const HUBCOUNCIL_BANKED_LIST = gql`
  query hubCouncilBanked($id: ID!) {
    hubCouncils(where: { id: $id }) {
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
export const HUBCOUNCIL_CANCELLED_SERVICES_LIST = gql`
  query hubCouncilCancelledServicesThisWeek($id: ID!) {
    hubCouncils(where: { id: $id }) {
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
