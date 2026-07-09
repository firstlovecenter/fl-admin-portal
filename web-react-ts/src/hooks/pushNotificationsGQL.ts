import { gql } from '@apollo/client'

export const REGISTER_PUSH_TOKEN = gql`
  mutation RegisterPushToken($token: String!) {
    RegisterPushToken(token: $token)
  }
`

export const UNREGISTER_PUSH_TOKEN = gql`
  mutation UnregisterPushToken($token: String!) {
    UnregisterPushToken(token: $token)
  }
`

export const MY_NOTIFICATION_PREFERENCES = gql`
  query MyNotificationPreferences {
    myNotificationPreferences {
      services
      banking
      defaulters
      arrivals
    }
  }
`

export const SET_NOTIFICATION_PREFERENCE = gql`
  mutation SetNotificationPreference(
    $category: NotificationCategory!
    $enabled: Boolean!
  ) {
    SetNotificationPreference(category: $category, enabled: $enabled) {
      services
      banking
      defaulters
      arrivals
    }
  }
`
