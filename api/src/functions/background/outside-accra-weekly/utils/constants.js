// Constants for outside-accra-weekly function
const OVERSIGHT_NAME = 'Outside Accra'
const notifyBaseURL = 'https://api-notify.firstlovecenter.com'

/**
 * Calculate the last Sunday (start of current week) from a given date
 * @param {Date} date - The date to calculate from (defaults to today)
 * @returns {string} - ISO date string (YYYY-MM-DD)
 */
const getLastSunday = (date = new Date()) => {
  const targetDate = new Date(date)
  targetDate.setDate(targetDate.getDate() - targetDate.getDay())
  return targetDate.toISOString().split('T')[0]
}

// Use CommonJS exports for AWS Lambda compatibility
module.exports = {
  OVERSIGHT_NAME,
  notifyBaseURL,
  getLastSunday,
}
