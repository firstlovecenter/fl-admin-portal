// Body construction for the weekly defaulters-roundup push. Extracted from
// index.js (like banking-message.js / date-format.js) so the wording — the
// singular/plural agreement and the form-only / banking-only / both phrasing —
// is unit-testable without the neo4j / FCM plumbing.
//
// `row` is one output of a DEFAULTERS_REMINDER_RECIPIENTS_* query:
//   { churchName, level, formDefaulters, bankingDefaulters, ... }
// where the two counts arrive as neo4j integers.

// Neo4j ints arrive as `{ low, high }` — convert to a JS number when possible.
// Kept local so this module has no dependency on banking-message.js.
const toNumber = (n) => {
  if (n === null || n === undefined) return 0
  if (typeof n === 'number') return n
  if (typeof n.toNumber === 'function') return n.toNumber()
  return Number(n) || 0
}

const noun = (n) => (n === 1 ? 'Bacenta' : 'Bacentas')
const verb = (n) => (n === 1 ? "hasn't" : "haven't")
const possessive = (n) => (n === 1 ? 'its' : 'their')

/**
 * Build the defaulters-roundup notification body for one church-node row.
 *
 * The query only emits rows where at least one count is > 0, but the builder
 * is defensive about the 0/0 case so it is safe to call on any row.
 *
 * Examples (churchName "Adenta Council"):
 *   form 7, banking 4 → "Adenta Council: 7 Bacentas haven't filled their
 *                        service form, 4 haven't banked this week."
 *   form 3, banking 0 → "Adenta Council: 3 Bacentas haven't filled their
 *                        service form this week."
 *   form 0, banking 1 → "Adenta Council: 1 Bacenta hasn't banked this week."
 *
 * @param {{ churchName: string, formDefaulters: any, bankingDefaulters: any }} row
 * @returns {string} the notification body text
 */
const buildDefaultersBody = (row) => {
  const form = toNumber(row.formDefaulters)
  const banking = toNumber(row.bankingDefaulters)
  const name = row.churchName

  const formClause = `${form} ${noun(form)} ${verb(form)} filled ${possessive(
    form
  )} service form`
  const bankingClauseFull = `${banking} ${noun(banking)} ${verb(
    banking
  )} banked`
  // In the combined phrasing the noun is dropped after the comma — the reader
  // carries "Bacentas" from the first clause ("…form, 4 haven't banked").
  const bankingClauseShort = `${banking} ${verb(banking)} banked`

  if (form > 0 && banking > 0) {
    return `${name}: ${formClause}, ${bankingClauseShort} this week.`
  }
  if (form > 0) {
    return `${name}: ${formClause} this week.`
  }
  if (banking > 0) {
    return `${name}: ${bankingClauseFull} this week.`
  }
  return `${name}: no outstanding defaulters this week.`
}

module.exports = { toNumber, buildDefaultersBody }
