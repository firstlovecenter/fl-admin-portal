type GreetingFn = (name: string) => string

type GreetingBucket =
  | 'lateNight'
  | 'earlyMorning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night'

const GREETINGS_BY_BUCKET: Record<GreetingBucket, GreetingFn[]> = {
  // 00:00 – 03:59 — Paul & Silas hours
  lateNight: [
    (name) => `${name}, at this hour? Paul-and-Silas mode unlocked.`,
    (name) => `Watchman ${name}, what of the night? Apparently, more admin.`,
    (name) => `${name}, even the disciples slept. Just gently saying.`,
    (name) => `The spirit is willing, ${name} — please let the flesh sleep soon.`,
    (name) => `Burning oil at ${name} o'clock. Heaven sees you.`,
    (name) => `He neither slumbers nor sleeps, ${name}. You, however, should.`,
    () => `Midnight oil hits different.`,
    () => `Be sober, be vigilant — and please, be horizontal soon.`,
    () => `Lift up your hands in the sanctuary by night. Or in the dashboard.`,
  ],

  // 04:00 – 06:59 — rise and shine
  earlyMorning: [
    (name) => `Rise and shine, ${name} — mercies are new this morning.`,
    (name) => `Early bird ${name}. The worm respectfully bows.`,
    (name) => `He waketh morning by morning, ${name}. You're keeping up.`,
    (name) => `${name}, up before sunrise — big "I sought thee early" energy.`,
    (name) => `Pre-dawn admin, ${name}. The watchman approves.`,
    (name) =>
      `Good morning, ${name}. Joy comes in the morning — and so do you.`,
    (name) => `Eyes open, ${name}. Heart awake. Let's go.`,
    () => `The morning stars sang together. You're the encore.`,
    () => `New day, fresh anointing.`,
    () => `Before the dew lifts — that kind of devotion.`,
  ],

  // 07:00 – 10:59 — morning proper
  morning: [
    (name) => `Good morning, ${name}. Mercies: fresh out the box.`,
    (name) => `Coffee in one hand, calling in the other — let's go, ${name}.`,
    (name) => `Morning, ${name}. This is the day the Lord has made.`,
    (name) => `${name}, the harvest is plentiful — and so is the to-do list.`,
    (name) => `${name}, the joy of the Lord is your strength.`,
    (name) => `Daylight servant hours, ${name}. Let's move.`,
    (name) => `Welcome, ${name}. Start small, finish faithful.`,
    () => `Strong coffee, stronger calling.`,
    () => `Every good gift cometh down — including today.`,
    () => `Sunrise: done. To-do list: pending.`,
  ],

  // 11:00 – 13:59 — midday
  midday: [
    (name) => `Midday check-in, ${name}. Did you eat?`,
    (name) => `The sun is high, ${name}. The standards are higher.`,
    (name) => `${name}, halfway through the day. Stand firm.`,
    (name) => `Lunch break or admin break, ${name}? Yes.`,
    (name) => `Welcome back, ${name}. The day is still yours.`,
    (name) => `Be still, ${name} — but only after the form is submitted.`,
    () => `High noon, holy hustle.`,
    () => `The light is at its brightest. So is the assignment.`,
    () => `Even Elijah ate before he ran.`,
  ],

  // 14:00 – 16:59 — afternoon
  afternoon: [
    (name) => `Good afternoon, ${name}. Finishing strong beats starting strong.`,
    (name) =>
      `${name}, run with patience the race set before you — even the admin part.`,
    (name) => `${name}, faithful in little, faithful in much.`,
    (name) => `Productivity window open, ${name}. Naps are also biblical.`,
    (name) => `Afternoon, ${name}. Press on.`,
    (name) => `The day is not over, ${name}. Neither is the calling.`,
    () => `Still standing. Still serving.`,
    () => `The afternoon shift is undefeated.`,
    () => `Slow and steady wins the kingdom race.`,
  ],

  // 17:00 – 20:59 — evening
  evening: [
    (name) => `Good evening, ${name}. Day well used?`,
    (name) => `Evening admin, ${name}. Pastor mode: still on.`,
    (name) => `${name}, the day is far spent — the work was good.`,
    (name) => `Sun setting, ${name}. Dashboard still glowing.`,
    (name) => `Welcome back, ${name}. One last push.`,
    (name) =>
      `He gives His beloved sleep, ${name} — right after you bank that service.`,
    () => `Sunset admin. Holy, but slightly tired.`,
    () => `Cool of the day — God walks. So do you.`,
    () => `Evening sacrifices are still acceptable.`,
  ],

  // 21:00 – 23:59 — night
  night: [
    (name) => `Late shift, ${name}? The Lord watches over you.`,
    (name) => `He neither slumbers nor sleeps, ${name}. You, on the other hand…`,
    (name) => `${name}, faithful with the late-night details. Respect.`,
    (name) =>
      `Burning the midnight oil, ${name} — anointed, but please rest soon.`,
    (name) => `Evening, ${name}. Rest is also worship.`,
    (name) => `Quiet hours, ${name}. Steady hands. Holy work.`,
    () => `One more record, one more rest.`,
    () => `Even the temple closed eventually.`,
    () => `Twilight servant hours — clocking in quietly.`,
  ],
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
}: {
  firstName: string
  userKey: string
  now?: Date
}): string => {
  const hour = getAccraHour(now)
  const bucket = GREETINGS_BY_BUCKET[getBucket(hour)]
  // Hour-since-epoch — same value for everyone in the same clock hour,
  // changes at the top of every hour.
  const hourEpoch = Math.floor(now.getTime() / 3_600_000)
  const seedKey = userKey || firstName || 'guest'
  const idx = (hashString(seedKey) + hourEpoch) % bucket.length
  return bucket[idx]?.(firstName) ?? `Hello, ${firstName}.`
}
