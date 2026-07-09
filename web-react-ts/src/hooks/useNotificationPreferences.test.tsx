/**
 * useNotificationPreferences.test.tsx
 *
 * Covers the DEFAULTERS category added alongside Services / Banking / Arrivals:
 * that it is read back from the query, that its default is ON before data
 * loads, and that toggling it fires SetNotificationPreference with the right
 * variables and reflects the new value (optimistic → server) through the cache.
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'

import useNotificationPreferences from './useNotificationPreferences'
import {
  MY_NOTIFICATION_PREFERENCES,
  SET_NOTIFICATION_PREFERENCE,
} from './pushNotificationsGQL'

const prefs = (overrides: Record<string, boolean> = {}) => ({
  services: true,
  banking: true,
  defaulters: true,
  arrivals: true,
  ...overrides,
})

const queryMock = (data = prefs()) => ({
  request: { query: MY_NOTIFICATION_PREFERENCES },
  result: { data: { myNotificationPreferences: data } },
})

const setDefaultersMock = (enabled: boolean, resulting = prefs()) => ({
  request: {
    query: SET_NOTIFICATION_PREFERENCE,
    variables: { category: 'DEFAULTERS', enabled },
  },
  result: {
    data: {
      SetNotificationPreference: {
        __typename: 'NotificationPreferences',
        ...resulting,
      },
    },
  },
})

const renderPrefs = (mocks: unknown[]) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={mocks as never} addTypename={false}>
      {children}
    </MockedProvider>
  )
  return renderHook(() => useNotificationPreferences(), { wrapper })
}

describe('useNotificationPreferences — DEFAULTERS wiring', () => {
  it('defaults defaulters to ON before the query resolves', () => {
    const { result } = renderPrefs([queryMock()])
    expect(result.current.preferences.defaulters).toBe(true)
  })

  it('reads the defaulters flag back from the query', async () => {
    const { result } = renderPrefs([queryMock(prefs({ defaulters: false }))])

    await waitFor(() =>
      expect(result.current.preferences.defaulters).toBe(false)
    )
  })

  it('setPreference("DEFAULTERS", false) fires the mutation and flips the flag', async () => {
    const { result } = renderPrefs([
      queryMock(),
      setDefaultersMock(false, prefs({ defaulters: false })),
    ])

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.setPreference('DEFAULTERS', false)
    })

    await waitFor(() =>
      expect(result.current.preferences.defaulters).toBe(false)
    )
    // The other categories are untouched by the single-category toggle.
    expect(result.current.preferences.services).toBe(true)
    expect(result.current.preferences.banking).toBe(true)
    expect(result.current.preferences.arrivals).toBe(true)
  })
})
