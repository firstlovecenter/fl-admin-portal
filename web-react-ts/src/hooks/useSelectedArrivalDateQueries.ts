import { gql } from '@apollo/client'

export const GET_BUSSING_DATES = gql`
  query GetBussingDates {
    bussingDates
  }
`
