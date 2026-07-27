/**
 * Smoke tests for TrendsMenu i18n surface (English default).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import 'lib/i18n'
import TrendsMenu from './TrendsMenu'

vi.mock('contexts/ChurchRoleScopeContext', () => ({
  useChurchRoleScope: () => ({
    selectedScope: {
      churchId: 'bacenta-1',
      churchType: 'Bacenta',
      churchName: 'Test Bacenta',
    },
  }),
}))

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

describe('TrendsMenu', () => {
  afterEach(cleanup)

  it('renders trends title and menu cards in English', () => {
    render(
      <MemoryRouter>
        <ChurchContext.Provider value={{ clickCard: vi.fn() }}>
          <MemberContext.Provider
            value={{
              currentUser: {
                id: 'user-1',
                roles: ['leaderBacenta'],
                currentChurch: {
                  id: 'bacenta-1',
                  name: 'Test Bacenta',
                  __typename: 'Bacenta',
                },
              },
            }}
          >
            <TrendsMenu />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText('Trends')).toBeInTheDocument()
    expect(screen.getByText('Last 4 Weeks')).toBeInTheDocument()
    expect(screen.getByText('Quick Facts')).toBeInTheDocument()
  })
})
