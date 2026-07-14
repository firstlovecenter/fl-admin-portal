/**
 * firebaseMessaging.test.ts — SYN-202
 *
 * This file previously had zero tests. SYN-202 removed 4 stray
 * DEV-gated `console.log` debug calls (foreground message logging in
 * `getMessagingInstance`, token-acquired logging in `acquireToken`,
 * enable-failure logging in `enablePushNotifications`, and silent-register
 * failure logging in `registerPushIfGranted`), replacing the last two with
 * an *unconditional* `console.error` before the function throws / resolves
 * null. These tests pin that behavior:
 *
 *   1. No code path in this module calls `console.log` any more.
 *   2. The foreground `onMessage` listener wired in `getMessagingInstance`
 *      is a genuine no-op (never throws, never logs) — it silently drops
 *      every foreground push while the app is in the foreground.
 *   3. `enablePushNotifications` failure logs via `console.error` with the
 *      `'[FCM] enable failed:'` prefix and the raw error, then throws
 *      `Error('registration-failed')` (the raw error is never surfaced to
 *      the caller).
 *   4. `registerPushIfGranted` failure logs via `console.error` with the
 *      `'[FCM] silent register failed:'` prefix and the raw error, then
 *      resolves to `null` (never throws — this is the silent, app-load
 *      re-registration path).
 *   5. `isPushSupported` still resolves true/false (and false on a thrown
 *      support check) — sanity check that the untouched branch wasn't
 *      disturbed by the log removal.
 *
 * `firebase/app` and `firebase/messaging` are mocked entirely (this is a
 * unit test of this module's control flow and logging, not of the Firebase
 * SDK). `navigator.serviceWorker.register` and the global `Notification`
 * API are stubbed because jsdom implements neither.
 *
 * Module-level singletons (`app`, `messaging`, `foregroundListenerWired` in
 * the source) are reset between tests via `vi.resetModules()` + a fresh
 * dynamic import, so each test observes `getMessagingInstance()` wiring the
 * foreground listener from scratch rather than depending on test order.
 * The firebase/messaging mock functions are created with `vi.hoisted` so
 * they stay the same stable references across those resets — the mock
 * *module* is re-evaluated on every reset, but it always returns the same
 * mock fns, so `mockResolvedValue` / assertions set up per test keep
 * working after the dynamic re-import.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({})),
  getMessaging: vi.fn(() => ({})),
  getToken: vi.fn(),
  onMessage: vi.fn(),
  isSupported: vi.fn(),
}))

vi.mock('firebase/app', () => ({
  initializeApp: mocks.initializeApp,
}))

vi.mock('firebase/messaging', () => ({
  getMessaging: mocks.getMessaging,
  getToken: mocks.getToken,
  onMessage: mocks.onMessage,
  isSupported: mocks.isSupported,
}))

type NotificationStub = {
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
}

const registerServiceWorker = vi.fn()
let notificationStub: NotificationStub

// vi.fn(async () => 'granted') infers Promise<string>, not
// Promise<NotificationPermission> — the DOM lib's permission strings are a
// closed union, so TS widens the literal unless we pin the return type here.
const permissionResolver = (
  permission: NotificationPermission
): (() => Promise<NotificationPermission>) => vi.fn(async () => permission)

const importFirebaseMessaging = async () => {
  vi.resetModules()
  return import('./firebaseMessaging')
}

beforeEach(() => {
  mocks.initializeApp.mockReset().mockReturnValue({})
  mocks.getMessaging.mockReset().mockReturnValue({})
  mocks.getToken.mockReset()
  mocks.onMessage.mockReset()
  mocks.isSupported.mockReset()

  registerServiceWorker
    .mockReset()
    .mockResolvedValue({} as ServiceWorkerRegistration)
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { register: registerServiceWorker },
    configurable: true,
  })

  notificationStub = {
    permission: 'default',
    requestPermission: permissionResolver('default'),
  }
  vi.stubGlobal('Notification', notificationStub)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('isPushSupported', () => {
  it('resolves true when the SDK reports support', async () => {
    mocks.isSupported.mockResolvedValue(true)
    const { isPushSupported } = await importFirebaseMessaging()
    await expect(isPushSupported()).resolves.toBe(true)
  })

  it('resolves false when the SDK reports no support', async () => {
    mocks.isSupported.mockResolvedValue(false)
    const { isPushSupported } = await importFirebaseMessaging()
    await expect(isPushSupported()).resolves.toBe(false)
  })

  it('resolves false (not throw) when the support check itself throws', async () => {
    mocks.isSupported.mockRejectedValue(new Error('not in this context'))
    const { isPushSupported } = await importFirebaseMessaging()
    await expect(isPushSupported()).resolves.toBe(false)
  })
})

describe('enablePushNotifications — success', () => {
  it('returns the token and logs nothing', async () => {
    mocks.isSupported.mockResolvedValue(true)
    notificationStub.requestPermission = permissionResolver('granted')
    mocks.getToken.mockResolvedValue('tok-123')

    const consoleLogSpy = vi.spyOn(console, 'log')
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { enablePushNotifications } = await importFirebaseMessaging()
    await expect(enablePushNotifications()).resolves.toBe('tok-123')

    expect(consoleLogSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('wires the foreground onMessage listener as a silent no-op', async () => {
    mocks.isSupported.mockResolvedValue(true)
    notificationStub.requestPermission = permissionResolver('granted')
    mocks.getToken.mockResolvedValue('tok-123')

    const consoleLogSpy = vi.spyOn(console, 'log')
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { enablePushNotifications } = await importFirebaseMessaging()
    await enablePushNotifications()

    expect(mocks.onMessage).toHaveBeenCalledTimes(1)
    const foregroundHandler = mocks.onMessage.mock.calls[0][1] as (
      payload: unknown
    ) => void

    // TODO(refactor): this listener silently drops every foreground FCM
    // message (it used to at least console.log the payload in DEV). That
    // means a user with the app open in the foreground gets no in-app
    // signal that a push arrived. Documenting the current no-op contract
    // here, not endorsing it — flag before building any foreground toast/
    // banner feature on top of this.
    expect(() =>
      foregroundHandler({ notification: { title: 'test' } })
    ).not.toThrow()
    expect(consoleLogSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})

describe('enablePushNotifications — failure', () => {
  it('logs via console.error and throws registration-failed when token acquisition rejects', async () => {
    mocks.isSupported.mockResolvedValue(true)
    notificationStub.requestPermission = permissionResolver('granted')
    const underlyingError = new Error('FCM 401')
    mocks.getToken.mockRejectedValue(underlyingError)

    const consoleLogSpy = vi.spyOn(console, 'log')
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { enablePushNotifications } = await importFirebaseMessaging()
    await expect(enablePushNotifications()).rejects.toThrow(
      'registration-failed'
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[FCM] enable failed:',
      underlyingError
    )
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('still throws the permission string, not registration-failed, when permission is refused (unrelated failure path)', async () => {
    mocks.isSupported.mockResolvedValue(true)
    notificationStub.requestPermission = permissionResolver('denied')

    const consoleLogSpy = vi.spyOn(console, 'log')
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { enablePushNotifications } = await importFirebaseMessaging()
    await expect(enablePushNotifications()).rejects.toThrow('denied')

    // Permission refusal throws before the try/catch that owns the
    // console.error call, so neither log function fires here.
    expect(consoleLogSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})

describe('registerPushIfGranted — success', () => {
  it('returns the token and logs nothing', async () => {
    mocks.isSupported.mockResolvedValue(true)
    notificationStub.permission = 'granted'
    mocks.getToken.mockResolvedValue('tok-456')

    const consoleLogSpy = vi.spyOn(console, 'log')
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { registerPushIfGranted } = await importFirebaseMessaging()
    await expect(registerPushIfGranted()).resolves.toBe('tok-456')

    expect(consoleLogSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})

describe('registerPushIfGranted — failure', () => {
  it('logs via console.error and resolves null (never throws) when token acquisition rejects', async () => {
    mocks.isSupported.mockResolvedValue(true)
    notificationStub.permission = 'granted'
    const underlyingError = new Error('FCM unavailable')
    mocks.getToken.mockRejectedValue(underlyingError)

    const consoleLogSpy = vi.spyOn(console, 'log')
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { registerPushIfGranted } = await importFirebaseMessaging()
    await expect(registerPushIfGranted()).resolves.toBeNull()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[FCM] silent register failed:',
      underlyingError
    )
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('resolves null without touching the service worker when permission is not granted', async () => {
    mocks.isSupported.mockResolvedValue(true)
    notificationStub.permission = 'denied'

    const consoleLogSpy = vi.spyOn(console, 'log')
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { registerPushIfGranted } = await importFirebaseMessaging()
    await expect(registerPushIfGranted()).resolves.toBeNull()

    expect(registerServiceWorker).not.toHaveBeenCalled()
    expect(consoleLogSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
