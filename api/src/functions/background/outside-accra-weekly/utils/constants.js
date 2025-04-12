// Constants for outside-accra-weekly function
const OVERSIGHT_NAME = 'Outside Accra'
const notifyBaseURL = 'https://api-notify.firstlovecenter.com'

const lastSunday = new Date(
  new Date().setDate(new Date().getDate() - new Date().getDay())
)
  .toISOString()
  .split('T')[0]

// Use CommonJS exports for AWS Lambda compatibility
module.exports = {
  OVERSIGHT_NAME,
  notifyBaseURL,
  lastSunday,
}
