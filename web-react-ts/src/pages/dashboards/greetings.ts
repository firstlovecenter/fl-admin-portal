import type { TFunction } from 'i18next'

type GreetingBucket =
  | 'lateNight'
  | 'earlyMorning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night'

// Length of each dashboard.greetings.<bucket> array in locales/*.json. Kept
// in lockstep with the JSON by the "locale key-parity" test (lib/i18n.test.ts)
// — every locale must translate all N entries in every bucket.
const GREETING_COUNTS: Record<GreetingBucket, number> = {
  lateNight: 9,
  earlyMorning: 10,
  morning: 10,
  midday: 9,
  afternoon: 9,
  evening: 9,
  night: 9,
}

const ACCRA_TIME_ZONE = 'Africa/Accra'

const getAccraHour = (date: Date): number => {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: ACCRA_TIME_ZONE,
    hour: 'numeric',
    hour12: false,
  }).format(date)
  const parsed = Number(formatted.replace(/\D/g, ''))
  if (!Number.isFinite(parsed)) return date.getHours()
  // Some runtimes return "24" for midnight under hour12:false
  return parsed === 24 ? 0 : parsed
}

const getBucket = (hour: number): GreetingBucket => {
  if (hour >= 4 && hour < 7) return 'earlyMorning'
  if (hour >= 7 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 14) return 'midday'
  if (hour >= 14 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  if (hour >= 21 && hour < 24) return 'night'
  return 'lateNight'
}

const hashString = (input: string): number => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    // djb2-ish; bitwise ops coerce to 32-bit int
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export const getHourlyGreeting = ({
  firstName,
  userKey,
  now = new Date(),
  t,
}: {
  firstName: string
  userKey: string
  now?: Date
  t: TFunction
}): string => {
  const hour = getAccraHour(now)
  const bucket = getBucket(hour)
  const count = GREETING_COUNTS[bucket]
  // Hour-since-epoch — same value for everyone in the same clock hour,
  // changes at the top of every hour.
  const hourEpoch = Math.floor(now.getTime() / 3_600_000)
  const seedKey = userKey || firstName || 'guest'
  const idx = (hashString(seedKey) + hourEpoch) % count
  return t(`dashboard.greetings.${bucket}.${idx}`, { name: firstName })
}
