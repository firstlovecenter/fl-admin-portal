// Central source of truth for the banking SM1 transactionStatus values and
// the banking-method discriminator. The Cypher templates (banking-cypher.ts)
// embed the literal strings directly because those values are persisted on
// the ServiceRecord nodes — changing them would require a database
// migration. The TS-side comparisons / writes use these constants so a
// typo at the call site is caught at compile time instead of silently
// branching the wrong way at runtime.

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SEND_OTP: 'send OTP',
  SUCCESS: 'success',
  FAILED: 'failed',
  REVERSED: 'reversed',
  ABANDONED: 'abandoned',
} as const

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS]

export const BANKING_METHOD = {
  SELF: 'self',
  SLIP: 'slip',
  TELLER: 'teller',
} as const

export type BankingMethod =
  (typeof BANKING_METHOD)[keyof typeof BANKING_METHOD]

// Banking history-log methods include 'recovery' (admin pasted a Paystack
// reference) and 'webhook' (Paystack-driven settlement) in addition to the
// three ServiceRecord-stamped methods above.
export const BANKING_HISTORY_METHOD = {
  ...BANKING_METHOD,
  RECOVERY: 'recovery',
  WEBHOOK: 'webhook',
} as const

export type BankingHistoryMethod =
  (typeof BANKING_HISTORY_METHOD)[keyof typeof BANKING_HISTORY_METHOD]
