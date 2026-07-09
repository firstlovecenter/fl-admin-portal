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
  return `${row.churchName}: ${formatMoney(
    latest.income,
    latest.foreignCurrency
  )} from your service ${describeServiceDate(
    latest.date,
    now
  )} hasn't been banked yet${more}. Please bank it today.`
}

module.exports = { toNumber, formatMoney, buildBankingBody }
