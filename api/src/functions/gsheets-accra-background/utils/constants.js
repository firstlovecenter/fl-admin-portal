export const CAMPUS_NAME = 'Accra'
export const notifyBaseURL =
  'https://flc-microservices.netlify.app/.netlify/functions/notify'

export const lastSunday = new Date(
  new Date().setDate(new Date().getDate() - new Date().getDay())
)
  .toISOString()
  .split('T')[0]
