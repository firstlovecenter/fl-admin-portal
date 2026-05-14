import { ChurchIdAndName, Council, Stream } from 'global-types'
import { AccountTransaction } from './transaction-history/transaction-types'

export interface CampusDashboardItem {
  id: string
  name: string
  weekdayBalance?: number | null
  bussingSocietyBalance?: number | null
  leader: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    pictureUrl: string
  }
}

export interface StreamForAccounts extends Stream {
  bussingAmount: number
  weekdayBalance: number
  bussingSocietyBalance: number
  councils: CouncilForAccounts[]
}

export interface CouncilForAccounts extends Council {
  hrAmount: number
  amountSpent: number
  bussingAmount: number
  weekdayBalance: number
  bussingSocietyBalance: number
  transactions: AccountTransaction[]
}

export interface CampusForAccounts extends ChurchIdAndName {
  streams: StreamForAccounts[]
}
