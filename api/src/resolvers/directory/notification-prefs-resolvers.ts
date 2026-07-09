import { permitMe } from '../permissions'
import { Context } from '../utils/neo4j-types'
import { isAuth, throwToSentry } from '../utils/utils'
import {
  READ_NOTIFICATION_PREFERENCES,
  SET_NOTIFICATION_PREFERENCE,
} from './notification-prefs-cypher'

type NotificationCategory = 'SERVICES' | 'BANKING' | 'DEFAULTERS' | 'ARRIVALS'

type SetPreferenceArgs = {
  category: NotificationCategory
  enabled: boolean
}

type NotificationPreferences = {
  services: boolean
  banking: boolean
  defaulters: boolean
  arrivals: boolean
}

const CATEGORIES: NotificationCategory[] = [
  'SERVICES',
  'BANKING',
  'DEFAULTERS',
  'ARRIVALS',
]

// Fully-subscribed fallback for the (shouldn't-happen) no-node case, mirrored
// in both the read and write paths.
const ALL_SUBSCRIBED: NotificationPreferences = {
  services: true,
  banking: true,
  defaulters: true,
  arrivals: true,
}

// Both operations are self-scoped: the read/write always targets the Member
// identified by `context.jwt.userId`, so no caller can read or change another
// member's preferences regardless of role. `permitMe('Bacenta')` (any servant)
// is the gate.

const toPreferences = (record: {
  get: (key: string) => boolean
}): NotificationPreferences => ({
  services: record.get('services'),
  banking: record.get('banking'),
  defaulters: record.get('defaulters'),
  arrivals: record.get('arrivals'),
})

export const myNotificationPreferences = async (
  _source: unknown,
  _args: unknown,
  context: Context
): Promise<NotificationPreferences> => {
  isAuth(permitMe('Bacenta'), context.jwt?.roles)

  const userId = context.jwt?.userId
  if (!userId) {
    return throwToSentry(
      'Unable to read notification preferences',
      'Missing user'
    )
  }

  const session = context.executionContext.session()
  try {
    const result = await session.executeRead((tx) =>
      tx.run(READ_NOTIFICATION_PREFERENCES, { userId })
    )
    const record = result.records[0]
    // A member with no matching node (shouldn't happen for an authed user)
    // defaults to fully subscribed.
    if (!record) {
      return ALL_SUBSCRIBED
    }
    return toPreferences(record)
  } catch (error) {
    return throwToSentry('Unable to read notification preferences', error)
  } finally {
    await session.close()
  }
}

export const SetNotificationPreference = async (
  _source: unknown,
  args: SetPreferenceArgs,
  context: Context
): Promise<NotificationPreferences> => {
  isAuth(permitMe('Bacenta'), context.jwt?.roles)

  const userId = context.jwt?.userId
  if (!userId || !CATEGORIES.includes(args.category)) {
    return throwToSentry(
      'Unable to set notification preference',
      'Missing user or invalid category'
    )
  }

  const session = context.executionContext.session()
  try {
    const result = await session.executeWrite((tx) =>
      tx.run(SET_NOTIFICATION_PREFERENCE, {
        userId,
        category: args.category,
        enabled: args.enabled,
      })
    )
    const record = result.records[0]
    // No node for a valid authed user shouldn't happen; mirror the read path
    // and default to fully subscribed rather than throwing.
    if (!record) {
      return ALL_SUBSCRIBED
    }
    return toPreferences(record)
  } catch (error) {
    return throwToSentry('Unable to set notification preference', error)
  } finally {
    await session.close()
  }
}

export const notificationPrefsQuery = {
  myNotificationPreferences,
}

export const notificationPrefsMutation = {
  SetNotificationPreference,
}
