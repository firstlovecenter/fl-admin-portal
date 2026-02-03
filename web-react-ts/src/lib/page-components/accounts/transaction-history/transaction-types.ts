import { Member } from '@jaedag/admin-portal-types'
import { Council } from 'global-types'

export interface AccountTransaction {
  id: string
  createdAt: string
  lastModified: string
  council: Council
  description: string
  amount: number
  charge?: number
  account: 'Bussing Society' | 'Current Account'
  status: 'success' | 'pending approval' | 'declined'
  category: 'Deposit' | 'Bussing'
  loggedBy: Member

  weekdayBalance: number
  bussingSocietyBalance: number
}
