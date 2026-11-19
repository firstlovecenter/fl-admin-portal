import { assertChurchScope } from './scope-utils'

/**
 * SYN-253 — a failed church-scope check is a permission refusal the user
 * sees as FORBIDDEN, not a server failure. Its diagnostic line goes to WARN
 * so CloudWatch ERROR stays for real failures (SYN-230, SYN-250/251).
 */
const contextWithRows = (rows: number) => {
  const session = {
    executeRead: jest.fn().mockResolvedValue({
      records: Array.from({ length: rows }, () => ({})),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }
  return {
    session,
    context: {
      jwt: { userId: 'user_1' },
      executionContext: { session: () => session },
    } as never,
  }
}

describe('assertChurchScope logging (SYN-253)', () => {
  let errorSpy: jest.SpyInstance
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('SYN-253: logs a failed scope check at warn and refuses with FORBIDDEN', async () => {
    const { context, session } = contextWithRows(0)

    await expect(assertChurchScope(context, 'church_1')).rejects.toMatchObject(
      { extensions: { code: 'FORBIDDEN' } }
    )
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toBe('❌ Church-scope check failed')
    expect(session.close).toHaveBeenCalled()
  })

  it('SYN-253: logs nothing when the caller is in scope', async () => {
    const { context } = contextWithRows(1)

    await expect(assertChurchScope(context, 'church_1')).resolves.toBeUndefined()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
