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

// Mirrors api/src/resolvers/utils/financial-utils.ts MAX_OFFERING_CASH.
// Self-banking payment-rail ceiling (SYN-195): recording an offering has no
// cap, but a single self-banking payment is capped so a fat-fingered typo
// never reaches Paystack. Surfaced on the self-banking page so the leader
// sees it before attempting payment.
export const MAX_SELF_BANKING_CASH = 50_000

export const BANKING_METHOD = {
  SELF: 'self',
  SLIP: 'slip',
  TELLER: 'teller',
} as const

export type BankingMethod =
  (typeof BANKING_METHOD)[keyof typeof BANKING_METHOD]
