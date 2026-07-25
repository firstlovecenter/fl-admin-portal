import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import i18n, { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from 'lib/i18n'
import useLanguage from './useLanguage'

describe('useLanguage', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  afterEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('exposes the active language and the full supported language list', () => {
    const { result } = renderHook(() => useLanguage())

    expect(result.current.language).toBe('en')
    expect(result.current.languages).toEqual(SUPPORTED_LANGUAGES)
  })

  it('changes the i18n language and persists the choice under the flc-language key', async () => {
    const { result } = renderHook(() => useLanguage())

    await act(async () => {
      result.current.setLanguage('de')
    })

    expect(i18n.language).toBe('de')
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('de')
  })
})
