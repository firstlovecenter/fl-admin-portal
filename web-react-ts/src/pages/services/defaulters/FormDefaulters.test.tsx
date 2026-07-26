/**
 * i18n smoke test for FormDefaulters.tsx.
 *
 * Asserts the page accent title renders in English and French after
 * `changeLanguage('fr')`. Heavy Apollo / week / sonta-level deps are mocked.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import FormDefaulters from './FormDefaulters'

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useLazyQuery: vi.fn(() => [vi.fn(), { refetch: vi.fn() }]),
  }
})

vi.mock('hooks/useSelectedWeek', () => ({
  default: () => ({
    weekStart: '2026-07-20',
    week: 30,
    isCurrent: true,
  }),
}))

vi.mock('hooks/useSontaLevel', () => ({
  default: vi.fn(() => ({
    church: {
      id: 'council-1',
      name: 'Test Council',
      __typename: 'Council',
      formDefaultersThisWeek: [],
    },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  })),
}))

vi.mock('components/base-component/PullToRefresh', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('components/WeekSelector/WeekSelector', () => ({
  default: () => null,
}))

vi.mock('./DownloadDefaultersButton', () => ({
  default: () => null,
}))

describe('FormDefaulters i18n', () => {
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
  })

  it('renders Form Defaulters title in English', () => {
    render(
      <MemoryRouter>
        <FormDefaulters />
      </MemoryRouter>
    )
    expect(screen.getByText('Form Defaulters')).toBeInTheDocument()
    expect(screen.getByText('All bacentas filled')).toBeInTheDocument()
  })

  it('renders Form Defaulters title in French', async () => {
    await i18n.changeLanguage('fr')
    render(
      <MemoryRouter>
        <FormDefaulters />
      </MemoryRouter>
    )
    expect(
      screen.getByText('Défaillants de formulaire')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Toutes les bacentas ont rempli')
    ).toBeInTheDocument()
  })
})
