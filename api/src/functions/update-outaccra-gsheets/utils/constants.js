export const OVERSIGHT_NAME = 'Outside Accra'
export const lastSunday = new Date(
  new Date().setDate(new Date().getDate() - new Date().getDay())
)
  .toISOString()
  .split('T')[0]
