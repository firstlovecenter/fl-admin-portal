const errorMessage = require('../texts.json').error

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10)

// Inlined from the (now-removed) `jd-date-utils` dep — same algorithm,
// just colocated here so we don't drag the whole npm CLI tree back in
// (SYN-61).
export function getHumanReadableDate(
  date: string | undefined,
  weekday?: true
): string | undefined {
  if (!date) return undefined
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  if (weekday) options.weekday = 'long'
  return new Date(date).toLocaleDateString('en-gb', options)
}

// UTC math throughout. The downstream Cypher uses `date($serviceDate).week`
// which is timezone-free, so the guard must agree. Mixing local-time week
// math (jd-date-utils' `getMondayThisWeek` uses local `getDay`) with UTC ISO
// formatting would let week boundaries drift on non-UTC hosts.
const mondayOfWeekIso = (date: Date): string => {
  const dayOfWeek = date.getUTCDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + offsetToMonday
    )
  )
  return toIsoDate(monday)
}

// Server-side mirror of the FE Yup rule on every service form. The
// `serviceDate` must be a yyyy-mm-dd ISO date in the range
// [Monday-of-this-week, today] inclusive. Direct GraphQL callers bypass the FE
// form, so this guard is the only thing standing between an authenticated
// caller and an out-of-week ServiceRecord write.
export const assertServiceDateInCurrentWeek = (serviceDate?: string): void => {
  if (!serviceDate || !ISO_DATE_RE.test(serviceDate)) {
    throw new Error(errorMessage.service_date_required)
  }
  if (Number.isNaN(Date.parse(serviceDate))) {
    throw new Error(errorMessage.service_date_required)
  }

  const now = new Date()
  const todayIso = toIsoDate(now)
  const mondayThisWeekIso = mondayOfWeekIso(now)

  if (serviceDate < mondayThisWeekIso || serviceDate > todayIso) {
    throw new Error(errorMessage.service_date_out_of_week)
  }
}
