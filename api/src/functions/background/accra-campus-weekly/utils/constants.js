const CAMPUS_NAME = 'FL Accra'
const notifyBaseURL = 'https://api-notify.firstlovecenter.com'

const today = new Date().toISOString().split('T')[0]

module.exports = {
  CAMPUS_NAME,
  notifyBaseURL,
  lastSunday: today,
}
