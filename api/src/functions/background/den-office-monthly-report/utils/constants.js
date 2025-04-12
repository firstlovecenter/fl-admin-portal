const notifyBaseURL = 'https://api-notify.firstlovecenter.com'

const lastMonth = ((new Date().getMonth() + 11) % 12) + 1

module.exports = {
  notifyBaseURL,
  lastMonth,
}
