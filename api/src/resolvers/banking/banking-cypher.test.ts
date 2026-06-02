/**
 * SM1 — Characterization tests for Cypher guard clauses in banking-cypher.ts
 *
 * The WHERE guards in these strings are the executable form of the SM1
 * state-machine invariants from kb/04-state-machines.md. If they drift,
 * the double-write protection is gone — a Paystack webhook re-delivery or
 * a race condition can corrupt the transactionStatus of a ServiceRecord.
 *
 * All test names begin with "SM1:" for grep-ability (SYN-66 requirement):
 *   npm test -- --testNamePattern="SM1:"
 */
import {
  initiateServiceRecordTransaction,
  setTransactionStatusSuccess,
  setTransactionStatusFailed,
  setTransactionStatusReversed,
  setRecordTransactionReferenceWithOTP,
} from './banking-cypher'

// Returns the portion of a Cypher string before the first SET clause, used to
// assert that guards appear before writes (i.e. no write can bypass the check).
const beforeFirstSet = (cypher: string): string => cypher.split(/\n\s*SET\s/)[0]

// ---------------------------------------------------------------------------
// initiateServiceRecordTransaction — null/failed → pending
// ---------------------------------------------------------------------------
describe('SM1 — initiateServiceRecordTransaction', () => {
  it('SM1: only allows a new payment attempt from null or failed', () => {
    expect(initiateServiceRecordTransaction).toMatch(
      /record\.transactionStatus IS NULL OR record\.transactionStatus = 'failed'/
    )
  })

  it('SM1: guard clause appears before the SET clause (write cannot bypass the check)', () => {
    const wherePos = initiateServiceRecordTransaction.search(/WHERE/)
    const setPos = initiateServiceRecordTransaction.search(/\n\s*SET\s/)
    expect(wherePos).toBeGreaterThan(-1)
    expect(setPos).toBeGreaterThan(wherePos)
  })

  it("SM1: 'pending' is not a valid source state — blocks a concurrent second initiation", () => {
    const guardSection = beforeFirstSet(initiateServiceRecordTransaction)
    expect(guardSection).not.toMatch(/'pending'/)
  })

  it("SM1: 'success' is not a valid source state — success is terminal for self-banking", () => {
    const guardSection = beforeFirstSet(initiateServiceRecordTransaction)
    expect(guardSection).not.toMatch(/'success'/)
  })

  it('SM1: money math invariant — initiation never modifies the income field', () => {
    expect(initiateServiceRecordTransaction).not.toMatch(/\bincome\b\s*=/)
  })
})

// ---------------------------------------------------------------------------
// setTransactionStatusSuccess — pending/send OTP → success
// ---------------------------------------------------------------------------
describe('SM1 — setTransactionStatusSuccess', () => {
  it("SM1: guard allows only 'pending' or 'send OTP' as source state", () => {
    expect(setTransactionStatusSuccess).toMatch(
      /record\.transactionStatus IN \['pending', 'send OTP'\]/
    )
  })

  it("SM1: Pending→Success applied twice is a no-op — 'success' is not in the allowed source list", () => {
    // When transactionStatus is already 'success', it is NOT in ['pending','send OTP']
    // → zero rows matched → no write. This is the structural proof of SM1 idempotency.
    const guardSection = beforeFirstSet(setTransactionStatusSuccess)
    expect(guardSection).not.toMatch(/'success'/)
    expect(guardSection).not.toMatch(/'failed'/)
  })

  it('SM1: money math invariant — success transition never modifies the income field', () => {
    expect(setTransactionStatusSuccess).not.toMatch(/\bincome\b/)
  })
})

// ---------------------------------------------------------------------------
// setTransactionStatusFailed — pending/send OTP/null/failed → failed
// ---------------------------------------------------------------------------
describe('SM1 — setTransactionStatusFailed', () => {
  it("SM1: 'success' is not a valid source state — cannot overwrite a settled record", () => {
    // Allowed sources: null, pending, send OTP, failed — not success.
    const guardSection = beforeFirstSet(setTransactionStatusFailed)
    expect(guardSection).not.toMatch(/'success'/)
  })

  it("SM1: null is a valid source state (defensive no-reference branch in ConfirmOfferingPayment)", () => {
    expect(setTransactionStatusFailed).toMatch(
      /record\.transactionStatus IS NULL/
    )
  })

  it('SM1: money math invariant — failed transition never modifies the income field', () => {
    expect(setTransactionStatusFailed).not.toMatch(/\bincome\b/)
  })
})

// ---------------------------------------------------------------------------
// setRecordTransactionReferenceWithOTP — pending → send OTP
// ---------------------------------------------------------------------------
describe('SM1 — setRecordTransactionReferenceWithOTP', () => {
  it("SM1: OTP transition is only valid from 'pending'", () => {
    expect(setRecordTransactionReferenceWithOTP).toMatch(
      /record\.transactionStatus = 'pending'/
    )
  })

  it("SM1: guard blocks the OTP write if the record is already 'success', 'send OTP', or 'failed'", () => {
    // Only 'pending' is the allowed source — success, failed, and send OTP are absent
    // from the guard section, meaning a concurrent webhook cannot race to terminal first.
    const guardSection = beforeFirstSet(setRecordTransactionReferenceWithOTP)
    expect(guardSection).not.toMatch(/'success'/)
    expect(guardSection).not.toMatch(/'send OTP'/)
    expect(guardSection).not.toMatch(/'failed'/)
  })
})

// ---------------------------------------------------------------------------
// setTransactionStatusReversed — any → reversed (only path that overwrites success)
// ---------------------------------------------------------------------------
describe('SM1 — setTransactionStatusReversed', () => {
  it("SM1: 'reversed' is the only transition permitted to overwrite 'success' (settled refund)", () => {
    const guardSection = beforeFirstSet(setTransactionStatusReversed)
    expect(guardSection).toMatch(/'success'/)
  })

  it("SM1: 'reversed' is itself terminal — it is not a valid source state for any further write", () => {
    // 'reversed' must not appear in the WHERE guard's allowed list.
    const guardSection = beforeFirstSet(setTransactionStatusReversed)
    expect(guardSection).not.toMatch(/'reversed'/)
  })

  it('SM1: money math invariant — reversed transition never modifies the income field', () => {
    expect(setTransactionStatusReversed).not.toMatch(/\bincome\b/)
  })
})
