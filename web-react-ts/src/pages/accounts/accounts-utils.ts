export const isAccountOpen = () => {
  const currentDate = new Date()
  // const currentDay = currentDate.getUTCDay()
  const currentHour = currentDate.getUTCHours()

  // Accounts are only open from 6am to 3pm daily (15:00 in 24-hour format)
  if (currentHour < 6 || currentHour >= 15) {
    return false
  }

  // For Thursday after 10am, all of Friday (5), and Saturday (6), return false
  return false
}
