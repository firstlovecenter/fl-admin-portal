import { gql } from '@apollo/client'

export const GET_MEMBER_TITLES = gql`
  query GetMemberTitles($id: ID!) {
    members(where: { id: $id }) {
      id
      firstName
      lastName
      fullName
      nameWithTitle
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
`

export const DELETE_MEMBER_TITLES = gql`
  mutation DeleteMemberTitles($id: ID!) {
    DeleteMemberTitles(id: $id) {
      id

      firstName
      lastName
      fullName
      nameWithTitle
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
`

export const UPDATE_MEMBER_APPOINTMENT_DATE = gql`
  mutation UpdateMemberAppointmentDate($id: ID!, $appointmentDate: String!) {
    UpdateMemberAppointmentDate(id: $id, appointmentDate: $appointmentDate) {
      id
      firstName
      lastName
      nameWithTitle
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
`

export const UPDATE_MEMBER_ORDINATION_DATE = gql`
  mutation UpdateMemberOrdinationDate($id: ID!, $ordinationDate: String!) {
    UpdateMemberOrdinationDate(id: $id, ordinationDate: $ordinationDate) {
      id
      firstName
      lastName
      nameWithTitle
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
`

export const UPDATE_MEMBER_CONSECRATION_DATE = gql`
  mutation UpdateMemberConsecrationDate($id: ID!, $consecrationDate: String!) {
    UpdateMemberConsecrationDate(id: $id, consecrationDate: $consecrationDate) {
      id
      firstName
      lastName
      nameWithTitle
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
`
