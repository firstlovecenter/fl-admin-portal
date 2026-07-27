/**
 * Tests for `tOutsideReact` — the escape hatch used by `lib/auth-service`,
 * `utils/s3Upload` and the export hooks, which are plain modules with no
 * `useTranslation()` to read.
 *
 * Deliberately does NOT import `lib/i18n`: the uninitialised branch is the
 * one that matters, because `i18next.t` returns `undefined` before init and
 * an unguarded caller would show the user the literal string "undefined".
 * The initialised path is covered in a sibling file that does boot i18n.
 */
import { describe, it, expect } from 'vitest'
import i18next from 'i18next'
import { tOutsideReact } from './translate-outside-react'

describe('tOutsideReact — before i18next is initialised', () => {
  it('confirms the precondition', () => {
    expect(i18next.isInitialized).toBeFalsy()
    // this is the failure mode the helper exists to prevent
    expect(i18next.t('shared.errors.loginFailed')).toBeUndefined()
  })

  it('returns the English fallback rather than undefined', () => {
    expect(tOutsideReact('shared.errors.loginFailed', 'Login failed')).toBe(
      'Login failed'
    )
  })

  it('interpolates into the fallback so placeholders never leak', () => {
    expect(
      tOutsideReact(
        'shared.errors.downloadFailed',
        'Download failed ({{status}})',
        { status: 503 }
      )
    ).toBe('Download failed (503)')
  })

  it('leaves a placeholder alone when no value is supplied for it', () => {
    expect(
      tOutsideReact('some.key', 'Maximum size: {{size}}MB', { other: 1 })
    ).toBe('Maximum size: {{size}}MB')
  })

  it('handles a fallback with no placeholders and no values', () => {
    expect(tOutsideReact('some.key', 'Plain text')).toBe('Plain text')
  })
})
