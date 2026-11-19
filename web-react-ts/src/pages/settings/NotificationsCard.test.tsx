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

// The card renders through `useTranslation`, so the real i18next instance has
// to be registered before it mounts — otherwise react-i18next warns
// NO_I18NEXT_INSTANCE and every label renders as its raw key.
import i18n from 'lib/i18n'
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

let roles: string[] = ['leaderBacenta']
const useNotificationPreferencesSpy = vi.fn()

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { roles } }),
}))

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
  useNotificationPreferences: (skip: boolean) => {
    useNotificationPreferencesSpy(skip)
    return { preferences, loading: false, setPreference }
  },
}))

beforeEach(() => {
  setPreference.mockReset()
  useNotificationPreferencesSpy.mockReset()
  roles = ['leaderBacenta']
  preferences = {
    services: true,
    banking: true,
    defaulters: true,
    arrivals: true,
  }
})

// globals:false in vitest.config means RTL's auto-cleanup is not registered —
// unmount between tests so the document doesn't accumulate multiple cards.
afterEach(async () => {
  cleanup()
  // Reset here rather than at the end of a test body: a failing expect would
  // skip an in-body reset and leak the language into every later test.
  await i18n.changeLanguage('en')
})

const defaultersLabel = 'Defaulters reminders'

describe('NotificationsCard — Defaulters row', () => {
  it('renders the Defaulters reminders row', () => {
    render(<NotificationsCard />)
    expect(screen.getByText(defaultersLabel)).toBeInTheDocument()
  })

  it('toggles the DEFAULTERS category off when its switch is turned off', () => {
    render(<NotificationsCard />)
    const toggle = screen.getByRole('switch', {
      name: `Toggle ${defaultersLabel}`,
    })
    // Starts on (preferences.defaulters === true); a click turns it off.
    fireEvent.click(toggle)
    expect(setPreference).toHaveBeenCalledWith('DEFAULTERS', false)
  })

  it('renders the row label in the active language', async () => {
    await i18n.changeLanguage('fr')
    render(<NotificationsCard />)

    expect(screen.getByText('Rappels de défaillants')).toBeInTheDocument()
    expect(screen.queryByText(defaultersLabel)).not.toBeInTheDocument()
  })
})

// SYN-230 — a roleless member would get FORBIDDEN from both the preferences
// query and RegisterPushToken, so the card hides and skips the query.
describe('NotificationsCard — role gate', () => {
  it('renders nothing and skips the preferences query for a roleless member', () => {
    roles = []
    const { container } = render(<NotificationsCard />)

    expect(container).toBeEmptyDOMElement()
    expect(useNotificationPreferencesSpy).toHaveBeenCalledWith(true)
  })

  it('renders and queries preferences for an arrivals-counter-only member', () => {
    roles = ['arrivalsCounterStream']
    render(<NotificationsCard />)

    expect(screen.getByText(defaultersLabel)).toBeInTheDocument()
    expect(useNotificationPreferencesSpy).toHaveBeenCalledWith(false)
  })
})
