/**
 * NotificationsCard.test.tsx
 *
 * Verifies the Defaulters reminders row that was added to the notification
 * preferences card: that it renders and that toggling it calls setPreference
 * with the DEFAULTERS category. Both underlying hooks are mocked so the test
 * needs neither browser push APIs nor Apollo.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import NotificationsCard from './NotificationsCard'

const setPreference = vi.fn()

const settings = {
  supported: true,
  permission: 'granted' as const,
  enabled: true,
  enabling: false,
  enable: vi.fn(),
  disable: vi.fn(),
}

let preferences = {
  services: true,
  banking: true,
  defaulters: true,
  arrivals: true,
}

vi.mock('hooks/usePushNotificationSettings', () => ({
  usePushNotificationSettings: () => settings,
}))

vi.mock('hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: () => ({
    preferences,
    loading: false,
    setPreference,
  }),
}))

beforeEach(() => {
  setPreference.mockReset()
  preferences = {
    services: true,
    banking: true,
    defaulters: true,
    arrivals: true,
  }
})

// globals:false in vitest.config means RTL's auto-cleanup is not registered —
// unmount between tests so the document doesn't accumulate multiple cards.
afterEach(() => {
  cleanup()
})

describe('NotificationsCard — Defaulters row', () => {
  it('renders the Defaulters reminders row', () => {
    render(<NotificationsCard />)
    expect(screen.getByText('Defaulters reminders')).toBeInTheDocument()
  })

  it('toggles the DEFAULTERS category off when its switch is turned off', () => {
    render(<NotificationsCard />)
    const toggle = screen.getByRole('switch', {
      name: 'Toggle Defaulters reminders',
    })
    // Starts on (preferences.defaulters === true); a click turns it off.
    fireEvent.click(toggle)
    expect(setPreference).toHaveBeenCalledWith('DEFAULTERS', false)
  })
})
