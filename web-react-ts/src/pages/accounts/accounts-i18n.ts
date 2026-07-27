import type { TFunction } from 'i18next'

/** Display-only label for stored account enum. Keep English on the wire. */
export const translateAccountLabel = (
  t: TFunction,
  account: string | null | undefined
): string => {
  if (!account) return ''
  switch (account) {
    case 'Weekday Account':
      return t('accounts.common.weekdayAccount')
    case 'Bussing Society':
      return t('accounts.common.bussingSociety')
    case 'Current Account':
      return t('accounts.common.currentAccount')
    default:
      return account
  }
}

/** Display-only label for stored category enum. Keep English on the wire. */
export const translateCategoryLabel = (
  t: TFunction,
  category: string | null | undefined
): string => {
  if (!category) return ''
  switch (category) {
    case 'Deposit':
      return t('accounts.common.categoryDeposit')
    case 'Bussing':
      return t('accounts.expense.categoryBussing')
    case 'HR':
      return t('accounts.expense.categoryHr')
    case 'Construction':
      return t('accounts.expense.categoryConstruction')
    case 'Ministry Expense':
      return t('accounts.expense.categoryMinistry')
    default:
      return category
  }
}

/** Display-only label for stored status enum. Keep English on the wire. */
export const translateStatusLabel = (
  t: TFunction,
  status: string | null | undefined
): string => {
  if (!status) return ''
  switch (status) {
    case 'success':
      return t('accounts.history.statusSuccess')
    case 'pending approval':
      return t('accounts.history.statusPending')
    case 'declined':
      return t('accounts.history.statusDeclined')
    default:
      return status
  }
}
