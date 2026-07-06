import { useCallback } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import {
  MY_NOTIFICATION_PREFERENCES,
  SET_NOTIFICATION_PREFERENCE,
} from './pushNotificationsGQL'

export type NotificationCategory = 'SERVICES' | 'BANKING' | 'ARRIVALS'

export interface NotificationPreferences {
  services: boolean
  banking: boolean
  arrivals: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  services: true,
  banking: true,
  arrivals: true,
}

const CATEGORY_FIELD: Record<NotificationCategory, keyof NotificationPreferences> =
  {
    SERVICES: 'services',
    BANKING: 'banking',
    ARRIVALS: 'arrivals',
  }

export interface UseNotificationPreferences {
  preferences: NotificationPreferences
  loading: boolean
  /** Set one category on/off. Optimistic; reverts if the server rejects. */
  setPreference: (
    category: NotificationCategory,
    enabled: boolean
  ) => Promise<void>
}

/**
 * Reads and updates the current user's per-category reminder preferences
 * (Services / Banking / Arrivals), which live server-side on the Member node so
 * the reminder jobs can honour them. Only meaningful once push is enabled on
 * the device, but the preference itself is per-user, not per-device.
 */
export const useNotificationPreferences = (
  skip = false
): UseNotificationPreferences => {
  const { data, loading } = useQuery<{
    myNotificationPreferences: NotificationPreferences
  }>(MY_NOTIFICATION_PREFERENCES, {
    skip,
    fetchPolicy: 'cache-and-network',
  })
  const [mutate] = useMutation<
    {
      SetNotificationPreference: NotificationPreferences & {
        __typename: 'NotificationPreferences'
      }
    },
    { category: NotificationCategory; enabled: boolean }
  >(SET_NOTIFICATION_PREFERENCE)

  const preferences: NotificationPreferences =
    data?.myNotificationPreferences ?? DEFAULT_PREFERENCES

  const setPreference = useCallback(
    async (category: NotificationCategory, enabled: boolean): Promise<void> => {
      const optimistic: NotificationPreferences = {
        ...preferences,
        [CATEGORY_FIELD[category]]: enabled,
      }
      await mutate({
        variables: { category, enabled },
        optimisticResponse: {
          SetNotificationPreference: {
            __typename: 'NotificationPreferences',
            ...optimistic,
          },
        },
        update: (cache, { data: result }) => {
          const next = result?.SetNotificationPreference
          if (!next) return
          cache.writeQuery({
            query: MY_NOTIFICATION_PREFERENCES,
            data: { myNotificationPreferences: next },
          })
        },
      })
    },
    [mutate, preferences]
  )

  return { preferences, loading, setPreference }
}

export default useNotificationPreferences
