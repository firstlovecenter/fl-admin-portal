import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import i18n from 'lib/i18n'
import ShepherdingControlProjector from './ShepherdingControlProjector'

vi.mock('./useShepherdingSlide', () => ({
  useShepherdingSlide: () => ({ slide: null, loading: false }),
}))

vi.mock('./shepherding-control-channel', () => ({
  useProjectorViewer: () => null,
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('ShepherdingControlProjector i18n', () => {
  it('shows the English waiting empty state when no controller is connected', async () => {
    await i18n.changeLanguage('en')
    render(<ShepherdingControlProjector />)

    expect(
      screen.getByText(
        'Waiting for controller — drag this window to your projector or external monitor.'
      )
    ).toBeInTheDocument()
  })

  it('shows the French waiting empty state rather than English fallback text', async () => {
    await i18n.changeLanguage('fr')
    render(<ShepherdingControlProjector />)

    expect(
      screen.getByText(i18n.t('shepherding.projector.waiting'))
    ).toBeInTheDocument()
  })
})
