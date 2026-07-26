import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import i18n from 'lib/i18n'
import SearchPalette from './SearchPalette'

vi.mock('hooks/useSetUserChurch', () => ({
  default: () => ({ setUserFinancials: vi.fn() }),
}))

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverStub,
  })
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const renderPalette = () =>
  render(
    <MemoryRouter>
      <MockedProvider mocks={[]}>
        <ChurchContext.Provider value={{ clickCard: vi.fn() } as never}>
          <MemberContext.Provider
            value={{ currentUser: { id: 'member-1' } } as never}
          >
            <SearchPalette open onOpenChange={vi.fn()} />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )

describe('SearchPalette i18n', () => {
  it('renders English chrome for the empty open state', async () => {
    await i18n.changeLanguage('en')
    renderPalette()

    expect(screen.getByText('Global search')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Search members, bacentas, councils…')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Start typing to search across the directory')
    ).toBeInTheDocument()
  })

  it('renders French chrome rather than English fallback text', async () => {
    await i18n.changeLanguage('fr')
    renderPalette()

    expect(
      screen.getByText(i18n.t('shell.search.startTyping'))
    ).toBeInTheDocument()
  })
})
