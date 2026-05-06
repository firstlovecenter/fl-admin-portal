import { Member } from 'global-types'
import { getHumanReadableDate } from 'global-utils'

export const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g

// Birthdays show day + month only — getHumanReadableDate always emits the year.
export const formatBirthday = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

export const csvHeaders = [
  { label: 'Governorship', key: 'governorship' },
  { label: 'Governorship Leader', key: 'governorshipLeader' },
  { label: 'Bacenta', key: 'bacenta' },
  { label: 'Bacenta Leader', key: 'bacentaLeader' },
  { label: 'First Name', key: 'firstName' },
  { label: 'Last Name', key: 'lastName' },
  { label: 'Phone Number', key: 'phoneNumber' },
  { label: 'Whatsapp Number', key: 'whatsappNumber' },
  { label: 'Email', key: 'email' },
  { label: 'Marital Status', key: 'maritalStatus' },
  { label: 'Gender', key: 'gender' },
  { label: 'Date of Birth', key: 'dateOfBirth' },
  { label: 'Visitation Area', key: 'visitationArea' },
  { label: 'Basonta', key: 'basonta' },
] as const

export type CsvRowKey = (typeof csvHeaders)[number]['key']
export type CsvRow = { id: string } & Record<CsvRowKey, string>

export const buildCsvRow = (member: Member): CsvRow => ({
  id: member.id,
  governorship: member.bacenta?.governorship?.name ?? '',
  governorshipLeader: member.bacenta?.governorship?.leader?.fullName ?? '',
  bacenta: member.bacenta?.name ?? '',
  bacentaLeader: member.bacenta?.leader?.fullName ?? '',
  firstName: member.firstName ?? '',
  lastName: member.lastName ?? '',
  phoneNumber: member.phoneNumber ?? '',
  whatsappNumber: member.whatsappNumber ?? '',
  email: member.email ?? '',
  maritalStatus: member.maritalStatus?.status ?? '',
  gender: member.gender?.gender ?? '',
  dateOfBirth: formatBirthday(member.dob?.date),
  visitationArea: member.visitationArea ?? '',
  basonta: member.basonta?.name ?? '',
})

type FilenameInput = {
  churchName?: string
  churchType: string
  filteredCount: number
  totalCount: number
}

export const buildCsvFilename = ({
  churchName,
  churchType,
  filteredCount,
  totalCount,
}: FilenameInput) => {
  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeName = (churchName ?? '').replace(ILLEGAL_FILENAME_CHARS, '-')
  const filtered = filteredCount !== totalCount ? ' (filtered)' : ''
  return {
    filename: `${
      safeName ? `${safeName} ` : ''
    }${churchType} Membership${filtered} - ${generatedOn}.csv`,
    generatedOn,
  }
}
