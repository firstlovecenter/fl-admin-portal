/**
 * usePushNotificationSettings.test.tsx
 *
 * SYN-230: enabling/disabling push from Settings sent Register/
 * UnregisterPushToken regardless of the member's roles, and the server gate
 * rejected roleless members with FORBIDDEN. The hook now only syncs the token
 * server-side for members holding a `permitSelfService()` role — the local
 * opt-in and token bookkeeping still happen for everyone.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import usePushNotificationSettings from './usePushNotificationSettings'
import { REGISTER_PUSH_TOKEN } from './pushNotificationsGQL'

const registerPushToken = vi.fn()
const unregisterPushToken = vi.fn()
const enablePushNotifications = vi.fn()
const writePushEnabled = vi.fn()
const writePushToken = vi.fn()
const clearPushToken = vi.fn()
let roles: string[] = ['leaderBacenta']

vi.mock('@apollo/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client')>()),
  useMutation: (doc: unknown) => [
    doc === REGISTER_PUSH_TOKEN ? registerPushToken : unregisterPushToken,
  ],
}))

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { roles } }),
}))

vi.mock('services/firebaseMessaging', () => ({
  enablePushNotifications: () => enablePushNotifications(),
  isPushSupported: () => Promise.resolve(true),
}))

vi.mock('lib/push-preference-storage', () => ({
  readPushEnabled: () => false,
  readPushToken: () => 'tok_abc',
  writePushEnabled: (v: boolean) => writePushEnabled(v),
  writePushToken: (t: string) => writePushToken(t),
  clearPushToken: () => clearPushToken(),
}))

beforeEach(() => {
  registerPushToken.mockReset().mockResolvedValue({})
  unregisterPushToken.mockReset().mockResolvedValue({})
  enablePushNotifications.mockReset().mockResolvedValue('tok_abc')
  writePushEnabled.mockReset()
  writePushToken.mockReset()
  clearPushToken.mockReset()
  roles = ['leaderBacenta']
})

describe('usePushNotificationSettings — server sync gate', () => {
  it.each([['leaderBacenta'], ['arrivalsPayerCouncil']])(
    'enable() registers the token server-side for a %s member',
    async (role) => {
      roles = [role]
      const { result } = renderHook(() => usePushNotificationSettings())

      await act(async () => {
        await result.current.enable()
      })

      expect(registerPushToken).toHaveBeenCalledWith({
        variables: { token: 'tok_abc' },
      })
      expect(writePushEnabled).toHaveBeenCalledWith(true)
      expect(result.current.enabled).toBe(true)
    }
  )

  it('enable() skips RegisterPushToken for a roleless member but still opts in locally', async () => {
    roles = []
    const { result } = renderHook(() => usePushNotificationSettings())

    await act(async () => {
      await result.current.enable()
    })

    expect(registerPushToken).not.toHaveBeenCalled()
    expect(writePushToken).toHaveBeenCalledWith('tok_abc')
    expect(writePushEnabled).toHaveBeenCalledWith(true)
  })

  it('disable() unregisters server-side for a member with a sign-in role', () => {
    roles = ['arrivalsCounterStream']
    const { result } = renderHook(() => usePushNotificationSettings())

    act(() => result.current.disable())

    expect(unregisterPushToken).toHaveBeenCalledWith({
      variables: { token: 'tok_abc' },
    })
    expect(clearPushToken).toHaveBeenCalled()
  })

  it('disable() skips UnregisterPushToken for a roleless member but still clears the local token', () => {
    roles = []
    const { result } = renderHook(() => usePushNotificationSettings())

    act(() => result.current.disable())

    expect(unregisterPushToken).not.toHaveBeenCalled()
    expect(clearPushToken).toHaveBeenCalled()
    expect(writePushEnabled).toHaveBeenCalledWith(false)
  })
})
