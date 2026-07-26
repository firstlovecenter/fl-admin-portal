import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemberContext } from 'contexts/MemberContext'
import i18n from 'lib/i18n'
import ShepherdingControlSession from './ShepherdingControlSession'

vi.mock('./useShepherdingSlide', () => ({
  useShepherdingSlide: () => ({ slide: null, loading: false }),
}))

vi.mock('./shepherding-control-channel', () => ({
  useProjectorController: () => ({
    isSupported: false,
    isConnected: false,
    focusProjector: vi.fn(),
  }),
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('ShepherdingControlSession i18n', () => {
  it('shows the English empty state when no leader scope is available', async () => {
    await i18n.changeLanguage('en')
    render(
      <MemberContext.Provider value={{ currentUser: null } as never}>
        <ShepherdingControlSession />
      </MemberContext.Provider>
    )

    expect(
      screen.getByRole('heading', { name: 'No leader scope detected' })
    ).toBeInTheDocument()
  })

  it('shows the French empty state rather than English fallback text', async () => {
    await i18n.changeLanguage('fr')
    render(
      <MemberContext.Provider value={{ currentUser: null } as never}>
        <ShepherdingControlSession />
      </MemberContext.Provider>
    )

    expect(
      screen.getByRole('heading', {
        name: i18n.t('shepherding.noLeaderScopeTitle'),
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(i18n.t('shepherding.noLeaderScopeBody'))
    ).toBeInTheDocument()
  })
})
