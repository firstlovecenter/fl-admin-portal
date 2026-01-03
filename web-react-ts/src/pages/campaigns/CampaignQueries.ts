import { gql } from '@apollo/client'

//Campus Queries and Mutations
export const CAMPUS_CAMPAIGN_LIST = gql`
  query campusCampaigns($campusId: ID) {
    campuses(where: { id: $campusId }) {
      id
      name
      campaigns
    }
  }
`

export const CAMPUS_TRENDS = gql`
  query campusTrends($campusId: ID) {
    campuses(where: { id: $campusId }) {
      id
      name
      campaigns
      equipmentRecord {
        bluetoothSpeakers
        offeringBags
        pulpits
      }
      fellowshipEquipmentFilledCount
      governorshipEquipmentFilledCount
    }
  }
`

export const CAMPUS_BY_STREAM = gql`
  query equipmentCampusByStream($campusId: ID) {
    campuses(where: { id: $campusId }) {
      id
      name
      streams {
        id
        name
        equipmentRecord {
          bluetoothSpeakers
          offeringBags
          pulpits
        }
        fellowshipEquipmentFilledCount
        governorshipEquipmentFilledCount
      }
    }
  }
`

export const SET_EQUIPMENT_DEADLINE = gql`
  mutation SetEquipmentDeadline(
    $startDate: Date!
    $endDate: Date!
    $campusId: ID!
  ) {
    SetEquipmentDeadline(
      startDate: $startDate
      endDate: $endDate
      id: $campusId
    ) {
      id
    }
  }
`

export const EQUIPMENT_END_DATE = gql`
  query equipmentEndDate($campusId: ID) {
    campuses(where: { id: $campusId }) {
      id
      equipmentEndDate
    }
  }
`

export const CAMPUS_EQUIPMENT_DEFAULTERS_NUMBER_BY_GOVERNORSHIP_AND_FELLOWSHIP = gql`
  query campusEquipmentDefaultersNumberByGovernorshipAndFellowship(
    $campusId: ID
  ) {
    campuses(where: { id: $campusId }) {
      id
      governorshipCount
      governorshipEquipmentFilledCount
      governorshipEquipmentNotFilledCount
      fellowshipCount
      fellowshipEquipmentFilledCount
      fellowshipEquipmentNotFilledCount
      streamCount
    }
  }
`

export const CAMPUS_BY_STREAM_EQUIPMENT_DEFAULTERS = gql`
  query equipmentCampusByStreamDefaulters($campusId: ID) {
    campuses(where: { id: $campusId }) {
      id
      name
      streams {
        id
        name
        governorshipCount
        fellowshipCount
        governorshipEquipmentFilledCount
        governorshipEquipmentNotFilledCount
        fellowshipEquipmentFilledCount
        fellowshipEquipmentNotFilledCount
        admin {
          id
          firstName
          lastName
          whatsappNumber
          phoneNumber
        }
      }
    }
  }
`

export const CAMPUS_EQUIPMENT_DEFAULTERS_LIST_BY_GOVERNORSHIP = gql`
  query equipmentCampusDefaultersByGovernorship($campusId: ID) {
    campuses(where: { id: $campusId }) {
      id
      governorshipEquipmentNotFilled {
        id
        name
        leader {
          id
          firstName
          lastName
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

export const CAMPUS_EQUIPMENT_DEFAULTERS_LIST_BY_FELLOWSHIP = gql`
  query equipmentCampusDefaultersByFellowship($campusId: ID) {
    campuses(where: { id: $campusId }) {
      id
      fellowshipEquipmentNotFilled {
        id
        name
        leader {
          id
          firstName
          lastName
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

//Streams Queries and Mutations
export const STREAM_CAMPAIGN_LIST = gql`
  query streamCampaigns($streamId: ID) {
    streams(where: { id: $streamId }) {
      id
      name
      campaigns
    }
  }
`

export const STREAM_TRENDS = gql`
  query streamTrends($streamId: ID) {
    streams(where: { id: $streamId }) {
      id
      name
      equipmentRecord {
        bluetoothSpeakers
        offeringBags
        pulpits
      }
      fellowshipEquipmentFilledCount
      governorshipEquipmentFilledCount
    }
  }
`

export const STREAM_BY_COUNCIL = gql`
  query equipmentStreamByCouncil($streamId: ID) {
    streams(where: { id: $streamId }) {
      id
      name
      councils {
        id
        name
        equipmentRecord {
          bluetoothSpeakers
          offeringBags
          pulpits
        }
        fellowshipEquipmentFilledCount
        governorshipEquipmentFilledCount
      }
    }
  }
`
export const STREAM_BY_COUNCIL_EQUIPMENT_DEFAULTERS = gql`
  query equipmentStreamByCouncilDefaulters($streamId: ID) {
    streams(where: { id: $streamId }) {
      id
      name
      councils {
        id
        name
        governorshipCount
        fellowshipCount
        governorshipEquipmentFilledCount
        governorshipEquipmentNotFilledCount
        fellowshipEquipmentFilledCount
        fellowshipEquipmentNotFilledCount
        admin {
          id
          firstName
          lastName
          whatsappNumber
          phoneNumber
        }
      }
    }
  }
`

export const STREAM_EQUIPMENT_DEFAULTERS_NUMBER_BY_GOVERNORSHIP_AND_FELLOWSHIP = gql`
  query streamEquipmentDefaultersNumberByGovernorshipAndFellowship(
    $streamId: ID
  ) {
    streams(where: { id: $streamId }) {
      id
      governorshipCount
      governorshipEquipmentFilledCount
      governorshipEquipmentNotFilledCount
      fellowshipCount
      fellowshipEquipmentFilledCount
      fellowshipEquipmentNotFilledCount
      councilCount
    }
  }
`

export const STREAM_EQUIPMENT_DEFAULTERS_LIST_BY_GOVERNORSHIP = gql`
  query equipmentStreamDefaultersByGovernorship($streamId: ID) {
    streams(where: { id: $streamId }) {
      id
      governorshipEquipmentNotFilled {
        id
        name
        leader {
          id
          firstName
          lastName
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

export const STREAM_EQUIPMENT_DEFAULTERS_LIST_BY_FELLOWSHIP = gql`
  query equipmentStreamDefaultersByFellowship($streamId: ID) {
    streams(where: { id: $streamId }) {
      id
      fellowshipEquipmentNotFilled {
        id
        name
        leader {
          id
          firstName
          lastName
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

//Councils Queries and Mutations
export const COUNCIL_CAMPAIGN_LIST = gql`
  query councilsCampaigns($councilId: ID) {
    councils(where: { id: $councilId }) {
      id
      name
      campaigns
    }
  }
`

export const COUNCIL_TRENDS = gql`
  query councilsTrends($councilId: ID) {
    councils(where: { id: $councilId }) {
      id
      name
      equipmentRecord {
        bluetoothSpeakers
        offeringBags
        pulpits
      }
      fellowshipEquipmentFilledCount
      governorshipEquipmentFilledCount
    }
  }
`

export const COUNCIL_BY_GOVERNORSHIP = gql`
  query equipmentCouncilByGovernorship($councilId: ID) {
    councils(where: { id: $councilId }) {
      id
      name
      governorships {
        id
        name
        equipmentRecord {
          id
          bluetoothSpeakers
          offeringBags
          pulpits
        }
        fellowshipEquipmentFilledCount
      }
    }
  }
`

export const COUNCIL_EQUIPMENT_DEFAULTERS_NUMBER_BY_GOVERNORSHIP_AND_FELLOWSHIP = gql`
  query councilEquipmentDefaultersNumberByGovernorshipAndFellowship(
    $councilId: ID
  ) {
    councils(where: { id: $councilId }) {
      id
      governorshipCount
      governorshipEquipmentFilledCount
      governorshipEquipmentNotFilledCount
      fellowshipCount
      fellowshipEquipmentFilledCount
      fellowshipEquipmentNotFilledCount
    }
  }
`

export const COUNCIL_EQUIPMENT_DEFAULTERS_LIST_BY_FELLOWSHIP = gql`
  query equipmentCouncilDefaultersByFellowship($councilId: ID) {
    councils(where: { id: $councilId }) {
      id
      fellowshipEquipmentNotFilled {
        id
        name
        leader {
          id
          firstName
          lastName
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`
export const COUNCIL_BY_GOVERNORSHIP_EQUIPMENT_DEFAULTERS = gql`
  query equipmentCouncilByGovernorshipDefaulters($councilId: ID) {
    councils(where: { id: $councilId }) {
      id
      name
      governorships {
        id
        name
        fellowshipCount
        fellowshipEquipmentFilledCount
        fellowshipEquipmentNotFilledCount
        equipmentRecord {
          id
          pulpits
        }
        admin {
          id
          firstName
          lastName
          whatsappNumber
          phoneNumber
        }
      }
    }
  }
`

export const COUNCIL_EQUIPMENT_DEFAULTERS_LIST_BY_GOVERNORSHIP = gql`
  query equipmentGovernorshipDefaultersByGovernorship($councilId: ID) {
    councils(where: { id: $councilId }) {
      id
      governorshipEquipmentNotFilled {
        id
        name
        leader {
          id
          firstName
          lastName
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

//Governorships and Mutations
export const GOVERNORSHIP_CAMPAIGN_LIST = gql`
  query governorshipCampaigns($governorshipId: ID) {
    governorships(where: { id: $governorshipId }) {
      id
      name
      campaigns
    }
  }
`

export const GOVERNORSHIP_TRENDS = gql`
  query governorshipsTrends($governorshipId: ID) {
    governorships(where: { id: $governorshipId }) {
      id
      name
      equipmentRecord {
        id
        bluetoothSpeakers
        offeringBags
        pulpits
      }
      fellowshipEquipmentFilledCount
    }
  }
`

export const CREATE_GOVERNORSHIP_EQUIPMENT_RECORD = gql`
  mutation CreateGovernorshipEquipmentRecord(
    $id: ID!
    $pulpits: Int!
    $date: Date!
  ) {
    CreateGovernorshipEquipmentRecord(id: $id, pulpits: $pulpits, date: $date) {
      id
      equipmentRecord {
        id
        pulpits
      }
    }
  }
`

export const GOVERNORSHIP_LATEST_EQUIPMENT_RECORD = gql`
  query LatestEquipmentRecord($governorshipId: ID) {
    governorships(where: { id: $governorshipId }) {
      id
      equipmentRecord {
        id
        pulpits
      }
    }
  }
`

export const GOVERNORSHIP_BY_BACENTA = gql`
  query equipmentGovernorshipByBacenta($governorshipId: ID) {
    governorships(where: { id: $governorshipId }) {
      id
      name
      bacentas {
        id
        name
        equipmentRecord {
          bluetoothSpeakers
          offeringBags
        }
        fellowshipEquipmentFilledCount
      }
    }
  }
`

export const GOVERNORSHIP_EQUIPMENT_DEFAULTERS_NUMBER_BY_FELLOWSHIP = gql`
  query equipmentGovernorshipDefaultersNumberByFellowship($governorshipId: ID) {
    governorships(where: { id: $governorshipId }) {
      id
      name
      fellowshipEquipmentFilledCount
      fellowshipEquipmentNotFilledCount
      fellowshipCount
    }
  }
`

export const GOVERNORSHIP_EQUIPMENT_DEFAULTERS_LIST_BY_FELLOWSHIP = gql`
  query equipmentGovernorshipDefaultersListByFellowship($governorshipId: ID) {
    governorships(where: { id: $governorshipId }) {
      id
      fellowshipEquipmentFilledCount
      fellowshipEquipmentNotFilledCount
      fellowshipEquipmentNotFilled {
        id
        name
        leader {
          id
          firstName
          lastName
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

//Bacenta Queries and Mutation
export const BACENTA_CAMPAIGN_LIST = gql`
  query bacentaCampaigns($bacentaId: ID) {
    bacentas(where: { id: $bacentaId }) {
      id
      name
      campaigns
    }
  }
`

export const BACENTA_TRENDS = gql`
  query bacentaTrends($bacentaId: ID) {
    bacentas(where: { id: $bacentaId }) {
      id
      name
      equipmentRecord {
        offeringBags
        bluetoothSpeakers
      }
      fellowshipEquipmentFilledCount
    }
  }
`

export const BACENTA_BY_FELLOWSHIP = gql`
  query bacentaByFellowship($bacentaId: ID) {
    bacentas(where: { id: $bacentaId }) {
      id
      name
      fellowshipEquipmentFilledCount
      fellowships {
        id
        name
        equipmentRecord {
          id
          bluetoothSpeakers
          offeringBags
        }
      }
    }
  }
`

//Fellowships Queries and Mutations
export const FELLOWSHIP_CAMPAIGN_LIST = gql`
  query fellowshipCampaigns($fellowshipId: ID) {
    fellowships(where: { id: $fellowshipId }) {
      id
      name
      campaigns
    }
  }
`

export const FELLOWSHIP_TRENDS = gql`
  query fellowshipTrends($fellowshipId: ID) {
    fellowships(where: { id: $fellowshipId }) {
      id
      name
      equipmentRecord {
        id
        bluetoothSpeakers
        offeringBags
      }
    }
  }
`
export const CREATE_FELLOWSHIP_EQUIPMENT_RECORD = gql`
  mutation CreateFellowshipEquipmentRecord(
    $id: ID!
    $offeringBags: Int!
    $date: Date!
    $bluetoothSpeakers: Int!
  ) {
    CreateFellowshipEquipmentRecord(
      id: $id
      offeringBags: $offeringBags
      date: $date
      bluetoothSpeakers: $bluetoothSpeakers
    ) {
      id
      equipmentRecord {
        id
        bluetoothSpeakers
        offeringBags
      }
    }
  }
`

export const FELLOWSHIP_LATEST_EQUIPMENT_RECORD = gql`
  query LatestEquipmenRecord($fellowshipId: ID) {
    fellowships(where: { id: $fellowshipId }) {
      id
      equipmentRecord {
        id
        bluetoothSpeakers
        offeringBags
      }
    }
  }
`

// use bacenta by fellowship instrad and drill down
export const FELLOWSHIP_RECORDS_PER_GOVERNORSHIP = gql`
  query Governorships($governorshipId: ID) {
    governorships(where: { id: $governorshipId }) {
      id
      bacentas {
        id
        fellowships {
          id
          name
          equipmentRecord {
            id
            bluetoothSpeakers
            offeringBags
          }
        }
      }
    }
  }
`
