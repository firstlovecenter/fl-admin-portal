// Body construction for the daily banking-reminder push. Extracted from
// index.js so the wording — money label + relative service date + the
// "+N more" pluralisation — is unit-testable without the neo4j / FCM plumbing.

const { describeServiceDate } = require('./date-format')

// Neo4j ints arrive as `{ low, high }` — convert to a JS number when possible.
const toNumber = (n) => {
  if (n === null || n === undefined) return null
  if (typeof n === 'number') return n
  if (typeof n.toNumber === 'function') return n.toNumber()
  return n
}

// Outside Accra records store income in a foreign currency
// (ServiceRecord.foreignCurrency) — label with it so a USD figure is never
// presented as GHS.
const formatMoney = (amount, currency) => {
  const value = toNumber(amount)
  if (value === null) return ''
  return `${currency || 'GHS'} ${value.toLocaleString('en-GH')}`
}

// Stewardship scriptures that open the banking reminder. These frame the
// unbanked offering as funds held in trust (not the leader's own money), so the
// set is drawn from verses about faithfulness with what is entrusted and
// honesty in handling money — not personal-giving / tithing verses. Verse text
// only: the reminder body still carries the "Please bank it today." call to
// action, so the scripture supplies the "why", not a second instruction.
const BANKING_VERSES = [
  '1 Cor 4:2 — It is required of stewards that they be found faithful.',
  'Luke 16:10 — Whoever is faithful in a very little is faithful also in much.',
  'Lev 19:11 — You shall not steal, nor deal falsely with one another.',
  'Prov 11:1 — A false balance is an abomination to the Lord, but a just weight is his delight.',
]

/**
 * Pick the day's verse. Rotation is keyed on the UTC calendar day so it is
 * deterministic (every recipient on a given day sees the same verse, and the
 * choice is unit-testable from `now` alone) and advances one verse per day.
 * Ghana is UTC+0 year-round, so the UTC day IS the Accra day.
 *
 * @param {Date} now  reference "today"
 * @returns {string} one of BANKING_VERSES
 */
const pickVerse = (now = new Date()) => {
  const dayNumber = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) /
      (24 * 60 * 60 * 1000)
  )
  return BANKING_VERSES[dayNumber % BANKING_VERSES.length]
}

/**
 * Build the banking-reminder notification body for one recipient row.
 *
 * `row.unbanked` is ordered most-recent-first (ORDER BY serviceDate.date DESC
 * in BANKING_REMINDER_RECIPIENTS): the latest unbanked service leads the
 * message and any others are folded into a "+N more" count.
 *
 * @param {{ churchName: string, unbanked: Array<{income: any, foreignCurrency?: string, date: string}> }} row
 * @param {Date} now  reference "today" for the relative date phrasing
 * @returns {string} the notification body text
 */
const buildBankingBody = (row, now = new Date()) => {
  const [latest] = row.unbanked
  const more =
    row.unbanked.length > 1
      ? ` (+${row.unbanked.length - 1} more unbanked service${
          row.unbanked.length > 2 ? 's' : ''
        })`
      : ''
  return `${pickVerse(now)}\n\n${row.churchName}: ${formatMoney(
    latest.income,
    latest.foreignCurrency
  )} from your service ${describeServiceDate(
    latest.date,
    now
  )} hasn't been banked yet${more}. Please bank it today.`
}

module.exports = {
  toNumber,
  formatMoney,
  buildBankingBody,
  pickVerse,
  BANKING_VERSES,
}
