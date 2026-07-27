import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import ReportsPage from './ReportsPage'

vi.mock('contexts/ChurchRoleScopeContext', () => ({
  useChurchRoleScope: () => ({
    selectedScope: {
      churchId: 'stream-1',
      churchType: 'Stream',
      churchName: 'Passion',
    },
  }),
}))

vi.mock('auth/RoleView', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

beforeEach(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
})

afterEach(async () => {
  cleanup()
  vi.unstubAllGlobals()
  await i18n.changeLanguage('en')
})

describe('ReportsPage i18n', () => {
  it('renders the English Reports title', async () => {
    await i18n.changeLanguage('en')
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Reports'
    )
  })

  it('renders the French Reports title', async () => {
    await i18n.changeLanguage('fr')
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      i18n.t('reports.home.title')
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Rapports'
    )
  })
})
