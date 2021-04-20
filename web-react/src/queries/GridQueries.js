import { gql } from '@apollo/client'

export const GET_FEDERAL_MEMBERS = gql`
  query {
    Member(orderBy: firstName_asc) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        id
        name
      }
      ministry {
        id
        name
      }
      maritalStatus {
        status
      }
      gender {
        gender
      }
      title {
        Title {
          title
        }
        status
        yearAppointed {
          year
        }
      }
      leadsBacenta {
        name
      }
      leadsCentre {
        name
      }
      leadsMinistry {
        name
      }
      leadsSonta {
        name
      }
      leadsBasonta {
        name
      }
      leadsTown {
        name
      }
      leadsCampus {
        name
      }
      townBishop {
        name
      }
      campusBishop {
        name
      }
    }
  }
`

export const GET_FEDERAL_PASTORS = gql`
  query {
    federalPastorList(orderBy: firstName_asc) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        id
        name
      }
      ministry {
        id
        name
      }
      maritalStatus {
        status
      }
      gender {
        gender
      }
      title {
        Title {
          title
        }
        status
        yearAppointed {
          year
        }
      }
      leadsBacenta {
        name
      }
      leadsCentre {
        name
      }
      leadsMinistry {
        name
      }
      leadsSonta {
        name
      }
      leadsBasonta {
        name
      }
      leadsTown {
        name
      }
      leadsCampus {
        name
      }
      townBishop {
        name
      }
      campusBishop {
        name
      }
    }
  }
`

export const GET_BISHOP_MEMBERS = gql`
  query($id: ID) {
    displayMember(id: $id) {
      id
      firstName
      lastName
    }
    bishopMemberList(id: $id, orderBy: firstName_asc) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        id
        name
      }
      ministry {
        id
        name
      }
      maritalStatus {
        status
      }
      gender {
        gender
      }
      title {
        Title {
          title
        }
        status
        yearAppointed {
          year
        }
      }
      leadsBacenta {
        id
        name
      }
      leadsCentre {
        id
        name
      }
      leadsMinistry {
        id
        name
      }
      leadsSonta {
        id
        name
      }
      leadsBasonta {
        id
        name
      }
      leadsTown {
        id
        name
      }
      leadsCampus {
        id
        name
      }
      townBishop {
        id
        name
      }
      campusBishop {
        id
        name
      }
    }
  }
`

export const GET_CAMPUSTOWN_MEMBERS = gql`
  query($id: ID) {
    displayTown(id: $id) {
      id
      name
    }
    townMemberList(id: $id, orderBy: firstName_asc) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        name
      }
      ministry {
        name
      }
      maritalStatus {
        status
      }
      gender {
        gender
      }
      title {
        Title {
          title
        }
        status
        yearAppointed {
          year
        }
      }
      leadsBacenta {
        name
      }
      leadsCentre {
        name
      }
      leadsMinistry {
        name
      }
      leadsSonta {
        name
      }
      leadsBasonta {
        name
      }
      leadsTown {
        name
      }
      leadsCampus {
        name
      }
      townBishop {
        name
      }
      campusBishop {
        name
      }
    }
    displayCampus(id: $id) {
      id
      name
    }
    campusMemberList(id: $id, orderBy: firstName_asc) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        name
      }
      ministry {
        name
      }
      maritalStatus {
        status
      }
      gender {
        gender
      }
      title {
        Title {
          title
        }
        status
        yearAppointed {
          year
        }
      }
      leadsBacenta {
        name
      }
      leadsCentre {
        name
      }
      leadsMinistry {
        name
      }
      leadsSonta {
        name
      }
      leadsBasonta {
        name
      }
      leadsTown {
        name
      }
      leadsCampus {
        name
      }
      townBishop {
        name
      }
      campusBishop {
        name
      }
    }
  }
`

export const GET_CENTRE_MEMBERS = gql`
  query($id: ID) {
    displayCentre(id: $id) {
      id
      name
    }
    centreMemberList(id: $id, orderBy: firstName_asc) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        name
      }
      ministry {
        name
      }
      maritalStatus {
        status
      }
      gender {
        gender
      }
      title {
        Title {
          title
        }
        status
        yearAppointed {
          year
        }
      }
      leadsBacenta {
        name
      }
      leadsCentre {
        name
      }
      leadsMinistry {
        name
      }
      leadsSonta {
        name
      }
      leadsBasonta {
        name
      }
      leadsTown {
        name
      }
      leadsCampus {
        name
      }
      townBishop {
        name
      }
      campusBishop {
        name
      }
    }
  }
`

export const GET_BACENTA_MEMBERS = gql`
  query($id: ID) {
    displayBacenta(id: $id) {
      name
    }
    bacentaMemberList(id: $id, orderBy: firstName_asc) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        name
      }
      ministry {
        name
      }
      maritalStatus {
        status
      }
      gender {
        gender
      }
      title {
        Title {
          title
        }
        status
        yearAppointed {
          year
        }
      }
      leadsBacenta {
        name
      }
      leadsCentre {
        name
      }
      leadsMinistry {
        name
      }
      leadsSonta {
        name
      }
      leadsBasonta {
        name
      }
      leadsTown {
        name
      }
      leadsCampus {
        name
      }
      townBishop {
        name
      }
      campusBishop {
        name
      }
    }
  }
`

export const GET_SONTA_MEMBERS = gql`
  query($id: ID) {
    displaySonta(id: $id) {
      id
      name
    }
    sontaMemberList(id: $id, orderBy: firstName_asc) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        name
      }
      ministry {
        name
      }
      maritalStatus {
        status
      }
      gender {
        gender
      }
      title {
        Title {
          title
        }
        status
        yearAppointed {
          year
        }
      }
      leadsBacenta {
        name
      }
      leadsCentre {
        name
      }
      leadsMinistry {
        name
      }
      leadsSonta {
        name
      }
      leadsBasonta {
        name
      }
      leadsTown {
        name
      }
      leadsCampus {
        name
      }
      townBishop {
        name
      }
      campusBishop {
        name
      }
    }
  }
`
