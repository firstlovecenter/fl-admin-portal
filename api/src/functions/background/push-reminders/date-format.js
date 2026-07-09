// Human-readable date phrasing for reminder notification bodies.
//
// Church leaders read these on their phones, so a raw ISO date ("2026-07-02")
// is noise. Within the last week we speak relatively (yesterday / 2 days ago /
// last Wednesday); older than that we fall back to a plain calendar date
// ("2 July"). The banking reminder only ever looks back 6 days
// (BANKING_REMINDER_RECIPIENTS: range(1,6)), so the >=7 branch is defensive —
// it keeps the helper honest for any other caller.
//
// Ghana is UTC+0 year-round (no DST), so all day math is done on the UTC
// calendar date — the same assumption index.js already relies on.

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MS_PER_DAY = 24 * 60 * 60 * 1000

// UTC midnight for a Y/M/D triple, so subtraction yields whole calendar days
// regardless of the time-of-day carried by `now`.
const utcMidnight = (year, monthIndex, day) =>
  new Date(Date.UTC(year, monthIndex, day))

/**
 * Turn a `YYYY-MM-DD` service date into a phrase that reads naturally after
 * "your service …", relative to `now`:
 *   0 days  -> "today"
 *   1 day   -> "yesterday"
 *   2 days  -> "2 days ago"
 *   3–6 days-> "last Wednesday" (weekday name)
 *   7+ days -> "on 2 July" (absolute calendar date, with leading "on ")
 *
 * Returns the raw input unchanged if it is missing or unparseable, so a bad
 * value degrades to the old behaviour rather than crashing the reminder.
 *
 * @param {string} dateStr  service date as `YYYY-MM-DD` (toString of a neo4j Date)
 * @param {Date}   now      reference "today" (defaults to the current time)
 * @returns {string} phrase to splice into the notification body
 */
const describeServiceDate = (dateStr, now = new Date()) => {
  if (typeof dateStr !== 'string') return String(dateStr ?? '')

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!match) return dateStr

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return dateStr

  const then = utcMidnight(year, monthIndex, day)
  // Reject impossible-but-well-formed dates (e.g. "2026-02-30") that Date.UTC
  // silently rolls forward — degrade to the raw input rather than printing a
  // rolled-over month.
  if (then.getUTCMonth() !== monthIndex || then.getUTCDate() !== day) {
    return dateStr
  }

  const today = utcMidnight(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  const diffDays = Math.round((today.getTime() - then.getTime()) / MS_PER_DAY)

  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays === 2) return '2 days ago'
  if (diffDays <= 6) return `last ${WEEKDAYS[then.getUTCDay()]}`
  return `on ${day} ${MONTHS[monthIndex]}`
}

module.exports = { describeServiceDate }
