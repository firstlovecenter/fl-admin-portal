const CAMPUS_NAME = 'Accra'
const notifyBaseURL = 'https://api-notify.firstlovecenter.com'

const lastSunday = new Date(
  new Date().setDate(new Date().getDate() - new Date().getDay())
)
  .toISOString()
  .split('T')[0]

module.exports = {
  CAMPUS_NAME,
  notifyBaseURL,
  lastSunday,
}
