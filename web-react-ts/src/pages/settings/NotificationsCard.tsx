import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'components/ui/card'
import { Switch } from 'components/ui/switch'
import { Badge } from 'components/ui/badge'
import { Alert, AlertDescription } from 'components/ui/alert'
import { usePushNotificationSettings } from 'hooks/usePushNotificationSettings'
import {
  NotificationCategory,
  useNotificationPreferences,
} from 'hooks/useNotificationPreferences'

type CategoryRow = {
  key: NotificationCategory
  field: 'services' | 'banking' | 'arrivals'
  label: string
  description: string
}

const CATEGORY_ROWS: CategoryRow[] = [
  {
    key: 'SERVICES',
    field: 'services',
    label: 'Service reminders',
    description: 'A nudge when your service form is still unfilled.',
  },
  {
    key: 'BANKING',
    field: 'banking',
    label: 'Banking reminders',
    description: 'A nudge to bank your offering the next day.',
  },
  {
    key: 'ARRIVALS',
    field: 'arrivals',
    label: 'Arrivals reminders',
    description: 'Sunday bussing mobilisation and arrival-time alerts.',
  },
]

const NotificationsCard = () => {
  const {
    supported,
    permission,
    enabled,
    enabling,
    enable,
    disable,
  } = usePushNotificationSettings()

  const blocked = permission === 'denied'
  const pushOn = enabled && permission === 'granted'

  const { preferences, loading: prefsLoading, setPreference } =
    useNotificationPreferences(supported !== true)

  const handlePushToggle = async (next: boolean) => {
    if (!next) {
      disable()
      toast.info('Notifications muted on this device.')
      return
    }

    try {
      await enable()
      toast.success('Notifications enabled on this device.')
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'registration-failed'
      if (reason === 'denied') {
        toast.error(
          'Notifications are blocked. Enable them for this app in your browser or device settings, then try again.'
        )
      } else if (reason === 'unsupported') {
        toast.error('This device or browser does not support notifications.')
      } else if (reason === 'default') {
        toast.info('Notification permission was dismissed. Tap again to allow.')
      } else {
        toast.error(
          "Couldn't enable notifications on this device. Please try again later."
        )
      }
    }
  }

  const handleCategoryToggle = async (
    category: NotificationCategory,
    next: boolean
  ) => {
    try {
      await setPreference(category, next)
    } catch {
      toast.error("Couldn't save that preference. Please try again.")
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              Notifications
            </CardTitle>
            <CardDescription>
              Reminders on this device — to record service, do banking, and for
              Sunday bussing arrival times.
            </CardDescription>
          </div>
          {pushOn ? (
            <Badge variant="success">On</Badge>
          ) : (
            <Badge variant="outline">Off</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {supported === undefined ? (
          <p className="text-sm text-muted-foreground">Checking…</p>
        ) : !supported ? (
          <p className="text-sm text-muted-foreground">
            Notifications aren't supported on this device or browser. Install the
            app to your home screen and open it there to enable them.
          </p>
        ) : (
          <>
            <label
              htmlFor="push-toggle"
              className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm font-medium"
            >
              Push notifications
              <Switch
                id="push-toggle"
                checked={pushOn}
                disabled={enabling || blocked}
                onCheckedChange={handlePushToggle}
                aria-label="Toggle push notifications"
              />
            </label>

            {blocked && (
              <Alert>
                <AlertDescription>
                  Notifications are blocked for this app. Turn them on in your
                  browser or device settings, then come back and toggle this on.
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4">
              <p className="mb-1 text-sm font-medium">What to be reminded about</p>
              <p className="mb-3 text-xs text-muted-foreground">
                {pushOn
                  ? 'Choose which reminders you want. These apply to your account on every device.'
                  : 'Turn on push notifications above to choose your reminders.'}
              </p>
              <div className="divide-y">
                {CATEGORY_ROWS.map((row) => (
                  <label
                    key={row.key}
                    htmlFor={`category-${row.key}`}
                    className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-2"
                  >
                    <span>
                      <span className="block text-sm font-medium">
                        {row.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {row.description}
                      </span>
                    </span>
                    <Switch
                      id={`category-${row.key}`}
                      checked={preferences[row.field]}
                      disabled={!pushOn || prefsLoading}
                      onCheckedChange={(next) =>
                        handleCategoryToggle(row.key, next)
                      }
                      aria-label={`Toggle ${row.label}`}
                    />
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default NotificationsCard
