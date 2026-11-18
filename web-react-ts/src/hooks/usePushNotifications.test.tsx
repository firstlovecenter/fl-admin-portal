/**
 * usePushNotifications.test.tsx
 *
 * SYN-230: the silent on-load re-registration fired RegisterPushToken for any
 * authenticated user who had opted in, including members whose roles the
 * server gate rejects — producing a FORBIDDEN on every load. The hook now only
 * registers for members holding a `permitSelfService()` role.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import usePushNotifications from './usePushNotifications'

const registerPushToken = vi.fn()
const registerPushIfGranted = vi.fn()
const writePushToken = vi.fn()
let pushEnabled = true
let auth: { isAuthenticated: boolean; user: { roles: string[] } | null }

vi.mock('@apollo/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client')>()),
  useMutation: () => [registerPushToken],
}))

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => auth,
}))

vi.mock('services/firebaseMessaging', () => ({
  registerPushIfGranted: () => registerPushIfGranted(),
}))

vi.mock('lib/push-preference-storage', () => ({
  readPushEnabled: () => pushEnabled,
  writePushToken: (token: string) => writePushToken(token),
}))

beforeEach(() => {
  registerPushToken.mockReset().mockResolvedValue({})
  registerPushIfGranted.mockReset().mockResolvedValue('tok_abc')
  writePushToken.mockReset()
  pushEnabled = true
  auth = { isAuthenticated: true, user: { roles: ['leaderBacenta'] } }
})

describe('usePushNotifications', () => {
  it.each([['leaderBacenta'], ['arrivalsCounterStream'], ['fishers']])(
    're-registers the device token for a %s member',
    async (role) => {
      auth = { isAuthenticated: true, user: { roles: [role] } }
      renderHook(() => usePushNotifications())

      await waitFor(() =>
        expect(registerPushToken).toHaveBeenCalledWith({
          variables: { token: 'tok_abc' },
        })
      )
      expect(writePushToken).toHaveBeenCalledWith('tok_abc')
    }
  )

  it('never calls RegisterPushToken for a roleless member', async () => {
    auth = { isAuthenticated: true, user: { roles: [] } }
    renderHook(() => usePushNotifications())

    // Give any stray promise chain a chance to run before asserting silence.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(registerPushIfGranted).not.toHaveBeenCalled()
    expect(registerPushToken).not.toHaveBeenCalled()
  })

  it('registers once the roles arrive (does not burn the once-per-session guard)', async () => {
    auth = { isAuthenticated: true, user: { roles: [] } }
    const { rerender } = renderHook(() => usePushNotifications())
    expect(registerPushIfGranted).not.toHaveBeenCalled()

    auth = { isAuthenticated: true, user: { roles: ['tellerStream'] } }
    rerender()

    await waitFor(() => expect(registerPushToken).toHaveBeenCalledTimes(1))
  })

  it('does nothing when the user has not opted in', async () => {
    pushEnabled = false
    renderHook(() => usePushNotifications())

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(registerPushToken).not.toHaveBeenCalled()
  })
})
