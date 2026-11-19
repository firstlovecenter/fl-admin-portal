/**
 * SYN-224: the auth service matches emails case-sensitively and every Member
 * write path stores them trimmed + lowercased, so a mobile keyboard's leading
 * capital ("Leader@…") produced "Invalid email or password" for a correct
 * password. These tests pin the client-side normalisation on every request
 * that looks a user up by email.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  login,
  normaliseEmail,
  requestPasswordReset,
  resetPassword,
  signup,
} from './auth-service'

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response)

const sentBody = (fetchMock: ReturnType<typeof vi.fn>) =>
  JSON.parse(fetchMock.mock.calls[0][1].body as string)

describe('normaliseEmail', () => {
  it('lowercases and trims the address', () => {
    expect(normaliseEmail('  Leader@Example.COM ')).toBe('leader@example.com')
  })

  it('leaves an already-normalised address unchanged', () => {
    expect(normaliseEmail('leader@example.com')).toBe('leader@example.com')
  })
})

describe('auth-service email normalisation', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('login sends a lowercased, trimmed email and leaves the password untouched', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ accessToken: 'tok', user: { id: '1', email: 'x' } })
    )

    const result = await login({
      email: ' Leader@Example.com ',
      password: ' PassWord ',
    })

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3333/auth/login')
    expect(sentBody(fetchMock)).toEqual({
      email: 'leader@example.com',
      password: ' PassWord ',
    })
    expect(result.accessToken).toBe('tok')
  })

  it('login still surfaces the service error for genuinely wrong credentials', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'Invalid email or password', statusCode: 401 }, 401)
    )

    await expect(
      login({ email: 'leader@example.com', password: 'wrong' })
    ).rejects.toMatchObject({
      name: 'AuthServiceError',
      message: 'Invalid email or password',
      statusCode: 401,
    })
  })

  it('requestPasswordReset sends a lowercased, trimmed email', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'ok' }))

    await requestPasswordReset('Leader@Example.com ')

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3333/auth/forgot-password'
    )
    expect(sentBody(fetchMock)).toEqual({ email: 'leader@example.com' })
  })

  it('resetPassword sends a lowercased email and leaves the passwords untouched', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'ok', user: { id: '1', email: 'x' } })
    )

    await resetPassword({
      email: 'Leader@Example.com',
      currentPassword: 'Old',
      newPassword: 'New',
      confirmPassword: 'New',
    })

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3333/auth/reset-password'
    )
    expect(sentBody(fetchMock)).toEqual({
      email: 'leader@example.com',
      currentPassword: 'Old',
      newPassword: 'New',
      confirmPassword: 'New',
    })
  })

  it('signup stores the same lowercased email its follow-up login sends', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ user: { id: '1' } }, 201))
      .mockResolvedValueOnce(
        jsonResponse({ accessToken: 'tok', user: { id: '1', email: 'x' } })
      )

    await signup({ email: 'Leader@Example.com', password: 'pw', firstName: 'A' })

    const [signupCall, loginCall] = fetchMock.mock.calls
    expect(signupCall[0]).toBe('http://localhost:3333/auth/signup')
    expect(JSON.parse(signupCall[1].body as string)).toEqual({
      email: 'leader@example.com',
      password: 'pw',
      firstName: 'A',
    })
    expect(JSON.parse(loginCall[1].body as string).email).toBe(
      'leader@example.com'
    )
  })
})
