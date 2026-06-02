// Mirrors api/src/resolvers/banking/banking-constants.ts. Cypher templates
// on the API side embed the literal strings; the FE uses these constants
// for TS-side comparisons against the transactionStatus field returned
// from GraphQL so a typo in a comparison is caught at compile time.

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
