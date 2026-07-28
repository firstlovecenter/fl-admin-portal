import i18next from 'i18next'
import en from 'locales/en.json'
import { currentIntlLocale, intlLocaleFor } from 'lib/intl-locale'

// `i18next.t` is unbound until `lib/i18n` has run — it returns `undefined`,
// not the key, so an uninitialised caller would render the literal string
// "undefined". The app always initialises (`src/index.tsx` imports `lib/i18n`
// at module level), but a pure unit test importing a date helper on its own
// does not.
//
// The fallback reads the bundled English catalogue rather than repeating the
// three strings here: duplicating them would silently drift the moment
// anyone edits `shared.dates.*` in `en.json`.
const enDates = (en as { shared: { dates: Record<string, string> } }).shared
  .dates

const translate = (key: string, options?: Record<string, unknown>): string => {
  if (i18next.isInitialized) return i18next.t(key, options) as string

  const leaf = key.replace(/^shared\.dates\./, '')
  const template = enDates[leaf]
  if (!template) return key
  // Only `{{count}}` appears in this namespace; keep the shim to that.
  return template.replace('{{count}}', String(options?.count ?? 0))
}

// Replaces the `jd-date-utils` npm dep. The published package transitively
// bundled the entire npm 8 CLI tree, which dragged in dozens of Dependabot
// alerts (SYN-61). The functions below are inlined from the package's 1.0.9
// source (MIT licensed, authored by the same maintainer as this repo) with
// modern TypeScript signatures.

export const getTime = (time: Date): string =>
  `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`

export const setTime = (timeArray: number[]): Date => {
  const now = new Date()
  now.setHours(timeArray[0])
  now.setMinutes(timeArray[1])
  now.setMilliseconds(timeArray[2])
  return now
}

export const parseTimeToDate = (timeString: string): string => {
  // Upstream `jd-date-utils@1.0.9` appended a trailing `0` to the parsed
  // array before passing it to `setTime` so milliseconds are always
  // zeroed when the input is `HH:MM`. Preserve that behaviour exactly —
  // without the `0` a two-part input becomes `setMilliseconds(undefined)`
  // → NaN.
  const numArray = timeString.split(':').map((element) => parseInt(element, 10))
  const datetime = setTime([...numArray, 0])
  return datetime.toISOString()
}

export const getMondayThisWeek = (date: Date): Date => {
  const firstDate = new Date(date)
  const numberOfDaysBefore = firstDate.getDay()
  if (numberOfDaysBefore === 0) {
    firstDate.setDate(firstDate.getDate() - 6)
  } else {
    firstDate.setDate(firstDate.getDate() - numberOfDaysBefore + 1)
  }
  // Calendar-day bound for Yup.date().min() against <input type="date">
  // values (parsed as midnight). Keeping the source time-of-day made every
  // Monday service date fail after 00:00, because midnight < "now".
  firstDate.setHours(0, 0, 0, 0)
  return firstDate
}

export const parseNeoTime = (timestamp?: string): string | undefined => {
  if (!timestamp) return undefined
  const data = new Date(timestamp)
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${pad(data.getHours())}:${pad(data.getMinutes())}:${pad(
    data.getSeconds()
  )}`
}

type ParseDateOptions = {
  /**
   * Overrides the ambient i18next `t`. Pages already holding a `t` from
   * `useTranslation()` should pass it — that subscription is what re-renders
   * them on a language change.
   */
  t?: (key: string, options?: Record<string, unknown>) => string
  /** BCP 47 locale for the long-date fallback. Defaults to the active UI language. */
  locale?: string
}

export const parseDate = (date: string, options?: ParseDateOptions): string => {
  // Returns text "Today", "Yesterday", "N days ago", or a long date string
  const todaysDate = new Date()
  const inputDate = new Date(date)
  const differenceInTime = todaysDate.getTime() - inputDate.getTime()
  const differenceInDays = differenceInTime / (1000 * 3600 * 24)
  // Falling back to the i18next singleton (rather than English literals)
  // keeps the ~5 bare call sites on localized banking/arrivals pages in the
  // user's language without threading `t` through each of them.
  const t = options?.t ?? translate
  const locale = options?.locale
    ? intlLocaleFor(options.locale)
    : currentIntlLocale()

  if (inputDate.toDateString() === todaysDate.toDateString()) {
    return t('shared.dates.today')
  }
  if (differenceInDays < 2) {
    return t('shared.dates.yesterday')
  }
  if (Math.floor(differenceInDays) < 7) {
    const count = Math.floor(differenceInDays)
    return t('shared.dates.daysAgo', { count })
  }
  return inputDate.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

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
  return new Date(date).toLocaleDateString(currentIntlLocale(), options)
}

type MemberWithDob = { dob?: { date?: string } }

export const getMemberDob = (
  displayMember?: MemberWithDob
): string | null | undefined => {
  if (!displayMember) return undefined
  if (displayMember.dob?.date)
    return getHumanReadableDate(displayMember.dob.date)
  return null
}

export const getWeekNumber = (date?: string): number => {
  const currentdate = date ? new Date(date) : new Date()
  const oneJan = new Date(currentdate.getFullYear(), 0, 1)
  let adjustedForMonday = 8 - oneJan.getDay()
  if (adjustedForMonday <= 0) adjustedForMonday += 7
  if (adjustedForMonday >= 8) adjustedForMonday -= 7
  oneJan.setDate(oneJan.getDate() + adjustedForMonday)
  const numberOfDays = Math.floor(
    (currentdate.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)
  )
  return Math.ceil(numberOfDays / 7)
}

export const last3Weeks = (): number[] => {
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toString()
  const last2Weeks = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toString()
  return [getWeekNumber(), getWeekNumber(lastWeek), getWeekNumber(last2Weeks)]
}

// Compares calendar days directly rather than string-matching `parseDate`'s
// output against the literal 'Today'. That comparison was correct while
// `parseDate` returned English literals on its no-options path, but making
// `parseDate` translate by default (same commit) would have made it return
// false in every non-English session — and it gates real arrivals behaviour
// (`FormAttendanceConfirmation`, `FormPayVehicleRecord`, `arrivals-utils`).
export const isToday = (date: string): boolean =>
  new Date(date).toDateString() === new Date().toDateString()

// Intentional drift from upstream: the published `jd-date-utils@1.0.9`
// signature was `(string) => string` but its body optional-chained the
// argument, so a missing input would concatenate the literal string
// "undefined" onto the ISO date and yield an invalid `new Date(...)` at
// every callsite that passes an optional-chained value (which all of
// them do). The `?? ''` fallback here returns the bare `YYYY-MM-DD`
// instead — a saner default that none of the callers depend on
// distinguishing.
export const getTodayTime = (timeString?: string): string =>
  new Date().toISOString().slice(0, 10) + (timeString?.slice(10) ?? '')

export const addHours = (date: string, hours: number): Date => {
  const newDate = new Date(date)
  newDate.setHours(newDate.getHours() + hours)
  return newDate
}

export const addMinutes = (date: string, minutes: number): Date => {
  const newDate = new Date(date)
  newDate.setMinutes(newDate.getMinutes() + minutes)
  return newDate
}
