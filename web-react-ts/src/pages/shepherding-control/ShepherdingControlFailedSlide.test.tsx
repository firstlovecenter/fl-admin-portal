import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemberContext } from 'contexts/MemberContext'
import 'lib/i18n'
import ShepherdingControlProjector from './ShepherdingControlProjector'
import ShepherdingControlSession from './ShepherdingControlSession'

vi.mock('./useShepherdingSlide', () => ({
  useShepherdingSlide: () => ({
    slide: null,
    loading: false,
    error: new Error('Float cannot represent non numeric value: Infinity'),
  }),
}))

vi.mock('./shepherding-control-channel', () => ({
  useProjectorController: () => ({
    isSupported: false,
    isConnected: false,
    focusProjector: vi.fn(),
  }),
  useProjectorViewer: () => ({
    level: 'Denomination',
    id: 'denomination-1',
    name: 'First Love',
    anchor: { week: 36, year: 2026 },
    windowWeeks: 4,
    metricA: 'serviceAttendance',
    metricB: null,
  }),
}))

afterEach(cleanup)

describe('Shepherding Control when the slide query fails', () => {
  it('shows the load error on the controller instead of a permanent spinner', () => {
    const currentUser = {
      bacenta: 'bacenta-1',
      roles: ['leaderBacenta'],
    }

    render(
      <MemberContext.Provider value={{ currentUser } as never}>
        <ShepherdingControlSession />
      </MemberContext.Provider>
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This slide could not be loaded.'
    )
  })

  it('shows the load error on the projector window', () => {
    render(<ShepherdingControlProjector />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This slide could not be loaded.'
    )
  })
})
