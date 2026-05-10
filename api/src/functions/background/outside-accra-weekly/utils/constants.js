// Constants for outside-accra-weekly function
const OVERSIGHT_NAME = 'Outside Accra'
const notifyBaseURL = 'https://api-notify.firstlovecenter.com'

const toLocalIsoDateString = (date = new Date()) => {
  const targetDate = new Date(date)
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Calculate the last Sunday (start of current week) from a given date
 * @param {Date} date - The date to calculate from (defaults to today)
 * @returns {string} - ISO date string (YYYY-MM-DD)
 */
const getLastSunday = (date = new Date()) => {
  const targetDate = new Date(date)
  targetDate.setDate(targetDate.getDate() - targetDate.getDay())
  return toLocalIsoDateString(targetDate)
}

/**
 * Returns the Monday after a given Sunday date string.
 * ISO weeks start on Monday, so fellowship services (Mon–Sat) fall in a
 * different ISO week than the Sunday that opened the church week. Using this
 * date as the Neo4j week filter correctly targets the current church week's
 * weekday records.
 * @param {string} lastSunday - ISO date string of the preceding Sunday (YYYY-MM-DD)
 * @returns {string} - ISO date string of the following Monday (YYYY-MM-DD)
 */
const getWeekdayDate = (lastSunday) => {
  const date = new Date(lastSunday)
  date.setDate(date.getDate() + 1)
  return toLocalIsoDateString(date)
}

// Use CommonJS exports for AWS Lambda compatibility
module.exports = {
  OVERSIGHT_NAME,
  notifyBaseURL,
  toLocalIsoDateString,
  getLastSunday,
  getWeekdayDate,
}
