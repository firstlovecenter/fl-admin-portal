/**
 * PushSoftAsk is a full-width card that appears over whatever page the user is
 * on — including localized ones — and every string in it, plus all four of its
 * toasts, was English-only until this branch.
 *
 * The eligibility gate is exercised too, since the card only renders under a
 * narrow set of conditions and a test that silently rendered nothing would
 * assert nothing.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { toast } from 'sonner'
import i18n from 'lib/i18n'
import PushSoftAsk from './PushSoftAsk'

const enable = vi.fn()
let supported = true
let permission: NotificationPermission = 'default'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

vi.mock('hooks/usePushNotificationSettings', () => ({
  usePushNotificationSettings: () => ({
    supported,
    permission,
    enabled: false,
    enabling: false,
    enable,
  }),
}))

vi.mock('lib/push-preference-storage', () => ({
  readPushSoftAskDismissed: () => false,
  writePushSoftAskDismissed: vi.fn(),
}))

// The card is delayed 2.5s after mount so it doesn't slam the first paint.
const APPEAR_DELAY_MS = 2500

const renderAndReveal = () => {
  const result = render(
    <MemoryRouter initialEntries={['/directory/members']}>
      <PushSoftAsk />
    </MemoryRouter>
  )
  act(() => {
    vi.advanceTimersByTime(APPEAR_DELAY_MS)
  })
  return result
}

beforeEach(() => {
  vi.useFakeTimers()
  supported = true
  permission = 'default'
  enable.mockReset().mockResolvedValue(undefined)
})

afterEach(async () => {
  vi.useRealTimers()
  cleanup()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  await i18n.changeLanguage('en')
})

describe('PushSoftAsk', () => {
  it('stays hidden until the appear delay elapses', () => {
    render(
      <MemoryRouter initialEntries={['/directory/members']}>
        <PushSoftAsk />
      </MemoryRouter>
    )
    expect(screen.queryByText('Turn on notifications')).not.toBeInTheDocument()
  })

  it('renders its copy in English by default', () => {
    renderAndReveal()

    expect(screen.getByText('Turn on notifications')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enable' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('translates its copy, buttons and aria-labels', async () => {
    await i18n.changeLanguage('de')
    renderAndReveal()

    expect(
      screen.getByRole('region', { name: 'Benachrichtigungen aktivieren' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Benachrichtigungen einschalten')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Aktivieren' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Jetzt nicht' })
    ).toBeInTheDocument()
  })

  it('translates the success toast', async () => {
    await i18n.changeLanguage('fr')
    renderAndReveal()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
    })

    expect(toast.success).toHaveBeenCalledWith('Notifications activées.')
  })

  it('translates the blocked-permission toast', async () => {
    enable.mockRejectedValue(new Error('denied'))
    await i18n.changeLanguage('es')
    renderAndReveal()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Activar' }))
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Las notificaciones están bloqueadas. Puede activarlas en la configuración de su navegador.'
    )
  })

  it('never renders when push is unsupported', () => {
    supported = false
    renderAndReveal()

    expect(screen.queryByText('Turn on notifications')).not.toBeInTheDocument()
  })
})
