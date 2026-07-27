import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import ShepherdingControlPrint from './ShepherdingControlPrint'

vi.mock('./shepherding-control-fetch', () => ({
  checkScope: vi.fn(),
  walkSubtree: vi.fn(),
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('ShepherdingControlPrint i18n', () => {
  it('shows the English invalid-params empty state when the URL is incomplete', async () => {
    await i18n.changeLanguage('en')
    render(
      <MemoryRouter initialEntries={['/shepherding-control/print']}>
        <MockedProvider mocks={[]}>
          <ShepherdingControlPrint />
        </MockedProvider>
      </MemoryRouter>
    )

    expect(
      screen.getByText('Missing or invalid parameters in URL.')
    ).toBeInTheDocument()
  })
})
