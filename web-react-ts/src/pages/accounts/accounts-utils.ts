export const formatCurrency = (value: number | null | undefined) => {
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 0,
    }).format(value ?? 0)
  } catch {
    return `GHS ${(value ?? 0).toLocaleString('en-GH', { maximumFractionDigits: 0 })}`
  }
}

export const isAccountOpen = () => {
  const currentDate = new Date()
  // const currentDay = currentDate.getUTCDay()
  const currentHour = currentDate.getUTCHours()

  // Accounts are only open from 6am to 3pm daily (15:00 in 24-hour format)
  if (currentHour < 6 || currentHour >= 15) {
    return false
  }

  return true
}
