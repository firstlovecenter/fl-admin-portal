export const messageForAdminsOfDefaulters = (church: {
  admins?: { firstName: string; lastName: string }[]
  formDefaultersThisWeekCount: number
  bankingDefaultersThisWeekCount: number
}) => {
  const adminNames = church.admins && church.admins.length > 0
    ? church.admins.map(a => a.firstName).join(' and ')
    : 'Admin'
  
  return encodeURI(
    `Hi ${adminNames}\nLooks like you have\n\n${
      church.formDefaultersThisWeekCount
    } form defaulters this week and\n${
      church.bankingDefaultersThisWeekCount
    } Banking Defaulters.\n\nPlease follow up to make sure they fill the forms and bank their offerings.`
  )
}
