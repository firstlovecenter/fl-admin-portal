/**
 * Tests for `getHourlyGreeting`, which now takes a required `t: TFunction`
 * param instead of being pure-English. Uses the app's real i18next instance
 * (`lib/i18n.ts`) rather than re-mocking i18next, matching the pattern in
 * `SimpleLogin.test.tsx` / `LanguageSwitcherMenu.test.tsx`.
 *
 * Every `dashboard.greetings.<bucket>` array is verified to exist in full in
 * every locale by `src/lib/i18n.test.ts`'s key-parity test, so the
 * defaultValue/fallback path is intentionally not exercised here.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'
import { getHourlyGreeting } from './greetings'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

// One UTC timestamp per bucket (Africa/Accra === UTC, no DST) — see
// getBucket's hour ranges in greetings.ts. `userKey` is fixed at 'ama-key'
// for all cases: with these exact timestamps its hash-selected index lands
// on a template containing "{{name}}" in every bucket, verified against the
// locale JSON directly rather than assumed.
const BUCKET_TIMES: Record<string, string> = {
  lateNight: '2026-07-25T02:00:00.000Z',
  earlyMorning: '2026-07-25T05:00:00.000Z',
  morning: '2026-07-25T09:00:00.000Z',
  midday: '2026-07-25T12:00:00.000Z',
  afternoon: '2026-07-25T15:00:00.000Z',
  evening: '2026-07-25T20:00:00.000Z',
  night: '2026-07-25T22:00:00.000Z',
}

describe('getHourlyGreeting', () => {
  it.each(Object.entries(BUCKET_TIMES))(
    'returns a non-empty English greeting containing the first name for the %s bucket',
    (bucketName, iso) => {
      const greeting = getHourlyGreeting({
        firstName: 'Ama',
        userKey: 'ama-key',
        now: new Date(iso),
        t: i18n.t,
      })

      expect(greeting).not.toHaveLength(0)
      expect(greeting).toContain('Ama')
    }
  )

  it('is deterministic — same userKey/now produce the same greeting across repeated calls', () => {
    const now = new Date('2026-07-25T09:00:00.000Z')
    const first = getHourlyGreeting({
      firstName: 'Ama',
      userKey: 'ama-key',
      now,
      t: i18n.t,
    })
    const second = getHourlyGreeting({
      firstName: 'Ama',
      userKey: 'ama-key',
      now,
      t: i18n.t,
    })
    const third = getHourlyGreeting({
      firstName: 'Ama',
      userKey: 'ama-key',
      now,
      t: i18n.t,
    })

    expect(second).toBe(first)
    expect(third).toBe(first)
  })

  it('returns different greeting selections for different userKeys at the same time', () => {
    const now = new Date('2026-07-25T09:00:00.000Z')
    const amaGreeting = getHourlyGreeting({
      firstName: 'Ama',
      userKey: 'ama-key',
      now,
      t: i18n.t,
    })
    const guestGreeting = getHourlyGreeting({
      firstName: 'Kwame',
      userKey: 'guest',
      now,
      t: i18n.t,
    })

    expect(guestGreeting).not.toBe(amaGreeting)
  })

  it('returns the French translation for the same inputs once the language is switched', async () => {
    const now = new Date('2026-07-25T09:00:00.000Z')
    const englishGreeting = getHourlyGreeting({
      firstName: 'Ama',
      userKey: 'ama-key',
      now,
      t: i18n.t,
    })

    await i18n.changeLanguage('fr')
    const frenchGreeting = getHourlyGreeting({
      firstName: 'Ama',
      userKey: 'ama-key',
      now,
      t: i18n.t,
    })

    expect(frenchGreeting).toBe(
      "Ama, la joie de l'Éternel est ta force."
    )
    expect(frenchGreeting).not.toBe(englishGreeting)
  })
})
