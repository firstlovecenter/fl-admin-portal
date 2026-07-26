import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { BackButton } from './BackButton'

const matchMediaMock = vi.fn()

beforeEach(() => {
  matchMediaMock.mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMediaMock,
  })
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('BackButton i18n', () => {
  it('uses the English nav.goBack aria-label in standalone mode', async () => {
    await i18n.changeLanguage('en')
    render(
      <MemoryRouter initialEntries={['/directory']}>
        <BackButton />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
  })

  it('uses the French nav.goBack aria-label rather than English fallback text', async () => {
    await i18n.changeLanguage('fr')
    render(
      <MemoryRouter initialEntries={['/directory']}>
        <BackButton />
      </MemoryRouter>
    )

    expect(
      screen.getByRole('button', { name: i18n.t('nav.goBack') })
    ).toBeInTheDocument()
  })
})
