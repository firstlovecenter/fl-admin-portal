export const CAMPUS_NAME = 'Accra'
export const notifyBaseURL = 'https://api-notify.firstlovecenter.com'

export const lastSunday = new Date(
  new Date().setDate(new Date().getDate() - new Date().getDay())
)
  .toISOString()
  .split('T')[0]
