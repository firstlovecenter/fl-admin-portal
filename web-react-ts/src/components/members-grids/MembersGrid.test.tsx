import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { gql } from '@apollo/client'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import MembersGrid from './MembersGrid'

vi.mock('hooks/useInfiniteScroll')
vi.mock('./MemberTable', () => ({ default: () => <div data-testid="member-table" /> }))
vi.mock('./Filters', () => ({ default: () => <div data-testid="filters" /> }))
vi.mock('auth/RoleView', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('components/ui/sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <>{children}</> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

const mockedUseInfiniteScroll = vi.mocked(useInfiniteScroll)
const query = gql`query Members { __typename }`
const getHeading = () => 'Test Church Members'

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  })
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

function renderGrid(filters = {}) {
  mockedUseInfiniteScroll.mockReturnValue({
    data: { churches: [{ members: [], memberCount: 4 }] },
    items: [], totalCount: 4, loading: false, error: undefined,
    fetchingMore: false, hasMore: false, sentinelRef: () => {},
    reset: async () => {},
  })

  return render(
    <MemoryRouter>
      <ChurchContext.Provider value={{ filters, campusId: 'campus-1' } as never}>
        <MembersGrid
          query={query}
          parentId="campus-1"
          parentTypename="Campus"
          pluckParent={(data) => (data as { churches?: { members: []; memberCount: number }[] })?.churches?.[0]}
          getHeading={getHeading}
        />
      </ChurchContext.Provider>
    </MemoryRouter>
  )
}

describe('MembersGrid i18n', () => {
  it('renders English search, toolbar, count, and filter-sheet labels', () => {
    renderGrid()

    expect(screen.getByPlaceholderText('Search members…')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('4').parentElement).toHaveTextContent('4 members')
    expect(screen.getByRole('button', { name: 'Add member' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download membership list' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    expect(screen.getByRole('heading', { name: 'Filter Members' })).toBeInTheDocument()
  })

  it('uses French labels and the filtered-results suffix', async () => {
    await i18n.changeLanguage('fr')
    renderGrid({ gender: ['Male'] })

    expect(screen.getByPlaceholderText('Rechercher des membres…')).toBeInTheDocument()
    expect(screen.getByText('0').parentElement).toHaveTextContent(
      `0${i18n.t('directory.memberGrid.matches')}`
    )
    expect(screen.getByRole('button', { name: i18n.t('directory.memberGrid.addMember') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: i18n.t('directory.memberGrid.filters') })).toBeInTheDocument()
  })
})
