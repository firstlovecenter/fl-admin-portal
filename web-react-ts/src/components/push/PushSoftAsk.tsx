import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Bell, X } from 'lucide-react'
import { useAuth } from 'contexts/AuthContext'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import { usePushNotificationSettings } from 'hooks/usePushNotificationSettings'
import {
  readPushSoftAskDismissed,
  writePushSoftAskDismissed,
} from 'lib/push-preference-storage'

// Delay before the card appears, so it doesn't slam the user on first paint.
const APPEAR_DELAY_MS = 2500

// Routes where the soft-ask is suppressed (onboarding owns the first-run flow;
// the Notifications settings page already exposes the toggle explicitly).
const isSuppressedPath = (pathname: string): boolean =>
  pathname.startsWith('/settings') || pathname.includes('onboard')

// iOS Safari can only receive web push once the PWA is installed to the home
// screen. Before install there's nothing to subscribe, so the install prompt
// covers that case and we don't soft-ask here.
const isIosWithoutInstall = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  if (!isIos) return false
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  return !standalone
}

/**
 * Dismissible, branded soft-ask card for enabling push notifications. Appears
 * once per device when push is supported, permission hasn't been asked yet, the
 * user isn't already subscribed, and they haven't dismissed it before. The
 * Enable button is the required user gesture — Chrome demotes a cold, gesture-
 * less permission request to a muted bell, so we never auto-fire; tapping Enable
 * runs the shared enable() (native prompt + subscribe). "Not now" hides it for
 * good. Reuses the enrollment logic in usePushNotificationSettings.
 */
const PushSoftAsk = () => {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const { supported, permission, enabled, enabling, enable } =
    usePushNotificationSettings()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(() => readPushSoftAskDismissed())

  const eligible =
    isAuthenticated &&
    supported === true &&
    permission === 'default' &&
    !enabled &&
    !dismissed &&
    !isSuppressedPath(pathname) &&
    !isIosWithoutInstall()

  useEffect(() => {
    if (!eligible) {
      setVisible(false)
      return undefined
    }
    const timer = window.setTimeout(() => setVisible(true), APPEAR_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [eligible])

  const handleDismiss = () => {
    writePushSoftAskDismissed()
    setDismissed(true)
    setVisible(false)
  }

  const handleEnable = async () => {
    try {
      await enable()
      setVisible(false)
      toast.success('Notifications enabled.')
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'registration-failed'
      if (reason === 'denied') {
        toast.error(
          'Notifications are blocked. You can enable them in your browser settings.'
        )
        handleDismiss()
      } else if (reason === 'default') {
        // User dismissed the native prompt — leave the card so they can retry.
        toast.info('No problem — tap Enable whenever you’re ready.')
      } else {
        toast.error("Couldn't enable notifications. Please try again later.")
      }
    }
  }

  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 flex justify-center px-4',
        'pb-[calc(env(safe-area-inset-bottom)+1rem)]'
      )}
      role="region"
      aria-label="Enable notifications"
    >
      <div className="w-full max-w-md rounded-2xl border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Turn on notifications
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Get reminded to record service, bank offerings, and for Sunday
              bussing arrival times.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="-mr-2 -mt-2 flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            onClick={handleDismiss}
            disabled={enabling}
          >
            Not now
          </Button>
          <Button
            type="button"
            className="h-11"
            onClick={handleEnable}
            disabled={enabling}
          >
            {enabling ? 'Enabling…' : 'Enable'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PushSoftAsk
